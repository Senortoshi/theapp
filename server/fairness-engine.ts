import { randomUUID } from "crypto";
import type { Contribution, Contributor, ContributionType, RevenueEvent } from "@shared/schema";
import { contributions } from "@shared/schema";
import { and, asc, eq } from "drizzle-orm";
// @ts-ignore - db is provided by the server storage layer at runtime
import { db } from "./storage";

const BASE_SCORES: Record<ContributionType, number> = {
  idea: 10,
  code: 25,
  design: 20,
  critique: 12,
  synthesis: 18,
  advocacy: 15,
};

export class FairnessEngine {

  scoreContribution(content: string, type: ContributionType, allContributions: Contribution[]): number {
    let score = BASE_SCORES[type];

    const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const existingWords = new Set<string>();
    for (const c of allContributions) {
      c.content.toLowerCase().split(/\s+/).filter(w => w.length > 3).forEach(w => existingWords.add(w));
    }

    if (words.length > 0 && existingWords.size > 0) {
      const overlap = words.filter(w => existingWords.has(w)).length / words.length;
      const noveltyMultiplier = 1.5 - overlap;
      score *= Math.max(0.5, Math.min(1.5, noveltyMultiplier));
      console.log(`[FairnessEngine] Novelty: ${(1.5 - overlap).toFixed(2)}x (${words.filter(w => existingWords.has(w)).length}/${words.length} overlap)`);
    } else {
      score *= 1.5;
      console.log(`[FairnessEngine] Novelty: 1.5x (first or no overlap)`);
    }

    const wordCount = content.split(/\s+/).length;
    const lengthBonus = Math.min(2, 1 + Math.log(Math.max(1, wordCount)) / Math.log(100));
    score *= lengthBonus;

    const finalScore = Math.round(score * 100) / 100;
    console.log(`[FairnessEngine] Scored: type=${type}, base=${BASE_SCORES[type]}, depth=${wordCount}w, final=${finalScore}`);
    return finalScore;
  }

  /** Decay payload includes narrative fields for ethics layer (old_pct, new_pct, referenced_count, etc.). */
  decayScores(allContributions: Contribution[]): {
    contributor_id: string;
    old_score: number;
    new_score: number;
    old_pct: number;
    new_pct: number;
    contribution_type: string;
    referenced_count: number;
    decay_rate: number;
    slower_than_average: boolean;
  }[] {
    const totalBefore = allContributions.reduce((s, x) => s + x.current_score, 0);
    const changes: {
      contributor_id: string;
      old_score: number;
      new_score: number;
      old_pct: number;
      new_pct: number;
      contribution_type: string;
      referenced_count: number;
      decay_rate: number;
      slower_than_average: boolean;
    }[] = [];
    const BASE_RATE = 0.015;

    for (const c of allContributions) {
      const oldScore = c.current_score;
      const minScore = c.base_score * 0.15;

      if (c.current_score <= minScore) continue;

      let decayRate = BASE_RATE;
      if (c.referenced_by.length > 0) {
        decayRate = 0.0075;
      }
      if (c.type === 'synthesis') {
        decayRate *= 0.7;
      }

      c.current_score = Math.max(minScore, c.current_score * (1 - decayRate));

      if (Math.abs(oldScore - c.current_score) > 0.001) {
        c.score_history.push({
          timestamp: Date.now(),
          score: c.current_score,
          reason: `Decay ${(decayRate * 100).toFixed(2)}% | referenced:${c.referenced_by.length > 0} synthesis:${c.type === 'synthesis'}`
        });
        const old_pct = totalBefore > 0 ? (oldScore / totalBefore) * 100 : 0;
        changes.push({
          contributor_id: c.contributor_id,
          old_score: oldScore,
          new_score: c.current_score,
          old_pct: Math.round(old_pct * 10) / 10,
          new_pct: 0, // filled below
          contribution_type: c.type,
          referenced_count: c.referenced_by.length,
          decay_rate: decayRate * 100,
          slower_than_average: decayRate < BASE_RATE,
        });
      }
    }

    if (changes.length > 0) {
      const totalAfter = allContributions.reduce((s, x) => s + x.current_score, 0);
      for (const ch of changes) {
        ch.new_pct = totalAfter > 0 ? Math.round((ch.new_score / totalAfter) * 1000) / 10 : 0;
      }
    }

    return changes;
  }

  boostReferenced(targetContribution: Contribution, referencingContributionId: string): number {
    if (targetContribution.referenced_by.length >= 3) {
      console.log(`[FairnessEngine] Boost capped for ${targetContribution.id} (3 max)`);
      return 0;
    }

    const boostAmount = targetContribution.current_score * 0.08;
    targetContribution.current_score += boostAmount;
    targetContribution.referenced_by.push(referencingContributionId);

    targetContribution.score_history.push({
      timestamp: Date.now(),
      score: targetContribution.current_score,
      reason: `Boost +8% from ${referencingContributionId}`
    });

    console.log(`[FairnessEngine] Boosted ${targetContribution.id} by +${boostAmount.toFixed(2)} → ${targetContribution.current_score.toFixed(2)}`);
    return boostAmount;
  }

  detectReferences(content: string, allContributions: Contribution[]): Contribution | null {
    const lower = content.toLowerCase();

    if (lower.includes('builds on') || lower.includes('building on') || lower.includes('extending')) {
      for (const c of allContributions) {
        const keywords = c.content.toLowerCase().split(/\s+/).filter(w => w.length > 5);
        const contentWords = lower.split(/\s+/).filter(w => w.length > 5);
        const overlap = contentWords.filter(w => keywords.includes(w)).length;
        const similarity = keywords.length > 0 ? overlap / Math.max(keywords.length, contentWords.length) : 0;
        if (similarity > 0.15) return c;
      }
    }

    for (const c of allContributions) {
      const keywords = c.content.toLowerCase().split(/\s+/).filter(w => w.length > 5);
      const contentWords = lower.split(/\s+/).filter(w => w.length > 5);
      if (keywords.length === 0 || contentWords.length === 0) continue;
      const overlap = contentWords.filter(w => keywords.includes(w)).length;
      const similarity = overlap / Math.min(keywords.length, contentWords.length);
      if (similarity > 0.7) return c;
    }

    return null;
  }

  calculateShares(contributors: Map<string, Contributor>, contributions: Contribution[]): void {
    const contributorScores = new Map<string, number>();
    let totalPool = 0;

    for (const c of contributions) {
      const current = contributorScores.get(c.contributor_id) || 0;
      contributorScores.set(c.contributor_id, current + c.current_score);
      totalPool += c.current_score;
    }

    if (totalPool === 0) return;

    for (const [id, contributor] of Array.from(contributors.entries())) {
      const score = contributorScores.get(id) || 0;
      const oldPct = contributor.current_share_pct;
      contributor.current_share_pct = Math.round((score / totalPool) * 10000) / 100;
      contributor.relevance_score = score;

      contributor.share_history.push([Date.now(), contributor.current_share_pct]);
      if (contributor.share_history.length > 20) {
        contributor.share_history = contributor.share_history.slice(-20);
      }

      if (contributor.share_history.length >= 3) {
        const last3 = contributor.share_history.slice(-3);
        const allRising = last3.every((h: [number, number], i: number) => i === 0 || h[1] > last3[i - 1][1]);
        const allDecaying = last3.every((h: [number, number], i: number) => i === 0 || h[1] < last3[i - 1][1]);

        const oldStatus = contributor.status;
        if (allRising) contributor.status = 'rising';
        else if (allDecaying) contributor.status = 'decaying';
        else contributor.status = 'stable';

        if (oldStatus !== contributor.status) {
          console.log(`[FairnessEngine] Status: ${contributor.username} ${oldStatus} → ${contributor.status}`);
        }
      }
    }

    const all = Array.from(contributors.values());
    const sum = all.reduce((acc, c) => acc + c.current_share_pct, 0);
    if (sum > 0 && Math.abs(sum - 100) > 0.01) {
      const sorted = [...all].sort((a, b) => b.current_share_pct - a.current_share_pct);
      sorted[0].current_share_pct = Math.round((sorted[0].current_share_pct + (100 - sum)) * 100) / 100;
    }
  }

  distributeRevenue(amountSatoshis: number, contributors: Map<string, Contributor>): RevenueEvent {
    const distribution: RevenueEvent['distribution'] = [];
    let remaining = amountSatoshis;

    const sorted = Array.from(contributors.values())
      .filter(c => c.current_share_pct > 0)
      .sort((a, b) => b.current_share_pct - a.current_share_pct);

    for (const contributor of sorted) {
      const amount = Math.floor(amountSatoshis * (contributor.current_share_pct / 100));
      distribution.push({
        contributor_id: contributor.id,
        username: contributor.username,
        amount,
        share_pct: contributor.current_share_pct,
      });
      contributor.total_satoshis_earned += amount;
      remaining -= amount;
    }

    if (remaining > 0 && distribution.length > 0) {
      distribution[0].amount += remaining;
      const top = contributors.get(distribution[0].contributor_id);
      if (top) top.total_satoshis_earned += remaining;
    }

    const event: RevenueEvent = {
      id: randomUUID(),
      amount_satoshis: amountSatoshis,
      timestamp: Date.now(),
      distribution,
    };

    console.log(`[FairnessEngine] Revenue: ${amountSatoshis} sats → ${distribution.length} contributors`);
    return event;
  }
}

export const fairnessEngine = new FairnessEngine();

export interface ShareResult {
  address: string;
  sharePercent: number;
  contributionCount: number;
}

export async function computeShares(projectId: string): Promise<ShareResult[]> {
  if (!projectId) {
    return [];
  }

  const rows = await db
    .select()
    .from(contributions)
    .where(eq(contributions.projectId, projectId))
    .orderBy(asc(contributions.timestamp));

  if (!rows.length) {
    return [];
  }

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const addressTotals = new Map<string, { totalScore: number; contributionCount: number }>();

  rows.forEach((row, index) => {
    const address = row.contributorAddress;
    if (!address) {
      return;
    }

    let score = 100;

    const ts = typeof row.timestamp === "number" ? row.timestamp : Number(row.timestamp);
    if (Number.isFinite(ts) && ts >= now - sevenDaysMs) {
      score *= 1.5;
    }

    const textLength = row.text?.length ?? 0;
    if (textLength > 100) {
      score *= 1.2;
    }

    if (index < 3) {
      score *= 2;
    }

    const existing = addressTotals.get(address) ?? { totalScore: 0, contributionCount: 0 };
    existing.totalScore += score;
    existing.contributionCount += 1;
    addressTotals.set(address, existing);
  });

  const grandTotal = Array.from(addressTotals.values()).reduce(
    (sum, entry) => sum + entry.totalScore,
    0,
  );

  if (grandTotal <= 0) {
    await db
      .update(contributions)
      .set({ sharePercent: 0 })
      .where(eq(contributions.projectId, projectId));
    return [];
  }

  const shareResults: ShareResult[] = [];

  await db.transaction(async (tx) => {
    for (const [address, entry] of addressTotals) {
      const rawPercent = (entry.totalScore / grandTotal) * 100;
      const sharePercent = Math.round(rawPercent * 1000) / 1000;

      await tx
        .update(contributions)
        .set({ sharePercent })
        .where(
          and(
            eq(contributions.projectId, projectId),
            eq(contributions.contributorAddress, address),
          ),
        );

      shareResults.push({
        address,
        sharePercent,
        contributionCount: entry.contributionCount,
      });
    }
  });

  shareResults.sort((a, b) => b.sharePercent - a.sharePercent);

  return shareResults;
}

import type { Contribution, Contributor, ContributionType, RevenueEvent } from "../data/schema";

const BASE_SCORES: Record<ContributionType, number> = {
  idea: 10,
  code: 25,
  design: 20,
  critique: 12,
  synthesis: 18,
  advocacy: 15,
};

export function scoreContribution(
  content: string,
  type: ContributionType,
  allContributions: Contribution[]
): number {
  let score = BASE_SCORES[type];

  const words = content.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const existingWords = new Set<string>();
  for (const c of allContributions) {
    c.content
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .forEach((w) => existingWords.add(w));
  }

  if (words.length > 0 && existingWords.size > 0) {
    const overlap = words.filter((w) => existingWords.has(w)).length / words.length;
    const noveltyMultiplier = 1.5 - overlap;
    score *= Math.max(0.5, Math.min(1.5, noveltyMultiplier));
  } else {
    score *= 1.5;
  }

  const wordCount = content.split(/\s+/).length;
  const lengthBonus = Math.min(2, 1 + Math.log(Math.max(1, wordCount)) / Math.log(100));
  score *= lengthBonus;

  return Math.round(score * 100) / 100;
}

export function calculateShares(
  contributors: Map<string, Contributor>,
  contributions: Contribution[]
): void {
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
    contributor.current_share_pct = Math.round((score / totalPool) * 10000) / 100;
    contributor.relevance_score = score;

    contributor.share_history.push([Date.now(), contributor.current_share_pct]);
    if (contributor.share_history.length > 20) {
      contributor.share_history = contributor.share_history.slice(-20);
    }

    if (contributor.share_history.length >= 3) {
      const last3 = contributor.share_history.slice(-3);
      const allRising = last3.every(
        (h: [number, number], i: number) => i === 0 || h[1] > last3[i - 1][1]
      );
      const allDecaying = last3.every(
        (h: [number, number], i: number) => i === 0 || h[1] < last3[i - 1][1]
      );
      if (allRising) contributor.status = "rising";
      else if (allDecaying) contributor.status = "decaying";
      else contributor.status = "stable";
    }
  }

  const all = Array.from(contributors.values());
  const sum = all.reduce((acc, c) => acc + c.current_share_pct, 0);
  if (sum > 0 && Math.abs(sum - 100) > 0.01) {
    const sorted = [...all].sort((a, b) => b.current_share_pct - a.current_share_pct);
    sorted[0].current_share_pct =
      Math.round((sorted[0].current_share_pct + (100 - sum)) * 100) / 100;
  }
}

export function distributeRevenue(
  amountSatoshis: number,
  contributors: Map<string, Contributor>
): RevenueEvent {
  const distribution: RevenueEvent["distribution"] = [];
  let remaining = amountSatoshis;

  const sorted = Array.from(contributors.values())
    .filter((c) => c.current_share_pct > 0)
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

  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : "",
    amount_satoshis: amountSatoshis,
    timestamp: Date.now(),
    distribution,
  };
}

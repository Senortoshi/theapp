/**
 * Fairness agent v1.0 for the real app.
 * Share = contributor_points ÷ total_pool_points × 100
 * Revenue = (share_percentage ÷ 100) × total_satoshis
 * Language: pool growing honestly, not punishment.
 */

import type {
  RealContribution,
  RealContributor,
  RealContributionType,
} from "@shared/real-app-schema";
import { REAL_BASE_POINTS } from "@shared/real-app-schema";
import { realAppStore } from "./real-app-store";

const AGENT_VERSION = 1;

export function getBasePoints(type: RealContributionType): number {
  return REAL_BASE_POINTS[type];
}

/**
 * Score a contribution when marked implemented. v1: base points only.
 * (Future: novelty, references, formula improvements → version bump.)
 */
export function scoreContribution(
  _content: string,
  type: RealContributionType
): number {
  return REAL_BASE_POINTS[type];
}

/**
 * Recalculate every contributor's points (sum of implemented contribution points),
 * then share_pct = points / total_pool * 100, satoshis = (share_pct/100) * revenue_pool.
 */
export function recalculateSharesAndRevenue(): void {
  const store = realAppStore;
  const implemented = store.contributions.filter((c) => c.status === "IMPLEMENTED");
  let totalPool = 0;
  const pointsByContributor = new Map<string, number>();

  for (const c of implemented) {
    const current = pointsByContributor.get(c.contributor_id) ?? 0;
    pointsByContributor.set(c.contributor_id, current + c.points);
    totalPool += c.points;
  }

  if (totalPool === 0) {
    store.contributors.forEach((c) => {
      c.points = 0;
      c.share_pct = 0;
      c.satoshis = 0;
    });
    return;
  }

  const poolSatoshis = store.revenue_pool_satoshis;
  for (const [contributorId, points] of Array.from(pointsByContributor)) {
    const contributor = store.contributors.get(contributorId);
    if (!contributor) continue;
    contributor.points = points;
    contributor.share_pct = Math.round((points / totalPool) * 10000) / 100;
    contributor.satoshis = Math.floor(
      (contributor.share_pct / 100) * poolSatoshis
    );
  }

  // Contributors with no implemented contributions
  for (const c of Array.from(store.contributors.values())) {
    if (!pointsByContributor.has(c.id)) {
      c.points = 0;
      c.share_pct = 0;
      c.satoshis = 0;
    }
  }
}

/**
 * Generate agent log lines for broadcasting when a contribution is marked implemented.
 * Factual, transparent, no celebration language (ethics.mdc).
 */
export function buildAgentLogForImplement(
  contribution: RealContribution,
  contributor: RealContributor,
  totalPoolBefore: number,
  totalPoolAfter: number
): string[] {
  const typeLabel = contribution.type.replace("_", " / ");
  const points = contribution.points;
  const sharePct =
    totalPoolAfter > 0
      ? Math.round((points / totalPoolAfter) * 10000) / 100
      : 100;

  return [
    `Processing contribution #${contribution.id.slice(0, 8)}...`,
    `Type: ${typeLabel}`,
    `Base score: ${points} points`,
    `Pool was: ${totalPoolBefore} points`,
    `Pool now: ${totalPoolAfter} points`,
    `Share: ${points} ÷ ${totalPoolAfter} = ${sharePct}%`,
    `All shares recalculated.`,
    `Agent version: ${AGENT_VERSION}.`,
  ];
}

export function getAgentVersion(): number {
  return AGENT_VERSION;
}

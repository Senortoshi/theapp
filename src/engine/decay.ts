import type { Contribution } from "../data/schema";

/**
 * Applies one tick of decay to all contributions (e.g. per new contribution).
 * - Default: 1.5% per tick.
 * - If referenced by others: 0.75% (half rate).
 * - Synthesis type: 30% slower (rate × 0.7).
 * - Floor: never below 15% of original base_score.
 * Returns the same (mutated) contributions array.
 */
export function decayAllScores(contributions: Contribution[]): Contribution[] {
  for (const c of contributions) {
    const minScore = c.base_score * 0.15;
    if (c.current_score <= minScore) continue;

    let decayRate = 0.015;
    if (c.referenced_by.length > 0) decayRate = 0.0075;
    if (c.type === "synthesis") decayRate *= 0.7;

    c.current_score = Math.max(minScore, c.current_score * (1 - decayRate));
    c.score_history.push({
      timestamp: Date.now(),
      score: c.current_score,
      reason: `Decay ${(decayRate * 100).toFixed(2)}% | referenced:${c.referenced_by.length > 0} synthesis:${c.type === "synthesis"}`,
    });
  }
  return contributions;
}

/** @deprecated Use decayAllScores. Returns change list for legacy consumers. */
export function decayScores(
  allContributions: Contribution[]
): { contributor_id: string; old_score: number; new_score: number }[] {
  const changes: { contributor_id: string; old_score: number; new_score: number }[] = [];
  for (const c of allContributions) {
    const oldScore = c.current_score;
    const minScore = c.base_score * 0.15;
    if (c.current_score <= minScore) continue;
    let decayRate = 0.015;
    if (c.referenced_by.length > 0) decayRate = 0.0075;
    if (c.type === "synthesis") decayRate *= 0.7;
    c.current_score = Math.max(minScore, c.current_score * (1 - decayRate));
    if (Math.abs(oldScore - c.current_score) > 0.001) {
      c.score_history.push({
        timestamp: Date.now(),
        score: c.current_score,
        reason: `Decay ${(decayRate * 100).toFixed(2)}% | referenced:${c.referenced_by.length > 0} synthesis:${c.type === "synthesis"}`,
      });
      changes.push({ contributor_id: c.contributor_id, old_score: oldScore, new_score: c.current_score });
    }
  }
  return changes;
}

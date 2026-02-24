/**
 * Ethics layer: calm, factual, transparent narration.
 * No encouragement, urgency, or comparative language.
 */

export interface DecayPayload {
  contributor_id?: string;
  old_score?: number;
  new_score?: number;
  old_pct?: number;
  new_pct?: number;
  contribution_type?: string;
  referenced_count?: number;
  decay_rate?: number;
  /** True when referenced or synthesis → slower than base 1.5% */
  slower_than_average?: boolean;
}

/**
 * Decay events: frame as "share adjusting as ecosystem grows", not loss.
 * If referenced by others, note that decay is slower — "aging well."
 */
export function narrateDecay(data: DecayPayload): string {
  const x = data.old_pct != null ? `${Number(data.old_pct).toFixed(1)}` : "—";
  const y = data.new_pct != null ? `${Number(data.new_pct).toFixed(1)}` : "—";
  const n = data.referenced_count ?? 0;
  const slower = data.slower_than_average === true;

  let line = `Your share is adjusting as the ecosystem grows — from ${x}% to ${y}%.`;
  if (slower && n > 0) {
    const baseRatePct = 1.5;
    const ratePct = data.decay_rate ?? 1.5;
    const z = ratePct < baseRatePct ? Math.round(((baseRatePct - ratePct) / baseRatePct) * 100) : 0;
    line += ` Because your work was cited ${n} time${n === 1 ? "" : "s"}, your decay rate is ${z}% slower than average. You're aging well.`;
  }
  return line;
}

export interface AdjustmentReason {
  newContributionsCount: number;
}

/**
 * Share adjustment: pool grew; your work unchanged. No loss/competition language.
 */
export function narrateAdjustment(
  contributor: { current_share_pct?: number; total_satoshis_earned?: number },
  reason: AdjustmentReason,
  satoshisThisPeriod?: number
): string {
  const n = reason.newContributionsCount;
  const satoshis = satoshisThisPeriod ?? contributor.total_satoshis_earned ?? 0;
  const satsStr = typeof satoshis === "number" ? satoshis.toLocaleString() : "—";
  return `${n} new contribution${n === 1 ? "" : "s"} entered the pool. The work you did is unchanged — the pool grew around it, as it should. Your absolute earning this period: ${satsStr} satoshis.`;
}

/** Generic shares-updated line when we don't have per-contributor context (e.g. feed). */
export function narrateAdjustmentGeneric(reason: AdjustmentReason): string {
  const n = reason.newContributionsCount;
  return `${n} new contribution${n === 1 ? "" : "s"} entered the pool. The work you did is unchanged — the pool grew around it, as it should.`;
}

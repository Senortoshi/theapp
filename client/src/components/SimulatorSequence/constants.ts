/**
 * Simulator phase timing (seconds from sequence start).
 * Pacing: minimum 2s between major state changes; agent log 800ms per line.
 */
export const PHASE_END = {
  PHASE_0_VOID: 4,
  PHASE_1_FIRST: 18,
  PHASE_2_BUILDER: 32,
  PHASE_3_MORE: 80,
  PHASE_4_EXTERNAL: 115,
  PHASE_5_REVENUE: 140,
  PHASE_6_REPLICATION: 165,
} as const;

export const AGENT_LINE_MS = 800;
export const TYPING_CHAR_MS = 80;
export const PAUSE_BEFORE_SUBMIT_MS = 2000;
export const PAUSE_AFTER_WALL_MS = 3000;
export const PAUSE_AFTER_SHARES_MS = 3000;
export const PAUSE_AFTER_EXTERNAL_MS = 4000;

export const FIRST_CONTRIBUTION_TEXT = "This site needs a name.";
export const CONTRIBUTION_2 = "The design should feel like infrastructure. Dark. Minimal. Permanent.";
export const CONTRIBUTION_3 = "Every contribution should show its full calculation history.";
export const CONTRIBUTION_4 = "The fairness agent scoring formula should itself be improvable by contributors.";
export const CONTRIBUTION_6 = "This model should replicate to every project that needs it.";

export const REVENUE_SATS = 100_000; // 0.001 BSV = 100,000 sats

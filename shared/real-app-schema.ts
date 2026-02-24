/**
 * Real app schema — in-memory now, BSV on-chain later.
 * Contribution types and base points per fairness agent v1.0.
 */

export const REAL_CONTRIBUTION_TYPES = [
  "naming",
  "design",
  "code",
  "governance",
  "external_advocacy",
  "general",
] as const;

export type RealContributionType = (typeof REAL_CONTRIBUTION_TYPES)[number];

/** Base points per type — fairness agent v1.0 */
export const REAL_BASE_POINTS: Record<RealContributionType, number> = {
  naming: 15,
  design: 20,
  code: 25,
  governance: 18,
  external_advocacy: 15,
  general: 10,
};

export type ContributionStatus = "PENDING" | "IMPLEMENTED";

export interface RealContributor {
  id: string;
  /** Display name or handle (optional from submit) */
  name: string;
  /** Sum of points from all implemented contributions */
  points: number;
  /** share_percentage = points / total_pool_points * 100 */
  share_pct: number;
  /** satoshis = (share_pct / 100) * revenue_pool_satoshis */
  satoshis: number;
}

export interface RealContribution {
  id: string;
  contributor_id: string;
  content: string;
  /** Optional name at time of submit */
  author_name: string;
  status: ContributionStatus;
  type: RealContributionType;
  /** Set when IMPLEMENTED */
  points: number;
  /** ISO timestamp for display */
  created_at: string;
  /** When marked implemented */
  implemented_at?: string;
}

export interface WallEntryDTO {
  id: number;
  contribution_id: string;
  content: string;
  author: string;
  status: ContributionStatus;
  points?: number;
  sharePct?: number;
  satoshis?: number;
  isExternal?: boolean;
  timestampLabel: string;
  type?: RealContributionType;
}

export interface RealAppState {
  /** Chronological ledger — nothing deleted */
  contributions: RealContribution[];
  contributors: Map<string, RealContributor>;
  /** Total satoshis in revenue pool (manual from admin) */
  revenue_pool_satoshis: number;
  /** Fairness agent version — increments when formula improved by contribution */
  agent_version: number;
}

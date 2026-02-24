import type { Contributor as SchemaContributor } from "./schema";

export type Contributor = SchemaContributor;

export interface GlobalStats {
  total_contributors: number;
  total_revenue: number;
  total_contributions: number;
}

export type FeedEventType =
  | "contribution_added"
  | "shares_updated"
  | "revenue_distributed"
  | "score_decayed"
  | "boost_applied"
  | "status_changed"
  | "simulation_phase"
  | "advocacy_detected";

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  data: unknown;
  timestamp: number;
}

export type WsStatus = "connecting" | "live" | "reconnecting";

export interface RevenueDistributionItem {
  contributor_id: string;
  username: string;
  amount: number;
  share_pct: number;
}

export interface WSMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

export type ContributionType = "idea" | "code" | "design" | "critique" | "synthesis" | "advocacy";

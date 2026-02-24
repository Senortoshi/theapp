import type { Contributor as SchemaContributor } from "@shared/schema";

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

/** External attribution: agent found someone who was never on the platform. Gold only. */
export type AdvocacySource = "X" | "GitHub" | "Reddit" | "Telegram";

export interface AdvocacyEvent {
  source: AdvocacySource;
  username: string;
  content: string;
  impactMetric: string;
  attributedShare: number;
  wasAwareOfPlatform: false;
}

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

export type ContributionType = "idea" | "code" | "design" | "critique" | "synthesis";

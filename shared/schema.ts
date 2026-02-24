import { z } from "zod";

export const contributionTypes = ['idea', 'code', 'design', 'critique', 'synthesis'] as const;
export type ContributionType = (typeof contributionTypes)[number];

export interface Contributor {
  id: string;
  username: string;
  avatar_seed: string;
  contributions: string[];
  current_share_pct: number;
  total_satoshis_earned: number;
  share_history: [number, number][];
  relevance_score: number;
  status: 'rising' | 'stable' | 'decaying';
}

export interface Contribution {
  id: string;
  contributor_id: string;
  content: string;
  timestamp: number;
  base_score: number;
  current_score: number;
  referenced_by: string[];
  decay_rate: number;
  type: ContributionType;
  score_history: { timestamp: number; score: number; reason: string }[];
}

export interface RevenueEvent {
  id: string;
  amount_satoshis: number;
  timestamp: number;
  distribution: { contributor_id: string; username: string; amount: number; share_pct: number }[];
}

export interface AppState {
  contributors: Contributor[];
  contributions: Contribution[];
  revenueEvents: RevenueEvent[];
  globalStats: {
    total_contributors: number;
    total_revenue: number;
    total_contributions: number;
  };
}

export const contributeSchema = z.object({
  username: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(contributionTypes).optional(),
});

export const revenueSchema = z.object({
  amount_satoshis: z.number().positive().int(),
});

export type ContributeInput = z.infer<typeof contributeSchema>;
export type RevenueInput = z.infer<typeof revenueSchema>;

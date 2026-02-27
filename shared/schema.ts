/**
 * Legacy simulator schema.
 *
 * NOTE: For THEREALBITCOIN.FUN, all real data MUST come from on-chain
 * 1Sat Ordinal inscriptions on BSV (via GorillaPool + Yours Wallet), with
 * no mock or simulated data. This file will be progressively aligned to
 * the therealbitcoin.fun project rules defined in `.cursor/rules`.
 */
import { z } from "zod";
import { pgTable, text, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";

export const contributionTypes = ['idea', 'code', 'design', 'critique', 'synthesis', 'advocacy'] as const;
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

export const contributions = pgTable("contributions", {
  id: text("id").primaryKey(),
  txid: text("txid").notNull(),
  projectId: text("project_id").notNull(),
  contributorAddress: text("contributor_address").notNull(),
  text: text("text").notNull(),
  timestamp: integer("timestamp").notNull(),
  blockHeight: integer("block_height"),
  sharePercent: real("share_percent").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  genesisTxid: text("genesis_txid").notNull(),
  creatorAddress: text("creator_address").notNull(),
  description: text("description"),
  live: boolean("live").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

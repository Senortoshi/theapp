import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import type { Contributor, Contribution, ContributionType, RevenueEvent, AppState } from "@shared/schema";

export class SimulationStore {
  contributors: Map<string, Contributor> = new Map();
  contributions: Contribution[] = [];
  revenueEvents: RevenueEvent[] = [];

  getOrCreateContributor(username: string): Contributor {
    const existing = Array.from(this.contributors.values()).find(c => c.username === username);
    if (existing) return existing;

    const contributor: Contributor = {
      id: randomUUID(),
      username,
      avatar_seed: randomUUID().slice(0, 8),
      contributions: [],
      current_share_pct: 0,
      total_satoshis_earned: 0,
      share_history: [],
      relevance_score: 0,
      status: 'stable',
    };

    this.contributors.set(contributor.id, contributor);
    return contributor;
  }

  addContribution(contributorId: string, content: string, type: ContributionType, baseScore: number): Contribution {
    const contribution: Contribution = {
      id: randomUUID(),
      contributor_id: contributorId,
      content,
      timestamp: Date.now(),
      base_score: baseScore,
      current_score: baseScore,
      referenced_by: [],
      decay_rate: 0.015,
      type,
      score_history: [{ timestamp: Date.now(), score: baseScore, reason: 'Initial score' }],
    };

    this.contributions.push(contribution);

    const contributor = this.contributors.get(contributorId);
    if (contributor) {
      contributor.contributions.push(contribution.id);
    }

    return contribution;
  }

  addRevenueEvent(event: RevenueEvent): void {
    this.revenueEvents.push(event);
  }

  getContributionById(id: string): Contribution | undefined {
    return this.contributions.find(c => c.id === id);
  }

  getAllContributorsSorted(): Contributor[] {
    return Array.from(this.contributors.values()).sort((a, b) => b.current_share_pct - a.current_share_pct);
  }

  getState(): AppState {
    return {
      contributors: this.getAllContributorsSorted(),
      contributions: [...this.contributions].reverse().slice(0, 50),
      revenueEvents: [...this.revenueEvents].reverse().slice(0, 20),
      globalStats: {
        total_contributors: this.contributors.size,
        total_revenue: this.revenueEvents.reduce((sum, e) => sum + e.amount_satoshis, 0),
        total_contributions: this.contributions.length,
      },
    };
  }

  getContributorById(id: string): Contributor | undefined {
    return this.contributors.get(id);
  }
}

export const store = new SimulationStore();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });


import { randomUUID } from "crypto";
import type {
  RealContribution,
  RealContributor,
  RealContributionType,
  WallEntryDTO,
} from "@shared/real-app-schema";

/** In-memory store for the real app. BSV on-chain persistence later. */
class RealAppStore {
  contributions: RealContribution[] = [];
  contributors: Map<string, RealContributor> = new Map();
  revenue_pool_satoshis = 0;
  agent_version = 1;
  /** Sequential id for Wall display (#1, #2, ...) */
  private nextWallId = 1;

  getOrCreateContributor(name: string): RealContributor {
    const trimmed = (name || "anonymous").trim() || "anonymous";
    const existing = Array.from(this.contributors.values()).find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const contributor: RealContributor = {
      id: randomUUID(),
      name: trimmed,
      points: 0,
      share_pct: 0,
      satoshis: 0,
    };
    this.contributors.set(contributor.id, contributor);
    return contributor;
  }

  getContributorById(id: string): RealContributor | undefined {
    return this.contributors.get(id);
  }

  /** Add contribution as PENDING. Appears on Wall immediately. */
  addContribution(
    contributorId: string,
    content: string,
    authorName: string,
    type: RealContributionType
  ): RealContribution {
    const contributor = this.contributors.get(contributorId);
    if (!contributor) throw new Error("Contributor not found");

    const contribution: RealContribution = {
      id: randomUUID(),
      contributor_id: contributorId,
      content: content.trim(),
      author_name: authorName.trim() || contributor.name,
      status: "PENDING",
      type,
      points: 0,
      created_at: new Date().toISOString(),
    };
    this.contributions.push(contribution);
    return contribution;
  }

  getContributionById(id: string): RealContribution | undefined {
    return this.contributions.find((c) => c.id === id);
  }

  /** Mark contribution as IMPLEMENTED with given points; then caller recalculates shares. */
  markImplemented(contributionId: string, points: number): RealContribution | undefined {
    const c = this.contributions.find((x) => x.id === contributionId);
    if (!c || c.status !== "PENDING") return undefined;
    c.status = "IMPLEMENTED";
    c.points = points;
    c.implemented_at = new Date().toISOString();
    return c;
  }

  getPendingContributions(): RealContribution[] {
    return this.contributions.filter((c) => c.status === "PENDING");
  }

  /** Wall: chronological, all contributions, never deleted. */
  getWallEntries(): WallEntryDTO[] {
    return this.contributions.map((c, i) => {
      const contributor = this.contributors.get(c.contributor_id);
      const created = new Date(c.created_at);
      const timestampLabel =
        created.toISOString().slice(0, 10) +
        " " +
        created.toTimeString().slice(0, 5);

      return {
        id: i + 1,
        contribution_id: c.id,
        content: c.content,
        author: c.author_name || contributor?.name || "—",
        status: c.status,
        points: c.status === "IMPLEMENTED" ? c.points : undefined,
        sharePct:
          c.status === "IMPLEMENTED" && contributor
            ? contributor.share_pct
            : undefined,
        satoshis:
          c.status === "IMPLEMENTED" && contributor
            ? contributor.satoshis
            : undefined,
        isExternal: c.type === "external_advocacy",
        timestampLabel,
        type: c.type,
      };
    });
  }

  setRevenuePool(satoshis: number): void {
    this.revenue_pool_satoshis = Math.max(0, Math.floor(satoshis));
  }

  incrementAgentVersion(): void {
    this.agent_version += 1;
  }
}

export const realAppStore = new RealAppStore();

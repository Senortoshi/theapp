import { EventEmitter } from "events";
import { db } from "./storage";
import { contributions } from "@shared/schema";

type NewContributionRow = typeof contributions.$inferInsert;

interface GorillaPoolFile {
  content?: string | null;
}

interface GorillaPoolInscription {
  id?: unknown;
  inscriptionId?: unknown;
  outpoint?: unknown;
  origin?: unknown;
  txid?: unknown;
  address?: unknown;
  owner?: unknown;
  timestamp?: unknown;
  created_at?: unknown;
  createdAt?: unknown;
  time?: unknown;
  height?: unknown;
  blockHeight?: unknown;
  file?: GorillaPoolFile | null;
  [key: string]: unknown;
}

interface ContributionPayload {
  app: string;
  type: string;
  text: string;
  projectId: string;
}

const GORILLAPOOL_ENDPOINT = "https://ordinals.gorillapool.io/api/inscriptions/search";
const DEFAULT_POLL_INTERVAL_MS = 30_000;

export class BsvIndexer extends EventEmitter {
  private readonly projectId: string;
  private readonly pollIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  constructor(projectId: string, pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS) {
    super();
    this.projectId = projectId;
    this.pollIntervalMs = pollIntervalMs;

    if (this.projectId) {
      this.start();
    }
  }

  start(): void {
    if (this.timer || !this.projectId) return;

    void this.pollOnce();
    this.timer = setInterval(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private async pollOnce(): Promise<void> {
    if (this.isPolling || !this.projectId) return;
    this.isPolling = true;

    try {
      const searchQuery = { map: { app: "therealbitcoin", projectId: this.projectId } };
      const qParam = encodeURIComponent(JSON.stringify(searchQuery));
      const url = `${GORILLAPOOL_ENDPOINT}?q=${qParam}`;

      const response = await fetch(url);
      if (!response.ok) {
        return;
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        // Malformed JSON from upstream; try again on next interval
        return;
      }

      const inscriptions = this.normalizeInscriptionsResponse(json);
      if (!inscriptions.length) {
        return;
      }

      const rowsToInsert: NewContributionRow[] = [];

      for (const inscription of inscriptions) {
        const row = this.mapInscriptionToContribution(inscription);
        if (row) {
          rowsToInsert.push(row);
        }
      }

      if (!rowsToInsert.length) {
        return;
      }

      const inserted = await db
        .insert(contributions)
        .values(rowsToInsert)
        .onConflictDoNothing()
        .returning();

      for (const contribution of inserted) {
        this.emit("new_contribution", contribution);
      }
    } catch {
      // Silent fail on network or other unexpected errors; retry on next tick
    } finally {
      this.isPolling = false;
    }
  }

  private normalizeInscriptionsResponse(data: unknown): GorillaPoolInscription[] {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data as GorillaPoolInscription[];
    }

    if (typeof data === "object" && data !== null) {
      const maybeResults = (data as { results?: unknown }).results;
      if (Array.isArray(maybeResults)) {
        return maybeResults as GorillaPoolInscription[];
      }
    }

    return [];
  }

  private mapInscriptionToContribution(inscription: GorillaPoolInscription): NewContributionRow | null {
    const payload = this.decodeAndValidatePayload(inscription);
    if (!payload) return null;

    const txid = this.getTxid(inscription);
    if (!txid) return null;

    const id = this.getStableContributionId(inscription, txid, payload.projectId);
    if (!id) return null;

    const contributorAddress = this.getContributorAddress(inscription) ?? "";
    const timestamp = this.getTimestamp(inscription);
    const blockHeight = this.getBlockHeight(inscription);

    const row: NewContributionRow = {
      id,
      txid,
      projectId: payload.projectId,
      contributorAddress,
      text: payload.text,
      timestamp,
      blockHeight,
    };

    return row;
  }

  private decodeAndValidatePayload(inscription: GorillaPoolInscription): ContributionPayload | null {
    const file = inscription.file;
    const content = file?.content;

    if (!content || typeof content !== "string") {
      return null;
    }

    let decoded: string;
    try {
      decoded = Buffer.from(content, "base64").toString("utf8");
    } catch {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(decoded);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const maybePayload = parsed as Partial<ContributionPayload> & Record<string, unknown>;

    if (maybePayload.app !== "therealbitcoin") {
      return null;
    }

    if (maybePayload.type !== "contribution") {
      return null;
    }

    if (typeof maybePayload.text !== "string" || !maybePayload.text.trim()) {
      return null;
    }

    if (typeof maybePayload.projectId !== "string" || maybePayload.projectId !== this.projectId) {
      return null;
    }

    return {
      app: maybePayload.app,
      type: maybePayload.type,
      text: maybePayload.text.trim(),
      projectId: maybePayload.projectId,
    };
  }

  private getTxid(inscription: GorillaPoolInscription): string | null {
    const txidCandidate =
      (typeof inscription.txid === "string" && inscription.txid) ||
      (typeof inscription.origin === "string" && inscription.origin.split(":")[0]) ||
      (typeof inscription.outpoint === "string" && inscription.outpoint.split(":")[0]);

    if (typeof txidCandidate === "string" && txidCandidate.length > 0) {
      return txidCandidate;
    }

    return null;
  }

  private getStableContributionId(
    inscription: GorillaPoolInscription,
    txid: string,
    projectId: string,
  ): string | null {
    const explicitId =
      (typeof inscription.id === "string" && inscription.id) ||
      (typeof inscription.inscriptionId === "string" && inscription.inscriptionId) ||
      (typeof inscription.outpoint === "string" && inscription.outpoint);

    if (explicitId && typeof explicitId === "string" && explicitId.length > 0) {
      return explicitId;
    }

    if (!txid || !projectId) {
      return null;
    }

    // Deterministic fallback ID derived from txid + projectId
    return `${txid}:${projectId}`;
  }

  private getContributorAddress(inscription: GorillaPoolInscription): string | null {
    const addr =
      (typeof inscription.address === "string" && inscription.address) ||
      (typeof inscription.owner === "string" && inscription.owner);

    if (typeof addr === "string" && addr.length > 0) {
      return addr;
    }

    return null;
  }

  private getTimestamp(inscription: GorillaPoolInscription): number {
    const tsCandidate =
      (typeof inscription.timestamp === "number" && inscription.timestamp) ||
      (typeof inscription.created_at === "number" && inscription.created_at) ||
      (typeof inscription.createdAt === "number" && inscription.createdAt) ||
      (typeof inscription.time === "number" && inscription.time);

    if (typeof tsCandidate === "number" && Number.isFinite(tsCandidate)) {
      return Math.trunc(tsCandidate);
    }

    return Date.now();
  }

  private getBlockHeight(inscription: GorillaPoolInscription): number | null {
    const heightCandidate =
      (typeof inscription.height === "number" && inscription.height) ||
      (typeof inscription.blockHeight === "number" && inscription.blockHeight);

    if (typeof heightCandidate === "number" && Number.isFinite(heightCandidate)) {
      return Math.trunc(heightCandidate);
    }

    return null;
  }
}

export const indexer = new BsvIndexer(process.env.PROJECT_ID ?? "");


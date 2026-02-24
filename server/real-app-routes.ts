/**
 * Real app API and WebSocket events.
 * Admin: password via REAL_APP_ADMIN_PASSWORD env (default for dev: "admin").
 */

import type { Express, Request, Response } from "express";
import { realAppStore } from "./real-app-store";
import {
  scoreContribution,
  recalculateSharesAndRevenue,
  buildAgentLogForImplement,
} from "./real-app-fairness";
import type { RealContributionType } from "@shared/real-app-schema";
import { REAL_CONTRIBUTION_TYPES } from "@shared/real-app-schema";
import { z } from "zod";

const ADMIN_PASSWORD =
  process.env.REAL_APP_ADMIN_PASSWORD || "admin";

function getBroadcast(): (type: string, data: unknown) => void {
  // Injected by registerRoutes
  const g = globalThis as unknown as { __realAppBroadcast?: (type: string, data: unknown) => void };
  return g.__realAppBroadcast ?? (() => {});
}

const contributeSchema = z.object({
  content: z.string().min(1).max(10000),
  name: z.string().max(200).optional(),
  type: z
    .enum(
      REAL_CONTRIBUTION_TYPES as unknown as [RealContributionType, ...RealContributionType[]]
    )
    .default("general"),
});

const adminMarkImplementedSchema = z.object({
  contribution_id: z.string().uuid(),
});

const adminRevenuePoolSchema = z.object({
  satoshis: z.number().int().min(0),
});

const adminAuthSchema = z.object({
  password: z.string(),
});

function requireAdmin(req: Request, res: Response, next: () => void): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function registerRealAppRoutes(
  app: Express,
  broadcast: (type: string, data: unknown) => void
): void {
  (globalThis as unknown as { __realAppBroadcast?: (type: string, data: unknown) => void }).__realAppBroadcast = broadcast;

  // —— Public ——

  app.post("/api/real/contribute", (req, res) => {
    try {
      const parsed = contributeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const { content, name, type } = parsed.data;
      const contributor = realAppStore.getOrCreateContributor(name ?? "");
      const contribution = realAppStore.addContribution(
        contributor.id,
        content,
        name ?? contributor.name,
        type as RealContributionType
      );
      const wallEntries = realAppStore.getWallEntries();
      const entry = wallEntries.find((e) => e.contribution_id === contribution.id);
      getBroadcast()("real_wall_entry", { entry: entry ?? null, wall: wallEntries });
      res.status(201).json({ contribution_id: contribution.id, wall: wallEntries });
    } catch (err: unknown) {
      console.error("[RealApp] POST /contribute:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  app.get("/api/real/wall", (_req, res) => {
    try {
      const wall = realAppStore.getWallEntries();
      res.json({ wall });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  app.get("/api/real/state", (_req, res) => {
    try {
      const wall = realAppStore.getWallEntries();
      const revenue_pool_satoshis = realAppStore.revenue_pool_satoshis;
      const agent_version = realAppStore.agent_version;
      res.json({ wall, revenue_pool_satoshis, agent_version });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  // —— Admin (password protected) ——

  app.post("/api/real/admin/auth", (req, res) => {
    try {
      const parsed = adminAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid body" });
      }
      if (parsed.data.password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      res.json({ ok: true, token: ADMIN_PASSWORD });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/real/admin/pending", requireAdmin, (_req, res) => {
    try {
      const pending = realAppStore.getPendingContributions();
      res.json({ pending });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  app.post("/api/real/admin/mark-implemented", requireAdmin, (req, res) => {
    try {
      const parsed = adminMarkImplementedSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const contrib = realAppStore.getContributionById(parsed.data.contribution_id);
      if (!contrib || contrib.status !== "PENDING") {
        return res.status(404).json({ error: "Contribution not found or already implemented" });
      }
      const totalPoolBefore = realAppStore.contributions
        .filter((c) => c.status === "IMPLEMENTED")
        .reduce((s, c) => s + c.points, 0);
      const points = scoreContribution(contrib.content, contrib.type);
      const updated = realAppStore.markImplemented(contrib.id, points);
      if (!updated) {
        return res.status(500).json({ error: "Failed to mark implemented" });
      }
      recalculateSharesAndRevenue();
      const totalPoolAfter = realAppStore.contributions
        .filter((c) => c.status === "IMPLEMENTED")
        .reduce((s, c) => s + c.points, 0);
      const contributor = realAppStore.getContributorById(updated.contributor_id);
      if (!contributor) {
        return res.status(500).json({ error: "Contributor not found" });
      }
      const logLines = buildAgentLogForImplement(
        updated,
        contributor,
        totalPoolBefore,
        totalPoolAfter
      );
      const wall = realAppStore.getWallEntries();
      broadcast("real_agent_log", { lines: logLines });
      broadcast("real_wall_updated", { wall });
      res.json({ contribution: updated, wall, agent_log: logLines });
    } catch (err: unknown) {
      console.error("[RealApp] POST mark-implemented:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  app.get("/api/real/admin/revenue-pool", requireAdmin, (_req, res) => {
    try {
      res.json({ satoshis: realAppStore.revenue_pool_satoshis });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/real/admin/revenue-pool", requireAdmin, (req, res) => {
    try {
      const parsed = adminRevenuePoolSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      realAppStore.setRevenuePool(parsed.data.satoshis);
      recalculateSharesAndRevenue();
      const wall = realAppStore.getWallEntries();
      broadcast("real_wall_updated", { wall });
      broadcast("real_revenue_pool_updated", { satoshis: realAppStore.revenue_pool_satoshis });
      res.json({ satoshis: realAppStore.revenue_pool_satoshis });
    } catch (err: unknown) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });
}

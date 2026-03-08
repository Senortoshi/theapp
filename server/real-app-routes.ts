import type { Express } from "express";

type BroadcastFn = (type: string, data: unknown) => void;

export function registerRealAppRoutes(app: Express, _broadcast: BroadcastFn): void {
  // Real on-chain app routes are registered here.
  // The current implementation relies on the core simulation and BSV indexer
  // routes defined in `routes.ts`, so this is intentionally minimal.
  void app;
  void _broadcast;
}


import { useEffect, useRef } from "react";
import type { WSMessage } from "@/types";
import type { Contributor } from "@shared/schema";
import {
  applySharesUpdate,
  addFeedEvent,
  applyRevenueDistribution,
  clearRevenueBatch,
  setAdvocacyInProgress,
} from "@/store/useSimStore";
import type { RevenueDistributionItem, AdvocacyEvent } from "@/types";

export type ProcessBatchFn = (batch: WSMessage[]) => void;

/** Process buffered WS messages once per frame. Collapse shares_updated to latest only. */
function processBatch(batch: WSMessage[]): void {
  const shares: Contributor[][] = [];
  let lastSharesPayload: { new_contributions_count?: number } = {};
  const revenueEvents: Array<{ distribution: RevenueDistributionItem[]; totalRevenue: number }> = [];
  const contributionAdded: WSMessage[] = [];
  const scoreDecayed: WSMessage[] = [];
  const boostApplied: WSMessage[] = [];
  const statusChanged: WSMessage[] = [];
  const simulationPhase: WSMessage[] = [];
  const advocacyDetected: WSMessage[] = [];

  for (const msg of batch) {
    switch (msg.type) {
      case "advocacy_detected":
        advocacyDetected.push(msg);
        break;
      case "shares_updated": {
        const d = msg.data as { contributors?: Contributor[]; new_contributions_count?: number };
        shares.push(d?.contributors ?? []);
        lastSharesPayload = { new_contributions_count: d?.new_contributions_count };
        break;
      }
      case "revenue_distributed": {
        const d = msg.data as { amount?: number; distribution?: RevenueDistributionItem[]; running_totals?: Record<string, number> };
        if (d?.distribution) {
          const totalRevenue = d.running_totals
            ? Object.values(d.running_totals).reduce((a, b) => a + b, 0)
            : d.distribution.reduce((s, x) => s + x.amount, 0);
          revenueEvents.push({ distribution: d.distribution, totalRevenue });
        }
        break;
      }
      case "contribution_added":
        contributionAdded.push(msg);
        break;
      case "score_decayed":
        scoreDecayed.push(msg);
        break;
      case "boost_applied":
        boostApplied.push(msg);
        break;
      case "status_changed":
        statusChanged.push(msg);
        break;
      case "simulation_phase":
        simulationPhase.push(msg);
        break;
      default:
        break;
    }
  }

  if (shares.length > 0) {
    const latest = shares[shares.length - 1];
    if (latest.length > 0) {
      applySharesUpdate(latest);
      addFeedEvent({ type: "shares_updated", data: lastSharesPayload, timestamp: Date.now() });
    }
  }

  for (const ev of revenueEvents) {
    applyRevenueDistribution(ev.distribution, ev.totalRevenue);
    const amount = ev.distribution.reduce((s, d) => s + d.amount, 0);
    addFeedEvent({ type: "revenue_distributed", data: { amount }, timestamp: Date.now() });
  }

  for (const msg of contributionAdded) {
    addFeedEvent({ type: "contribution_added", data: msg.data, timestamp: msg.timestamp });
  }

  if (scoreDecayed.length > 0) {
    if (scoreDecayed.length <= 3) {
      scoreDecayed.forEach((msg) =>
        addFeedEvent({ type: "score_decayed", data: msg.data, timestamp: msg.timestamp })
      );
    } else {
      addFeedEvent({
        type: "score_decayed",
        data: { batch: true, count: scoreDecayed.length },
        timestamp: scoreDecayed[scoreDecayed.length - 1].timestamp,
      });
    }
  }

  for (const msg of boostApplied) {
    addFeedEvent({ type: "boost_applied", data: msg.data, timestamp: msg.timestamp });
  }
  for (const msg of statusChanged) {
    addFeedEvent({ type: "status_changed", data: msg.data, timestamp: msg.timestamp });
  }
  for (const msg of simulationPhase) {
    addFeedEvent({ type: "simulation_phase", data: msg.data, timestamp: msg.timestamp });
  }

  for (const msg of advocacyDetected) {
    const event = msg.data as AdvocacyEvent;
    if (event?.username != null) setAdvocacyInProgress(event);
  }
}

export interface UseRAFFlushOptions {
  messageBufferRef: React.MutableRefObject<WSMessage[]>;
}

export function useRAFFlush({ messageBufferRef }: UseRAFFlushOptions): void {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const flush = () => {
      if (messageBufferRef.current.length > 0) {
        const batch = [...messageBufferRef.current];
        messageBufferRef.current = [];
        processBatch(batch);
      }
      rafRef.current = requestAnimationFrame(flush);
    };
    rafRef.current = requestAnimationFrame(flush);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [messageBufferRef]);
}

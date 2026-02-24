import React from "react";
import { motion } from "framer-motion";
import type { FeedEvent as FeedEventType } from "@/types";
import { useContributors } from "@/store/useSimStore";
import { narrateDecay, narrateAdjustmentGeneric, type DecayPayload } from "@/utils/narration";

function formatSats(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export const FeedEvent = React.memo(function FeedEvent({ event, compact = false }: { event: FeedEventType; compact?: boolean }) {
  const contributors = useContributors();
  const config = React.useMemo(() => {
    const typeLabels: Record<string, string> = { idea: "[idea]", code: "[code]", design: "[design]", critique: "[critique]", synthesis: "[synthesis]" };
    switch (event.type) {
      case "contribution_added": {
        const d = event.data as { contributor?: { username: string }; contribution?: { type: string; current_score?: number } };
        const contribType = d?.contribution?.type ?? "idea";
        const label = typeLabels[contribType] ?? "[contribution]";
        const pts = d?.contribution?.current_score != null ? `+${Number(d.contribution.current_score).toFixed(1)}pts` : "";
        return { icon: label, msg: `${contribType} scored ${pts}`.trim(), color: "var(--green)" };
      }
      case "shares_updated": {
        const d = event.data as { new_contributions_count?: number };
        const n = d?.new_contributions_count;
        const msg = n != null && n > 0
          ? narrateAdjustmentGeneric({ newContributionsCount: n })
          : "Pool updated. Shares recalculated.";
        return { icon: "[update]", msg, color: "var(--green)" };
      }
      case "revenue_distributed": {
        const d = event.data as { amount?: number };
        const amt = d?.amount ?? 0;
        return { icon: "[revenue]", msg: `${formatSats(amt)} sats distributed`, color: "var(--text-1)" };
      }
      case "boost_applied": {
        const d = event.data as { to_username?: string };
        return { icon: "[boost]", msg: `contribution built upon (+boost)`, color: "var(--purple)" };
      }
      case "score_decayed": {
        const d = event.data as DecayPayload & { batch?: boolean; count?: number };
        if (d?.batch && d?.count != null) {
          return {
            icon: "[adjust]",
            msg: `Share adjustments as the ecosystem grows — ${d.count} contribution${d.count === 1 ? "" : "s"} updated.`,
            color: "var(--red)",
          };
        }
        return {
          icon: "[adjust]",
          msg: narrateDecay(d),
          color: "var(--red)",
        };
      }
      case "status_changed": {
        const d = event.data as { username?: string; new_status?: string };
        return { icon: "·", msg: `${d?.username ?? "?"} ${d?.new_status ?? ""}`, color: "var(--text-2)" };
      }
      case "simulation_phase":
        return { icon: "[phase]", msg: (event.data as { message?: string })?.message ?? "Phase", color: "var(--green)" };
      case "advocacy_detected": {
        const d = event.data as { username?: string; attributedShare?: number };
        const u = d?.username ?? "?";
        return {
          icon: "[external]",
          msg: `External attribution: @${u}. The ledger found them — their work was real.`,
          color: "#f59e0b",
        };
      }
      default:
        return null;
    }
  }, [event.type, event.data, contributors]);

  if (!config) return null;

  const isGold = config.color === "#f59e0b";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="flex items-center gap-2 py-2 px-3 rounded-md border-l min-h-[44px] touch-manipulation"
        style={{
          borderLeftColor: config.color,
          borderLeftWidth: 3,
          background: "var(--surface-1)",
          fontSize: 14,
          fontFamily: "var(--font-ui)",
          color: isGold ? "#f59e0b" : "var(--text-2)",
        }}
      >
        <span className="flex-shrink-0" style={{ color: "var(--text-3)" }}>{config.icon}</span>
        <span className="truncate flex-1 min-w-0" style={{ lineHeight: 1.4 }}>{config.msg}</span>
        <span className="flex-shrink-0 tabular-nums text-[var(--text-3)]" style={{ fontFamily: "var(--font-data)", fontSize: 12 }}>{timeAgo(event.timestamp)}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-start gap-2 py-2 px-3 border-l"
      style={{ borderLeftColor: config.color, borderLeftWidth: 2, height: 52, minHeight: 44 }}
    >
      <span className="flex-shrink-0 text-[12px]" style={{ color: "var(--text-3)" }}>{config.icon}</span>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <div
          className="truncate"
          style={{
            fontSize: 14,
            color: isGold ? "#f59e0b" : "var(--text-2)",
            fontFamily: "var(--font-ui)",
            lineHeight: 1.5,
          }}
        >
          {config.msg}
        </div>
        <div className="flex-shrink-0 tabular-nums" style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-data)" }}>{timeAgo(event.timestamp)}</div>
      </div>
    </motion.div>
  );
});

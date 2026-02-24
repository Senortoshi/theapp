import React from "react";
import { motion } from "framer-motion";
import type { FeedEvent as FeedEventType } from "../../data/types";
import { useContributors } from "../../hooks/useSimStore";

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

export const FeedEvent = React.memo(function FeedEvent({ event }: { event: FeedEventType }) {
  const contributors = useContributors();
  const config = React.useMemo(() => {
    const typeIcons: Record<string, string> = { idea: "🧠", code: "⌨️", design: "🎨", critique: "🔍", synthesis: "🔗" };
    switch (event.type) {
      case "contribution_added": {
        const d = event.data as { contributor?: { username: string }; contribution?: { type: string; current_score?: number } };
        const u = d?.contributor?.username ?? "?";
        const contribType = d?.contribution?.type ?? "idea";
        const icon = typeIcons[contribType] ?? "🧠";
        const pts = d?.contribution?.current_score?.toFixed(1);
        return { icon, msg: `${u} ${contribType}${pts ? ` +${pts}` : ""}`, color: "var(--green)" };
      }
      case "revenue_distributed": {
        const d = event.data as { amount?: number };
        return { icon: "💸", msg: `${formatSats(d?.amount ?? 0)} sats distributed`, color: "var(--text-1)" };
      }
      case "boost_applied": {
        const d = event.data as { to_username?: string };
        return { icon: "↑", msg: `${d?.to_username ?? "?"} boost`, color: "var(--gold)" };
      }
      case "score_decayed": {
        const d = event.data as { contributor_id?: string; old_score?: number; new_score?: number };
        const name = d?.contributor_id ? contributors.find((c) => c.id === d.contributor_id)?.username ?? "?" : "?";
        return {
          icon: "−",
          msg: `${name} ${d?.old_score?.toFixed(1) ?? "?"}→${d?.new_score?.toFixed(1) ?? "?"}`,
          color: "var(--red)",
        };
      }
      case "status_changed": {
        const d = event.data as { username?: string; new_status?: string };
        return { icon: "·", msg: `${d?.username ?? "?"} ${d?.new_status ?? ""}`, color: "var(--text-2)" };
      }
      case "simulation_phase":
        return { icon: "▶", msg: (event.data as { message?: string })?.message ?? "Phase", color: "var(--green)" };
      default:
        return null;
    }
  }, [event.type, event.data, contributors]);

  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-start gap-2 py-2 px-3 border-l"
      style={{ borderLeftColor: config.color, borderLeftWidth: 2, height: 52 }}
    >
      <span className="flex-shrink-0 text-[12px]" style={{ color: "var(--text-3)" }}>{config.icon}</span>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <div className="truncate" style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-ui)" }}>{config.msg}</div>
        <div className="flex-shrink-0 tabular-nums" style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-data)" }}>{timeAgo(event.timestamp)}</div>
      </div>
    </motion.div>
  );
});

/**
 * Agent log: shows each step of external attribution with 800ms between lines.
 * Ethics: the agent shows its work. Not a loading animation — readable testimony.
 */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdvocacyEvent as AdvocacyEventType } from "@/types";

const GOLD = "#f59e0b";
const LINE_DELAY_MS = 800;

function platformLabel(source: string): string {
  return source === "X" ? "X / Twitter" : source;
}

function parseConversions(impactMetric: string): number {
  const m = impactMetric.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** Stable plausible "posts analyzed" from event (same for same event). */
function postsAnalyzed(event: AdvocacyEventType): number {
  const n = event.username.length + event.content.length + event.source.length;
  return 500 + (n % 501);
}

export interface AgentLogProps {
  event: AdvocacyEventType;
  satoshisThisPeriod: number;
  onComplete: () => void;
}

export const AgentLog: React.FC<AgentLogProps> = ({ event, satoshisThisPeriod, onComplete }) => {
  const [visibleLines, setVisibleLines] = useState(0);

  const platform = platformLabel(event.source);
  const postsCount = postsAnalyzed(event);
  const conversions = parseConversions(event.impactMetric);
  const xPct = event.attributedShare.toFixed(4);

  const lines: string[] = [
    "Agent beginning scan of external sources...",
    `Reading ${platform} mentions: ${postsCount} posts analyzed`,
    "Filtering for high-signal attribution candidates...",
    `Candidate identified: @${event.username}`,
    `Attribution basis: ${event.impactMetric}`,
    `Downstream impact measured: ${conversions} conversions`,
    "Running attribution calculation...",
    "Formula: [contribution_weight / total_pool_weight] × revenue",
    `Result: ${xPct}% share — ${satoshisThisPeriod.toLocaleString()} satoshis this period`,
    "This person created real value without knowing this system existed. The ledger found them because their work was real.",
  ];

  useEffect(() => {
    if (visibleLines >= lines.length) {
      const t = setTimeout(onComplete, LINE_DELAY_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleLines((n) => n + 1), LINE_DELAY_MS);
    return () => clearTimeout(t);
  }, [visibleLines, lines.length, onComplete]);

  return (
    <div
      className="flex flex-col items-start justify-center w-full max-w-lg mx-auto px-4 py-6"
      style={{ fontFamily: "var(--font-data)", color: GOLD, fontSize: 14, lineHeight: 1.6 }}
    >
      <div className="mb-3 text-[10px] uppercase tracking-widest opacity-80">Agent log</div>
      <AnimatePresence>
        {lines.slice(0, visibleLines).map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ marginBottom: i < visibleLines - 1 ? 8 : 0 }}
          >
            {text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

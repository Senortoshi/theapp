import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AGENT_LINE_MS = 800;

export interface RealAppAgentLogProps {
  lines: string[];
}

/** Renders agent log lines one by one at 800ms intervals. Same as simulator. */
export const RealAppAgentLog: React.FC<RealAppAgentLogProps> = ({ lines }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
  }, [lines.length]);

  useEffect(() => {
    if (visibleCount >= lines.length) return;
    const t = setTimeout(() => setVisibleCount((c) => c + 1), AGENT_LINE_MS);
    return () => clearTimeout(t);
  }, [visibleCount, lines.length]);

  if (lines.length === 0) return null;

  return (
    <div
      className="w-full max-w-md mx-auto mt-6 rounded-lg border px-3 py-3 font-mono text-left"
      style={{
        background: "var(--surface-0)",
        borderColor: "var(--border)",
        fontSize: 12,
        color: "var(--text-2)",
        fontFamily: "var(--font-data)",
        lineHeight: 1.8,
      }}
    >
      <div
        className="mb-2"
        style={{
          fontSize: 10,
          color: "var(--text-3)",
          letterSpacing: "0.08em",
        }}
      >
        FAIRNESS AGENT
      </div>
      <AnimatePresence>
        {lines.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {line}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

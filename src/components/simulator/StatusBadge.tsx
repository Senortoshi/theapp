import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const LABELS: Record<string, string> = {
  rising: "↑ RISING",
  stable: "— STABLE",
  decaying: "↓ DECAYING",
};

export const StatusBadge = React.memo(function StatusBadge({ status }: { status: string }) {
  const label = LABELS[status] ?? status.toUpperCase();
  const color =
    status === "rising"
      ? "var(--green)"
      : status === "decaying"
        ? "var(--red)"
        : "var(--text-3)";

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 3 }}
        transition={{ duration: 0.12 }}
        style={{
          color,
          fontFamily: "var(--font-data)",
          fontSize: 10,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </motion.span>
    </AnimatePresence>
  );
});

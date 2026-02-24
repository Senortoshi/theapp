import React from "react";
import { motion } from "framer-motion";

export const ShareBar = React.memo(function ShareBar({
  sharePct,
  color = "var(--green)",
}: {
  sharePct: number;
  color?: string;
}) {
  const value = Math.min(100, Math.max(0, sharePct));
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: 2,
        background: "var(--border-light)",
        borderRadius: 2,
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          transformOrigin: "left center",
        }}
        animate={{ scaleX: value / 100 }}
        transition={{ type: "spring", stiffness: 110, damping: 22 }}
      />
    </div>
  );
});

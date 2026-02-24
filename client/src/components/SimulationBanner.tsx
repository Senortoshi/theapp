import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SimulationBanner = React.memo(function SimulationBanner() {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="border-b px-4 py-1.5 text-center flex items-center justify-center gap-3"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
            fontSize: 12,
            color: "var(--text-2)",
            fontFamily: "var(--font-data)",
          }}
        >
          <span>CONTRIBUTION ECONOMY — LIVE</span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-3)] active:text-[var(--text-1)] md:hover:text-[var(--text-1)] focus:outline-none touch-manipulation -my-1"
            style={{ fontSize: 24 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

import React from "react";
import { motion } from "framer-motion";
import { useContributors } from "@/store/useSimStore";
import { ContributorCard } from "./ContributorCard";

const STAGGER_MS = 50;

export const ContributorPanel = React.memo(function ContributorPanel({ hideHeader }: { hideHeader?: boolean } = {}) {
  const contributors = useContributors();

  return (
    <div
      className={`flex flex-col h-full overflow-hidden scrollbar-thin ${hideHeader ? "" : "border-r"}`}
      style={{ background: "var(--surface-0)", borderColor: "var(--border)" }}
    >
      {!hideHeader && (
        <div
          className="flex-shrink-0 px-3 py-2 flex items-center justify-between border-b"
          style={{ borderColor: "var(--border)", fontFamily: "var(--font-ui)", fontSize: 14 }}
        >
          <span style={{ color: "var(--text-1)", fontWeight: 600 }}>Contributors</span>
          <span style={{ fontFamily: "var(--font-data)", color: "var(--text-3)", fontSize: 13 }}>{contributors.length}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
        {contributors.length === 0 ? (
          <div
            className="px-3 py-4 text-center"
            style={{ color: "var(--text-3)", fontSize: 13, fontFamily: "var(--font-ui)" }}
          >
            No contributors yet
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {contributors.map((c, i) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                  mass: 0.8,
                  delay: i * (STAGGER_MS / 1000),
                  layout: { type: "spring", stiffness: 350, damping: 30 },
                }}
              >
                <ContributorCard contributor={c} />
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

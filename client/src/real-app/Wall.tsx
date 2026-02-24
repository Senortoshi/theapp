import React from "react";
import { motion } from "framer-motion";
import type { WallEntry } from "./types";

const GREEN = "#00ff88";
const GOLD = "#f59e0b";

export const RealAppWall: React.FC<{ entries: WallEntry[] }> = ({ entries }) => {
  return (
    <div
      className="w-full max-w-xl mx-auto rounded-lg overflow-hidden border"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="px-3 py-2 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            fontFamily: "var(--font-data)",
            letterSpacing: "0.08em",
          }}
        >
          THE WALL
        </span>
      </div>
      <ul className="divide-y">
        {entries.length === 0 ? (
          <li
            className="px-3 py-6 text-center"
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              color: "var(--text-3)",
            }}
          >
            No contributions yet. Emptiness is correct.
          </li>
        ) : (
          entries.map((entry) => (
            <motion.li
              key={entry.contribution_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="px-3 py-3"
              style={{
                background: entry.isExternal
                  ? "rgba(245, 158, 11, 0.06)"
                  : undefined,
                borderLeft: entry.isExternal
                  ? `3px solid ${GOLD}`
                  : undefined,
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 12,
                    color: "var(--text-2)",
                  }}
                >
                  #{entry.id}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 11,
                    color: "var(--text-3)",
                  }}
                >
                  {entry.timestampLabel}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: 12,
                    color: entry.isExternal ? GOLD : "var(--text-2)",
                  }}
                >
                  {entry.author}
                  {entry.isExternal && " ✦ external"}
                </span>
              </div>
              <p
                className="mt-1 text-sm"
                style={{
                  fontFamily: "var(--font-ui)",
                  color: "var(--text-1)",
                  lineHeight: 1.5,
                }}
              >
                &ldquo;{entry.content}&rdquo;
              </p>
              <div
                className="mt-2 flex items-center gap-3 flex-wrap"
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-data)",
                  color: "var(--text-3)",
                }}
              >
                <span>Status: {entry.status}</span>
                {entry.points != null && (
                  <>
                    <span>Points: {entry.points}</span>
                    <span>
                      Share:{" "}
                      {entry.sharePct != null
                        ? entry.sharePct.toFixed(4)
                        : ""}%
                    </span>
                    <span>Satoshis: {entry.satoshis ?? 0}</span>
                  </>
                )}
              </div>
            </motion.li>
          ))
        )}
      </ul>
    </div>
  );
};

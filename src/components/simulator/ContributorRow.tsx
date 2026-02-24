import React from "react";
import type { Contributor } from "../../data/types";
import { GeometricAvatar } from "./GeometricAvatar";

export const ContributorRow = React.memo(function ContributorRow({
  contributor,
}: {
  contributor: Contributor;
}) {
  const status = contributor.status;
  const isRising = status === "rising";
  const isDecaying = status === "decaying";

  return (
    <div
      className="flex items-center gap-2 border-b transition-colors duration-100 hover:bg-[var(--surface-1)]"
      style={{
        padding: "6px 12px",
        borderColor: "var(--border)",
        borderLeft: isRising ? "2px solid var(--green)" : isDecaying ? "1px solid var(--red)" : "2px solid transparent",
      }}
    >
      <GeometricAvatar seed={contributor.avatar_seed} size={24} />
      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
        <span
          className="truncate"
          style={{
            fontSize: 13,
            color: "var(--text-1)",
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
          }}
        >
          {contributor.username}
        </span>
        <span
          className="flex-shrink-0 tabular-nums"
          style={{
            fontSize: 12,
            color: "var(--text-2)",
            fontFamily: "var(--font-data)",
          }}
        >
          {contributor.current_share_pct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
});

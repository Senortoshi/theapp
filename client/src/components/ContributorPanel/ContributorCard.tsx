import React from "react";
import { motion } from "framer-motion";
import type { Contributor } from "@/types";
import { GeometricAvatar } from "./GeometricAvatar";
import { ShareBar } from "./ShareBar";
import { SparkLine } from "./SparkLine";
import { StatusBadge } from "./StatusBadge";
import { useLastAdvocacyUsername } from "@/store/useSimStore";

const GOLD = "#f59e0b";

function formatSats(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export const ContributorCard = React.memo(
  function ContributorCard({ contributor }: { contributor: Contributor }) {
    const sharePct = contributor.current_share_pct;
    const history = contributor.share_history?.slice(-20) ?? [];
    const status = contributor.status;
    const isRising = status === "rising";
    const isDecaying = status === "decaying";
    const lastAdvocacyUsername = useLastAdvocacyUsername();
    const isAdvocacy = lastAdvocacyUsername != null && contributor.username === lastAdvocacyUsername;

    return (
      <div
        className="flex items-center gap-3 border-b transition-colors duration-[120ms] ease-out hover:bg-[var(--surface-1)]"
        style={{
          height: 76,
          padding: "0 16px",
          borderColor: "var(--border)",
          borderLeft: isAdvocacy ? `2px solid ${GOLD}` : isRising ? "2px solid var(--green)" : "2px solid transparent",
          boxShadow: isAdvocacy
            ? `0 0 0 1px ${GOLD}30, 0 0 20px ${GOLD}15`
            : isRising
              ? "0 0 0 1px rgba(0,245,160,0.2), 0 0 24px var(--green-dim)"
              : isDecaying
                ? "0 0 0 1px rgba(255,59,92,0.15)"
                : undefined,
          opacity: isDecaying ? 0.85 : 1,
          background: isAdvocacy ? `linear-gradient(90deg, ${GOLD}08 0%, transparent 100%)` : undefined,
        }}
      >
        <GeometricAvatar seed={contributor.avatar_seed} size={32} />
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className="truncate font-semibold"
              style={{
                fontSize: 13,
                color: isAdvocacy ? GOLD : "var(--text-1)",
                fontFamily: "var(--font-ui)",
              }}
            >
              {contributor.username}
            </span>
            <StatusBadge status={status} />
          </div>
          <ShareBar sharePct={sharePct} color={isAdvocacy ? GOLD : "var(--green)"} />
          <div className="flex items-center justify-between gap-2">
            <span className="tabular-nums" style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--font-data)" }}>
              {formatSats(contributor.total_satoshis_earned)} sats
            </span>
            <SparkLine data={history} />
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.contributor.id === next.contributor.id &&
    prev.contributor.current_share_pct === next.contributor.current_share_pct &&
    prev.contributor.status === next.contributor.status &&
    prev.contributor.total_satoshis_earned === next.contributor.total_satoshis_earned &&
    prev.contributor.share_history?.length === next.contributor.share_history?.length
);

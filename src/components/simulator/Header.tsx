import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useSimStore, useGlobalStats, setSimulationActive } from "../../hooks/useSimStore";

const AnimatedNumber = React.memo(function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 75, damping: 18 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));

  React.useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return (
    <motion.span style={{ fontFamily: "var(--font-data)" }} className="tabular-nums">
      {display}
    </motion.span>
  );
});

function timeAgo(ts: number): string {
  if (ts <= 0) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

export const Header = React.memo(function Header() {
  const stats = useGlobalStats();
  const wsStatus = useSimStore((s) => s.wsStatus);
  const simulationActive = useSimStore((s) => s.simulationActive);
  const lastEventAt = useSimStore((s) => s.lastEventAt);

  const handleStartSim = React.useCallback(async () => {
    await fetch("/api/simulate/run");
    setSimulationActive(true);
  }, []);
  const handleStopSim = React.useCallback(async () => {
    await fetch("/api/simulate/stop");
    setSimulationActive(false);
  }, []);

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 border-b"
      style={{
        height: 52,
        background: "var(--surface-0)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-0" style={{ fontFamily: "var(--font-data)" }}>
        <div className="flex items-center gap-2 pr-4 border-r" style={{ borderColor: "var(--border)" }}>
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden>
            <rect x={2} y={2} width={16} height={16} rx={2} stroke="var(--green)" strokeWidth={1.5} fill="none" />
            <path d="M6 10h8M10 6v8" stroke="var(--green)" strokeWidth={1.2} strokeLinecap="round" />
          </svg>
          <span
            className="font-medium tracking-widest uppercase"
            style={{ fontSize: 13, letterSpacing: "0.15em", color: "var(--green)" }}
          >
            FAIRNESS ENGINE
          </span>
        </div>
        <div className="px-4 border-r flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <span className="uppercase" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
            CONTRIBUTORS
          </span>
          <span style={{ fontSize: 14, color: "var(--text-1)" }}>
            <AnimatedNumber value={stats.total_contributors} />
          </span>
        </div>
        <div className="px-4 border-r flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <span className="uppercase" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
            CONTRIBUTIONS
          </span>
          <span style={{ fontSize: 14, color: "var(--text-1)" }}>
            <AnimatedNumber value={stats.total_contributions} />
          </span>
        </div>
        <div className="px-4 border-r flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <span className="uppercase" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
            REVENUE PAID
          </span>
          <span style={{ fontSize: 14, color: "var(--text-1)" }}>
            <AnimatedNumber value={stats.total_revenue} decimals={0} />
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>sats</span>
        </div>
        <div className="px-4 border-r flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <span className="uppercase" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
            LIVE SHARES
          </span>
          <span style={{ fontSize: 14, color: "var(--text-1)" }}>100.00</span>
        </div>
        <div className="pl-4 flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <span className="uppercase" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
            LAST EVENT
          </span>
          <span style={{ fontSize: 14, color: "var(--text-1)" }}>{timeAgo(lastEventAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: wsStatus === "live" ? "var(--green)" : "transparent",
            border: "1px solid var(--border)",
            boxShadow: wsStatus === "live" ? "0 0 8px var(--green-glow)" : undefined,
            animation: wsStatus === "live" ? "pulse 2s ease-in-out infinite" : undefined,
          }}
          aria-label={`WebSocket ${wsStatus}`}
        />
        {simulationActive ? (
          <button
            type="button"
            onClick={handleStopSim}
            className="px-3 py-1.5 border transition-colors duration-120"
            style={{
              borderColor: "var(--border-light)",
              color: "var(--text-2)",
              fontSize: 12,
              letterSpacing: "0.1em",
              fontFamily: "var(--font-data)",
            }}
          >
            STOP
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartSim}
            className="px-3 py-1.5 border transition-colors duration-[120ms] hover:bg-[var(--green-dim)] hover:border-[var(--green)] hover:text-[var(--green)]"
            style={{
              borderColor: "var(--border-light)",
              background: "transparent",
              color: "var(--text-2)",
              fontSize: 12,
              letterSpacing: "0.1em",
              fontFamily: "var(--font-data)",
            }}
          >
            SIMULATE
          </button>
        )}
      </div>
    </header>
  );
});

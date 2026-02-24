import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useSimStore, useGlobalStats, setSimulationActive } from "@/store/useSimStore";

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

function useSatsPerMin(): number {
  const stats = useGlobalStats();
  const prevRef = useRef({ revenue: stats.total_revenue, ts: Date.now() });
  const [rate, setRate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const prev = prevRef.current;
      const deltaRevenue = stats.total_revenue - prev.revenue;
      const deltaMin = (now - prev.ts) / 60000;
      prevRef.current = { revenue: stats.total_revenue, ts: now };
      setRate(deltaMin > 0 ? Math.round(deltaRevenue / deltaMin) : 0);
    }, 2000);
    return () => clearInterval(interval);
  }, [stats.total_revenue]);

  return rate;
}

export const Header = React.memo(function Header() {
  const stats = useGlobalStats();
  const wsStatus = useSimStore((s) => s.wsStatus);
  const simulationActive = useSimStore((s) => s.simulationActive);
  const satsPerMin = useSatsPerMin();

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
      className="flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between px-3 md:px-4 border-b gap-2 md:gap-0 py-2 md:py-0"
      style={{
        minHeight: 44,
        background: "var(--surface-0)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="px-3 md:px-4 py-1 text-center md:text-left" style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-ui)" }}>
        Your share is permanent whether or not you return.
      </div>
      {/* Mobile: START full width first, then 2 stats. Desktop: stats row + START */}
      <div className="flex flex-col gap-2 md:contents">
        <div className="flex items-center justify-between md:order-2" style={{ fontFamily: "var(--font-data)" }}>
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-thin min-h-[44px] md:min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
            <div
              className="px-3 border-r flex items-center gap-2 flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="uppercase md:text-[9px] text-[10px] md:leading-none" style={{ color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
                Contributors
              </span>
              <span className="text-sm md:text-[13px] min-w-[1.5em]" style={{ color: "var(--text-1)" }}>
                <AnimatedNumber value={stats.total_contributors} />
              </span>
            </div>
            <div
              className="px-3 border-r flex items-center gap-2 flex-shrink-0 hidden md:flex"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="uppercase text-[9px]" style={{ color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
                Satoshis
              </span>
              <span style={{ fontSize: 13, color: "var(--text-1)" }}>
                <AnimatedNumber value={stats.total_revenue} decimals={0} />
              </span>
            </div>
            <div className="px-3 flex items-center gap-2 flex-shrink-0 md:hidden">
              <span className="uppercase text-[10px]" style={{ color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
                Satoshis
              </span>
              <span className="text-sm min-w-[2.5em]" style={{ color: "var(--text-1)" }}>
                <AnimatedNumber value={stats.total_revenue} decimals={0} />
              </span>
            </div>
            <div
              className="px-3 border-r hidden md:flex items-center gap-2 flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="uppercase text-[9px]" style={{ color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
                Contributions
              </span>
              <span style={{ fontSize: 13, color: "var(--text-1)" }}>
                <AnimatedNumber value={stats.total_contributions} />
              </span>
            </div>
            <div
              className="px-3 border-r hidden md:flex items-center gap-2 flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="uppercase text-[9px]" style={{ color: "var(--text-3)", letterSpacing: "0.1em", fontFamily: "var(--font-ui)" }}>
                Sats/min
              </span>
              <span style={{ fontSize: 13, color: "var(--text-1)" }}>
                <AnimatedNumber value={satsPerMin} />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 8,
                height: 8,
                minWidth: 8,
                minHeight: 8,
                backgroundColor: wsStatus === "live" ? "var(--green)" : "transparent",
                border: "1px solid var(--border)",
                boxShadow: wsStatus === "live" ? "0 0 8px var(--green-glow)" : undefined,
                animation: wsStatus === "live" ? "pulse 2s ease-in-out infinite" : undefined,
              }}
              aria-label={wsStatus === "live" ? "Live" : "Connecting"}
            />
            {wsStatus === "live" && (
              <span className="text-[10px] md:text-[10px]" style={{ color: "var(--text-3)", letterSpacing: "0.08em", fontFamily: "var(--font-ui)" }}>LIVE</span>
            )}
          </div>
        </div>
        <div className="w-full md:w-auto flex gap-2 md:flex-shrink-0">
          {simulationActive ? (
            <button
              type="button"
              onClick={handleStopSim}
              className="flex-1 md:flex-initial min-h-[44px] md:min-h-0 px-4 py-2.5 md:px-3 md:py-1 border transition-colors duration-120 touch-manipulation"
              style={{
                borderColor: "var(--border-light)",
                color: "var(--text-2)",
                fontSize: 16,
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
              className="flex-1 md:flex-initial min-h-[44px] md:min-h-0 px-4 py-2.5 md:px-3 md:py-1 border transition-colors duration-[120ms] active:bg-[var(--green-dim)] active:border-[var(--green)] active:text-[var(--green)] md:hover:bg-[var(--green-dim)] md:hover:border-[var(--green)] md:hover:text-[var(--green)] touch-manipulation"
              style={{
                borderColor: "var(--border-light)",
                background: "transparent",
                color: "var(--text-2)",
                fontSize: 16,
                letterSpacing: "0.1em",
                fontFamily: "var(--font-data)",
              }}
            >
              START
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useSimStore, useContributors, useGlobalStats, useLastAdvocacyUsername } from "@/store/useSimStore";
import { getStableColor } from "@/utils/colors";

const GOLD_EXTERNAL = "#f59e0b";

const colorMapRef = { current: new Map<string, string>() };
function getColor(id: string, username: string, lastAdvocacyUsername: string | null): string {
  if (lastAdvocacyUsername != null && username === lastAdvocacyUsername) return GOLD_EXTERNAL;
  if (!colorMapRef.current.has(id)) {
    colorMapRef.current.set(id, getStableColor(id));
  }
  return colorMapRef.current.get(id)!;
}

const AnimatedTotal = React.memo(function AnimatedTotal() {
  const stats = useGlobalStats();
  const motionValue = useMotionValue(stats.total_revenue);
  const spring = useSpring(motionValue, { stiffness: 75, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  React.useEffect(() => {
    motionValue.set(stats.total_revenue);
  }, [stats.total_revenue, motionValue]);

  return (
    <div className="text-center pointer-events-none flex flex-col items-center gap-0 px-2">
      <span className="uppercase" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.15em", fontFamily: "var(--font-data)" }}>
        ATTRIBUTION
      </span>
      <motion.span style={{ fontFamily: "var(--font-data)", fontSize: "clamp(18px,5vw,22px)", color: "var(--text-1)", fontWeight: 500 }}>{display}</motion.span>
      <span style={{ fontSize: 14, color: "var(--text-3)", fontFamily: "var(--font-data)" }}>sats</span>
    </div>
  );
});

export const AttributionRing = React.memo(function AttributionRing() {
  const contributors = useContributors();
  const lastAdvocacyUsername = useLastAdvocacyUsername();
  const simulationActive = useSimStore((s) => s.simulationActive);
  const advocacyInProgress = useSimStore((s) => s.advocacyInProgress);
  const [hover, setHover] = useState(false);
  const ringPaused = hover || advocacyInProgress != null;
  const chartData = useMemo(
    () =>
      contributors
        .filter((c) => c.current_share_pct > 0)
        .map((c) => ({
          name: c.username,
          value: c.current_share_pct,
          fill: getColor(c.id, c.username, lastAdvocacyUsername),
          id: c.id,
        })),
    [contributors, lastAdvocacyUsername]
  );

  const isEmpty = chartData.length === 0;

  return (
    <div
      className="relative flex items-center justify-center w-full h-full"
      style={{
        minWidth: 0,
        minHeight: 180,
        animation: simulationActive && !advocacyInProgress ? "ring-rotate 120s linear infinite" : undefined,
        animationPlayState: ringPaused ? "paused" : "running",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setHover(false)}
    >
      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center gap-1 px-4 text-center"
          style={{
            width: "100%",
            minHeight: 180,
            color: "var(--text-3)",
            fontFamily: "var(--font-ui)",
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          <span>No contributors yet</span>
          <span style={{ fontSize: 14 }}>Run simulation or add a contribution</span>
        </div>
      ) : (
        <div className="w-full h-full max-h-[min(320px,50vw)] max-w-[min(320px,95vw)] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="38%"
                outerRadius="54%"
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {chartData.length === 1 ? (
          <div className="text-center flex flex-col items-center gap-0 px-2">
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "clamp(14px,4vw,18px)", color: "var(--text-1)", fontWeight: 500, lineHeight: 1.5 }}>
              1 person. 1 idea. 100%.
            </span>
            <span style={{ fontSize: 14, color: "var(--text-3)", fontFamily: "var(--font-data)", marginTop: 4 }}>
              1 sats
            </span>
          </div>
        ) : (
          <AnimatedTotal />
        )}
      </div>
    </div>
  );
});

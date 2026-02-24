import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useSimStore, useContributors, useGlobalStats } from "../../hooks/useSimStore";
import { getStableColor } from "../shared/colors";

const colorMapRef = { current: new Map<string, string>() };
function getColor(id: string): string {
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
    <div className="text-center pointer-events-none flex flex-col items-center gap-0">
      <span className="uppercase" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.15em", fontFamily: "var(--font-data)" }}>
        ATTRIBUTION
      </span>
      <motion.span style={{ fontFamily: "var(--font-data)", fontSize: 22, color: "var(--text-1)", fontWeight: 500 }}>{display}</motion.span>
      <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-data)" }}>sats</span>
    </div>
  );
});

export const AttributionRing = React.memo(function AttributionRing() {
  const contributors = useContributors();
  const simulationActive = useSimStore((s) => s.simulationActive);
  const [hover, setHover] = useState(false);
  const chartData = useMemo(
    () =>
      contributors
        .filter((c) => c.current_share_pct > 0)
        .map((c) => ({
          name: c.username,
          value: c.current_share_pct,
          fill: getColor(c.id),
          id: c.id,
        })),
    [contributors]
  );

  const isEmpty = chartData.length === 0;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: "100%",
        height: "100%",
        minWidth: 200,
        minHeight: 200,
        animation: simulationActive ? "ring-rotate 120s linear infinite" : undefined,
        animationPlayState: hover ? "paused" : "running",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center gap-1"
          style={{
            width: "100%",
            height: "100%",
            minHeight: 200,
            color: "var(--text-3)",
            fontFamily: "var(--font-ui)",
            fontSize: 14,
          }}
        >
          <span>No contributors yet</span>
          <span style={{ fontSize: 12 }}>Run simulation or add a contribution</span>
        </div>
      ) : (
        <div style={{ width: "100%", height: "100%", maxHeight: 320, maxWidth: 320 }}>
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
        <AnimatedTotal />
      </div>
    </div>
  );
});

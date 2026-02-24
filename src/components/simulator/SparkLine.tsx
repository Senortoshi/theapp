import React from "react";

function arraysEqual(a: [number, number][], b: [number, number][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

export const SparkLine = React.memo(function SparkLine({ data }: { data: [number, number][] }) {
  const path = React.useMemo(() => {
    if (data.length < 2) return "";
    const values = data.map(([, v]) => v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 72;
    const h = 20;
    const pts = values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(" ");
    return pts;
  }, [data]);

  const stroke = React.useMemo(() => {
    if (data.length < 2) return "var(--text-3)";
    const values = data.map(([, v]) => v);
    const trend = values[values.length - 1] - values[0];
    return trend > 0 ? "var(--green)" : trend < 0 ? "var(--red)" : "var(--text-3)";
  }, [data]);

  if (data.length < 2) return null;

  return (
    <svg width={72} height={20} className="overflow-visible flex-shrink-0" aria-hidden>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={path}
      />
    </svg>
  );
}, (prev, next) => arraysEqual(prev.data, next.data));

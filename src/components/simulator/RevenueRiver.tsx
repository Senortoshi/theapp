import React, { useRef, useMemo, useEffect, useState } from "react";
import { useRevenueRiver } from "../../hooks/useRevenueRiver";
import { useContributors } from "../../hooks/useSimStore";

const HEIGHT = 156;

export const RevenueRiver = React.memo(function RevenueRiver() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contributors = useContributors();
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.offsetWidth || 400);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const contributorIdToX = useMemo(() => {
    const m = new Map<string, number>();
    const centerX = width / 2;
    const spread = Math.min(width - 40, Math.max(0, contributors.length * 36));
    contributors.forEach((c, i) => {
      const t = contributors.length > 0 ? (i + 1) / (contributors.length + 1) : 0.5;
      const x = centerX + (t - 0.5) * spread;
      m.set(c.id, x);
    });
    return m;
  }, [contributors, width]);

  useRevenueRiver(canvasRef, contributorIdToX, width, HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;
    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = width * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = "100%";
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, [width]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        height: HEIGHT,
        background: "linear-gradient(to bottom, transparent, var(--surface-0))",
      }}
    >
      <canvas ref={canvasRef} width={width} height={HEIGHT} className="block w-full h-full" />
    </div>
  );
});

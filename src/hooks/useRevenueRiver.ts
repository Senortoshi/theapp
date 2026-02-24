import { useEffect, useRef } from "react";
import { useSimStore, clearRevenueBatch } from "./useSimStore";
import { getStableColorHex } from "../components/shared/colors";
import { easeInOutCubic, lerp } from "../components/shared/easing";

interface Particle {
  id: string;
  targetX: number;
  progress: number;
  size: number;
  color: string;
  amount: number;
  trail: Array<{ x: number; y: number }>;
}

const MAX_TRAIL = 5;
const PARTICLE_SPEED = 0.012;

export function useRevenueRiver(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  contributorIdToX: Map<string, number>,
  width: number,
  height: number
) {
  const particlesRef = useRef<Particle[]>([]);
  const centerX = width / 2;
  const topY = 20;
  const bottomY = height - 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const tick = () => {
      const batch = useSimStore.getState().lastRevenueBatch;
      if (batch && batch.length > 0) {
        batch.forEach((d) => {
          const targetX = contributorIdToX.get(d.contributor_id) ?? centerX;
          particlesRef.current.push({
            id: crypto.randomUUID(),
            targetX,
            progress: 0,
            size: Math.max(3, Math.min(12, d.share_pct / 5)),
            color: getStableColorHex(d.contributor_id),
            amount: d.amount,
            trail: [],
          });
        });
        clearRevenueBatch();
      }

      ctx.clearRect(0, 0, width, height);

      particlesRef.current = particlesRef.current.filter((p) => p.progress < 1);

      particlesRef.current.forEach((p) => {
        p.progress += PARTICLE_SPEED;
        const eased = easeInOutCubic(p.progress);
        const x = lerp(centerX, p.targetX, eased);
        const y = lerp(topY, bottomY, eased);

        p.trail.push({ x, y });
        if (p.trail.length > MAX_TRAIL) p.trail.shift();

        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.trail.length >= 2) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          p.trail.forEach((t) => ctx.lineTo(t.x, t.y));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef, contributorIdToX, width, height]);
}

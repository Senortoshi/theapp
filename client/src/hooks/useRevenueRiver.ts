import { useEffect, useRef } from "react";
import { useSimStore, clearRevenueBatch } from "@/store/useSimStore";
import { getStableColorHex } from "@/utils/colors";
import { easeInOutCubic, lerp } from "@/utils/easing";

interface Particle {
  id: string;
  targetX: number;
  progress: number;
  size: number;
  color: string;
  amount: number;
  trail: Array<{ x: number; y: number }>;
}

const MAX_TRAIL_DESKTOP = 5;
const MAX_TRAIL_MOBILE = 2;
const PARTICLE_SPEED = 0.012;

export function useRevenueRiver(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  contributorIdToX: Map<string, number>,
  width: number,
  height: number,
  isMobile = false
) {
  const particlesRef = useRef<Particle[]>([]);
  const centerX = width / 2;
  const topY = 20;
  const bottomY = height - 40;
  const maxTrail = isMobile ? MAX_TRAIL_MOBILE : MAX_TRAIL_DESKTOP;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const tick = () => {
      const batch = useSimStore.getState().lastRevenueBatch;
      const lastAdvocacyUsername = useSimStore.getState().lastAdvocacyUsername;
      const GOLD = "#f59e0b";
      const batchToAdd = isMobile && batch && batch.length > 0
        ? batch.filter((_, i) => i % 2 === 0)
        : batch ?? [];
      if (batchToAdd.length > 0) {
        batchToAdd.forEach((d) => {
          const targetX = contributorIdToX.get(d.contributor_id) ?? centerX;
          const isExternal = lastAdvocacyUsername != null && d.username === lastAdvocacyUsername;
          particlesRef.current.push({
            id: crypto.randomUUID(),
            targetX,
            progress: 0,
            size: Math.max(3, Math.min(12, d.share_pct / 5)),
            color: isExternal ? GOLD : getStableColorHex(d.contributor_id),
            amount: d.amount,
            trail: [],
          });
        });
        clearRevenueBatch();
      }

      ctx.clearRect(0, 0, width, height);

      particlesRef.current = particlesRef.current.filter((p) => p.progress < 1);

      const advocacyInProgress = useSimStore.getState().advocacyInProgress != null;

      particlesRef.current.forEach((p) => {
        if (!advocacyInProgress) p.progress += PARTICLE_SPEED;
        const eased = easeInOutCubic(p.progress);
        const x = lerp(centerX, p.targetX, eased);
        const y = lerp(topY, bottomY, eased);

        p.trail.push({ x, y });
        if (p.trail.length > maxTrail) p.trail.shift();

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
  }, [canvasRef, contributorIdToX, width, height, isMobile]);
}

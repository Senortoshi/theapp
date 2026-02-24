import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { injectGenesis, setOpeningComplete } from "@/store/useSimStore";

const PHRASE = "Nothing exists yet.";
const VOID_DURATION_MS = 1000;
const TYPING_DURATION_MS = 2000;
const FLASH_AT_MS = 3000;
const FLASH_PEAK_MS = 120;
const FLASH_FADE_MS = 400;
const OVERLAY_FADE_MS = 500;

type Phase = "void" | "typing" | "cursor" | "flash" | "reveal" | "done";

export const VoidOpening: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>("void");
  const [visibleLength, setVisibleLength] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  const triggerGenesis = useCallback(() => {
    injectGenesis();
  }, []);

  useEffect(() => {
    const t0 = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - t0;

      if (phase === "void") {
        if (elapsed >= VOID_DURATION_MS) {
          setPhase("typing");
        }
      }

      if (phase === "typing") {
        const typingElapsed = elapsed - VOID_DURATION_MS;
        const progress = Math.min(1, typingElapsed / TYPING_DURATION_MS);
        const len = Math.floor(progress * PHRASE.length);
        setVisibleLength(len);
        if (len >= PHRASE.length && typingElapsed >= TYPING_DURATION_MS) {
          setPhase("cursor");
        }
      }

      if (phase === "cursor") {
        if (elapsed >= FLASH_AT_MS) {
          setPhase("flash");
          triggerGenesis();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, triggerGenesis]);

  useEffect(() => {
    if (phase !== "flash") return;

    const start = performance.now();
    const peak = FLASH_PEAK_MS;
    const fade = FLASH_FADE_MS;

    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed <= peak) {
        setFlashOpacity(Math.min(1, elapsed / peak));
      } else if (elapsed <= peak + fade) {
        setFlashOpacity(1 - (elapsed - peak) / fade);
      } else {
        setPhase("reveal");
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [phase]);

  useEffect(() => {
    if (phase !== "reveal") return;

    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(1, elapsed / OVERLAY_FADE_MS);
      setOverlayOpacity(1 - progress);
      if (progress >= 1) {
        setPhase("done");
        setOpeningComplete(true);
        onComplete?.();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [phase, onComplete]);

  const showText = phase === "typing" || phase === "cursor";
  const showCursor = phase === "typing" || phase === "cursor";

  return (
    <>
      {phase !== "done" && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          style={{
            opacity: overlayOpacity,
            backgroundColor: "#000000",
            pointerEvents: phase === "done" ? "none" : "auto",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            {showText && (
              <div
                className="flex flex-col items-center justify-center gap-0 px-4"
                style={{ fontFamily: "var(--font-ui)", color: "var(--text-1)", fontSize: "clamp(1.5rem, 5vw, 3rem)", lineHeight: 1.5 }}
              >
                <span style={{ letterSpacing: "0.02em" }}>
                  {PHRASE.slice(0, visibleLength)}
                  {showCursor && (
                    <span
                      className="inline-block w-2 align-baseline ml-0.5 bg-[var(--text-1)]"
                      style={{
                        height: "1.1em",
                        animation: "cursor-blink 1s step-end infinite",
                      }}
                      aria-hidden
                    />
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Genesis flash — #00ff88 cracks across the screen like the first word spoken */}
          {phase === "flash" && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "#00ff88",
                opacity: flashOpacity,
              }}
              initial={false}
              aria-hidden
            />
          )}
        </motion.div>
      )}
    </>
  );
};

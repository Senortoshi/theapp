import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addFeedEvent, clearAdvocacyInProgress, useSimStore } from "@/store/useSimStore";
import type { AdvocacyEvent as AdvocacyEventType } from "@/types";
import { toast } from "@/hooks/use-toast";
import { AgentLog } from "./AgentLog";

const GOLD = "#f59e0b";
const BG = "#030712";
const REVEAL_DURATION_MS = 3000;
const INTEGRATION_DURATION_MS = 1000;
const NOTIFICATION_DELAY_MS = 400;

type Step = "agent_log" | "reveal" | "integration" | "notification" | "done";

/** Source label for display (tweet/post/code/whatever). */
function sourceActionLabel(source: string): string {
  if (source === "X") return "tweet";
  if (source === "GitHub") return "post";
  if (source === "Reddit") return "post";
  if (source === "Telegram") return "post";
  return "post";
}

export const AdvocacyEvent: React.FC<{ event: AdvocacyEventType }> = ({ event }) => {
  const [step, setStep] = useState<Step>("agent_log");
  const globalStats = useSimStore((s) => s.globalStats);
  const feedAddedRef = useRef(false);

  const satoshisThisMonth =
    Math.round((event.attributedShare / 100) * Math.max(0, globalStats.total_revenue)) ||
    Math.round(event.attributedShare * 42);

  useEffect(() => {
    if (step !== "reveal") return;
    const t = setTimeout(() => setStep("integration"), REVEAL_DURATION_MS);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "integration") return;
    if (!feedAddedRef.current) {
      feedAddedRef.current = true;
      addFeedEvent({
        type: "advocacy_detected",
        data: event,
        timestamp: Date.now(),
      });
    }
    const t = setTimeout(() => setStep("notification"), INTEGRATION_DURATION_MS);
    return () => clearTimeout(t);
  }, [step, event]);

  useEffect(() => {
    if (step !== "notification") return;
    toast({
      title: "You were already contributing. We just found you.",
      description: null,
      style: {
        background: BG,
        border: `1px solid ${GOLD}`,
        color: GOLD,
        fontFamily: "var(--font-ui)",
      },
    });
    const t = setTimeout(() => {
      setStep("done");
      clearAdvocacyInProgress();
    }, NOTIFICATION_DELAY_MS + 2500);
    return () => clearTimeout(t);
  }, [step, event.username]);

  const conversionsMatch = event.impactMetric.match(/\d+/);
  const conversions = conversionsMatch ? parseInt(conversionsMatch[0], 10) : 0;
  const actionLabel = sourceActionLabel(event.source);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      initial={{ opacity: 1 }}
      animate={{ opacity: step === "done" ? 0 : 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "rgba(3, 5, 7, 0.92)",
        pointerEvents: step === "done" ? "none" : "auto",
      }}
    >
      {/* Scanning effect during agent log */}
      {step === "agent_log" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            background: `
              linear-gradient(180deg, transparent 0%, ${GOLD}08 50%, transparent 100%),
              repeating-linear-gradient(0deg, transparent, transparent 2px, ${GOLD}06 2px, ${GOLD}06 3px)
            `,
            backgroundSize: "100% 200%",
            animation: "scan 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Step 1: Agent log — 10 lines, 800ms between each */}
      <AnimatePresence mode="wait">
        {step === "agent_log" && (
          <motion.div
            key="agent_log"
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AgentLog
              event={event}
              satoshisThisPeriod={satoshisThisMonth}
              onComplete={() => setStep("reveal")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2 & 3: Card — materializes then holds */}
      {(step === "reveal" || step === "integration") && (
        <motion.div
          key="card"
          className="relative w-full max-w-md mx-0 sm:mx-4 max-h-[85dvh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              `0 0 0 1px ${GOLD}40`,
              `0 0 0 1px ${GOLD}80, 0 0 24px ${GOLD}20`,
              `0 0 0 1px ${GOLD}40`,
            ],
          }}
          transition={{
            opacity: { duration: 0.6, ease: "easeOut" },
            scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            boxShadow: { repeat: Infinity, duration: 2 },
          }}
          style={{
            background: `linear-gradient(145deg, ${BG} 0%, #0a0d12 50%, ${BG} 100%)`,
            border: `1px solid ${GOLD}`,
            borderRadius: 12,
            padding: 24,
            paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
          }}
        >
          {/* Card content — ethics copy: calm, factual, transparent */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.04, delayChildren: 0.2 },
              },
            }}
            className="flex flex-col gap-3"
            style={{ color: "rgba(245, 158, 11, 0.95)", fontFamily: "var(--font-ui)", fontSize: 13, lineHeight: 1.6 }}
          >
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}>
              @{event.username} never posted here.
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}>
              They didn&apos;t apply for this.
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}>
              They didn&apos;t know this system existed.
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }} className="pt-1">
              But their {actionLabel} drove {conversions} real sign-ups.
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }} className="pt-2 font-medium" style={{ color: GOLD }}>
              The work was real. The attribution is real.
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}>
              {event.attributedShare.toFixed(4)}% of revenue. {satoshisThisMonth.toLocaleString()} satoshis this period.
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }} className="pt-3 border-t border-[var(--border)]" style={{ fontSize: 12, color: "rgba(245, 158, 11, 0.85)" }}>
              They&apos;ll receive a notification. It will say:
            </motion.p>
            <motion.p variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }} style={{ fontStyle: "italic" }}>
              &ldquo;You were already contributing. We just found you.&rdquo;
            </motion.p>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { background-position: 0 0%; }
          50% { background-position: 0 100%; }
        }
      `}</style>
    </motion.div>
  );
};

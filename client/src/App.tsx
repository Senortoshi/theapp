import React, { useRef, useEffect, useState } from "react";
import { MotionConfig, AnimatePresence, motion } from "framer-motion";
import { useWebSocketEngine } from "@/hooks/useWebSocketEngine";
import { useRAFFlush } from "@/hooks/useRAFFlush";
import { hydrateFromApi, useSimStore } from "@/store/useSimStore";
import { Header } from "@/components/Header";
import { ContributorPanel } from "@/components/ContributorPanel";
import { ContributorsStrip } from "@/components/ContributorPanel/ContributorsStrip";
import { CenterStage } from "@/components/CenterStage";
import { RightPanel } from "@/components/RightPanel";
import { ContributeInput } from "@/components/RightPanel/ContributeInput";
import { SimulationBanner } from "@/components/SimulationBanner";
import { VoidOpening } from "@/components/VoidOpening";
import { GuideScroll } from "@/components/GuideScroll";
import { SimulatorSequence } from "@/components/SimulatorSequence";
import { AdvocacyEvent } from "@/components/AdvocacyEvent";
import { useAdvocacyInProgress } from "@/store/useSimStore";
import { Toaster } from "@/components/ui/toaster";
import type { WSMessage } from "@/types";
import { RealApp, AdminPanel } from "@/real-app";

const FADE_DURATION = 0.4;

export default function App() {
  const messageBufferRef = useRef<WSMessage[]>([]);
  const [simulatorKey, setSimulatorKey] = useState(0);
  const [showRealBuild, setShowRealBuild] = useState(false);
  const [pathname, setPathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const openingComplete = useSimStore((s) => s.openingComplete);
  const guideComplete = useSimStore((s) => s.guideComplete);
  const advocacyInProgress = useAdvocacyInProgress();

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useWebSocketEngine(messageBufferRef);
  useRAFFlush({ messageBufferRef });

  useEffect(() => {
    setTimeout(() => {
      document.documentElement.classList.add("dark");
    }, 0);
  }, []);

  useEffect(() => {
    if (!openingComplete) return;
    let cancelled = false;
    const init = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        if (!cancelled) hydrateFromApi(data);
      } catch {
        // ignore
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [openingComplete]);

  const handleWatchAgain = () => {
    setSimulatorKey((k) => k + 1);
  };

  const handleContributeToRealBuild = () => {
    setShowRealBuild(true);
  };

  if (pathname === "/admin") {
    return <AdminPanel />;
  }

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 300, damping: 35 }}>
      <div
        className="flex flex-col bg-[var(--bg)] text-[var(--text-1)] min-h-0 w-full overflow-x-hidden"
        style={{ height: "100dvh", maxHeight: "-webkit-fill-available" }}
      >
        {/* STATE 1: Void opening (darkness + genesis flash) */}
        {!openingComplete && <VoidOpening />}

        {/* STATE 2: Guide scroll (6 panels) → STATE 3: Simulator sequence (on START click) → Real App (Contribute to the Real Build) */}
        <AnimatePresence mode="wait">
          {openingComplete && !guideComplete && (
            <motion.div
              key="guide"
              className="fixed inset-0 z-[90]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_DURATION }}
            >
              <GuideScroll />
            </motion.div>
          )}
          {guideComplete && !showRealBuild && (
            <SimulatorSequence
              key={simulatorKey}
              onWatchAgain={handleWatchAgain}
              onContribute={handleContributeToRealBuild}
            />
          )}
          {guideComplete && showRealBuild && (
            <motion.div
              key="real-build"
              className="flex flex-col flex-1 min-h-0 min-w-0 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_DURATION }}
            >
              <RealApp />
            </motion.div>
          )}
        </AnimatePresence>

        {advocacyInProgress && <AdvocacyEvent event={advocacyInProgress.event} />}
        <Toaster />
      </div>
    </MotionConfig>
  );
}

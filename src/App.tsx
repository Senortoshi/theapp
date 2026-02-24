import React, { useRef, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useWebSocketEngine } from "./hooks/useWebSocket";
import { useRAFFlush } from "./hooks/useSimulation";
import { hydrateFromApi } from "./hooks/useSimStore";
import { Header, ContributorPanel, CenterStage, RightPanel, ContributeInput, SimulationBanner } from "./components/simulator";
import type { WSMessage } from "./data/types";

export default function App() {
  const messageBufferRef = useRef<WSMessage[]>([]);

  useWebSocketEngine(messageBufferRef);
  useRAFFlush({ messageBufferRef });

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        if (!cancelled) hydrateFromApi(data);
      } catch {
        // ignore
      }
      if (!cancelled) {
        setTimeout(() => {
          document.documentElement.classList.add("dark");
        }, 0);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 300, damping: 35 }}>
      <div className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text-1)]">
        <SimulationBanner />
        <Header />
        <div
          className="flex-1 grid min-h-0"
          style={{
            gridTemplateAreas: "'left center right' 'left input right'",
            gridTemplateColumns: "300px minmax(280px, 1fr) 320px",
            gridTemplateRows: "1fr 156px",
            gap: 1,
            background: "var(--border)",
          }}
        >
          <div className="flex flex-col min-h-0 overflow-hidden" style={{ gridArea: "left", background: "var(--bg)" }}>
            <ContributorPanel />
          </div>
          <div className="flex flex-col min-h-0 overflow-hidden" style={{ gridArea: "center", background: "var(--bg)" }}>
            <div className="flex-1 min-h-0 flex flex-col" style={{ minHeight: 200 }}>
              <CenterStage />
            </div>
            <div className="flex-shrink-0" style={{ height: 156 }}>
              <ContributeInput />
            </div>
          </div>
          <div className="flex flex-col min-h-0 overflow-hidden" style={{ gridArea: "right", background: "var(--bg)" }}>
            <RightPanel />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

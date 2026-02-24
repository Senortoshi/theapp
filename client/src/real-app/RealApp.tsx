import React, { useCallback, useEffect, useState } from "react";
import { RealAppWall } from "./Wall";
import { RealAppInput } from "./Input";
import { TransparencyFooter } from "./TransparencyFooter";
import { RealAppAgentLog } from "./AgentLog";
import { useRealAppSocket } from "./useRealAppSocket";
import type { WallEntry } from "./types";

/**
 * Real app: Wall + Input + Transparency Footer only.
 * No name, no logo, no nav. Site has no identity until contributions give it one.
 * Ethics (ethics.mdc): No leaderboard, no celebration/pull-back language,
 * no variable reward animations, no comparisons; calculations visible; footer line on every screen.
 */
export const RealApp: React.FC = () => {
  const [initialWall, setInitialWall] = useState<WallEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/real/state")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.wall)) setInitialWall(data.wall);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { wall, agentLogLines } = useRealAppSocket(initialWall);

  const handleSubmit = useCallback(async (content: string, name: string) => {
    const res = await fetch("/api/real/contribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        name: name || undefined,
        type: "general",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? "Failed to submit");
    }
  }, []);

  return (
    <div
      className="flex flex-col min-h-full bg-[var(--bg)]"
      style={{ minHeight: "100dvh" }}
    >
      <main className="flex-1 overflow-auto py-6 px-3">
        <RealAppWall entries={wall} />
        {agentLogLines.length > 0 && (
          <RealAppAgentLog lines={agentLogLines} />
        )}
      </main>
      <div className="flex-shrink-0">
        <RealAppInput onSubmit={handleSubmit} />
      </div>
      <TransparencyFooter />
    </div>
  );
};

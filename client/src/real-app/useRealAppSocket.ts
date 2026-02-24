import { useEffect, useState, useCallback } from "react";
import type { WallEntry } from "./types";

const WS_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
    : "";

export interface RealAppState {
  wall: WallEntry[];
  agentLogLines: string[];
}

export function useRealAppSocket(initialWall: WallEntry[]): RealAppState {
  const [wall, setWall] = useState<WallEntry[]>(initialWall);
  const [agentLogLines, setAgentLogLines] = useState<string[]>([]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/real/state");
      const data = await res.json();
      if (Array.isArray(data.wall)) setWall(data.wall);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    if (!WS_URL) return;
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const type = msg.type;
        const data = msg.data;

        if (type === "real_wall_entry" && data?.wall) {
          setWall(data.wall);
        } else if (type === "real_wall_updated" && data?.wall) {
          setWall(data.wall);
        } else if (type === "real_agent_log" && Array.isArray(data?.lines)) {
          setAgentLogLines(data.lines);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setAgentLogLines((prev) => prev);
    };

    return () => {
      ws.close();
    };
  }, []);

  return { wall, agentLogLines };
}

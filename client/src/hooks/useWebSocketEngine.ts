import { useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { setWsStatus } from "@/store/useSimStore";
import type { WSMessage } from "@/types";

const WS_OPEN = 1;
const WS_CONNECTING = 0;

const getWsUrl = (): string => {
  if (typeof window === "undefined") return "ws://localhost:3000/ws";
  const port = window.location.port;
  if (port === "5173" || port === "3000") return "ws://localhost:3000/ws";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
};

export function useWebSocketEngine(messageBufferRef: React.MutableRefObject<WSMessage[]>) {
  const { lastJsonMessage, readyState } = useWebSocket(getWsUrl(), {
    shouldReconnect: () => true,
    reconnectAttempts: 20,
    reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    onOpen: () => setWsStatus("live"),
    onClose: () => setWsStatus("reconnecting"),
    onError: () => setWsStatus("reconnecting"),
  });

  const didConnectRef = useRef(false);
  useEffect(() => {
    const state = Number(readyState);
    if (state === WS_OPEN) {
      didConnectRef.current = true;
      setWsStatus("live");
    } else if (didConnectRef.current && state !== WS_OPEN) {
      setWsStatus("reconnecting");
    } else if (state === WS_CONNECTING) {
      setWsStatus("connecting");
    }
  }, [readyState]);

  useEffect(() => {
    if (lastJsonMessage == null) return;
    try {
      const msg = lastJsonMessage as { type?: string; data?: unknown; timestamp?: number };
      messageBufferRef.current.push({
        type: msg.type ?? "unknown",
        data: msg.data,
        timestamp: msg.timestamp ?? Date.now(),
      });
    } catch {
      // ignore
    }
  }, [lastJsonMessage, messageBufferRef]);
}

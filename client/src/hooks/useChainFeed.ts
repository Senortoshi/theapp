import { useEffect } from "react";
import {
  useQuery,
  useQueryClient,
  QueryErrorResetBoundary,
} from "@tanstack/react-query";

type Contribution = unknown;
type Share = unknown;

interface UseChainFeedResult {
  contributions: Contribution[] | undefined;
  shares: Share[] | undefined;
  isLoading: boolean;
  error: unknown;
}

export function useChainFeed(projectId: string): UseChainFeedResult {
  const queryClient = useQueryClient();

  const {
    data: contributions,
    isLoading: contributionsLoading,
    error: contributionsError,
  } = useQuery<Contribution[]>({
    queryKey: ["contributions", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/contributions`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contributions.");
      }

      return (await response.json()) as Contribution[];
    },
    refetchInterval: 30_000,
  });

  const {
    data: shares,
    isLoading: sharesLoading,
    error: sharesError,
  } = useQuery<Share[]>({
    queryKey: ["shares", projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/shares`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch shares.");
      }

      return (await response.json()) as Share[];
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let socket: WebSocket | null = null;
    let reconnectTimeoutId: number | null = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string) as {
            type?: string;
            projectId?: string;
          };

          if (
            message.type === "shares_updated" &&
            message.projectId === projectId
          ) {
            queryClient.invalidateQueries({
              queryKey: ["contributions", projectId],
            });
            queryClient.invalidateQueries({
              queryKey: ["shares", projectId],
            });
          }
        } catch {
          // Ignore malformed messages
        }
      };

      socket.onclose = () => {
        reconnectTimeoutId = window.setTimeout(connect, 3_000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [projectId, queryClient]);

  return {
    contributions,
    shares,
    isLoading: contributionsLoading || sharesLoading,
    error: contributionsError ?? sharesError ?? null,
  };
}


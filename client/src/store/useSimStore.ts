import { create } from "zustand";
import type {
  AdvocacyEvent,
  FeedEvent,
  GlobalStats,
  RevenueDistributionItem,
  WsStatus,
} from "@/types";
import type { Contributor, AppState } from "@shared/schema";

interface SimStoreState {
  contributors: Contributor[];
  feedEvents: FeedEvent[];
  globalStats: GlobalStats;
  wsStatus: WsStatus;
  simulationActive: boolean;
  lastRevenueBatch: RevenueDistributionItem[];
  lastAdvocacyUsername: string | null;
  advocacyInProgress: AdvocacyEvent | null;
}

const initialStats: GlobalStats = {
  total_contributors: 0,
  total_revenue: 0,
  total_contributions: 0,
};

const initialState: SimStoreState = {
  contributors: [],
  feedEvents: [],
  globalStats: initialStats,
  wsStatus: "connecting",
  simulationActive: false,
  lastRevenueBatch: [],
  lastAdvocacyUsername: null,
  advocacyInProgress: null,
};

export const useSimStore = create<SimStoreState>(() => initialState);

export function setWsStatus(status: WsStatus): void {
  useSimStore.setState({ wsStatus: status });
}

export function setSimulationActive(active: boolean): void {
  useSimStore.setState({ simulationActive: active });
}

export function hydrateFromApi(appState: AppState): void {
  useSimStore.setState((prev) => ({
    ...prev,
    contributors: appState.contributors ?? [],
    globalStats: appState.globalStats ?? initialStats,
  }));
}

export function applySharesUpdate(nextContributors: Contributor[]): void {
  useSimStore.setState((prev) => ({
    ...prev,
    contributors: nextContributors,
    globalStats: {
      ...prev.globalStats,
      total_contributors: nextContributors.length,
    },
  }));
}

type NewFeedEvent = Omit<FeedEvent, "id"> & { id?: string };

export function addFeedEvent(event: NewFeedEvent): void {
  const withId: FeedEvent = {
    id: event.id ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    type: event.type,
    data: event.data,
    timestamp: event.timestamp,
  };

  useSimStore.setState((prev) => ({
    ...prev,
    feedEvents: [...prev.feedEvents, withId],
  }));
}

export function applyRevenueDistribution(
  distribution: RevenueDistributionItem[],
  totalRevenue: number
): void {
  useSimStore.setState((prev) => ({
    ...prev,
    lastRevenueBatch: distribution,
    globalStats: {
      ...prev.globalStats,
      total_revenue: totalRevenue,
    },
  }));
}

export function clearRevenueBatch(): void {
  useSimStore.setState((prev) => ({
    ...prev,
    lastRevenueBatch: [],
  }));
}

export function setAdvocacyInProgress(event: AdvocacyEvent | null): void {
  useSimStore.setState((prev) => ({
    ...prev,
    advocacyInProgress: event,
    lastAdvocacyUsername: event?.username ?? null,
  }));
}

export function useContributors(): Contributor[] {
  return useSimStore((state) => state.contributors);
}

export function useGlobalStats(): GlobalStats {
  return useSimStore((state) => state.globalStats);
}

export function useFeedEvents(): FeedEvent[] {
  return useSimStore((state) => state.feedEvents);
}

export function useLastAdvocacyUsername(): string | null {
  return useSimStore((state) => state.lastAdvocacyUsername);
}


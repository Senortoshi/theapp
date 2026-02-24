import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  Contributor,
  GlobalStats,
  FeedEvent,
  WsStatus,
  RevenueDistributionItem,
} from "../data/types";

const MAX_FEED_EVENTS = 50;

export interface SimState {
  contributors: Contributor[];
  feedEvents: FeedEvent[];
  globalStats: GlobalStats;
  wsStatus: WsStatus;
  simulationActive: boolean;
  lastRevenueBatch: RevenueDistributionItem[] | null;
  lastEventAt: number;
}

const initialStats: GlobalStats = {
  total_contributors: 0,
  total_revenue: 0,
  total_contributions: 0,
};

const initialState: SimState = {
  contributors: [],
  feedEvents: [],
  globalStats: initialStats,
  wsStatus: "connecting",
  simulationActive: false,
  lastRevenueBatch: null,
  lastEventAt: 0,
};

export const useSimStore = create<SimState>(() => initialState);

export function applySharesUpdate(contributors: Contributor[]) {
  const sorted = [...contributors].sort((a, b) => b.current_share_pct - a.current_share_pct);
  const prev = useSimStore.getState().globalStats;
  useSimStore.setState({
    contributors: sorted,
    globalStats: {
      total_contributors: sorted.length,
      total_revenue: prev.total_revenue,
      total_contributions: sorted.reduce((s, c) => s + (c.contributions?.length ?? 0), 0),
    },
  });
}

export function addFeedEvent(event: Omit<FeedEvent, "id">) {
  const id = `feed-${event.timestamp}-${Math.random().toString(36).slice(2, 9)}`;
  useSimStore.setState((s) => ({
    feedEvents: [{ ...event, id }, ...s.feedEvents].slice(0, MAX_FEED_EVENTS),
    lastEventAt: event.timestamp,
  }));
}

export function applyRevenueDistribution(
  distribution: RevenueDistributionItem[],
  totalRevenue: number
) {
  useSimStore.setState((s) => ({
    globalStats: { ...s.globalStats, total_revenue: totalRevenue },
    lastRevenueBatch: distribution,
  }));
}

export function clearRevenueBatch() {
  useSimStore.setState({ lastRevenueBatch: null });
}

export function setWsStatus(status: WsStatus) {
  useSimStore.setState({ wsStatus: status });
}

export function setSimulationActive(active: boolean) {
  useSimStore.setState({ simulationActive: active });
}

export function hydrateFromApi(state: {
  contributors?: Contributor[];
  globalStats?: GlobalStats;
  simulation_running?: boolean;
}) {
  const contributors = state.contributors ?? [];
  const sorted = [...contributors].sort((a, b) => b.current_share_pct - a.current_share_pct);
  useSimStore.setState({
    contributors: sorted,
    globalStats: state.globalStats ?? initialStats,
    simulationActive: state.simulation_running ?? false,
  });
}

export function useContributors() {
  return useSimStore(useShallow((s) => s.contributors));
}

export function useGlobalStats() {
  return useSimStore(useShallow((s) => s.globalStats));
}

export function useFeedEvents() {
  return useSimStore(useShallow((s) => s.feedEvents));
}

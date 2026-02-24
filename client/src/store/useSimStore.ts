import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Contributor, GlobalStats, FeedEvent, WsStatus, RevenueDistributionItem, AdvocacyEvent } from "@/types";

const MAX_FEED_EVENTS = 50;

export interface SimState {
  contributors: Contributor[];
  feedEvents: FeedEvent[];
  globalStats: GlobalStats;
  wsStatus: WsStatus;
  simulationActive: boolean;
  /** Opening sequence has finished; main UI is visible */
  openingComplete: boolean;
  /** Guide scroll has been completed; user clicked START SIMULATION */
  guideComplete: boolean;
  /** Set by applyRevenueDistribution; cleared by RevenueRiver when it spawns particles */
  lastRevenueBatch: RevenueDistributionItem[] | null;
  /** Timestamp of most recent feed event for header "LAST EVENT" */
  lastEventAt: number;
  /** When set, AdvocacyEvent overlay is shown; all other animation is visually paused */
  advocacyInProgress: { event: AdvocacyEvent } | null;
  /** Username of last external attribution — ring shows this contributor in gold */
  lastAdvocacyUsername: string | null;
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
  openingComplete: false,
  guideComplete: false,
  lastRevenueBatch: null,
  lastEventAt: 0,
  advocacyInProgress: null,
  lastAdvocacyUsername: null,
};

const GENESIS_ID = "genesis";

/** Inject the first contributor and first satoshi pulse for the opening sequence. */
export function injectGenesis() {
  const genesis: Contributor = {
    id: GENESIS_ID,
    username: "First",
    avatar_seed: GENESIS_ID,
    contributions: ["genesis-contribution"],
    current_share_pct: 100,
    total_satoshis_earned: 1,
    share_history: [[Date.now(), 100]],
    relevance_score: 1,
    status: "stable",
  };
  const batch: RevenueDistributionItem[] = [
    { contributor_id: GENESIS_ID, username: genesis.username, amount: 1, share_pct: 100 },
  ];
  useSimStore.setState({
    contributors: [genesis],
    globalStats: {
      total_contributors: 1,
      total_revenue: 1,
      total_contributions: 1,
    },
    simulationActive: true,
    lastRevenueBatch: batch,
  });
}

export function setOpeningComplete(complete: boolean) {
  useSimStore.setState({ openingComplete: complete });
}

export function setGuideComplete(complete: boolean) {
  useSimStore.setState({ guideComplete: complete });
}

export const useSimStore = create<SimState>(() => initialState);

/** Sort by username (no leaderboard). Call from RAF flush only. */
export function applySharesUpdate(contributors: Contributor[]) {
  const sorted = [...contributors].sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: "base" }));
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

/** Add one feed event; keep newest first, cap at MAX_FEED_EVENTS. Call from RAF flush only. */
export function addFeedEvent(event: Omit<FeedEvent, "id">) {
  const id = `feed-${event.timestamp}-${Math.random().toString(36).slice(2, 9)}`;
  useSimStore.setState((s) => ({
    feedEvents: [{ ...event, id }, ...s.feedEvents].slice(0, MAX_FEED_EVENTS),
    lastEventAt: event.timestamp,
  }));
}

/** Update global revenue and set lastRevenueBatch for canvas to spawn particles. Call from RAF flush only. */
export function applyRevenueDistribution(
  distribution: RevenueDistributionItem[],
  totalRevenue: number
) {
  useSimStore.setState((s) => ({
    globalStats: {
      ...s.globalStats,
      total_revenue: totalRevenue,
    },
    lastRevenueBatch: distribution,
  }));
}

/** Clear lastRevenueBatch after canvas has spawned. */
export function clearRevenueBatch() {
  useSimStore.setState({ lastRevenueBatch: null });
}

export function setWsStatus(status: WsStatus) {
  useSimStore.setState({ wsStatus: status });
}

export function setSimulationActive(active: boolean) {
  useSimStore.setState({ simulationActive: active });
}

/** Start the external attribution overlay. Call when advocacy_detected is received. */
export function setAdvocacyInProgress(event: AdvocacyEvent) {
  useSimStore.setState({
    advocacyInProgress: { event },
    lastAdvocacyUsername: event.username,
  });
}

/** End the overlay and resume normal view. Call when AdvocacyEvent sequence finishes. */
export function clearAdvocacyInProgress() {
  useSimStore.setState({ advocacyInProgress: null });
}

/** Hydrate from API GET /api/state. */
export function hydrateFromApi(state: {
  contributors?: Contributor[];
  globalStats?: GlobalStats;
  simulation_running?: boolean;
}) {
  const contributors = state.contributors ?? [];
  const sorted = [...contributors].sort((a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: "base" }));
  useSimStore.setState({
    contributors: sorted,
    globalStats: state.globalStats ?? initialStats,
    simulationActive: state.simulation_running ?? false,
  });
}

/** Shallow selector for contributor list (avoid re-renders when other state changes). */
export function useContributors() {
  return useSimStore(useShallow((s) => s.contributors));
}

export function useGlobalStats() {
  return useSimStore(useShallow((s) => s.globalStats));
}

export function useFeedEvents() {
  return useSimStore(useShallow((s) => s.feedEvents));
}

export function useAdvocacyInProgress() {
  return useSimStore((s) => s.advocacyInProgress);
}

export function useLastAdvocacyUsername() {
  return useSimStore((s) => s.lastAdvocacyUsername);
}

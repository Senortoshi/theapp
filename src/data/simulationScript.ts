/**
 * Simulation script: timeline of events and engine loop.
 * Aligned with core.mdc: contribution economy, decay, advocacy ("agent found them"), revenue in satoshis.
 */

import type { Contribution, Contributor, ContributionType, RevenueEvent } from "../data/schema";
import { scoreContribution, calculateShares, distributeRevenue } from "../engine/fairness";
import { decayAllScores } from "../engine/decay";
import { detectReferences, boostReferenced, generateAdvocacyEvent } from "../engine/advocacy";
import type { AdvocacyEvent } from "../engine/advocacy";

const CONTRIBUTION_INTERVAL_MS = 4000;
const REVENUE_INTERVAL_MS = 3000;
const REVENUE_AMOUNT_SATS = 500;
const ADVOCACY_INTERVAL_MS = 45000;
const FIRST_ADVOCACY_AT_MS = 90000;

function uuid(): string {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface ScriptContribution {
  username: string;
  content: string;
  type: ContributionType;
  buildsOn?: boolean;
}

/** Phase 1 (0–30s): 5 on-platform contributors, shares even */
const PHASE_1: ScriptContribution[] = [
  { username: "genesis_builder", type: "idea", content: "We need a protocol-level mechanism for tracking value attribution across collaborative networks. Contributions compound — early work should be weighted but decay if not built upon." },
  { username: "idea_spark", type: "idea", content: "What if we model contribution value like a living organism? Each piece has a metabolic rate — grows when referenced, decays when ignored. Natural selection for ideas that matter." },
  { username: "code_weaver", type: "code", content: "Implementing the base scoring algorithm with type-weighted multipliers. Code 25, ideas 10. Added novelty detection to penalize redundant submissions." },
  { username: "silent_architect", type: "design", content: "Designed the share visualization. Three-panel layout with real-time rankings, activity stream, and analytics. Color-coded status for system dynamics." },
  { username: "pattern_seeker", type: "critique", content: "The decay model needs calibration. Reduce base decay and add foundational protection for genesis-phase work. Otherwise early contributors get diluted too fast." },
];

/** Phase 2 (30–90s): 10 more contributors, early ones decay */
const PHASE_2: ScriptContribution[] = [
  { username: "genesis_builder", type: "code", content: "Built the decay engine. Synthesis 30% slower decay. Referenced contributions decay at half rate. Floor at 15% of base score." },
  { username: "idea_spark", type: "synthesis", content: "Synthesizing scoring, decay, and boost into a unified fairness framework. The system must be self-correcting. Over-valued decay, under-valued get boosted when built upon." },
  { username: "signal_caster", type: "idea", content: "Attribution should account for signal-to-noise. Contributors who produce high-signal work deserve compounding returns, not just linear accumulation." },
  { username: "depth_runner", type: "code", content: "Optimized share calculation to O(n). Handles 1000+ contributions without latency." },
  { username: "chain_thinker", type: "synthesis", content: "Building on decay and boost — what emerges is a chain of value. Each contribution is a link. Referenced work becomes load-bearing and resists decay.", buildsOn: true },
  { username: "root_layer", type: "design", content: "Radial visualization: contributors orbit a central revenue pool. Orbit distance equals inverse share. As shares shift, contributors move — economics made tangible." },
  { username: "the_synthesizer", type: "synthesis", content: "The fairness engine should not just compute shares but explain them. Every number needs a traceable audit trail. Transparency is the product.", buildsOn: true },
  { username: "edge_finder", type: "critique", content: "Edge case: when two submit semantically identical content simultaneously, the novelty penalty hits the second. Need a grace window for concurrent submissions." },
  { username: "loop_breaker", type: "code", content: "Fixed reference loop vulnerability. Added DAG validation for reference chains." },
  { username: "consensus_node", type: "idea", content: "What if share calculations require minimum quorum? Below 3 contributors, shares equal. Fairness engine activates meaningful differentiation at scale." },
];

/** Phase 4 (120–180s) and ongoing: revenue flows, second advocacy, full scale */
const ONGOING: ScriptContribution[] = [
  { username: "flow_state", type: "code", content: "Revenue distribution with satoshi-precision. Remainder cascades to highest contributor. Zero-loss accounting.", buildsOn: true },
  { username: "compound_mind", type: "synthesis", content: "Revenue distribution plus contributor status creates a living economy. Rising attract attention, stable provide foundation, decaying signal where innovation moved.", buildsOn: true },
  { username: "genesis_builder", type: "code", content: "Shipping the production-ready fairness engine. All calculations deterministic and auditable." },
  { username: "late_bloomer", type: "idea", content: "New contributors should get a temporary novelty window where decay rate is reduced 50%." },
  { username: "emergence", type: "synthesis", content: "The emergent property is self-organizing meritocracy. No central authority — the network of references, decay, and revenue creates consensus.", buildsOn: true },
  { username: "reference_king", type: "code", content: "Audit trail system. Every contribution carries full score history. GET /audit/:id returns the forensic breakdown.", buildsOn: true },
  { username: "foundation_layer", type: "design", content: "Leaderboard shows momentum alongside rankings. A 5% share but rising is more interesting than 15% and decaying." },
  { username: "code_weaver", type: "code", content: "Benchmark: 35 contributors, 200 contributions, share recalc under 2ms. Production ready." },
  { username: "signal_caster", type: "idea", content: "Next evolution: federated fairness engines. Cross-project references create an internet of attribution." },
  { username: "the_synthesizer", type: "synthesis", content: "This attribution economy proves fair value distribution is computationally tractable. Every satoshi traceable to a contribution.", buildsOn: true },
];

function createContributor(username: string): Contributor {
  return {
    id: uuid(),
    username,
    avatar_seed: username,
    contributions: [],
    current_share_pct: 0,
    total_satoshis_earned: 0,
    share_history: [],
    relevance_score: 0,
    status: "stable",
  };
}

function createContribution(
  contributorId: string,
  content: string,
  type: ContributionType,
  baseScore: number
): Contribution {
  return {
    id: uuid(),
    contributor_id: contributorId,
    content,
    timestamp: Date.now(),
    base_score: baseScore,
    current_score: baseScore,
    referenced_by: [],
    decay_rate: type === "synthesis" ? 0.7 : 1,
    type,
    score_history: [{ timestamp: Date.now(), score: baseScore, reason: "Initial score" }],
  };
}

export type SimulationEvent =
  | { type: "simulation_phase"; data: { phase: number; message: string } }
  | { type: "contribution_added"; data: { contribution: Contribution; contributor: Contributor } }
  | { type: "shares_updated"; data: { contributors: Contributor[]; timestamp: number } }
  | { type: "revenue_distributed"; data: { amount: number; event: RevenueEvent; running_totals: Record<string, number> } }
  | { type: "advocacy_detected"; data: AdvocacyEvent }
  | { type: "boost_applied"; data: { from_id: string; to_id: string; from_username: string; to_username: string; boost_amount: number } };

export interface SimulationEngineState {
  contributors: Map<string, Contributor>;
  contributions: Contribution[];
  getContributorById(id: string): Contributor | undefined;
  getAllContributorsSorted(): Contributor[];
}

function createEngineState(): SimulationEngineState {
  const contributors = new Map<string, Contributor>();
  const contributions: Contribution[] = [];

  return {
    contributors,
    contributions,
    getContributorById(id: string) {
      return contributors.get(id);
    },
    getAllContributorsSorted() {
      return Array.from(contributors.values()).sort((a, b) => b.current_share_pct - a.current_share_pct);
    },
  };
}

function getOrCreateContributor(state: SimulationEngineState, username: string): Contributor {
  const existing = Array.from(state.contributors.values()).find((c) => c.username === username);
  if (existing) return existing;
  const contributor = createContributor(username);
  state.contributors.set(contributor.id, contributor);
  return contributor;
}

function addScriptContribution(
  state: SimulationEngineState,
  script: ScriptContribution,
  onEvent: (e: SimulationEvent) => void
): void {
  const contributor = getOrCreateContributor(state, script.username);
  const existingWithoutNew = state.contributions;

  decayAllScores(state.contributions);

  const baseScore = scoreContribution(script.content, script.type, existingWithoutNew);
  const contribution = createContribution(contributor.id, script.content, script.type, baseScore);
  state.contributions.push(contribution);
  contributor.contributions.push(contribution.id);

  let referenced: Contribution | null = null;
  if (script.buildsOn && state.contributions.length > 1) {
    const candidates = state.contributions.filter(
      (c) => c.id !== contribution.id && c.contributor_id !== contributor.id
    );
    if (candidates.length > 0) {
      referenced = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  if (!referenced) {
    referenced = detectReferences(script.content, state.contributions.filter((c) => c.id !== contribution.id));
  }
  if (referenced) {
    const amount = boostReferenced(referenced, contribution.id);
    if (amount > 0) {
      const toC = state.getContributorById(referenced.contributor_id);
      onEvent({
        type: "boost_applied",
        data: {
          from_id: contribution.id,
          to_id: referenced.id,
          from_username: contributor.username,
          to_username: toC?.username ?? "unknown",
          boost_amount: amount,
        },
      });
    }
  }

  calculateShares(state.contributors, state.contributions);
  onEvent({
    type: "contribution_added",
    data: { contribution, contributor },
  });
  onEvent({
    type: "shares_updated",
    data: { contributors: state.getAllContributorsSorted(), timestamp: Date.now() },
  });
}

function runRevenue(state: SimulationEngineState, onEvent: (e: SimulationEvent) => void): void {
  if (state.contributors.size === 0) return;
  const event = distributeRevenue(REVENUE_AMOUNT_SATS, state.contributors);
  const running_totals: Record<string, number> = {};
  state.contributors.forEach((c) => {
    running_totals[c.username] = c.total_satoshis_earned;
  });
  onEvent({
    type: "revenue_distributed",
    data: { amount: REVENUE_AMOUNT_SATS, event, running_totals },
  });
}

function runAdvocacy(state: SimulationEngineState, onEvent: (e: SimulationEvent) => void): void {
  const advocacyEvent = generateAdvocacyEvent();
  const contributor = getOrCreateContributor(state, advocacyEvent.username);
  const baseScore = scoreContribution(advocacyEvent.content, "advocacy", state.contributions);
  const contribution = createContribution(contributor.id, advocacyEvent.content, "advocacy", baseScore);
  state.contributions.push(contribution);
  contributor.contributions.push(contribution.id);
  calculateShares(state.contributors, state.contributions);
  onEvent({ type: "advocacy_detected", data: advocacyEvent });
  onEvent({
    type: "contribution_added",
    data: { contribution, contributor },
  });
  onEvent({
    type: "shares_updated",
    data: { contributors: state.getAllContributorsSorted(), timestamp: Date.now() },
  });
}

export interface SimulationLoopHandle {
  stop(): void;
}

/**
 * Runs the simulation engine loop and timeline.
 * - New contribution every 4s (from script phases then ongoing pool).
 * - Revenue pulse every 3s (500 satoshis).
 * - Advocacy event every 45s, first at 90s (phase 3 golden moment).
 * - Recalculates all shares after every contribution.
 */
export function runSimulationLoop(onEvent: (e: SimulationEvent) => void): SimulationLoopHandle {
  const state = createEngineState();
  const timers: ReturnType<typeof setTimeout>[] = [];
  let contributionIndex = 0;
  const scriptSequence: ScriptContribution[] = [...PHASE_1, ...PHASE_2, ...ONGOING];
  let phaseEmitted = { 1: false, 2: false, 3: false, 4: false };
  let firstAdvocacyScheduled = false;

  function emitPhase(phase: number, message: string) {
    if (phaseEmitted[phase as keyof typeof phaseEmitted]) return;
    phaseEmitted[phase as keyof typeof phaseEmitted] = true;
    onEvent({ type: "simulation_phase", data: { phase, message } });
  }

  emitPhase(1, "Genesis — A small team starts building. Shares are relatively even.");

  const contributionTimer = setInterval(() => {
    if (contributionIndex < scriptSequence.length) {
      const script = scriptSequence[contributionIndex];
      contributionIndex += 1;
      addScriptContribution(state, script, onEvent);

      const t = Date.now() - startTime;
      if (t >= 30000 && !phaseEmitted[2]) emitPhase(2, "Acceleration — New contributors enter. Early ones decay.");
      if (t >= 90000 && !phaseEmitted[3]) emitPhase(3, "The agent finds someone who never visited. They get attributed. Golden.");
      if (t >= 120000 && !phaseEmitted[4]) emitPhase(4, "Revenue flows. Shares shift. Second advocacy. Full scale.");
    } else {
      const script = ONGOING[(contributionIndex - scriptSequence.length) % ONGOING.length];
      contributionIndex += 1;
      addScriptContribution(state, script, onEvent);
    }
  }, CONTRIBUTION_INTERVAL_MS);
  timers.push(contributionTimer);

  const revenueTimer = setInterval(() => runRevenue(state, onEvent), REVENUE_INTERVAL_MS);
  timers.push(revenueTimer);

  function scheduleFirstAdvocacy() {
    if (firstAdvocacyScheduled) return;
    firstAdvocacyScheduled = true;
    const t = FIRST_ADVOCACY_AT_MS - (Date.now() - startTime);
    if (t <= 0) {
      runAdvocacy(state, onEvent);
      startAdvocacyInterval();
    } else {
      timers.push(setTimeout(() => {
        runAdvocacy(state, onEvent);
        startAdvocacyInterval();
      }, t));
    }
  }

  function startAdvocacyInterval() {
    const advTimer = setInterval(() => runAdvocacy(state, onEvent), ADVOCACY_INTERVAL_MS);
    timers.push(advTimer);
  }

  const startTime = Date.now();
  timers.push(setTimeout(scheduleFirstAdvocacy, Math.min(FIRST_ADVOCACY_AT_MS, 1000)));

  return {
    stop() {
      timers.forEach((t) => (typeof t === "number" ? clearTimeout(t) : clearInterval(t)));
    },
  };
}

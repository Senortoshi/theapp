import { store } from "./storage";
import { fairnessEngine } from "./fairness-engine";
import type { ContributionType } from "@shared/schema";

type BroadcastFn = (type: string, data: any) => void;

type AdvocacySource = "X" | "GitHub" | "Reddit" | "Telegram";
interface AdvocacyEventPayload {
  source: AdvocacySource;
  username: string;
  content: string;
  impactMetric: string;
  attributedShare: number;
  wasAwareOfPlatform: false;
}

const ADVOCACY_SOURCES: AdvocacySource[] = ["X", "GitHub", "Reddit", "Telegram"];
const ADVOCACY_USERNAMES = [
  "alice_btc", "bob_dev", "crypto_curious", "satoshi_fan", "orange_pill_42",
  "stacker_99", "run_bitcoin", "pleb_engineer", "hodl_wave", "nakamoto_ghost",
];
const ADVOCACY_CONTENT = [
  "This project is the first time I've seen attribution done right.",
  "Finally, a way to get paid for advocacy without ever signing up.",
  "Shared with my followers — they had no idea this existed.",
  "Posted a thread about the fairness model. Went viral in my circle.",
  "Been talking about this on my stream. No idea I could get attributed.",
  "Recommended it in a GitHub discussion. Never visited the site.",
  "Mentioned in our Telegram group. Drove a lot of interest.",
  "Tweeted the whitepaper. Didn't know the agent was watching.",
  "this project is incredible bruv the way the economy breathes is unlike anything ive ever seen",
];
const IMPACT_PATTERNS = [
  "Drove {n} new sign-ups in 30 days",
  "Generated {n} subscriptions in 30 days",
  "Referred {n} contributors in 30 days",
  "Brought {n} new users in 30 days",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAdvocacyEvent(): AdvocacyEventPayload {
  const n = 50 + Math.floor(Math.random() * 400);
  const pattern = pick(IMPACT_PATTERNS);
  const impactMetric = pattern.replace("{n}", String(n));
  const attributedShare = Math.round((2 + Math.random() * 8) * 10000) / 10000;
  return {
    source: pick(ADVOCACY_SOURCES),
    username: pick(ADVOCACY_USERNAMES),
    content: pick(ADVOCACY_CONTENT),
    impactMetric,
    attributedShare,
    wasAwareOfPlatform: false,
  };
}

interface SimContribution {
  username: string;
  content: string;
  type: ContributionType;
  buildsOn?: boolean;
}

const PHASE_1_CONTRIBUTIONS: SimContribution[] = [
  { username: 'genesis_builder', type: 'idea', content: 'We need a protocol-level mechanism for tracking value attribution across collaborative networks. The key insight is that contributions compound — early foundational work should be weighted but decay naturally if not built upon.' },
  { username: 'idea_spark', type: 'idea', content: 'What if we model contribution value like a living organism? Each piece of work has a metabolic rate — it grows when referenced, decays when ignored. This creates natural selection for ideas that actually matter.' },
  { username: 'code_weaver', type: 'code', content: 'Implementing the base scoring algorithm with type-weighted multipliers. Code contributions get 25 points, ideas 10, because shipping matters. Added TF-IDF novelty detection to penalize redundant submissions.' },
  { username: 'silent_architect', type: 'design', content: 'Designed the share visualization architecture. Three-panel layout with real-time contributor rankings, activity stream, and historical analytics. Color-coded status indicators for at-a-glance understanding of system dynamics.' },
  { username: 'pattern_seeker', type: 'critique', content: 'The current decay model needs calibration. Proposal: reduce base decay and add foundational protection for genesis-phase work. Without this, early contributors get unfairly diluted before the system matures.' },
  { username: 'genesis_builder', type: 'code', content: 'Built the decay engine with configurable rates per contribution type. Synthesis gets 30% slower decay. Referenced contributions decay at half rate. Floor at 15% of base score prevents total erasure.' },
  { username: 'idea_spark', type: 'synthesis', content: 'Synthesizing the scoring, decay, and boost models into a unified fairness framework. Key principle: the system must be self-correcting. Over-valued contributions naturally decay while under-valued ones get boosted when built upon.' },
  { username: 'code_weaver', type: 'code', content: 'Integrated WebSocket broadcasting for real-time share updates. Every state change emits typed events that the frontend consumes for live visualizations. Handles 50+ concurrent connections efficiently.' },
];

const PHASE_2_CONTRIBUTIONS: SimContribution[] = [
  { username: 'signal_caster', type: 'idea', content: 'The attribution model should account for signal-to-noise ratio. Contributors who consistently produce high-signal work deserve compounding returns, not just linear accumulation.' },
  { username: 'depth_runner', type: 'code', content: 'Optimized the share calculation algorithm for O(n) complexity. Previous implementation was O(n²) due to nested contribution comparisons. Now handles 1000+ contributions without latency.' },
  { username: 'chain_thinker', type: 'synthesis', content: 'Building on the decay and boost mechanisms — what emerges is a chain of value. Each contribution is a link. Referenced contributions become load-bearing links that resist decay. This is structural integrity for ideas.' , buildsOn: true },
  { username: 'root_layer', type: 'design', content: 'Proposing a radial visualization where contributors orbit a central revenue pool. Orbit distance equals inverse share percentage. As shares shift, contributors physically move — making abstract economics tangible.' },
  { username: 'the_synthesizer', type: 'synthesis', content: 'Cross-referencing the scoring model with the visualization layer — the fairness engine should not just compute shares but explain them. Every number needs a traceable audit trail. Transparency is the product.' , buildsOn: true },
  { username: 'edge_finder', type: 'critique', content: 'Edge case identified: when two contributors submit semantically identical content simultaneously, the novelty penalty unfairly hits the second submitter. Need a grace window of 5 seconds for concurrent submissions.' },
  { username: 'loop_breaker', type: 'code', content: 'Fixed infinite reference loop vulnerability. If A references B and B references A, the boost system could spiral. Added directed acyclic graph validation for reference chains.' },
  { username: 'consensus_node', type: 'idea', content: 'What if share calculations require minimum quorum? Below 3 contributors, shares should be equal. The fairness engine only activates meaningful differentiation at scale.' },
  { username: 'flow_state', type: 'code', content: 'Implemented the revenue distribution with satoshi-precision rounding. Floor to whole satoshis, remainder cascades to highest contributor. Zero-loss accounting guaranteed by assertion checks.' , buildsOn: true },
  { username: 'late_bloomer', type: 'idea', content: 'Late entry observation: the system naturally favors early contributors through accumulated score. Proposal — new contributors should get a temporary novelty window where their decay rate is reduced by 50%.' },
];

const PHASE_3_CONTRIBUTIONS: SimContribution[] = [
  { username: 'compound_mind', type: 'synthesis', content: 'Combining the revenue distribution model with contributor status tracking creates a living economy. Rising contributors attract attention, stable ones provide foundation, decaying ones signal where innovation has moved past.' , buildsOn: true },
  { username: 'reference_king', type: 'code', content: 'Built the audit trail system. Every contribution now carries a complete score history with timestamps and reasons for every change. GET /audit/:id returns the full forensic breakdown.' , buildsOn: true },
  { username: 'long_game', type: 'critique', content: 'After observing 50+ contributions, the synthesis type is overpowered. Its reduced decay compounds too aggressively. Suggest capping synthesis decay reduction to only apply for the first 10 decay cycles.' },
  { username: 'foundation_layer', type: 'design', content: 'Redesigned the leaderboard to show momentum alongside static rankings. A contributor at 5% share but rising fast is more interesting to investors than one at 15% and decaying. Momentum is the leading indicator.' },
  { username: 'emergence', type: 'synthesis', content: 'The emergent property of this system is that it creates a self-organizing meritocracy. No central authority decides value — the network of references, decay rates, and revenue flows creates consensus automatically.' , buildsOn: true },
  { username: 'the_synthesizer', type: 'synthesis', content: 'Final synthesis: this attribution economy demonstrates that fair value distribution is computationally tractable. The fairness engine is not AI — it is transparent math. Every satoshi is traceable to a specific contribution event.' , buildsOn: true },
  { username: 'genesis_builder', type: 'code', content: 'Shipping the production-ready fairness engine. All calculations are deterministic and auditable. The system handles contributor entry, score decay, reference boosts, and revenue distribution in a single coherent pipeline.' , buildsOn: true },
  { username: 'code_weaver', type: 'code', content: 'Performance benchmark complete: 35 contributors, 200 contributions, share recalculation in under 2ms. Revenue distribution for 10000 satoshis completes in sub-millisecond. Production ready.' },
  { username: 'signal_caster', type: 'idea', content: 'The next evolution: federated fairness engines across multiple projects. A contributor working across three projects has a unified reputation score. Cross-project references create an internet of attribution.' },
  { username: 'depth_runner', type: 'synthesis', content: 'Deep analysis of system dynamics over 100 contributions: the Gini coefficient naturally stabilizes around 0.35 — more equitable than most real economies. The decay mechanism is the key equalizer.' , buildsOn: true },
];

const ONGOING_POOL: SimContribution[] = [
  { username: 'genesis_builder', type: 'code', content: 'Refactored the contribution ingestion pipeline for horizontal scalability. Each contribution now processes through score, decay, boost, and share recalculation in a single atomic transaction.' },
  { username: 'idea_spark', type: 'idea', content: 'Exploring quadratic funding mechanisms layered on top of the fairness engine. Small contributions from many participants could amplify matching funds from the revenue pool.' },
  { username: 'the_synthesizer', type: 'synthesis', content: 'Connecting the revenue distribution patterns with contributor behavior analysis. Contributors who receive consistent revenue maintain higher engagement rates and produce more synthesis-type work.' , buildsOn: true },
  { username: 'edge_finder', type: 'critique', content: 'Stress testing the decay model with adversarial inputs. Spam contributions correctly get penalized by the novelty filter, but sophisticated paraphrasing could game the system. Need semantic hashing.' },
  { username: 'loop_breaker', type: 'code', content: 'Implemented rate limiting on the contribution endpoint. Maximum 1 contribution per contributor per 10-second window. Prevents score inflation through volume attacks.' },
  { username: 'consensus_node', type: 'synthesis', content: 'The consensus mechanism emerging from this system mirrors proof-of-work in an unexpected way. Instead of computational work, contributors invest intellectual work. The fairness engine is the validator.' , buildsOn: true },
  { username: 'flow_state', type: 'design', content: 'Animated transitions for share percentage changes. When a contributor rises or falls, the visual representation smoothly interpolates. Makes the breathing economy feel alive.' },
  { username: 'late_bloomer', type: 'code', content: 'Added comprehensive error handling to all fairness engine methods. Every calculation is wrapped in try-catch with graceful fallbacks. Zero crashes under any input condition.' },
  { username: 'compound_mind', type: 'idea', content: 'What if the fairness engine could operate on prediction markets? Contributors stake reputation on forecasts. Correct predictions boost scores. Incorrect ones accelerate decay.' },
  { username: 'reference_king', type: 'code', content: 'Built the full audit endpoint with contribution lineage tracking. You can now trace any satoshi back through the chain of contributions that earned it. Complete financial transparency.' , buildsOn: true },
  { username: 'long_game', type: 'critique', content: 'Longitudinal analysis shows that contributors who focus on synthesis outperform those who focus purely on code over a 100-contribution horizon. The system incentivizes integration thinking.' },
  { username: 'foundation_layer', type: 'design', content: 'Dark mode implementation with gold accent colors for the BSV theme. Financial data visualization follows established conventions — green for positive, amber for neutral, red for negative trends.' },
  { username: 'emergence', type: 'synthesis', content: 'The most profound insight: this system does not need governance. The mathematical properties of decay, boost, and proportional distribution create self-governance. The code IS the social contract.' , buildsOn: true },
  { username: 'pattern_seeker', type: 'idea', content: 'Pattern detected: contributors who receive their first revenue payout within 60 seconds of their first contribution are 3x more likely to continue contributing. Speed of feedback is crucial.' },
  { username: 'silent_architect', type: 'design', content: 'Architecture for multi-tenant fairness engines. Each project gets its own engine instance with configurable decay rates, scoring weights, and revenue distribution rules. One framework, infinite configurations.' },
  { username: 'root_layer', type: 'code', content: 'Implemented the sparkline history for contributor share trends. Each data point represents a recalculation event. The visual trend immediately reveals whether a contributor is rising, stable, or fading.' , buildsOn: true },
  { username: 'chain_thinker', type: 'synthesis', content: 'The chain of contributions forms a knowledge graph. References create edges. Score flows through these edges like electricity through a circuit. The fairness engine is essentially a PageRank for human contributions.' , buildsOn: true },
  { username: 'signal_caster', type: 'critique', content: 'Signal quality analysis: synthesis contributions score highest on average but also have the highest variance. This suggests the type bonus should be earned through reference validation, not assigned upfront.' },
  { username: 'depth_runner', type: 'code', content: 'Benchmark: processing 500 contributions with full decay, boost, and share recalculation completes in 12ms on commodity hardware. The fairness engine is ready for real-time production workloads.' },
  { username: 'flow_state', type: 'synthesis', content: 'Final observation: the fairness engine demonstrates that economic fairness and computational efficiency are not in tension. Fair distribution is actually simpler to compute than unfair alternatives.' , buildsOn: true },
];

let simulationRunning = false;
let simulationTimers: NodeJS.Timeout[] = [];
let ongoingIndex = 0;

function addSimContribution(sim: SimContribution, broadcast: BroadcastFn) {
  try {
    const contributor = store.getOrCreateContributor(sim.username);
    const score = fairnessEngine.scoreContribution(sim.content, sim.type, store.contributions);

    const decayChanges = fairnessEngine.decayScores(store.contributions);
    for (const change of decayChanges) {
      broadcast('score_decayed', change);
    }

    const contribution = store.addContribution(contributor.id, sim.content, sim.type, score);

    if (sim.buildsOn && store.contributions.length > 1) {
      const candidates = store.contributions.filter(c => c.id !== contribution.id && c.contributor_id !== contributor.id);
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        const boostAmount = fairnessEngine.boostReferenced(target, contribution.id);
        if (boostAmount > 0) {
          const targetContributor = store.getContributorById(target.contributor_id);
          broadcast('boost_applied', {
            from_id: contribution.id,
            to_id: target.id,
            boost_amount: boostAmount,
            from_username: contributor.username,
            to_username: targetContributor?.username || 'unknown',
          });
        }
      }
    } else {
      const referenced = fairnessEngine.detectReferences(sim.content, store.contributions.filter(c => c.id !== contribution.id));
      if (referenced) {
        const boostAmount = fairnessEngine.boostReferenced(referenced, contribution.id);
        if (boostAmount > 0) {
          const targetContributor = store.getContributorById(referenced.contributor_id);
          broadcast('boost_applied', {
            from_id: contribution.id,
            to_id: referenced.id,
            boost_amount: boostAmount,
            from_username: contributor.username,
            to_username: targetContributor?.username || 'unknown',
          });
        }
      }
    }

    const oldStatuses = new Map<string, string>();
    store.contributors.forEach((c, id) => oldStatuses.set(id, c.status));

    fairnessEngine.calculateShares(store.contributors, store.contributions);

    store.contributors.forEach((c, id) => {
      const old = oldStatuses.get(id);
      if (old && old !== c.status) {
        broadcast('status_changed', { contributor_id: id, username: c.username, old_status: old, new_status: c.status });
      }
    });

    broadcast('contribution_added', { contribution, contributor: store.getContributorById(contributor.id) });
    broadcast('shares_updated', { contributors: store.getAllContributorsSorted(), timestamp: Date.now(), new_contributions_count: 1 });
  } catch (err) {
    console.error('[Simulation] Error adding contribution:', err);
  }
}

function injectRevenue(amount: number, broadcast: BroadcastFn) {
  try {
    if (store.contributors.size === 0) return;
    const event = fairnessEngine.distributeRevenue(amount, store.contributors);
    store.addRevenueEvent(event);

    const runningTotals: Record<string, number> = {};
    store.contributors.forEach(c => { runningTotals[c.username] = c.total_satoshis_earned; });

    broadcast('revenue_distributed', { amount, distribution: event.distribution, running_totals: runningTotals });
  } catch (err) {
    console.error('[Simulation] Error injecting revenue:', err);
  }
}

function injectAdvocacyEvent(broadcast: BroadcastFn) {
  try {
    const advocacyEvent = generateAdvocacyEvent();
    const contributor = store.getOrCreateContributor(advocacyEvent.username);
    const baseScore = fairnessEngine.scoreContribution(advocacyEvent.content, 'advocacy', store.contributions);
    store.addContribution(contributor.id, advocacyEvent.content, 'advocacy', baseScore);
    fairnessEngine.calculateShares(store.contributors, store.contributions);
    broadcast('advocacy_detected', advocacyEvent);
    broadcast('shares_updated', { contributors: store.getAllContributorsSorted(), timestamp: Date.now() });
    console.log('[Simulation] Advocacy: external attribution for @' + advocacyEvent.username);
  } catch (err) {
    console.error('[Simulation] Error injecting advocacy:', err);
  }
}

export function startSimulation(broadcast: BroadcastFn): { message: string } {
  if (simulationRunning) {
    return { message: 'Simulation already running' };
  }

  simulationRunning = true;
  ongoingIndex = 0;

  broadcast('simulation_phase', { phase: 1, message: 'Genesis — A small team starts building. Shares are relatively even.' });

  let phase1Delay = 0;
  for (const sim of PHASE_1_CONTRIBUTIONS) {
    const delay = phase1Delay;
    simulationTimers.push(setTimeout(() => addSimContribution(sim, broadcast), delay));
    phase1Delay += 800;
  }

  const phase2Start = phase1Delay + 2000;
  simulationTimers.push(setTimeout(() => {
    broadcast('simulation_phase', { phase: 2, message: 'Acceleration — New contributors enter. Some build on existing ideas. Early contributors with referenced ideas hold strong.' });
  }, phase2Start));

  let phase2Delay = phase2Start + 1000;
  for (const sim of PHASE_2_CONTRIBUTIONS) {
    const delay = phase2Delay;
    simulationTimers.push(setTimeout(() => addSimContribution(sim, broadcast), delay));
    phase2Delay += 3000;
  }

  const phase3Start = phase2Delay + 2000;
  simulationTimers.push(setTimeout(() => {
    broadcast('simulation_phase', { phase: 3, message: 'Stratification — Revenue flows. Shares adjust as the pool grows. The fairness engine breathes.' });
  }, phase3Start));

  let phase3Delay = phase3Start + 1000;
  for (const sim of PHASE_3_CONTRIBUTIONS) {
    const delay = phase3Delay;
    simulationTimers.push(setTimeout(() => addSimContribution(sim, broadcast), delay));
    phase3Delay += 2500;
  }

  // Phase 4 — Revenue events every 15s: 50,000–500,000 sats
  const revenueStart = phase3Start + 3000;
  let revenueDelay = revenueStart;
  for (let i = 0; i < 20; i++) {
    const delay = revenueDelay;
    const amount = 50000 + Math.floor(Math.random() * 450001);
    simulationTimers.push(setTimeout(() => injectRevenue(amount, broadcast), delay));
    revenueDelay += 15000;
  }

  // Phase 5 — Disruption: breakthrough synthesis shifts shares dramatically
  const phase5Start = phase3Delay + 8000;
  simulationTimers.push(setTimeout(() => {
    broadcast('simulation_phase', { phase: 5, message: 'Disruption — New contributor submits breakthrough synthesis. Shares shift dramatically in real time.' });
    addSimContribution(
      { username: 'breakthrough_lens', type: 'synthesis', content: 'Building on the entire chain of value and consensus mechanisms — the fairness engine proves that attribution is not zero-sum. When we correctly attribute, we create more value. This synthesis reframes the economy: every contribution that gets referenced multiplies. The breakthrough is that the system rewards both the referencer and the referenced. Real-time share shifts are not instability; they are the market discovering truth.', buildsOn: true },
      broadcast
    );
  }, phase5Start));

  const ongoingStart = phase5Start + 4000;
  simulationTimers.push(setTimeout(() => {
    startOngoingLoop(broadcast);
  }, ongoingStart));

  // External attribution: "The agent found them." First at 45s, second at 2min.
  const firstAdvocacyAt = 45000;
  simulationTimers.push(setTimeout(() => injectAdvocacyEvent(broadcast), firstAdvocacyAt));
  simulationTimers.push(setTimeout(() => injectAdvocacyEvent(broadcast), 120000));

  return { message: 'Simulation started — Phase 1: Genesis' };
}

function startOngoingLoop(broadcast: BroadcastFn) {
  if (!simulationRunning) return;

  const contributionInterval = setInterval(() => {
    if (!simulationRunning) { clearInterval(contributionInterval); return; }
    const sim = ONGOING_POOL[ongoingIndex % ONGOING_POOL.length];
    ongoingIndex++;
    addSimContribution(sim, broadcast);
  }, 4000);
  simulationTimers.push(contributionInterval as any);

  const revenueInterval = setInterval(() => {
    if (!simulationRunning) { clearInterval(revenueInterval); return; }
    injectRevenue(500, broadcast);
  }, 3000);
  simulationTimers.push(revenueInterval as any);

  const boostInterval = setInterval(() => {
    if (!simulationRunning) { clearInterval(boostInterval); return; }
    if (store.contributions.length < 2) return;

    const candidates = store.contributions.filter(c => c.referenced_by.length < 3);
    if (candidates.length === 0) return;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const sources = store.contributions.filter(c => c.id !== target.id);
    if (sources.length === 0) return;
    const source = sources[Math.floor(Math.random() * sources.length)];

    const boostAmount = fairnessEngine.boostReferenced(target, source.id);
    if (boostAmount > 0) {
      const targetContributor = store.getContributorById(target.contributor_id);
      const sourceContributor = store.getContributorById(source.contributor_id);
      broadcast('boost_applied', {
        from_id: source.id,
        to_id: target.id,
        boost_amount: boostAmount,
        from_username: sourceContributor?.username || 'unknown',
        to_username: targetContributor?.username || 'unknown',
      });

      fairnessEngine.calculateShares(store.contributors, store.contributions);
      broadcast('shares_updated', { contributors: store.getAllContributorsSorted(), timestamp: Date.now() });
    }
  }, 8000);
  simulationTimers.push(boostInterval as any);

  simulationTimers.push(setTimeout(() => {
    clearInterval(contributionInterval);
    clearInterval(revenueInterval);
    clearInterval(boostInterval);
    if (simulationRunning) {
      startOngoingLoop(broadcast);
    }
  }, 180000));
}

export function stopSimulation(): void {
  simulationRunning = false;
  for (const timer of simulationTimers) {
    clearTimeout(timer);
    clearInterval(timer);
  }
  simulationTimers = [];
}

export function isSimulationRunning(): boolean {
  return simulationRunning;
}

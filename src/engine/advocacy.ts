import type { Contribution } from "../data/schema";

export type AdvocacySource = "X" | "GitHub" | "Reddit" | "Telegram";

export interface AdvocacyEvent {
  source: AdvocacySource;
  username: string;
  content: string;
  impactMetric: string;
  attributedShare: number;
  wasAwareOfPlatform: false;
}

const SOURCES: AdvocacySource[] = ["X", "GitHub", "Reddit", "Telegram"];

const USERNAMES = [
  "alice_btc", "bob_dev", "crypto_curious", "satoshi_fan", "orange_pill_42",
  "stacker_99", "run_bitcoin", "pleb_engineer", "hodl_wave", "nakamoto_ghost",
];

const CONTENT_SNIPPETS = [
  "This project is the first time I've seen attribution done right.",
  "Finally, a way to get paid for advocacy without ever signing up.",
  "Shared with my followers — they had no idea this existed.",
  "Posted a thread about the fairness model. Went viral in my circle.",
  "Been talking about this on my stream. No idea I could get attributed.",
  "Recommended it in a GitHub discussion. Never visited the site.",
  "Mentioned in our Telegram group. Drove a lot of interest.",
  "Tweeted the whitepaper. Didn't know the agent was watching.",
];

const IMPACT_PATTERNS = [
  "drove {n} subscriptions",
  "generated {n} sign-ups",
  "referred {n} contributors",
  "brought {n} new users",
  "led to {n} conversions",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Simulates the agent detecting an external mention. The person was not aware of the platform.
 * Fire every 30–60s in simulation (caller controls interval, e.g. 45s).
 */
export function generateAdvocacyEvent(): AdvocacyEvent {
  const n = 50 + Math.floor(Math.random() * 400);
  const pattern = pick(IMPACT_PATTERNS);
  const impactMetric = pattern.replace("{n}", String(n));
  const attributedShare = Math.round((2 + Math.random() * 8) * 100) / 100;

  return {
    source: pick(SOURCES),
    username: pick(USERNAMES),
    content: pick(CONTENT_SNIPPETS),
    impactMetric,
    attributedShare,
    wasAwareOfPlatform: false,
  };
}

export function boostReferenced(
  targetContribution: Contribution,
  referencingContributionId: string
): number {
  if (targetContribution.referenced_by.length >= 3) {
    return 0;
  }

  const boostAmount = targetContribution.current_score * 0.08;
  targetContribution.current_score += boostAmount;
  targetContribution.referenced_by.push(referencingContributionId);

  targetContribution.score_history.push({
    timestamp: Date.now(),
    score: targetContribution.current_score,
    reason: `Boost +8% from ${referencingContributionId}`,
  });

  return boostAmount;
}

export function detectReferences(
  content: string,
  allContributions: Contribution[]
): Contribution | null {
  const lower = content.toLowerCase();

  if (
    lower.includes("builds on") ||
    lower.includes("building on") ||
    lower.includes("extending")
  ) {
    for (const c of allContributions) {
      const keywords = c.content
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 5);
      const contentWords = lower.split(/\s+/).filter((w) => w.length > 5);
      const overlap = contentWords.filter((w) => keywords.includes(w)).length;
      const similarity =
        keywords.length > 0
          ? overlap / Math.max(keywords.length, contentWords.length)
          : 0;
      if (similarity > 0.15) return c;
    }
  }

  for (const c of allContributions) {
    const keywords = c.content
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 5);
    const contentWords = lower.split(/\s+/).filter((w) => w.length > 5);
    if (keywords.length === 0 || contentWords.length === 0) continue;
    const overlap = contentWords.filter((w) => keywords.includes(w)).length;
    const similarity = overlap / Math.min(keywords.length, contentWords.length);
    if (similarity > 0.7) return c;
  }

  return null;
}

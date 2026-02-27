export interface ContributionPayload {
  app: "therealbitcoin";
  type: "contribution";
  projectId: string;
  text: string;
  timestamp: number;
  v: "1";
}

export function buildContributionPayload(
  projectId: string,
  text: string
): ContributionPayload {
  return {
    app: "therealbitcoin",
    type: "contribution",
    projectId,
    text: text.trim(),
    timestamp: Math.floor(Date.now() / 1000),
    v: "1",
  };
}

export function encodePayload(payload: ContributionPayload): string {
  return btoa(JSON.stringify(payload));
}


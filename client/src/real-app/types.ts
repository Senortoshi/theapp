/** Wall entry from API / WebSocket — same shape as simulator Wall. */
export interface WallEntry {
  id: number;
  contribution_id: string;
  content: string;
  author: string;
  status: "PENDING" | "IMPLEMENTED";
  points?: number;
  sharePct?: number;
  satoshis?: number;
  isExternal?: boolean;
  timestampLabel: string;
  type?: string;
}

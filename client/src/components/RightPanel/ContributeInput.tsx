import React, { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { contributionTypes } from "@shared/schema";
import { hydrateFromApi } from "@/store/useSimStore";
import { toast } from "@/hooks/use-toast";

const INPUT_FONT_SIZE = 16;

function contributionConfirmation(res: {
  contribution?: { type?: string; base_score?: number };
  contributor?: { current_share_pct?: number };
  total_pool_score?: number;
}): string {
  const typeLabel = res.contribution?.type ?? "Contribution";
  const baseScore = res.contribution?.base_score ?? 0;
  const pool = res.total_pool_score ?? 0;
  const share = res.contributor?.current_share_pct ?? 0;
  return `${typeLabel} received. Base score: ${Number(baseScore).toFixed(1)} points. Current pool: ${Number(pool).toFixed(0)} points. Your starting share: ${Number(share).toFixed(2)}%. This will adjust as others contribute and reference your work. The math is always visible. The ledger is permanent.`;
}

export const ContributeInput = React.memo(function ContributeInput() {
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("idea");
  const [loading, setLoading] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  const handleSubmit = useCallback(async () => {
    const u = username.trim();
    const c = content.trim();
    if (!u || !c) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/contribute", { username: u, content: c, type: type || "idea" });
      const data = (await res.json()) as {
        contribution?: { type?: string; base_score?: number };
        contributor?: { current_share_pct?: number };
        total_pool_score?: number;
      };
      setContent("");
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 400);
      toast({
        title: "Contribution recorded",
        description: contributionConfirmation(data),
        style: {
          background: "var(--surface-1)",
          border: "1px solid var(--green)",
          color: "var(--text-1)",
          fontFamily: "var(--font-ui)",
          maxWidth: "min(90vw, 420px)",
        },
      });
      const stateRes = await fetch("/api/state");
      const state = await stateRes.json();
      hydrateFromApi(state);
    } finally {
      setLoading(false);
    }
  }, [username, content, type]);

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-3 px-3 md:px-4 py-2 transition-shadow duration-300 w-full max-w-[100vw] ${successFlash ? "shadow-[0_0_20px_var(--gold)]" : ""}`}
      style={{
        minHeight: 52,
        background: "var(--surface-1)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex flex-row gap-2 md:gap-3 w-full md:w-auto flex-wrap">
        <input
          type="text"
          placeholder="Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-shrink-0 w-28 min-w-[80px] min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] focus:outline-none focus:ring-[3px] focus:ring-[var(--green-dim)] touch-manipulation"
          style={{ background: "var(--surface-0)", border: "1px solid var(--border)", color: "var(--text-1)", fontFamily: "var(--font-ui)", fontSize: INPUT_FONT_SIZE }}
          aria-label="Your name"
        />
        <div className="flex gap-1 flex-shrink-0 flex-wrap">
          {(contributionTypes as readonly string[]).filter((t) => t !== "advocacy").map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`min-h-[44px] min-w-[44px] px-3 py-2 border transition-colors duration-100 touch-manipulation ${
                type === t
                  ? "border-[var(--green)] text-[var(--green)] bg-[var(--green-dim)]"
                  : "border-[var(--border)] text-[var(--text-2)] active:text-[var(--text-1)] md:hover:text-[var(--text-1)]"
              }`}
              style={{ fontFamily: "var(--font-ui)", fontSize: INPUT_FONT_SIZE }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 w-full md:flex-1 md:min-w-0">
        <textarea
          placeholder="Contribution..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={1}
          className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-[var(--radius-sm)] resize-none focus:outline-none focus:ring-[3px] focus:ring-[var(--green-dim)] touch-manipulation"
          style={{ background: "var(--surface-0)", border: "1px solid var(--border)", color: "var(--text-1)", fontFamily: "var(--font-ui)", fontSize: INPUT_FONT_SIZE }}
          aria-label="Contribution content"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 min-h-[44px] min-w-[44px] flex-shrink-0 font-semibold rounded-[var(--radius-sm)] disabled:opacity-50 flex items-center justify-center gap-1 touch-manipulation"
          style={{
            background: "var(--green)",
            color: "#000",
            fontSize: INPUT_FONT_SIZE,
            letterSpacing: "0.08em",
            fontFamily: "var(--font-data)",
          }}
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden />
          ) : (
            "CONTRIBUTE"
          )}
        </button>
      </div>
    </div>
  );
});

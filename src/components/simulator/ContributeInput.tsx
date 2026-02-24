import React, { useState, useCallback } from "react";
import { apiRequest } from "../../data/queryClient";
import { contributionTypes } from "../../data/schema";
import { hydrateFromApi } from "../../hooks/useSimStore";

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
      await apiRequest("POST", "/api/contribute", { username: u, content: c, type: type || "idea" });
      setContent("");
      setSuccessFlash(true);
      setTimeout(() => setSuccessFlash(false), 400);
      const res = await fetch("/api/state");
      const data = await res.json();
      hydrateFromApi(data);
    } finally {
      setLoading(false);
    }
  }, [username, content, type]);

  return (
    <div
      className={`flex flex-col gap-2 p-3 transition-shadow duration-300 ${successFlash ? "shadow-[0_0_20px_var(--gold)]" : ""}`}
      style={{ height: 156, background: "var(--surface-1)", borderTop: "1px solid var(--border)" }}
    >
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="min-w-[100px] max-w-[160px] px-2 py-1.5 rounded-[var(--radius-sm)] focus:outline-none focus:ring-[3px] focus:ring-[var(--green-dim)]"
          style={{ background: "var(--surface-0)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          aria-label="Your name"
        />
        <div className="flex gap-0.5 flex-wrap">
          {(contributionTypes as readonly string[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-2 py-1 border transition-colors ${
                type === t
                  ? "border-[var(--green)] text-[var(--green)] bg-[var(--green-dim)]"
                  : "border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 flex-1 min-h-0">
        <textarea
          placeholder="contribution..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="flex-1 px-2 py-1.5 rounded-[var(--radius-sm)] resize-none focus:outline-none focus:ring-[3px] focus:ring-[var(--green-dim)]"
          style={{ background: "var(--surface-0)", border: "1px solid var(--border)", color: "var(--text-1)" }}
          aria-label="Contribution content"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-3 py-1.5 flex-shrink-0 self-end font-semibold rounded-[var(--radius-sm)] disabled:opacity-50 flex items-center justify-center gap-1 min-w-[60px]"
          style={{
            background: "var(--green)",
            color: "#000",
            fontSize: 12,
            letterSpacing: "0.08em",
            fontFamily: "var(--font-data)",
          }}
        >
          {loading ? (
            <span className="inline-block w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" aria-hidden />
          ) : (
            "POST"
          )}
        </button>
      </div>
    </div>
  );
});

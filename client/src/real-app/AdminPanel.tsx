import React, { useState, useEffect, useCallback } from "react";

const GREEN = "#00ff88";

interface PendingContribution {
  id: string;
  content: string;
  author_name: string;
  type: string;
  created_at: string;
}

export const AdminPanel: React.FC = () => {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [pending, setPending] = useState<PendingContribution[]>([]);
  const [revenuePool, setRevenuePool] = useState<number>(0);
  const [revenueInput, setRevenueInput] = useState("");
  const [implementingId, setImplementingId] = useState<string | null>(null);
  const [agentLogLines, setAgentLogLines] = useState<string[]>([]);

  const authHeaders = (): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const fetchPending = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/real/admin/pending", {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        setToken(null);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.pending)) setPending(data.pending);
    } catch {
      // ignore
    }
  }, [token]);

  const fetchRevenuePool = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/real/admin/revenue-pool", {
        headers: authHeaders(),
      });
      if (res.status === 401) {
        setToken(null);
        return;
      }
      const data = await res.json();
      if (typeof data.satoshis === "number") {
        setRevenuePool(data.satoshis);
        setRevenueInput(String(data.satoshis));
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchPending();
    fetchRevenuePool();
  }, [token, fetchPending, fetchRevenuePool]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
    );
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "real_agent_log" && Array.isArray(msg.data?.lines)) {
          setAgentLogLines(msg.data.lines);
        }
        if (msg.type === "real_wall_updated") {
          fetchPending();
        }
      } catch {
        // ignore
      }
    };
    return () => ws.close();
  }, [token, fetchPending]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/real/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
      } else {
        setAuthError("Unauthorized");
      }
    } catch {
      setAuthError("Request failed");
    }
  };

  const handleMarkImplemented = async (contributionId: string) => {
    setImplementingId(contributionId);
    setAgentLogLines([]);
    try {
      const res = await fetch("/api/real/admin/mark-implemented", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ contribution_id: contributionId }),
      });
      if (res.status === 401) {
        setToken(null);
        return;
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data.pending)) {
        setPending(data.pending);
      }
    } catch {
      // ignore
    } finally {
      setImplementingId(null);
    }
  };

  const handleSetRevenuePool = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(revenueInput, 10);
    if (Number.isNaN(val) || val < 0) return;
    try {
      const res = await fetch("/api/real/admin/revenue-pool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ satoshis: val }),
      });
      if (res.status === 401) {
        setToken(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRevenuePool(data.satoshis);
        setRevenueInput(String(data.satoshis));
      }
    } catch {
      // ignore
    }
  };

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--bg)", color: "var(--text-1)" }}
      >
        <form
          onSubmit={handleLogin}
          className="max-w-xs w-full flex flex-col gap-3"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          <label htmlFor="admin-password" className="text-sm text-[var(--text-2)]">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded border bg-[var(--surface-0)] border-[var(--border)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--green-dim)]"
            autoFocus
            aria-label="Admin password"
          />
          {authError && (
            <p className="text-sm text-[#ef4444]" role="alert">
              {authError}
            </p>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded font-medium"
            style={{ background: GREEN, color: "#000", fontFamily: "var(--font-data)" }}
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-6 px-4"
      style={{ background: "var(--bg)", color: "var(--text-1)", fontFamily: "var(--font-ui)" }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <h1
          className="text-lg font-medium"
          style={{ fontFamily: "var(--font-data)", letterSpacing: "0.05em" }}
        >
          Pending contributions
        </h1>

        <section className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-[var(--text-3)]">No pending contributions.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((c) => (
                <li
                  key={c.id}
                  className="p-3 rounded border bg-[var(--surface-1)] border-[var(--border)]"
                >
                  <div className="flex flex-wrap items-baseline gap-2 text-sm text-[var(--text-2)]">
                    <span style={{ fontFamily: "var(--font-data)" }}>
                      {c.id.slice(0, 8)}
                    </span>
                    <span>{c.author_name || "—"}</span>
                    <span>{c.type}</span>
                  </div>
                  <p className="mt-1 text-[var(--text-1)]">&ldquo;{c.content}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => handleMarkImplemented(c.id)}
                    disabled={implementingId !== null}
                    className="mt-2 px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                    style={{
                      background: GREEN,
                      color: "#000",
                      fontFamily: "var(--font-data)",
                    }}
                  >
                    {implementingId === c.id ? "Implementing…" : "Mark Implemented"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2
            className="text-sm font-medium mb-2"
            style={{ fontFamily: "var(--font-data)" }}
          >
            Revenue pool (satoshis)
          </h2>
          <form onSubmit={handleSetRevenuePool} className="flex gap-2 items-center">
            <input
              type="number"
              min={0}
              value={revenueInput}
              onChange={(e) => setRevenueInput(e.target.value)}
              className="w-32 px-3 py-2 rounded border bg-[var(--surface-0)] border-[var(--border)] text-[var(--text-1)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--green-dim)]"
              aria-label="Revenue pool satoshis"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded text-sm font-medium"
              style={{
                background: GREEN,
                color: "#000",
                fontFamily: "var(--font-data)",
              }}
            >
              Update
            </button>
          </form>
          <p className="mt-1 text-xs text-[var(--text-3)]">
            When updated, all satoshi distributions recalculate. Current pool:{" "}
            {revenuePool.toLocaleString()} sats.
          </p>
        </section>

        {agentLogLines.length > 0 && (
          <section
            className="p-3 rounded border font-mono text-sm"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--border)",
              color: "var(--text-2)",
              fontFamily: "var(--font-data)",
              lineHeight: 1.8,
            }}
          >
            <div className="mb-2 text-xs text-[var(--text-3)]" style={{ letterSpacing: "0.08em" }}>
              FAIRNESS AGENT (implementation log)
            </div>
            {agentLogLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

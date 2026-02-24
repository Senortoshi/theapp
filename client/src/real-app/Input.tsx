import React, { useState, useCallback } from "react";

const GREEN = "#00ff88";
const INPUT_FONT_SIZE = 16;

export interface RealAppInputProps {
  onSubmit: (content: string, name: string) => Promise<void>;
  disabled?: boolean;
}

export const RealAppInput: React.FC<RealAppInputProps> = ({
  onSubmit,
  disabled = false,
}) => {
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const c = content.trim();
    if (!c) return;
    setLoading(true);
    try {
      await onSubmit(c, name.trim());
      setContent("");
    } finally {
      setLoading(false);
    }
  }, [content, name, onSubmit]);

  return (
    <div
      className="flex flex-col sm:flex-row gap-2 sm:gap-3 px-3 sm:px-4 py-3 w-full max-w-xl mx-auto"
      style={{
        background: "var(--surface-1)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:items-end">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <label
            htmlFor="real-app-name"
            className="sr-only"
          >
            Name or handle (optional)
          </label>
          <input
            id="real-app-name"
            type="text"
            placeholder="Name or handle (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-[var(--green-dim)]"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--border)",
              color: "var(--text-1)",
              fontFamily: "var(--font-ui)",
              fontSize: INPUT_FONT_SIZE - 2,
            }}
            aria-label="Name or handle (optional)"
          />
        </div>
        <div className="flex gap-2 flex-1 min-w-0">
          <label htmlFor="real-app-content" className="sr-only">
            Contribute something
          </label>
          <textarea
            id="real-app-content"
            placeholder="Contribute something."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="flex-1 min-h-[44px] px-3 py-2 rounded border resize-none focus:outline-none focus:ring-2 focus:ring-[var(--green-dim)]"
            style={{
              background: "var(--surface-0)",
              borderColor: "var(--border)",
              color: "var(--text-1)",
              fontFamily: "var(--font-ui)",
              fontSize: INPUT_FONT_SIZE,
            }}
            aria-label="Contribution"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || disabled}
            className="px-4 py-2 min-h-[44px] flex-shrink-0 font-semibold rounded disabled:opacity-50 flex items-center justify-center"
            style={{
              background: GREEN,
              color: "#000",
              fontSize: INPUT_FONT_SIZE,
              letterSpacing: "0.08em",
              fontFamily: "var(--font-data)",
            }}
          >
            {loading ? (
              <span
                className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"
                aria-hidden
              />
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

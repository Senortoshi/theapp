import React from "react";

/**
 * Always visible, always readable. ethics.mdc: "This line appears on every screen."
 * No variable reward, no pull-back language.
 */
export const TransparencyFooter: React.FC = () => {
  return (
    <footer
      className="w-full px-3 py-4 border-t"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-1)",
      }}
    >
      <p
        className="max-w-xl mx-auto text-center text-sm leading-relaxed"
        style={{
          fontFamily: "var(--font-ui)",
          color: "var(--text-2)",
        }}
      >
        Your share is permanent whether or not you return. This platform does not
        need your attention — only your work. How shares work: your points ÷
        total pool points = your % of revenue.
      </p>
    </footer>
  );
};

import React from "react";
import { useContributors } from "../../hooks/useSimStore";
import { ContributorRow } from "./ContributorRow";

export const ContributorPanel = React.memo(function ContributorPanel() {
  const contributors = useContributors();

  return (
    <div
      className="flex flex-col h-full overflow-hidden scrollbar-thin border-r"
      style={{ background: "var(--surface-0)", borderColor: "var(--border)" }}
    >
      <div
        className="flex-shrink-0 px-3 py-2 flex items-center justify-between border-b"
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-ui)", fontSize: 14 }}
      >
        <span style={{ color: "var(--text-1)", fontWeight: 600 }}>Contributors</span>
        <span style={{ fontFamily: "var(--font-data)", color: "var(--text-3)", fontSize: 13 }}>{contributors.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {contributors.length === 0 ? (
          <div
            className="px-3 py-4 text-center"
            style={{ color: "var(--text-3)", fontSize: 13, fontFamily: "var(--font-ui)" }}
          >
            No contributors yet
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {contributors.map((c) => (
              <li key={c.id}>
                <ContributorRow contributor={c} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

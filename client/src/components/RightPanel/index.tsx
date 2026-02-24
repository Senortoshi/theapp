import React from "react";
import { FeedList } from "./FeedList";

export const RightPanel = React.memo(function RightPanel() {
  return (
    <div className="flex flex-col h-full min-w-0 border-l border-[var(--border)]">
      <FeedList />
    </div>
  );
});

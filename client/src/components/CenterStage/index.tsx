import React from "react";
import { AttributionRing } from "./AttributionRing";
import { RevenueRiver } from "./RevenueRiver";

export const CenterStage = React.memo(function CenterStage() {
  return (
    <div
      className="flex flex-col flex-1 min-h-0 gap-0 w-full min-w-0"
      style={{
        background: "var(--surface-1)",
        minHeight: 200,
      }}
    >
      <div className="flex-1 flex items-center justify-center min-h-0 w-full" style={{ minHeight: 180 }}>
        <AttributionRing />
      </div>
      <div className="flex-shrink-0 w-full" style={{ height: 156 }}>
        <RevenueRiver />
      </div>
    </div>
  );
});

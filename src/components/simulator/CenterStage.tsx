import React from "react";
import { AttributionRing } from "./AttributionRing";
import { RevenueRiver } from "./RevenueRiver";

export const CenterStage = React.memo(function CenterStage() {
  return (
    <div
      className="flex flex-col flex-1 min-h-0 gap-0"
      style={{
        background: "var(--surface-1)",
        minHeight: 0,
        minWidth: 200,
      }}
    >
      <div
        className="flex-1 flex items-center justify-center"
        style={{ minHeight: 240, width: "100%" }}
      >
        <AttributionRing />
      </div>
      <div className="flex-shrink-0" style={{ height: 156 }}>
        <RevenueRiver />
      </div>
    </div>
  );
});

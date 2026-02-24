import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFeedEvents } from "@/store/useSimStore";
import { FeedEvent } from "./FeedEvent";
import { useIsMobile } from "@/hooks/use-mobile";

const ITEM_HEIGHT = 52;

export const FeedList = React.memo(function FeedList() {
  const events = useFeedEvents();
  const parentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden scrollbar-thin" style={{ background: "var(--surface-0)" }}>
      <div className="flex-shrink-0 px-3 md:px-4 py-2 flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-data)" }}>LIVE FEED</span>
        <span style={{ fontSize: 14, color: "var(--text-2)", fontFamily: "var(--font-data)" }}>{events.length}</span>
      </div>
      {isMobile ? (
        <div
          ref={parentRef}
          className="flex-1 overflow-x-auto overflow-y-hidden flex flex-row gap-2 px-3 py-2 min-h-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {events.length === 0 ? (
            <div className="text-center text-[var(--text-3)] text-base py-6 self-center">No events yet</div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="flex-shrink-0 w-auto max-w-[220px]">
                <FeedEvent event={ev} compact />
              </div>
            ))
          )}
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-auto min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
          {events.length === 0 ? (
            <div className="text-center text-[var(--text-3)] text-base py-8">No events yet</div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const ev = events[virtualRow.index];
                return (
                  <div
                    key={ev.id}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <FeedEvent event={ev} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

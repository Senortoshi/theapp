import React, { useState, useEffect, useRef } from "react";
import { useContributors } from "@/store/useSimStore";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ContributorPanel } from "./index";

export const ContributorsStrip = React.memo(function ContributorsStrip() {
  const contributors = useContributors();
  const [open, setOpen] = useState(false);
  const closedByBackRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    closedByBackRef.current = false;
    window.history.pushState({ contributorsDrawer: true }, "");
    const onPopState = () => {
      closedByBackRef.current = true;
      setOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next && !closedByBackRef.current) window.history.back();
    setOpen(next);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] touch-manipulation border-t border-[var(--border)] bg-[var(--surface-0)] active:bg-[var(--surface-1)]"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 16,
            color: "var(--text-2)",
          }}
          aria-label={`${contributors.length} contributors — open list`}
        >
          <span>{contributors.length}</span>
          <span>contributors</span>
        </button>
      </DrawerTrigger>
      <DrawerContent
        className="max-h-[85dvh] flex flex-col rounded-t-[10px] border-t border-[var(--border)] bg-[var(--surface-0)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <DrawerHeader className="flex-shrink-0 border-b border-[var(--border)]">
          <DrawerTitle className="text-left font-semibold" style={{ fontFamily: "var(--font-ui)", color: "var(--text-1)", fontSize: 18 }}>
            Contributors
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
          <ContributorPanel hideHeader />
        </div>
      </DrawerContent>
    </Drawer>
  );
});

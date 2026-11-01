"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import QuickSearchPalette from "@/components/QuickSearchPalette";

type QuickSearchContextValue = {
  openQuickSearch: () => void;
};

const QuickSearchContext = createContext<QuickSearchContextValue | null>(null);

export function QuickSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<QuickSearchContextValue>(() => ({ openQuickSearch: () => setOpen(true) }), []);

  return (
    <QuickSearchContext.Provider value={value}>
      {children}
      <QuickSearchPalette key={open ? "open" : "closed"} open={open} onOpenChange={setOpen} />
    </QuickSearchContext.Provider>
  );
}

export function useQuickSearch(): QuickSearchContextValue {
  const ctx = useContext(QuickSearchContext);
  if (!ctx) throw new Error("useQuickSearch must be used within QuickSearchProvider");
  return ctx;
}

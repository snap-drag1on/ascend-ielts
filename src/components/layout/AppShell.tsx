import { type ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Titlebar } from "./Titlebar";
import { CommandPalette } from "./CommandPalette";
import { useUI } from "@/lib/stores/ui";
import { useShortcut } from "@/lib/hooks/useShortcut";
import type { Route } from "@/types";

interface Props {
  children: ReactNode;
}

const ROUTE_NUMBER: Record<string, Route> = {
  "1": "dashboard",
  "2": "timeline",
  "3": "analytics",
  "4": "skills",
  "5": "focus",
  "6": "notes",
  "7": "calendar",
  "8": "achievements",
  "9": "settings",
};

export function AppShell({ children }: Props) {
  const { route, setRoute, togglePalette } = useUI();

  useShortcut("cmd+k", (e) => {
    e.preventDefault();
    togglePalette();
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const next = ROUTE_NUMBER[e.key];
      if (next) setRoute(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setRoute]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface text-text">
      <Sidebar />
      <div className="flex h-full flex-1 flex-col">
        <Titlebar />
        <main className="relative flex-1 overflow-hidden">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.18]" />
          <div className="scroll-y relative h-full overflow-y-auto px-8 pb-12 pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={route}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto max-w-6xl"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

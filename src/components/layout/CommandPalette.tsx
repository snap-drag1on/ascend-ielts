import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  CalendarRange,
  LineChart,
  Target,
  Timer,
  NotebookText,
  CalendarDays,
  Trophy,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUI } from "@/lib/stores/ui";
import { useSettings } from "@/lib/stores/settings";
import type { Route } from "@/types";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  group: "Navigation" | "Actions" | "Appearance";
  run: () => void;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, setRoute } = useUI();
  const { theme, setTheme } = useSettings();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paletteOpen) {
      setQ("");
      setActive(0);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [paletteOpen]);

  const allItems: CommandItem[] = useMemo(() => {
    const nav = (id: Route, label: string, icon: CommandItem["icon"]): CommandItem => ({
      id: `nav-${id}`,
      label,
      hint: "Go to",
      icon,
      group: "Navigation",
      run: () => setRoute(id),
    });
    return [
      nav("dashboard", "Dashboard", LayoutDashboard),
      nav("timeline", "Timeline", CalendarRange),
      nav("analytics", "Analytics", LineChart),
      nav("skills", "Skills", Target),
      nav("focus", "Focus", Timer),
      nav("notes", "Notes & Journal", NotebookText),
      nav("calendar", "Calendar", CalendarDays),
      nav("achievements", "Achievements", Trophy),
      nav("settings", "Settings", SettingsIcon),
      {
        id: "act-new-note",
        label: "New note",
        hint: "Add to mistake journal",
        icon: Plus,
        group: "Actions",
        run: () => {
          setRoute("notes");
          window.dispatchEvent(new CustomEvent("ascend:new-note"));
        },
      },
      {
        id: "act-start-focus",
        label: "Start Pomodoro",
        hint: "Focus mode",
        icon: Timer,
        group: "Actions",
        run: () => {
          setRoute("focus");
          window.dispatchEvent(new CustomEvent("ascend:start-focus"));
        },
      },
      {
        id: "ui-toggle-theme",
        label: theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode",
        icon: theme === "dark" ? Sun : Moon,
        group: "Appearance",
        run: () => void setTheme(theme === "dark" ? "light" : "dark"),
      },
    ];
  }, [setRoute, setTheme, theme]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allItems;
    return allItems.filter((it) => it.label.toLowerCase().includes(s));
  }, [q, allItems]);

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[active]?.run();
        setPaletteOpen(false);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, filtered, active, setPaletteOpen]);

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setPaletteOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong relative z-10 w-[640px] max-w-[92vw] overflow-hidden rounded-2xl shadow-elevated"
          >
            <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
              <Search size={16} className="text-text-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent text-[14px] text-text outline-none placeholder:text-text-faint"
              />
              <kbd className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-faint">
                ESC
              </kbd>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2 scroll-y">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-text-faint">
                  No commands match “{q}”.
                </div>
              ) : (
                <CommandList items={filtered} active={active} onSelect={(i) => {
                  filtered[i]?.run();
                  setPaletteOpen(false);
                }} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommandList({
  items,
  active,
  onSelect,
}: {
  items: CommandItem[];
  active: number;
  onSelect: (i: number) => void;
}) {
  const groups = items.reduce<Record<string, CommandItem[]>>((acc, it) => {
    (acc[it.group] ||= []).push(it);
    return acc;
  }, {});
  let flatIndex = -1;
  return (
    <div>
      {Object.entries(groups).map(([group, list]) => (
        <div key={group} className="mb-1">
          <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-text-faint">
            {group}
          </div>
          {list.map((it) => {
            flatIndex += 1;
            const idx = flatIndex;
            const isActive = idx === active;
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                onMouseEnter={() => {
                  /* no-op: keep keyboard control crisp */
                }}
                onClick={() => onSelect(idx)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                  isActive
                    ? "bg-accent/15 text-text ring-1 ring-accent/30"
                    : "text-text-muted hover:bg-surface-muted",
                )}
              >
                <Icon size={15} className="opacity-80" />
                <span className="flex-1">{it.label}</span>
                {it.hint && <span className="text-[11px] text-text-faint">{it.hint}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

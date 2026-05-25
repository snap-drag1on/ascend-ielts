import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarRange,
  LineChart,
  Target,
  Timer,
  NotebookText,
  CalendarDays,
  Trophy,
  Settings as SettingsIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUI } from "@/lib/stores/ui";
import type { Route } from "@/types";

interface Item {
  id: Route;
  label: string;
  icon: typeof LayoutDashboard;
  shortcut?: string;
}

const ITEMS: Item[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "1" },
  { id: "timeline", label: "Timeline", icon: CalendarRange, shortcut: "2" },
  { id: "analytics", label: "Analytics", icon: LineChart, shortcut: "3" },
  { id: "skills", label: "Skills", icon: Target, shortcut: "4" },
  { id: "focus", label: "Focus", icon: Timer, shortcut: "5" },
  { id: "notes", label: "Notes", icon: NotebookText, shortcut: "6" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, shortcut: "7" },
  { id: "achievements", label: "Achievements", icon: Trophy, shortcut: "8" },
];

export function Sidebar() {
  const { route, setRoute, sidebarCollapsed, toggleSidebar } = useUI();

  return (
    <aside
      className={cn(
        "glass relative flex shrink-0 flex-col gap-2 border-r border-border-subtle py-3 transition-[width] duration-300",
        sidebarCollapsed ? "w-[68px]" : "w-[232px]",
      )}
    >
      <div className={cn("flex items-center gap-2 px-4", sidebarCollapsed && "justify-center px-2")}>
        <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 shadow-glow">
          <span className="font-display text-[14px] font-bold tracking-tight text-white">A</span>
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[13px] font-semibold tracking-tight text-text">
              Ascend
            </span>
            <span className="text-[10px] uppercase tracking-wider text-text-faint">
              IELTS OS
            </span>
          </div>
        )}
      </div>

      <nav className={cn("mt-4 flex flex-col gap-0.5 px-2")}>
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const active = route === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setRoute(it.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                "hover:bg-surface-muted",
                active ? "text-text" : "text-text-muted",
                sidebarCollapsed && "justify-center px-2",
              )}
              title={sidebarCollapsed ? it.label : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-accent/15 ring-1 ring-accent/30"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon size={16} className="relative" />
              {!sidebarCollapsed && (
                <>
                  <span className="relative flex-1 text-left">{it.label}</span>
                  {it.shortcut && (
                    <kbd className="relative rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-faint">
                      {it.shortcut}
                    </kbd>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 px-2 pb-2">
        <button
          onClick={() => setRoute("settings")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text",
            route === "settings" && "text-text",
            sidebarCollapsed && "justify-center px-2",
          )}
        >
          <SettingsIcon size={16} />
          {!sidebarCollapsed && <span className="flex-1 text-left">Settings</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium text-text-faint transition-colors hover:bg-surface-muted hover:text-text-muted",
            sidebarCollapsed && "justify-center px-2",
          )}
        >
          {sidebarCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          {!sidebarCollapsed && <span className="flex-1 text-left">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

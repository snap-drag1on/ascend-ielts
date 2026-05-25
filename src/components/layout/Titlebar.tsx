import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUI } from "@/lib/stores/ui";
import { useClock } from "@/lib/hooks/useClock";
import { format } from "@/lib/utils/time";
import { isTauri } from "@/lib/env";

export function Titlebar() {
  const togglePalette = useUI((s) => s.togglePalette);
  const now = useClock(30_000);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  return (
    <div
      className={cn(
        "titlebar-drag relative flex h-12 shrink-0 items-center justify-between",
        "border-b border-border-subtle bg-surface/70 backdrop-blur-xl",
      )}
    >
      {/* Traffic-light spacer for native macOS hidden-title overlay */}
      <div className="flex h-full w-[88px] items-center pl-3.5">
        {/* Only render decorative dots in non-Tauri preview (so dev preview still looks Mac-like) */}
        {!isTauri() && (
          <div className="flex gap-2 titlebar-no-drag">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 select-none">
        <span className="font-display text-[13px] font-medium tracking-wide text-text-muted">
          ASCEND
        </span>
        <span className="ml-2 text-[12px] text-text-faint">{format(now, "EEE, MMM d · HH:mm")}</span>
      </div>

      <div className="titlebar-no-drag flex items-center gap-2 pr-3">
        <button
          onClick={togglePalette}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-muted px-2.5 py-1 text-[12px] text-text-muted",
            "hover:border-accent/30 hover:text-text transition-colors",
          )}
        >
          <Search size={13} />
          <span>Quick command</span>
          <kbd className="ml-2 rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-faint shadow-card">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>
      </div>
    </div>
  );
}

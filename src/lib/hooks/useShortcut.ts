import { useEffect } from "react";

/**
 * Bind a keyboard shortcut. Pass keys like "cmd+k", "shift+s", "esc".
 * Uses ⌘ on Mac and Ctrl on other platforms automatically when key is "cmd".
 */
export function useShortcut(keys: string, handler: (e: KeyboardEvent) => void): void {
  useEffect(() => {
    const parts = keys.toLowerCase().split("+").map((p) => p.trim());
    const wantMeta = parts.includes("cmd") || parts.includes("meta");
    const wantCtrl = parts.includes("ctrl");
    const wantShift = parts.includes("shift");
    const wantAlt = parts.includes("alt") || parts.includes("option");
    const main = parts.filter((p) => !["cmd", "meta", "ctrl", "shift", "alt", "option"].includes(p))[0];

    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isMacLike = typeof navigator !== "undefined" && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
      const cmdSatisfied = wantMeta ? (isMacLike ? e.metaKey : e.ctrlKey || e.metaKey) : true;
      const ctrlSatisfied = wantCtrl ? e.ctrlKey : true;
      const shiftSatisfied = wantShift ? e.shiftKey : !wantShift ? !e.shiftKey || true : true;
      const altSatisfied = wantAlt ? e.altKey : true;
      if (!cmdSatisfied || !ctrlSatisfied || !altSatisfied) return;
      if (wantShift && !shiftSatisfied) return;
      if (main && key !== main) return;
      handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keys, handler]);
}

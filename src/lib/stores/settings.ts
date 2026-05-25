import { create } from "zustand";
import { getAllSettings, setSetting } from "@/lib/db/repositories";

export type Theme = "dark" | "light";
export type Accent = "indigo" | "violet" | "rose" | "emerald" | "amber" | "sky";

interface SettingsState {
  theme: Theme;
  accent: Accent;
  fontScale: number;
  ready: boolean;
  load: () => Promise<void>;
  setTheme: (t: Theme) => Promise<void>;
  setAccent: (a: Accent) => Promise<void>;
  setFontScale: (n: number) => Promise<void>;
}

function applyDom(theme: Theme, accent: Accent, fontScale: number) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.accent = accent;
  root.style.fontSize = `${Math.round(fontScale * 16)}px`;
}

export const useSettings = create<SettingsState>((set, get) => ({
  theme: "dark",
  accent: "indigo",
  fontScale: 1,
  ready: false,

  load: async () => {
    try {
      const s = await getAllSettings();
      const theme = (s.theme as Theme) ?? "dark";
      const accent = (s.accent as Accent) ?? "indigo";
      const fontScale = s.font_scale ? Number(s.font_scale) : 1;
      applyDom(theme, accent, fontScale);
      set({ theme, accent, fontScale, ready: true });
    } catch {
      // Fallback: apply defaults from current state.
      const { theme, accent, fontScale } = get();
      applyDom(theme, accent, fontScale);
      set({ ready: true });
    }
  },

  setTheme: async (t) => {
    applyDom(t, get().accent, get().fontScale);
    set({ theme: t });
    await setSetting("theme", t);
  },

  setAccent: async (a) => {
    applyDom(get().theme, a, get().fontScale);
    set({ accent: a });
    await setSetting("accent", a);
  },

  setFontScale: async (n) => {
    applyDom(get().theme, get().accent, n);
    set({ fontScale: n });
    await setSetting("font_scale", String(n));
  },
}));

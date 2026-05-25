import { create } from "zustand";
import { logFocusSession } from "@/lib/db/repositories";

export type TimerMode = "pomodoro" | "deep";

interface TimerState {
  mode: TimerMode;
  durationMin: number;
  remainingSec: number;
  running: boolean;
  category: string | null;
  _intervalId: number | null;

  setMode: (m: TimerMode) => void;
  setDuration: (min: number) => void;
  setCategory: (c: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

const DEFAULTS: Record<TimerMode, number> = { pomodoro: 25, deep: 50 };

export const useTimer = create<TimerState>((set, get) => ({
  mode: "pomodoro",
  durationMin: DEFAULTS.pomodoro,
  remainingSec: DEFAULTS.pomodoro * 60,
  running: false,
  category: null,
  _intervalId: null,

  setMode: (m) =>
    set({
      mode: m,
      durationMin: DEFAULTS[m],
      remainingSec: DEFAULTS[m] * 60,
      running: false,
    }),
  setDuration: (min) => set({ durationMin: min, remainingSec: min * 60, running: false }),
  setCategory: (c) => set({ category: c }),

  start: () => {
    if (get().running) return;
    const id = window.setInterval(() => get().tick(), 1000);
    set({ running: true, _intervalId: id });
  },
  pause: () => {
    const id = get()._intervalId;
    if (id !== null) window.clearInterval(id);
    set({ running: false, _intervalId: null });
  },
  reset: () => {
    const id = get()._intervalId;
    if (id !== null) window.clearInterval(id);
    const { durationMin } = get();
    set({ running: false, _intervalId: null, remainingSec: durationMin * 60 });
  },

  tick: () => {
    const { remainingSec, durationMin, mode, category, _intervalId } = get();
    if (remainingSec <= 1) {
      if (_intervalId !== null) window.clearInterval(_intervalId);
      set({ running: false, remainingSec: 0, _intervalId: null });
      void logFocusSession({
        duration_min: durationMin,
        mode,
        category,
        completed: true,
      });
      return;
    }
    set({ remainingSec: remainingSec - 1 });
  },
}));

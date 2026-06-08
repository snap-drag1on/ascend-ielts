import { create } from "zustand";
import type { Route } from "@/types";

interface UIState {
  route: Route;
  paletteOpen: boolean;
  sidebarCollapsed: boolean;
  setRoute: (r: Route) => void;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  toggleSidebar: () => void;
}

export const useUI = create<UIState>((set) => ({
  route: "dashboard",
  paletteOpen: false,
  sidebarCollapsed: false,
  setRoute: (route) => set({ route, paletteOpen: false }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));

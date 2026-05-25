import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Timeline } from "./features/timeline/Timeline";
import { Analytics } from "./features/analytics/Analytics";
import { Skills } from "./features/skills/Skills";
import { Focus } from "./features/focus/Focus";
import { Notes } from "./features/notes/Notes";
import { Calendar } from "./features/calendar/Calendar";
import { Achievements } from "./features/gamification/Achievements";
import { Settings } from "./features/settings/Settings";
import { useUI } from "./lib/stores/ui";
import { useSettings } from "./lib/stores/settings";
import { isTauri } from "./lib/env";
import { Button } from "./components/ui/Button";

export function App() {
  const route = useUI((s) => s.route);
  const loadSettings = useSettings((s) => s.load);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri()) {
      setBootError(
        "ASCEND must be run inside the Tauri shell. From the project directory, run `pnpm tauri dev` (development) or `pnpm tauri build` to produce a .dmg.",
      );
      return;
    }
    loadSettings().catch((e: unknown) =>
      setBootError(e instanceof Error ? e.message : String(e)),
    );
  }, [loadSettings]);

  if (bootError) {
    return <BootScreen message={bootError} />;
  }

  return (
    <AppShell>
      {route === "dashboard" && <Dashboard />}
      {route === "timeline" && <Timeline />}
      {route === "analytics" && <Analytics />}
      {route === "skills" && <Skills />}
      {route === "focus" && <Focus />}
      {route === "notes" && <Notes />}
      {route === "calendar" && <Calendar />}
      {route === "achievements" && <Achievements />}
      {route === "settings" && <Settings />}
    </AppShell>
  );
}

function BootScreen({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center bg-surface p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 shadow-glow">
          <span className="font-display text-2xl font-bold text-white">A</span>
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-text">ASCEND</h1>
        <p className="mt-2 text-sm text-text-muted">{message}</p>
        <p className="mt-4 text-[12px] text-text-faint">
          ASCEND is a fully native macOS app. Open the project root and run:
        </p>
        <pre className="mt-2 rounded-xl border border-border-subtle bg-surface-muted p-3 text-left text-[12px] text-text-muted">
{`pnpm install
pnpm tauri dev      # dev mode
pnpm tauri build    # produces .dmg in src-tauri/target/release/bundle`}
        </pre>
        <div className="mt-6">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    </div>
  );
}

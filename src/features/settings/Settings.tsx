import { useState } from "react";
import { Moon, Sun, Download, Upload, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSettings, type Accent } from "@/lib/stores/settings";
import { cn } from "@/lib/utils/cn";
import { exportBackup, importBackup } from "@/lib/backup";

const ACCENTS: Array<{ id: Accent; color: string; label: string }> = [
  { id: "indigo", color: "#5b85ff", label: "Indigo" },
  { id: "violet", color: "#a78bfa", label: "Violet" },
  { id: "rose", color: "#f472b6", label: "Rose" },
  { id: "emerald", color: "#34d399", label: "Emerald" },
  { id: "amber", color: "#fbbf24", label: "Amber" },
  { id: "sky", color: "#38bdf8", label: "Sky" },
];

export function Settings() {
  const { theme, setTheme, accent, setAccent, fontScale, setFontScale } = useSettings();
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Make it yours."
        description="Theme, accent, typography, and local data tools."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Appearance</CardTitle>
          <p className="mt-1 text-xs text-text-faint">
            ASCEND auto-applies macOS-style glass and blur on all themes.
          </p>
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Theme
            </div>
            <div className="mt-2 flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-medium transition-colors",
                    theme === t
                      ? "border-accent/40 bg-accent/15 text-text"
                      : "border-border-subtle text-text-muted hover:bg-surface-muted",
                  )}
                >
                  {t === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Accent
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px]",
                    accent === a.id
                      ? "border-accent/40 bg-accent/15 text-text"
                      : "border-border-subtle text-text-muted hover:bg-surface-muted",
                  )}
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ background: a.color }}
                  />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Font scale
            </div>
            <div className="mt-2 flex gap-2">
              {[0.9, 1.0, 1.05, 1.1].map((s) => (
                <button
                  key={s}
                  onClick={() => setFontScale(s)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-[12px]",
                    Math.abs(fontScale - s) < 0.001
                      ? "border-accent/40 bg-accent/15 text-text"
                      : "border-border-subtle text-text-muted hover:bg-surface-muted",
                  )}
                >
                  {(s * 100).toFixed(0)}%
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Data</CardTitle>
          <p className="mt-1 text-xs text-text-faint">
            Everything is stored locally in <code>~/Library/Application Support/com.snapdrag1on.ascend/ascend.db</code>.
            No data ever leaves your Mac.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
              <div>
                <div className="font-display text-[14px] font-semibold text-text">
                  Export backup
                </div>
                <div className="text-[12px] text-text-muted">
                  Save a JSON of all sessions, mocks, notes, and settings.
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    await exportBackup();
                    setStatus("Backup exported");
                  } catch (e) {
                    setStatus(e instanceof Error ? e.message : "Export failed");
                  }
                }}
              >
                <Download size={14} /> Export
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
              <div>
                <div className="font-display text-[14px] font-semibold text-text">
                  Import backup
                </div>
                <div className="text-[12px] text-text-muted">
                  Restore from a JSON file produced by ASCEND.
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    await importBackup();
                    setStatus("Backup imported — reload the app to see changes");
                  } catch (e) {
                    setStatus(e instanceof Error ? e.message : "Import failed");
                  }
                }}
              >
                <Upload size={14} /> Import
              </Button>
            </div>
            {status && (
              <div className="rounded-lg border border-border-subtle bg-surface-muted/40 px-3 py-2 text-[12px] text-text-muted">
                {status}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold text-text">ASCEND v0.1.0</div>
            <div className="text-[12px] text-text-muted">
              Built with Tauri · React · TypeScript · SQLite. 100% offline.
            </div>
          </div>
          <Badge tone="accent" className="ml-auto">
            macOS native
          </Badge>
        </div>
      </Card>
    </div>
  );
}

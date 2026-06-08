import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Brain,
  Timer as TimerIcon,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useTimer } from "@/lib/stores/timer";
import {
  focusMinutesBetween,
  getReflection,
  listFocusForDate,
  upsertReflection,
} from "@/lib/db/repositories";
import { todayKey } from "@/lib/utils/time";
import type { FocusSession, Reflection } from "@/types";
import { cn } from "@/lib/utils/cn";

export function Focus() {
  const { mode, durationMin, remainingSec, running, start, pause, reset, setMode, setDuration } =
    useTimer();
  const [todayFocus, setTodayFocus] = useState<FocusSession[]>([]);
  const [weekMin, setWeekMin] = useState(0);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [reflectionDraft, setReflectionDraft] = useState({
    mood: 4,
    energy: 3,
    wins: "",
    struggles: "",
    tomorrow: "",
  });

  useEffect(() => {
    void refresh();
    const onCmd = () => start();
    window.addEventListener("ascend:start-focus", onCmd);
    return () => window.removeEventListener("ascend:start-focus", onCmd);
  }, [start]);

  async function refresh() {
    const today = todayKey();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const [tf, wm, r] = await Promise.all([
      listFocusForDate(today),
      focusMinutesBetween(weekStart.toISOString().slice(0, 10), today),
      getReflection(today),
    ]);
    setTodayFocus(tf);
    setWeekMin(wm);
    setReflection(r);
    if (r) {
      setReflectionDraft({
        mood: r.mood ?? 4,
        energy: r.energy ?? 3,
        wins: r.wins ?? "",
        struggles: r.struggles ?? "",
        tomorrow: r.tomorrow ?? "",
      });
    }
  }

  // Refresh when timer completes (every 60s during a session)
  useEffect(() => {
    if (!running) {
      void refresh();
    }
  }, [running]);

  const totalSec = durationMin * 60;
  const progress = totalSec > 0 ? 1 - remainingSec / totalSec : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Focus"
        title="Deep work, distilled."
        description="Pomodoro & Deep Focus sessions, daily goals, and an evening reflection journal."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="Today's focus"
          value={`${(todayFocus.reduce((a, s) => a + s.duration_min, 0))}m`}
          hint={`${todayFocus.filter((s) => s.completed).length} sessions`}
          icon={<TimerIcon size={14} />}
        />
        <Stat
          label="7-day focus"
          value={`${(weekMin / 60).toFixed(1)}h`}
          hint="Pomodoros + deep"
          icon={<Brain size={14} />}
        />
        <Stat
          label="Mode"
          value={mode === "pomodoro" ? "Pomodoro" : "Deep Focus"}
          hint={`${durationMin} min · ${running ? "running" : "idle"}`}
          icon={<Flame size={14} />}
          accent="#f97316"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col items-center gap-5 py-8">
          <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-muted/60 p-1 text-[12px]">
            {(["pomodoro", "deep"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  m === mode
                    ? "bg-surface-elevated text-text shadow-card"
                    : "text-text-muted hover:text-text",
                )}
              >
                {m === "pomodoro" ? "Pomodoro" : "Deep Focus"}
              </button>
            ))}
          </div>

          <ProgressRing
            value={progress}
            size={224}
            stroke={14}
            label={
              <div className="flex flex-col items-center">
                <span className="font-display text-4xl font-semibold tabular-nums text-text">
                  {fmt(remainingSec)}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-text-faint">
                  {running ? "Focused" : "Ready"}
                </span>
              </div>
            }
          />

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={reset}>
              <RotateCcw size={14} /> Reset
            </Button>
            {running ? (
              <Button variant="primary" size="lg" onClick={pause}>
                <Pause size={16} /> Pause
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={start}>
                <Play size={16} /> Start {mode === "pomodoro" ? "25" : "50"}m
              </Button>
            )}
            <div className="flex gap-1">
              {[15, 25, 50, 90].map((m) => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px]",
                    durationMin === m
                      ? "border-accent/40 bg-accent/15 text-accent"
                      : "border-border-subtle text-text-muted hover:bg-surface-muted",
                  )}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Daily reflection</CardTitle>
          <p className="mt-1 text-xs text-text-faint">
            Capture today&apos;s wins. Identify struggles. Plan tomorrow.
          </p>
          <div className="mt-4 space-y-3">
            <Slider
              label="Mood"
              value={reflectionDraft.mood}
              onChange={(v) => setReflectionDraft((r) => ({ ...r, mood: v }))}
            />
            <Slider
              label="Energy"
              value={reflectionDraft.energy}
              onChange={(v) => setReflectionDraft((r) => ({ ...r, energy: v }))}
            />
            <Field label="Wins">
              <Textarea
                rows={2}
                placeholder="What worked today?"
                value={reflectionDraft.wins}
                onChange={(e) => setReflectionDraft((r) => ({ ...r, wins: e.target.value }))}
              />
            </Field>
            <Field label="Struggles">
              <Textarea
                rows={2}
                placeholder="What didn't work?"
                value={reflectionDraft.struggles}
                onChange={(e) =>
                  setReflectionDraft((r) => ({ ...r, struggles: e.target.value }))
                }
              />
            </Field>
            <Field label="Tomorrow's focus">
              <Textarea
                rows={2}
                placeholder="One thing you'll prioritize"
                value={reflectionDraft.tomorrow}
                onChange={(e) =>
                  setReflectionDraft((r) => ({ ...r, tomorrow: e.target.value }))
                }
              />
            </Field>
            <div className="flex items-center justify-between">
              <Badge tone={reflection ? "success" : "muted"}>
                {reflection ? (
                  <>
                    <CheckCircle2 size={11} /> Saved today
                  </>
                ) : (
                  "Not saved yet"
                )}
              </Badge>
              <Button
                variant="primary"
                onClick={async () => {
                  await upsertReflection({
                    date: todayKey(),
                    mood: reflectionDraft.mood,
                    energy: reflectionDraft.energy,
                    wins: reflectionDraft.wins,
                    struggles: reflectionDraft.struggles,
                    tomorrow: reflectionDraft.tomorrow,
                  });
                  refresh();
                }}
              >
                Save reflection
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Motivation</CardTitle>
        <motion.blockquote
          key={quoteFor()}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-3 rounded-xl border border-border-subtle bg-surface-muted/40 p-5 font-display text-[15px] leading-relaxed text-text"
        >
          “{quoteFor()}”
        </motion.blockquote>
      </Card>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
        <span>{label}</span>
        <span className="text-text">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              "h-7 flex-1 rounded-md border transition-all",
              n <= value
                ? "border-accent/40 bg-accent/30"
                : "border-border-subtle bg-surface-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const QUOTES = [
  "Discipline beats motivation. Show up daily.",
  "You don't rise to the level of your goals — you fall to the level of your systems.",
  "Consistency compounds. Two hours a day for 90 days is a transformation.",
  "Listen actively. Read actively. Speak fearlessly.",
  "Mistakes are the curriculum. Track them, then beat them.",
  "Bands are a side-effect of disciplined input + ruthless feedback.",
];

function quoteFor(): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return QUOTES[day % QUOTES.length]!;
}

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Sparkles,
  Target,
  Clock,
  Activity,
  TrendingUp,
  CheckCircle2,
  Coffee,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Sparkline } from "@/components/charts/Sparkline";
import { useDailyData } from "@/lib/hooks/useDailyData";
import { useClock } from "@/lib/hooks/useClock";
import { useUI } from "@/lib/stores/ui";
import { formatLongDate, nowHHMM, hhmmToMinutes } from "@/lib/utils/time";
import { SKILL_COLOR, SKILL_LABEL, overallBand } from "@/lib/utils/ielts";

export function Dashboard() {
  const { snap, loading } = useDailyData();
  const setRoute = useUI((s) => s.setRoute);
  const now = useClock(15_000);

  const next = useMemo(() => {
    if (!snap) return null;
    const cur = hhmmToMinutes(nowHHMM(now));
    return (
      snap.sessions.find(
        (s) => s.status === "pending" && hhmmToMinutes(s.end_time) > cur,
      ) ?? null
    );
  }, [snap, now]);

  const dailyProgress = snap && snap.total > 0 ? snap.done / snap.total : 0;
  const targetMinutes = 6 * 60; // 6h/day baseline
  const productivity = snap ? Math.min(1, snap.studyMinutes / targetMinutes) : 0;
  const ovBand = snap ? overallBand(snap.targets) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatLongDate(now)}
        title="Today's Mission"
        description="Your 3-month IELTS preparation operating system."
        actions={
          <>
            <Button variant="ghost" onClick={() => setRoute("calendar")}>
              View calendar
            </Button>
            <Button variant="primary" onClick={() => setRoute("focus")}>
              Start focus
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Daily Progress"
          value={`${Math.round(dailyProgress * 100)}%`}
          hint={`${snap?.done ?? 0}/${snap?.total ?? 0} sessions`}
          icon={<CheckCircle2 size={14} />}
          trend={dailyProgress > 0.6 ? 4.2 : dailyProgress > 0.3 ? 1.1 : -0.5}
        />
        <Stat
          label="Study Hours"
          value={fmtHours(snap?.studyMinutes ?? 0)}
          hint={`Focus: ${fmtHours(snap?.focusMinutes ?? 0)}`}
          icon={<Clock size={14} />}
        />
        <Stat
          label="Current Streak"
          value={`${snap?.streak ?? 0} days`}
          hint="Keep the chain alive"
          icon={<Flame size={14} />}
          accent="#f97316"
        />
        <Stat
          label="Estimated Band"
          value={ovBand ? ovBand.toFixed(1) : "—"}
          hint="Average of 4 skills"
          icon={<Sparkles size={14} />}
          accent="rgb(167, 139, 250)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily ring */}
        <Card className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Productivity Score</CardTitle>
              <p className="mt-1 text-xs text-text-faint">Target: 6h focused study</p>
            </div>
            <Badge tone="accent">
              <Activity size={11} />
              {Math.round(productivity * 100)}%
            </Badge>
          </div>
          <div className="flex items-center justify-center pt-2">
            <ProgressRing
              value={productivity}
              size={172}
              stroke={12}
              label={
                <div className="flex flex-col items-center">
                  <span className="font-display text-3xl font-semibold text-text">
                    {Math.round(productivity * 100)}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-text-faint">
                    Score
                  </span>
                </div>
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <Mini label="Done" value={`${snap?.done ?? 0}`} />
            <Mini label="Mins" value={`${snap?.studyMinutes ?? 0}`} />
            <Mini label="Sessions" value={`${snap?.total ?? 0}`} />
          </div>
        </Card>

        {/* Upcoming */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Next Up</CardTitle>
              <p className="mt-1 text-xs text-text-faint">Based on your schedule</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRoute("timeline")}>
              Timeline <ArrowRight size={14} />
            </Button>
          </div>
          <div className="mt-4">
            {next ? (
              <motion.div
                key={next.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-border-subtle bg-surface-muted/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid size-10 place-items-center rounded-xl text-[18px]"
                      style={{
                        background: `${SKILL_COLOR[(next.category as keyof typeof SKILL_COLOR)] ?? "#5b85ff"}22`,
                      }}
                    >
                      {emojiFor(next.category)}
                    </div>
                    <div>
                      <div className="font-display text-[15px] font-semibold text-text">
                        {next.title}
                      </div>
                      <div className="text-xs text-text-muted">
                        {next.start_time}–{next.end_time} ·{" "}
                        {SKILL_LABEL[next.category as keyof typeof SKILL_LABEL] ?? cap(next.category)}
                      </div>
                    </div>
                  </div>
                  <Badge tone="accent">{next.block}</Badge>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border-subtle p-4 text-sm text-text-faint">
                <Coffee size={16} />
                {loading ? "Loading your day…" : "Nothing pending. Take a break or jump into Free Practice."}
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-faint">
              Today&apos;s flow
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 14 }).map((_, i) => {
                const s = snap?.sessions[i];
                const c = !s
                  ? "rgb(var(--surface-muted))"
                  : s.status === "completed"
                    ? "rgb(var(--accent))"
                    : s.category === "break"
                      ? "rgb(var(--border))"
                      : "rgb(var(--accent) / 0.35)";
                return (
                  <div
                    key={i}
                    title={s ? `${s.start_time} · ${s.title}` : ""}
                    className="h-7 rounded-md transition-all"
                    style={{ background: c }}
                  />
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Per-skill */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Skill bands</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setRoute("skills")}>
              All skills <ArrowRight size={14} />
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {snap?.targets.map((t) => {
              const pct = t.target_band > 0 ? t.current_band / t.target_band : 0;
              return (
                <div key={t.skill} className="rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: SKILL_COLOR[t.skill] }}
                      />
                      <span className="font-display text-[13px] font-semibold text-text">
                        {SKILL_LABEL[t.skill]}
                      </span>
                    </div>
                    <Badge tone="muted">target {t.target_band.toFixed(1)}</Badge>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="font-display text-2xl font-semibold text-text">
                        {t.current_band > 0 ? t.current_band.toFixed(1) : "—"}
                      </div>
                      <div className="text-[11px] text-text-faint">current band</div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <TrendingUp size={12} />
                      {(pct * 100).toFixed(0)}%
                    </div>
                  </div>
                  <ProgressBar
                    value={pct}
                    color={SKILL_COLOR[t.skill]}
                    className="mt-3"
                    height={6}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>XP momentum</CardTitle>
            <Badge tone="accent">
              <Sparkles size={11} /> {snap?.xp ?? 0} XP
            </Badge>
          </div>
          <p className="mt-1 text-xs text-text-faint">Last 14 sessions</p>
          <div className="mt-3">
            <Sparkline data={syntheticMomentum(snap?.xp ?? 0)} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-text-muted">Goal</span>
            <span className="font-display font-semibold text-text">
              Band {snap?.targets.find((t) => t.skill === "listening")?.target_band ?? 7}+
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full"
            onClick={() => setRoute("achievements")}
          >
            <Target size={14} /> Achievements
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-muted/60 p-2">
      <div className="font-display text-[15px] font-semibold text-text">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-text-faint">{label}</div>
    </div>
  );
}

function fmtHours(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function cap(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function emojiFor(cat: string): string {
  switch (cat) {
    case "listening": return "🎧";
    case "reading": return "📖";
    case "writing": return "✍️";
    case "speaking": return "🗣️";
    case "vocab": return "📚";
    case "review": return "🌀";
    case "reflection": return "🌙";
    case "break": return "☕";
    default: return "✨";
  }
}

function syntheticMomentum(xp: number): number[] {
  // Build a soft increasing curve seeded from xp so the spark chart feels alive even on day 1.
  const seed = (xp % 7) + 3;
  return Array.from({ length: 14 }, (_, i) => {
    const v = Math.sin((i + seed) * 0.6) * 4 + i * 0.7 + seed;
    return Math.max(1, v);
  });
}

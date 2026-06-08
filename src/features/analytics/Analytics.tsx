import { useEffect, useMemo, useState } from "react";
import { Activity, Brain, Flame, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Heatmap } from "@/components/charts/Heatmap";
import { BandLineChart } from "@/components/charts/BandLineChart";
import { WeeklyBars } from "@/components/charts/WeeklyBars";
import {
  focusMinutesBetween,
  listMocks,
  listSessionsBetween,
  listSkillTargets,
} from "@/lib/db/repositories";
import { lastNDays, format, thisWeekDays } from "@/lib/utils/time";
import { SKILL_COLOR, SKILL_LABEL, overallBand } from "@/lib/utils/ielts";
import type { Mock, Session, Skill, SkillTarget } from "@/types";

export function Analytics() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [targets, setTargets] = useState<SkillTarget[]>([]);
  const [focusMin, setFocusMin] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const days = lastNDays(120);
      const start = format(days[0]!, "yyyy-MM-dd");
      const end = format(days[days.length - 1]!, "yyyy-MM-dd");
      const [s, m, t, fm] = await Promise.all([
        listSessionsBetween(start, end),
        listMocks(),
        listSkillTargets(),
        focusMinutesBetween(start, end),
      ]);
      setSessions(s);
      setMocks(m);
      setTargets(t);
      setFocusMin(fm);
      setLoading(false);
    })();
  }, []);

  // Heatmap: completed non-break sessions per day
  const heatmapValues = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      if (s.status !== "completed" || s.category === "break") continue;
      map[s.date] = (map[s.date] ?? 0) + 1;
    }
    return map;
  }, [sessions]);

  // Weekly bars: minutes per day, this week
  const weekly = useMemo(() => {
    const days = thisWeekDays();
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const minutes = sessions
        .filter((s) => s.date === key && s.status === "completed" && s.category !== "break")
        .reduce((acc, s) => acc + s.duration_min, 0);
      return { day: format(d, "EEE"), minutes };
    });
  }, [sessions]);

  // Band over time: aggregate mocks by date for each skill (use 5-mock rolling avg)
  const bandSeries = useMemo(() => buildBandSeries(mocks), [mocks]);
  const ov = overallBand(targets);

  const totalStudied = sessions
    .filter((s) => s.status === "completed" && s.category !== "break")
    .reduce((a, s) => a + s.duration_min, 0);
  const consistencyDays = Object.keys(heatmapValues).length;
  const consistency = Math.min(1, consistencyDays / 90);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Where you are. Where you're going."
        description="Cinematic view of your progress, consistency, and band trajectory."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total study"
          value={`${(totalStudied / 60).toFixed(1)}h`}
          hint="last 120 days"
          icon={<Brain size={14} />}
        />
        <Stat
          label="Focus logged"
          value={`${(focusMin / 60).toFixed(1)}h`}
          hint="Pomodoro + deep"
          icon={<Activity size={14} />}
        />
        <Stat
          label="Consistency"
          value={`${Math.round(consistency * 100)}%`}
          hint={`${consistencyDays}/90 active days`}
          icon={<Flame size={14} />}
          accent="#f97316"
        />
        <Stat
          label="Predicted overall"
          value={ov ? ov.toFixed(1) : "—"}
          hint="rolling 5-mock avg"
          icon={<Target size={14} />}
          accent="rgb(167, 139, 250)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Skill bands · trajectory</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {(["listening", "reading", "writing", "speaking"] as Skill[]).map((k) => (
                <Legend key={k} skill={k} />
              ))}
            </div>
          </div>
          <div className="mt-3">
            {bandSeries.length === 0 ? (
              <div className="grid h-[260px] place-items-center text-sm text-text-faint">
                Log mocks in Skills to see your trajectory.
              </div>
            ) : (
              <BandLineChart data={bandSeries} />
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>This week</CardTitle>
          <p className="mt-1 text-xs text-text-faint">Minutes studied per day</p>
          <div className="mt-3">
            <WeeklyBars data={weekly} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Study heatmap</CardTitle>
            <p className="mt-1 text-xs text-text-faint">
              {loading ? "Loading…" : `${consistencyDays} active days in the last ~4 months`}
            </p>
          </div>
          <Badge tone="accent">Last 16 weeks</Badge>
        </div>
        <div className="mt-4 overflow-x-auto pb-1 scroll-y">
          <Heatmap values={heatmapValues} weeks={16} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Completion analytics</CardTitle>
          <div className="mt-4 space-y-3">
            {(["listening", "reading", "writing", "speaking", "vocab"] as const).map((c) => {
              const total = sessions.filter((s) => s.category === c).length;
              const done = sessions.filter((s) => s.category === c && s.status === "completed").length;
              const pct = total ? done / total : 0;
              return (
                <div key={c}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="text-text-muted">{cap(c)}</span>
                    <span className="text-text-faint">
                      {done}/{total} · {Math.round(pct * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct * 100}%`,
                        background:
                          SKILL_COLOR[c as keyof typeof SKILL_COLOR] ?? "rgb(var(--accent))",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardTitle>Monthly summary</CardTitle>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {buildMonthlyBuckets(sessions).map((b) => (
              <div
                key={b.label}
                className="rounded-xl border border-border-subtle bg-surface-muted/40 p-3"
              >
                <div className="text-[11px] uppercase tracking-wider text-text-faint">
                  {b.label}
                </div>
                <div className="mt-1 font-display text-xl font-semibold text-text">
                  {(b.minutes / 60).toFixed(1)}h
                </div>
                <div className="mt-0.5 text-[11px] text-text-muted">{b.completed} sessions</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Legend({ skill }: { skill: Skill }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
      <span className="size-2 rounded-full" style={{ background: SKILL_COLOR[skill] }} />
      {SKILL_LABEL[skill]}
    </span>
  );
}

function buildBandSeries(mocks: Mock[]) {
  if (mocks.length === 0) return [] as Array<{ date: string } & Partial<Record<Skill, number>>>;
  const sorted = [...mocks].sort((a, b) => a.date.localeCompare(b.date));
  const dateSet = Array.from(new Set(sorted.map((m) => m.date)));
  return dateSet.map((date) => {
    const point: { date: string } & Partial<Record<Skill, number>> = { date: date.slice(5) };
    (["listening", "reading", "writing", "speaking"] as Skill[]).forEach((k) => {
      const series = sorted.filter((m) => m.skill === k && m.date <= date);
      if (series.length === 0) return;
      const last5 = series.slice(-5);
      const avg = last5.reduce((s, m) => s + m.band, 0) / last5.length;
      point[k] = Math.round(avg * 10) / 10;
    });
    return point;
  });
}

function buildMonthlyBuckets(sessions: Session[]) {
  const out: Record<string, { minutes: number; completed: number }> = {};
  for (const s of sessions) {
    if (s.status !== "completed" || s.category === "break") continue;
    const key = s.date.slice(0, 7);
    out[key] ||= { minutes: 0, completed: 0 };
    out[key].minutes += s.duration_min;
    out[key].completed += 1;
  }
  return Object.entries(out)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-3)
    .map(([k, v]) => ({ label: k, ...v }));
}

function cap(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { listSessionsBetween } from "@/lib/db/repositories";
import {
  format,
  monthLabel,
  startOfMonth,
  endOfMonth,
  daysInMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from "@/lib/utils/time";
import type { Session } from "@/types";
import { cn } from "@/lib/utils/cn";

export function Calendar() {
  const [cursor, setCursor] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    (async () => {
      const days = daysInMonth(cursor);
      const start = format(days[0]!, "yyyy-MM-dd");
      const end = format(days[days.length - 1]!, "yyyy-MM-dd");
      setSessions(await listSessionsBetween(start, end));
    })();
  }, [cursor]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);

  const byDate = useMemo(() => {
    const map: Record<string, { total: number; done: number; minutes: number }> = {};
    for (const s of sessions) {
      if (s.category === "break") continue;
      map[s.date] ||= { total: 0, done: 0, minutes: 0 };
      map[s.date].total++;
      if (s.status === "completed") {
        map[s.date].done++;
        map[s.date].minutes += s.duration_min;
      }
    }
    return map;
  }, [sessions]);

  const completedDays = Object.values(byDate).filter((d) => d.done > 0).length;
  const totalMinutes = Object.values(byDate).reduce((a, d) => a + d.minutes, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendar"
        title="Your study month at a glance"
        description="See completed days, gaps, and your study streak."
        actions={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setCursor((d) => addDays(startOfMonth(d), -1))}>
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCursor((d) => addDays(endOfMonth(d), 1))}>
              Next <ChevronRight size={14} />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Active days" value={`${completedDays}`} hint="this month" icon={<CalendarDays size={14} />} />
        <Stat label="Study minutes" value={`${totalMinutes}`} hint="completed sessions" icon={<Flame size={14} />} accent="#f97316" />
        <Stat label="Completion rate" value={`${monthlyCompletion(byDate)}%`} hint="sessions done vs scheduled" />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>{monthLabel(cursor)}</CardTitle>
          <Badge tone="accent">{format(cursor, "yyyy")}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-text-faint">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-1">{d}</div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            const key = format(d.date, "yyyy-MM-dd");
            const meta = byDate[key];
            const inMonth = d.inMonth;
            const isToday = format(new Date(), "yyyy-MM-dd") === key;
            const ratio = meta && meta.total > 0 ? meta.done / meta.total : 0;
            return (
              <div
                key={i}
                className={cn(
                  "relative h-20 rounded-lg border bg-surface-muted/40 p-2 text-[12px]",
                  inMonth ? "border-border-subtle" : "border-transparent opacity-40",
                  isToday && "ring-2 ring-accent/50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text">{format(d.date, "d")}</span>
                  {meta && meta.done > 0 && (
                    <span
                      className="size-2 rounded-full"
                      style={{ background: "rgb(var(--accent))" }}
                    />
                  )}
                </div>
                {meta && meta.total > 0 && (
                  <div className="absolute inset-x-2 bottom-2">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${ratio * 100}%`, background: "rgb(var(--accent))" }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-text-faint">
                      <span>{meta.done}/{meta.total}</span>
                      <span>{meta.minutes}m</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function buildMonthGrid(cursor: Date): Array<{ date: Date; inMonth: boolean }> {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Array<{ date: Date; inMonth: boolean }> = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    days.push({ date: cur, inMonth: cur.getMonth() === cursor.getMonth() });
    cur = addDays(cur, 1);
  }
  return days;
}

function monthlyCompletion(map: Record<string, { total: number; done: number }>) {
  let total = 0;
  let done = 0;
  for (const v of Object.values(map)) {
    total += v.total;
    done += v.done;
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

import { useCallback, useEffect, useState } from "react";
import {
  dailyCompletion,
  ensureDaySessions,
  focusMinutesBetween,
  listSessions,
  listSkillTargets,
  studyDates,
  totalXp,
} from "@/lib/db/repositories";
import { useToday } from "./useToday";
import type { Session, SkillTarget } from "@/types";

export interface DailySnapshot {
  sessions: Session[];
  done: number;
  total: number;
  studyMinutes: number;
  focusMinutes: number;
  streak: number;
  xp: number;
  targets: SkillTarget[];
}

function streakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 400; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function useDailyData() {
  const today = useToday();
  const [snap, setSnap] = useState<DailySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const sessions = await ensureDaySessions(today);
      const [completion, dates, xp, focus, targets] = await Promise.all([
        dailyCompletion(today),
        studyDates(),
        totalXp(),
        focusMinutesBetween(today, today),
        listSkillTargets(),
      ]);
      setSnap({
        sessions,
        done: completion.done,
        total: completion.total,
        studyMinutes: completion.studyMinutes,
        focusMinutes: focus,
        streak: streakFromDates(dates),
        xp,
        targets,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { snap, loading, error, refresh, today };
}

export async function listSessionsForDate(date: string): Promise<Session[]> {
  return listSessions(date);
}

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Flame,
  Trophy,
  Target,
  BookOpen,
  Brain,
  Crown,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  listAchievements,
  listMocks,
  listNotes,
  listSessionsBetween,
  listSkillTargets,
  totalXp,
  unlockAchievement,
} from "@/lib/db/repositories";
import type { Achievement, Mock, Note, Session, SkillTarget } from "@/types";
import { overallBand } from "@/lib/utils/ielts";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
  target: Target,
  "book-open": BookOpen,
  brain: Brain,
  crown: Crown,
};

export function Achievements() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [xp, setXp] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [targets, setTargets] = useState<SkillTarget[]>([]);

  async function loadAll() {
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date();
    start.setDate(start.getDate() - 365);
    const startKey = start.toISOString().slice(0, 10);
    const [a, x, s, m, n, t] = await Promise.all([
      listAchievements(),
      totalXp(),
      listSessionsBetween(startKey, today),
      listMocks(),
      listNotes(),
      listSkillTargets(),
    ]);
    setItems(a);
    setXp(x);
    setSessions(s);
    setMocks(m);
    setNotes(n);
    setTargets(t);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const stats = useMemo(() => {
    const completedSessions = sessions.filter(
      (s) => s.status === "completed" && s.category !== "break",
    ).length;
    const streak = streakFromSessions(sessions);
    const totalMocks = mocks.length;
    const vocabCount = notes.filter((n) => n.kind === "vocab").length;
    const focusMinutes = sessions
      .filter((s) => s.status === "completed" && s.category !== "break")
      .reduce((a, s) => a + s.duration_min, 0);
    const ov = overallBand(targets);
    return {
      completedSessions,
      streak,
      totalMocks,
      vocabCount,
      focusHours: focusMinutes / 60,
      overall: ov,
    };
  }, [sessions, mocks, notes, targets]);

  const progress: Record<string, { value: number; goal: number }> = {
    first_session: { value: Math.min(stats.completedSessions, 1), goal: 1 },
    streak_3: { value: Math.min(stats.streak, 3), goal: 3 },
    streak_7: { value: Math.min(stats.streak, 7), goal: 7 },
    streak_30: { value: Math.min(stats.streak, 30), goal: 30 },
    mock_10: { value: Math.min(stats.totalMocks, 10), goal: 10 },
    vocab_100: { value: Math.min(stats.vocabCount, 100), goal: 100 },
    focus_50h: { value: Math.min(stats.focusHours, 50), goal: 50 },
    band_7: { value: Math.min(stats.overall, 7), goal: 7 },
  };

  // Auto-unlock when crossing thresholds
  useEffect(() => {
    (async () => {
      let changed = false;
      for (const a of items) {
        const p = progress[a.code];
        if (!p) continue;
        if (!a.unlocked_at && p.value >= p.goal) {
          await unlockAchievement(a.code);
          changed = true;
        }
      }
      if (changed) loadAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, stats.completedSessions, stats.streak, stats.totalMocks, stats.vocabCount, stats.focusHours, stats.overall]);

  const unlocked = items.filter((a) => a.unlocked_at).length;
  const level = Math.floor(xp / 200) + 1;
  const levelProgress = (xp % 200) / 200;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gamification"
        title="Achievements & Levels"
        description="XP, badges and milestones to keep your daily momentum going."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="XP"
          value={`${xp}`}
          hint={`Level ${level}`}
          icon={<Sparkles size={14} />}
          accent="rgb(167, 139, 250)"
        />
        <Stat
          label="Achievements"
          value={`${unlocked}/${items.length}`}
          hint="unlocked"
          icon={<Trophy size={14} />}
          accent="#f59e0b"
        />
        <Stat
          label="Current streak"
          value={`${stats.streak} days`}
          hint="keep it alive"
          icon={<Flame size={14} />}
          accent="#f97316"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Level progress</CardTitle>
            <p className="mt-1 text-xs text-text-faint">Earn 20 XP per completed session.</p>
          </div>
          <Badge tone="accent">Level {level}</Badge>
        </div>
        <ProgressBar className="mt-3" value={levelProgress} />
        <div className="mt-1 text-right text-[11px] text-text-faint">
          {xp % 200}/200 XP to level {level + 1}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((a, i) => {
          const p = progress[a.code] ?? { value: 0, goal: 1 };
          const unlocked = Boolean(a.unlocked_at);
          const Icon = ICONS[a.icon] ?? Trophy;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className={cn(
                "card relative p-5 transition-shadow hover:shadow-elevated",
                unlocked && "ring-1 ring-accent/40",
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "grid size-11 place-items-center rounded-xl",
                    unlocked
                      ? "bg-accent/15 text-accent shadow-glow"
                      : "bg-surface-muted text-text-faint",
                  )}
                >
                  {unlocked ? <Icon size={18} /> : <Lock size={16} />}
                </div>
                <Badge tone={unlocked ? "success" : "muted"}>
                  {unlocked ? "Unlocked" : "Locked"}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="font-display text-[15px] font-semibold text-text">
                  {a.title}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
                  {a.description}
                </p>
              </div>
              <div className="mt-3">
                <ProgressBar value={p.goal > 0 ? p.value / p.goal : 0} height={6} />
                <div className="mt-1 flex justify-between text-[11px] text-text-faint">
                  <span>
                    {format(p.value)}
                    {a.code === "focus_50h" ? "h" : ""}
                  </span>
                  <span>
                    {format(p.goal)}
                    {a.code === "focus_50h" ? "h" : ""}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function streakFromSessions(sessions: Session[]): number {
  const dates = Array.from(
    new Set(
      sessions
        .filter((s) => s.status === "completed" && s.category !== "break")
        .map((s) => s.date),
    ),
  );
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

function format(n: number) {
  if (n >= 10) return Math.round(n).toString();
  return n.toFixed(1).replace(/\.0$/, "");
}

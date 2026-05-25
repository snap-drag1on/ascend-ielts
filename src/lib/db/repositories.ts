import { exec, query, queryOne } from "@/lib/db";
import type {
  Achievement,
  FocusSession,
  Mock,
  Note,
  NoteKind,
  Reflection,
  ScheduleTemplate,
  Session,
  SessionStatus,
  Skill,
  SkillTarget,
  XpEntry,
} from "@/types";
import { todayKey } from "@/lib/utils/time";

// ──────────────────────────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>(
    "SELECT value FROM settings WHERE key = $1",
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await exec(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ──────────────────────────────────────────────────────────────────────────────
// Schedule template
// ──────────────────────────────────────────────────────────────────────────────

export async function listScheduleTemplate(): Promise<ScheduleTemplate[]> {
  return query<ScheduleTemplate>(
    "SELECT * FROM schedule_template ORDER BY sort_order ASC, start_time ASC",
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sessions
// ──────────────────────────────────────────────────────────────────────────────

export async function listSessions(date: string): Promise<Session[]> {
  return query<Session>(
    "SELECT * FROM sessions WHERE date = $1 ORDER BY start_time ASC",
    [date],
  );
}

export async function listSessionsBetween(start: string, end: string): Promise<Session[]> {
  return query<Session>(
    "SELECT * FROM sessions WHERE date >= $1 AND date <= $2 ORDER BY date ASC, start_time ASC",
    [start, end],
  );
}

export async function ensureDaySessions(date: string): Promise<Session[]> {
  const existing = await listSessions(date);
  if (existing.length > 0) return existing;

  const tmpls = await listScheduleTemplate();
  for (const t of tmpls) {
    const [sh, sm] = t.start_time.split(":").map(Number);
    const [eh, em] = t.end_time.split(":").map(Number);
    const duration = eh * 60 + em - (sh * 60 + sm);
    await exec(
      `INSERT INTO sessions (date, template_id, start_time, end_time, title, category, block, duration_min)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [date, t.id, t.start_time, t.end_time, t.title, t.category, t.block, duration],
    );
  }
  return listSessions(date);
}

export async function setSessionStatus(id: number, status: SessionStatus): Promise<void> {
  const completedAt = status === "completed" ? new Date().toISOString() : null;
  await exec(
    "UPDATE sessions SET status = $1, completed_at = $2 WHERE id = $3",
    [status, completedAt, id],
  );
}

export async function updateSessionNotes(id: number, notes: string): Promise<void> {
  await exec("UPDATE sessions SET notes = $1 WHERE id = $2", [notes, id]);
}

export async function dailyCompletion(date: string): Promise<{
  total: number;
  done: number;
  studyMinutes: number;
}> {
  const total = await queryOne<{ c: number }>(
    "SELECT COUNT(*) as c FROM sessions WHERE date = $1 AND category != 'break'",
    [date],
  );
  const done = await queryOne<{ c: number; m: number | null }>(
    `SELECT COUNT(*) as c, COALESCE(SUM(duration_min), 0) as m
       FROM sessions WHERE date = $1 AND status = 'completed' AND category != 'break'`,
    [date],
  );
  return {
    total: total?.c ?? 0,
    done: done?.c ?? 0,
    studyMinutes: done?.m ?? 0,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────────────────────

export interface NewMock {
  date: string;
  skill: Skill;
  band: number;
  correct?: number | null;
  total?: number | null;
  duration_min?: number | null;
  source?: string | null;
  notes?: string | null;
}

export async function addMock(m: NewMock): Promise<void> {
  await exec(
    `INSERT INTO mocks (date, skill, band, correct, total, duration_min, source, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      m.date,
      m.skill,
      m.band,
      m.correct ?? null,
      m.total ?? null,
      m.duration_min ?? null,
      m.source ?? null,
      m.notes ?? null,
    ],
  );
}

export async function listMocks(skill?: Skill): Promise<Mock[]> {
  if (skill) {
    return query<Mock>(
      "SELECT * FROM mocks WHERE skill = $1 ORDER BY date ASC, id ASC",
      [skill],
    );
  }
  return query<Mock>("SELECT * FROM mocks ORDER BY date ASC, id ASC");
}

export async function deleteMock(id: number): Promise<void> {
  await exec("DELETE FROM mocks WHERE id = $1", [id]);
}

// ──────────────────────────────────────────────────────────────────────────────
// Notes
// ──────────────────────────────────────────────────────────────────────────────

export interface NewNote {
  kind: NoteKind;
  title: string;
  body?: string;
  tags?: string;
  skill?: Skill | null;
}

export async function listNotes(kind?: NoteKind): Promise<Note[]> {
  if (kind) {
    return query<Note>(
      "SELECT * FROM notes WHERE kind = $1 ORDER BY updated_at DESC",
      [kind],
    );
  }
  return query<Note>("SELECT * FROM notes ORDER BY updated_at DESC");
}

export async function addNote(n: NewNote): Promise<void> {
  await exec(
    `INSERT INTO notes (kind, title, body, tags, skill)
     VALUES ($1, $2, $3, $4, $5)`,
    [n.kind, n.title, n.body ?? "", n.tags ?? "", n.skill ?? null],
  );
}

export async function updateNote(
  id: number,
  patch: Partial<Pick<Note, "title" | "body" | "tags" | "skill" | "kind">>,
): Promise<void> {
  const fields: string[] = [];
  const args: unknown[] = [];
  let i = 1;
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = $${i++}`);
    args.push(v);
  }
  fields.push(`updated_at = datetime('now')`);
  args.push(id);
  await exec(`UPDATE notes SET ${fields.join(", ")} WHERE id = $${i}`, args);
}

export async function deleteNote(id: number): Promise<void> {
  await exec("DELETE FROM notes WHERE id = $1", [id]);
}

// ──────────────────────────────────────────────────────────────────────────────
// Focus
// ──────────────────────────────────────────────────────────────────────────────

export async function logFocusSession(s: {
  duration_min: number;
  mode: "pomodoro" | "deep";
  category?: string | null;
  completed: boolean;
}): Promise<void> {
  const now = new Date().toISOString();
  await exec(
    `INSERT INTO focus_sessions (date, started_at, ended_at, duration_min, mode, category, completed)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      todayKey(),
      now,
      now,
      s.duration_min,
      s.mode,
      s.category ?? null,
      s.completed ? 1 : 0,
    ],
  );
}

export async function listFocusForDate(date: string): Promise<FocusSession[]> {
  return query<FocusSession>(
    "SELECT * FROM focus_sessions WHERE date = $1 ORDER BY started_at ASC",
    [date],
  );
}

export async function focusMinutesBetween(start: string, end: string): Promise<number> {
  const row = await queryOne<{ m: number | null }>(
    `SELECT COALESCE(SUM(duration_min), 0) AS m
       FROM focus_sessions WHERE date >= $1 AND date <= $2 AND completed = 1`,
    [start, end],
  );
  return row?.m ?? 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// Reflections
// ──────────────────────────────────────────────────────────────────────────────

export async function upsertReflection(r: Omit<Reflection, "id" | "created_at">): Promise<void> {
  await exec(
    `INSERT INTO reflections (date, mood, energy, wins, struggles, tomorrow)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(date) DO UPDATE SET
       mood = excluded.mood,
       energy = excluded.energy,
       wins = excluded.wins,
       struggles = excluded.struggles,
       tomorrow = excluded.tomorrow`,
    [r.date, r.mood, r.energy, r.wins, r.struggles, r.tomorrow],
  );
}

export async function getReflection(date: string): Promise<Reflection | null> {
  return queryOne<Reflection>("SELECT * FROM reflections WHERE date = $1", [date]);
}

// ──────────────────────────────────────────────────────────────────────────────
// Skill targets
// ──────────────────────────────────────────────────────────────────────────────

export async function listSkillTargets(): Promise<SkillTarget[]> {
  return query<SkillTarget>("SELECT * FROM skill_targets");
}

export async function setSkillBand(skill: Skill, current_band: number): Promise<void> {
  await exec(
    `UPDATE skill_targets SET current_band = $1, updated_at = datetime('now') WHERE skill = $2`,
    [current_band, skill],
  );
}

export async function setSkillTarget(skill: Skill, target_band: number): Promise<void> {
  await exec(
    `UPDATE skill_targets SET target_band = $1, updated_at = datetime('now') WHERE skill = $2`,
    [target_band, skill],
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Achievements & XP
// ──────────────────────────────────────────────────────────────────────────────

export async function listAchievements(): Promise<Achievement[]> {
  return query<Achievement>("SELECT * FROM achievements ORDER BY id ASC");
}

export async function unlockAchievement(code: string): Promise<void> {
  await exec(
    `UPDATE achievements SET unlocked_at = datetime('now')
     WHERE code = $1 AND unlocked_at IS NULL`,
    [code],
  );
}

export async function addXp(amount: number, reason: string): Promise<void> {
  await exec("INSERT INTO xp_log (date, amount, reason) VALUES ($1, $2, $3)", [
    todayKey(),
    amount,
    reason,
  ]);
}

export async function totalXp(): Promise<number> {
  const row = await queryOne<{ x: number | null }>(
    "SELECT COALESCE(SUM(amount), 0) AS x FROM xp_log",
  );
  return row?.x ?? 0;
}

export async function xpHistory(days: number): Promise<XpEntry[]> {
  return query<XpEntry>(
    "SELECT * FROM xp_log WHERE date >= date('now', $1) ORDER BY date ASC",
    [`-${days} days`],
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Streak
// ──────────────────────────────────────────────────────────────────────────────

export async function studyDates(limit = 365): Promise<string[]> {
  const rows = await query<{ date: string }>(
    `SELECT DISTINCT date FROM sessions
     WHERE status = 'completed' AND category != 'break'
     ORDER BY date DESC LIMIT $1`,
    [limit],
  );
  return rows.map((r) => r.date);
}

export async function currentStreak(): Promise<number> {
  const dates = await studyDates();
  if (dates.length === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  const set = new Set(dates);
  for (let i = 0; i < 400; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // allow today to be missing (still early in the day)
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

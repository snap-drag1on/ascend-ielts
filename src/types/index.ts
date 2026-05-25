export type Skill = "listening" | "reading" | "writing" | "speaking";

export type SessionStatus = "pending" | "completed" | "skipped" | "delayed";

export type TimelineBlock = "morning" | "midday" | "afternoon" | "evening";

export type Category =
  | "listening"
  | "reading"
  | "writing"
  | "speaking"
  | "vocab"
  | "break"
  | "review"
  | "reflection";

export interface ScheduleTemplate {
  id: number;
  start_time: string;
  end_time: string;
  title: string;
  category: Category;
  block: TimelineBlock;
  emoji?: string | null;
  sort_order: number;
}

export interface Session {
  id: number;
  date: string;
  template_id: number | null;
  start_time: string;
  end_time: string;
  title: string;
  category: Category;
  block: TimelineBlock;
  status: SessionStatus;
  notes: string | null;
  completed_at: string | null;
  duration_min: number;
  created_at: string;
}

export interface Mock {
  id: number;
  date: string;
  skill: Skill;
  band: number;
  correct: number | null;
  total: number | null;
  duration_min: number | null;
  source: string | null;
  notes: string | null;
  created_at: string;
}

export type NoteKind = "vocab" | "grammar" | "mistake" | "reflection" | "idea";

export interface Note {
  id: number;
  kind: NoteKind;
  skill: Skill | null;
  title: string;
  body: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: number;
  date: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number;
  mode: "pomodoro" | "deep";
  category: string | null;
  completed: 0 | 1;
}

export interface Reflection {
  id: number;
  date: string;
  mood: number | null;
  energy: number | null;
  wins: string | null;
  struggles: string | null;
  tomorrow: string | null;
  created_at: string;
}

export interface SkillTarget {
  skill: Skill;
  target_band: number;
  current_band: number;
  updated_at: string;
}

export interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
}

export interface XpEntry {
  id: number;
  date: string;
  amount: number;
  reason: string;
}

export interface SettingsRow {
  key: string;
  value: string;
}

export type Route =
  | "dashboard"
  | "timeline"
  | "analytics"
  | "skills"
  | "focus"
  | "notes"
  | "calendar"
  | "achievements"
  | "settings";

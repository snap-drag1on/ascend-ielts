-- ASCEND base schema
-- All data is stored locally. No network calls.

PRAGMA foreign_keys = ON;

-- App key/value settings (theme, accent, font scale, prefs)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- The schedule template (recurring daily plan). Sessions are concrete instances on a day.
CREATE TABLE IF NOT EXISTS schedule_template (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time   TEXT NOT NULL,   -- "HH:MM"
  end_time     TEXT NOT NULL,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,   -- listening | reading | writing | speaking | vocab | break | review | reflection
  block        TEXT NOT NULL,   -- morning | midday | afternoon | evening
  emoji        TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- Concrete day sessions (generated from template per date)
CREATE TABLE IF NOT EXISTS sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,            -- "YYYY-MM-DD"
  template_id  INTEGER REFERENCES schedule_template(id) ON DELETE SET NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  block        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',   -- pending | completed | skipped | delayed
  notes        TEXT,
  completed_at TEXT,
  duration_min INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_category ON sessions(category);

-- IELTS mocks (Listening / Reading)
CREATE TABLE IF NOT EXISTS mocks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT NOT NULL,
  skill       TEXT NOT NULL,             -- listening | reading | writing | speaking
  band        REAL NOT NULL,             -- e.g. 6.5
  correct     INTEGER,
  total       INTEGER,
  duration_min INTEGER,
  source      TEXT,                      -- e.g. "Cambridge 17 Test 2"
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mocks_skill ON mocks(skill);
CREATE INDEX IF NOT EXISTS idx_mocks_date ON mocks(date);

-- Notes (vocab, grammar, mistakes journal)
CREATE TABLE IF NOT EXISTS notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kind       TEXT NOT NULL,              -- vocab | grammar | mistake | reflection | idea
  skill      TEXT,                       -- optional skill tag
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  tags       TEXT NOT NULL DEFAULT '',   -- comma separated
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_kind ON notes(kind);
CREATE INDEX IF NOT EXISTS idx_notes_skill ON notes(skill);

-- Focus timer sessions (pomodoros)
CREATE TABLE IF NOT EXISTS focus_sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  date         TEXT NOT NULL,
  started_at   TEXT NOT NULL,
  ended_at     TEXT,
  duration_min INTEGER NOT NULL,
  mode         TEXT NOT NULL DEFAULT 'pomodoro', -- pomodoro | deep
  category     TEXT,                              -- optional skill / task category
  completed    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_focus_date ON focus_sessions(date);

-- Daily reflection
CREATE TABLE IF NOT EXISTS reflections (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL UNIQUE,
  mood       INTEGER,                   -- 1..5
  energy     INTEGER,                   -- 1..5
  wins       TEXT,
  struggles  TEXT,
  tomorrow   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Skill targets and current bands
CREATE TABLE IF NOT EXISTS skill_targets (
  skill         TEXT PRIMARY KEY,        -- listening | reading | writing | speaking
  target_band   REAL NOT NULL,
  current_band  REAL NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Achievements / gamification
CREATE TABLE IF NOT EXISTS achievements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  unlocked_at TEXT
);

-- XP / streak running totals
CREATE TABLE IF NOT EXISTS xp_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xp_date ON xp_log(date);

-- Seed default schedule + targets + achievements (idempotent — only inserts when empty)
INSERT INTO schedule_template (start_time, end_time, title, category, block, emoji, sort_order)
SELECT * FROM (
  SELECT '08:00','08:45','Listening Mock 1','listening','morning','🎧',1 UNION ALL
  SELECT '08:45','09:05','Listening Analysis','listening','morning','🔍',2 UNION ALL
  SELECT '09:05','09:20','Short Break','break','morning','☕',3 UNION ALL
  SELECT '09:20','10:00','Listening Mock 2','listening','morning','🎧',4 UNION ALL
  SELECT '10:00','10:30','Listening Analysis','listening','morning','🔍',5 UNION ALL
  SELECT '10:30','11:00','Rest Break','break','morning','🛋️',6 UNION ALL
  SELECT '11:00','12:30','Daily Dictation','listening','midday','✍️',7 UNION ALL
  SELECT '12:30','13:00','Long Break','break','midday','🍽️',8 UNION ALL
  SELECT '13:00','14:00','Reading Mock','reading','midday','📖',9 UNION ALL
  SELECT '14:00','14:30','Reading Analysis','reading','midday','🔍',10 UNION ALL
  SELECT '14:30','15:00','Rest Break','break','midday','🛋️',11 UNION ALL
  SELECT '15:00','16:00','Writing Task','writing','afternoon','✍️',12 UNION ALL
  SELECT '16:00','16:30','Writing Feedback & Correction','writing','afternoon','🔧',13 UNION ALL
  SELECT '16:30','17:00','Break','break','afternoon','☕',14 UNION ALL
  SELECT '17:00','18:00','Vocabulary Study','vocab','evening','📚',15 UNION ALL
  SELECT '18:00','19:00','Speaking Practice','speaking','evening','🗣️',16 UNION ALL
  SELECT '19:00','21:00','Free Practice / Review','review','evening','🌀',17 UNION ALL
  SELECT '21:00','21:30','Daily Reflection','reflection','evening','🌙',18
) WHERE NOT EXISTS (SELECT 1 FROM schedule_template);

INSERT INTO skill_targets (skill, target_band, current_band) VALUES
  ('listening', 8.0, 6.5),
  ('reading',   7.0, 6.0),
  ('writing',   6.5, 5.5),
  ('speaking',  6.0, 5.5)
ON CONFLICT(skill) DO NOTHING;

INSERT INTO achievements (code, title, description, icon) VALUES
  ('first_session', 'First Step', 'Complete your first study session.', 'sparkles'),
  ('streak_3',      'On a Roll', 'Maintain a 3-day study streak.', 'flame'),
  ('streak_7',      'Week Warrior', 'Maintain a 7-day study streak.', 'flame'),
  ('streak_30',     'Marathoner', 'Maintain a 30-day study streak.', 'trophy'),
  ('mock_10',       'Mock Master', 'Complete 10 IELTS mocks.', 'target'),
  ('vocab_100',     'Wordsmith', 'Save 100 vocabulary notes.', 'book-open'),
  ('focus_50h',     'Deep Worker', 'Log 50 hours of focused study.', 'brain'),
  ('band_7',        'Band 7 Vibes', 'Reach an estimated overall band of 7.0.', 'crown')
ON CONFLICT(code) DO NOTHING;

INSERT INTO settings (key, value) VALUES
  ('theme', 'dark'),
  ('accent', 'indigo'),
  ('font_scale', '1'),
  ('onboarded', '0')
ON CONFLICT(key) DO NOTHING;

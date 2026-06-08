<div align="center">

# ASCEND

**A premium, native-feeling macOS productivity OS for IELTS preparation.**

Tauri · React · TypeScript · TailwindCSS · Framer Motion · SQLite · Recharts

100% offline · no paid APIs · no telemetry · all data lives on your Mac.

</div>

---

## Why ASCEND

ASCEND is a 3-month IELTS preparation operating system, designed to feel like a first-party macOS app:

- 🎯 **Dashboard** — daily progress, current streak, IELTS band estimate, productivity score.
- 🗓️ **Daily Timeline** — your real 08:00 → 21:00 plan, with completion tracking and per-session notes.
- 📈 **Analytics** — band trajectory line chart, study heatmap, weekly bars, monthly buckets, predictive overall band.
- 🎧 **Skill Tracker** — log mocks, surface weak points, track Listening / Reading / Writing / Speaking separately.
- ⏱️ **Focus** — Pomodoro & Deep Focus timers, daily reflection journal, daily motivation.
- 📒 **Notes** — vocabulary bank, grammar references, mistake journal — searchable, tagged.
- 📅 **Calendar** — completed days, gaps, streak visuals at a glance.
- 🏆 **Gamification** — XP, levels, achievement badges that auto-unlock as you progress.
- 🌗 **Settings** — light/dark theme, 6 accent colors, font scaling, local backup/restore.
- ⌘K **Command Palette** — Linear-style command palette with keyboard shortcuts.

Designed for M1 Air: GPU-accelerated transitions, minimal memory footprint, no background polling, no network calls.

---

## Stack

| Layer        | Tech                                                            |
| ------------ | --------------------------------------------------------------- |
| Shell        | [Tauri 2](https://v2.tauri.app/) (Rust + WebView2 / WKWebView)  |
| Frontend     | React 18 + TypeScript + Vite 6                                  |
| UI / styling | TailwindCSS, custom CSS variables, glassmorphism, `font-display`|
| Animation    | Framer Motion                                                   |
| Charts       | Recharts                                                        |
| State        | Zustand                                                         |
| Storage      | SQLite via `tauri-plugin-sql` (auto-migrations)                 |

---

## Requirements

### macOS (target platform)

- **macOS 11+** (Big Sur or later, Apple Silicon natively supported)
- **Xcode Command Line Tools**: `xcode-select --install`
- **Rust** (stable): `curl https://sh.rustup.rs -sSf | sh`
- **Node 18+**: install via [Volta](https://volta.sh/), `nvm`, or [Homebrew](https://brew.sh/)
- **pnpm 9+**: `npm i -g pnpm`

### Linux / Windows (development only)

Tauri also supports Linux and Windows targets. Follow the
[Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/) for your OS.

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/snap-drag1on/ascend-ielts.git
cd ascend-ielts

# 2. Install JS deps
pnpm install

# 3. Run in dev mode (opens a native window with hot reload)
pnpm tauri dev
```

The first `tauri dev` run will compile the Rust shell — give it a couple of minutes.
Subsequent runs are fast.

---

## Build the .dmg installer

```bash
# Universal-ish build (Apple Silicon by default — see below for Intel)
pnpm tauri build
```

The signed `.app` and `.dmg` will appear in:

```
src-tauri/target/release/bundle/macos/ASCEND.app
src-tauri/target/release/bundle/dmg/ASCEND_0.1.0_aarch64.dmg
```

### Apple-Silicon-only build (M1/M2/M3) — fastest, smallest

```bash
pnpm tauri build -- --target aarch64-apple-darwin
```

### Intel build

```bash
rustup target add x86_64-apple-darwin
pnpm tauri build -- --target x86_64-apple-darwin
```

### Universal (Intel + Apple Silicon) build

```bash
rustup target add x86_64-apple-darwin aarch64-apple-darwin
pnpm tauri build -- --target universal-apple-darwin
```

### Optional: code signing & notarization

For distribution outside your own machine, set up Apple Developer signing as per
[Tauri signing docs](https://v2.tauri.app/distribute/sign/macos/). Without signing,
Gatekeeper will warn the first time you open the `.dmg` — `right-click → Open` once
to bypass.

---

## Where is my data?

ASCEND stores everything in a single local SQLite file:

```
~/Library/Application Support/com.snapdrag1on.ascend/ascend.db
```

You can back up, copy, or move this file freely. The Settings page also has
**Export Backup** (writes a JSON) and **Import Backup** actions.

**Nothing is ever sent over the network.** ASCEND makes no HTTP requests.

---

## Project structure

```
ascend-ielts/
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── README.md
│
├── src/                          ← React frontend
│   ├── main.tsx                  ← entry
│   ├── App.tsx                   ← route switcher + boot
│   ├── styles/global.css         ← Tailwind + design tokens
│   ├── types/                    ← shared TS types
│   ├── components/
│   │   ├── layout/               ← AppShell, Titlebar, Sidebar, CommandPalette, PageHeader
│   │   ├── ui/                   ← Card, Button, Badge, Modal, ProgressRing, Stat, …
│   │   └── charts/               ← Sparkline, Heatmap, BandLineChart, WeeklyBars
│   ├── features/
│   │   ├── dashboard/            ← Daily snapshot + KPIs
│   │   ├── timeline/             ← Visual daily timeline w/ status & notes
│   │   ├── analytics/            ← Heatmap, line chart, weekly bars, monthly buckets
│   │   ├── skills/               ← Per-skill tracker + mock log
│   │   ├── focus/                ← Pomodoro / Deep + reflection journal
│   │   ├── notes/                ← Vocab / grammar / mistake / idea journal
│   │   ├── calendar/             ← Month grid with completion ratios
│   │   ├── gamification/         ← XP, levels, achievement badges
│   │   └── settings/             ← Theme, accent, font, backup/restore
│   └── lib/
│       ├── db/                   ← SQLite client + repository functions
│       ├── stores/               ← Zustand: UI, timer, settings
│       ├── hooks/                ← useShortcut, useClock, useToday, useDailyData
│       ├── utils/                ← cn, time, ielts helpers
│       ├── backup.ts             ← export/import JSON backups
│       └── env.ts                ← isTauri() guard
│
└── src-tauri/                    ← Rust shell
    ├── Cargo.toml
    ├── tauri.conf.json           ← window, bundle, dmg config
    ├── capabilities/default.json ← permissions
    ├── icons/                    ← .icns / .ico / .png app icons
    ├── migrations/001_init.sql   ← SQLite schema + seed data
    └── src/
        ├── main.rs
        └── lib.rs                ← plugin wiring & migrations
```

---

## Keyboard shortcuts

| Action                     | Shortcut       |
| -------------------------- | -------------- |
| Open command palette       | `⌘K` / `Ctrl+K`|
| Jump to Dashboard          | `1`            |
| Jump to Timeline           | `2`            |
| Jump to Analytics          | `3`            |
| Jump to Skills             | `4`            |
| Jump to Focus              | `5`            |
| Jump to Notes              | `6`            |
| Jump to Calendar           | `7`            |
| Jump to Achievements       | `8`            |
| Settings                   | `9`            |

Numeric shortcuts are disabled while typing in inputs/textareas.

---

## Default schedule (auto-seeded on first run)

```
🌅 Morning
  08:00 – Listening Mock 1
  08:45 – Listening Analysis
  09:05 – Short Break
  09:20 – Listening Mock 2
  10:00 – Listening Analysis
  10:30 – Rest Break

☀️ Midday
  11:00 – Daily Dictation
  12:30 – Long Break
  13:00 – Reading Mock
  14:00 – Reading Analysis
  14:30 – Rest Break

🌇 Afternoon
  15:00 – Writing Task
  16:00 – Writing Feedback & Correction
  16:30 – Break

🌙 Evening
  17:00 – Vocabulary Study
  18:00 – Speaking Practice
  19:00 – Free Practice / Review
  21:00 – Daily Reflection
```

You can complete, skip, or take notes on each session from the **Timeline** view.

---

## Default IELTS targets (auto-seeded)

| Skill      | Target band |
| ---------- | ----------- |
| Listening  | 8.0         |
| Reading    | 7.0         |
| Writing    | 6.5         |
| Speaking   | 6.0         |
| **Overall**| **7.0**     |

Adjust any target on the **Skills** page (Edit target).

---

## Scripts

```bash
pnpm dev           # Vite frontend only (boot screen will explain to run via Tauri)
pnpm build         # Type-check + build frontend bundle into dist/
pnpm tauri dev     # Native dev mode (recommended)
pnpm tauri build   # Production .app + .dmg
pnpm lint          # ESLint
pnpm typecheck     # TypeScript
pnpm format        # Prettier write
```

---

## Performance notes (M1 Air)

- Native WKWebView shell — no Electron baggage.
- All animations are GPU-accelerated transforms/opacities.
- No background polling. Timers only run when on-screen.
- SQLite migrations are versioned and idempotent; the DB file is well under 1 MB even after months of use.
- Charts only re-render on data change.

---

## Privacy

ASCEND makes **zero network requests**. There is no analytics SDK, no remote
feature flags, no remote sync, and no AI/OpenAI calls. Your IELTS prep data is
yours, full stop.

---

## License

MIT — see `LICENSE`.

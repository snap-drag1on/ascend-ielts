import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/charts/Sparkline";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  addMock,
  deleteMock,
  listMocks,
  listSkillTargets,
  setSkillBand,
  setSkillTarget,
} from "@/lib/db/repositories";
import {
  SKILL_COLOR,
  SKILL_LABEL,
  SKILLS,
  bandColor,
  clampBand,
  currentBandFromMocks,
  improvementPercent,
  roundBand,
} from "@/lib/utils/ielts";
import { todayKey } from "@/lib/utils/time";
import type { Mock, Skill, SkillTarget } from "@/types";

export function Skills() {
  const [tab, setTab] = useState<Skill>("listening");
  const [targets, setTargets] = useState<SkillTarget[]>([]);
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    const [t, m] = await Promise.all([listSkillTargets(), listMocks()]);
    setTargets(t);
    setMocks(m);
    // Keep current band synced with last-5-mock average
    for (const skill of SKILLS) {
      const cb = currentBandFromMocks(m, skill, 5);
      const known = t.find((x) => x.skill === skill);
      if (known && cb > 0 && Math.abs(known.current_band - cb) > 0.01) {
        await setSkillBand(skill, cb);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const target = targets.find((t) => t.skill === tab);
  const skillMocks = mocks.filter((m) => m.skill === tab);
  const lastMocks = skillMocks.slice(-10);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Skills"
        title="IELTS Skill Tracker"
        description="Log mocks, track bands, identify weak points across all four sections."
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus size={14} /> Log mock
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border-subtle bg-surface-muted/50 p-1">
        {SKILLS.map((s) => {
          const active = s === tab;
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`relative flex-1 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors min-w-[120px] ${
                active ? "text-text" : "text-text-muted"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="skill-tab"
                  className="absolute inset-0 rounded-xl bg-surface-elevated shadow-card"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                <span className="size-2 rounded-full" style={{ background: SKILL_COLOR[s] }} />
                {SKILL_LABEL[s]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{SKILL_LABEL[tab]} · Trajectory</CardTitle>
              <p className="mt-1 text-xs text-text-faint">
                Last {lastMocks.length} mock{lastMocks.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="muted">target {target?.target_band.toFixed(1) ?? "—"}</Badge>
              <Badge tone="accent">
                <TrendingUp size={11} />{" "}
                {target ? improvementPercent(target.current_band, target.target_band) : 0}%
              </Badge>
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between gap-6">
            <div>
              <div
                className="font-display text-5xl font-semibold"
                style={{ color: bandColor(target?.current_band ?? 0) }}
              >
                {target && target.current_band > 0 ? target.current_band.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-text-faint">current band estimate</div>
              {target && (
                <ProgressBar
                  className="mt-3 w-56"
                  value={target.target_band > 0 ? target.current_band / target.target_band : 0}
                  color={SKILL_COLOR[tab]}
                />
              )}
              {target && (
                <TargetEditor
                  current={target.target_band}
                  onChange={async (n) => {
                    await setSkillTarget(tab, n);
                    refresh();
                  }}
                />
              )}
            </div>
            <div className="w-1/2 max-w-[340px]">
              <Sparkline
                data={lastMocks.map((m) => m.band)}
                color={SKILL_COLOR[tab]}
                height={92}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Weak points</CardTitle>
          <p className="mt-1 text-xs text-text-faint">Auto-detected from your mock notes</p>
          <ul className="mt-3 space-y-2 text-sm">
            {weakPoints(skillMocks).map((w, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-muted/50 px-3 py-2"
              >
                <span className="text-text-muted">{w.label}</span>
                <Badge tone={w.tone}>×{w.count}</Badge>
              </li>
            ))}
            {skillMocks.length === 0 && (
              <EmptyState
                title="No mocks yet"
                description="Log your first mock to surface weak points."
              />
            )}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>{SKILL_LABEL[tab]} · Mock history</CardTitle>
          <Badge tone="muted">{skillMocks.length} total</Badge>
        </div>
        <div className="mt-3 divide-y divide-border-subtle">
          {skillMocks.length === 0 ? (
            <EmptyState
              title="No mocks logged"
              description={`Log your first ${SKILL_LABEL[tab]} mock to start tracking.`}
              action={
                <Button variant="primary" onClick={() => setAdding(true)}>
                  <Plus size={14} /> Log mock
                </Button>
              }
            />
          ) : (
            skillMocks
              .slice()
              .reverse()
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-9 place-items-center rounded-xl font-display font-semibold"
                      style={{
                        background: bandColor(m.band) + "22",
                        color: bandColor(m.band),
                      }}
                    >
                      {m.band.toFixed(1)}
                    </span>
                    <div>
                      <div className="font-display text-[14px] font-semibold text-text">
                        {m.source ?? "Mock"}
                      </div>
                      <div className="text-[11px] text-text-faint">
                        {m.date}
                        {m.correct !== null && m.total !== null
                          ? ` · ${m.correct}/${m.total} correct`
                          : ""}
                        {m.duration_min ? ` · ${m.duration_min}m` : ""}
                      </div>
                      {m.notes && (
                        <div className="mt-1 max-w-md text-[12px] text-text-muted">
                          {m.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await deleteMock(m.id);
                      refresh();
                    }}
                    className="text-text-faint transition-colors hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
          )}
        </div>
      </Card>

      <AddMockModal
        open={adding}
        onClose={() => setAdding(false)}
        defaultSkill={tab}
        onSaved={refresh}
      />
    </div>
  );
}

function TargetEditor({
  current,
  onChange,
}: {
  current: number;
  onChange: (n: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(current);
  return editing ? (
    <div className="mt-3 flex items-center gap-2">
      <Input
        type="number"
        step={0.5}
        min={4}
        max={9}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-24"
      />
      <Button
        size="sm"
        variant="primary"
        onClick={async () => {
          await onChange(clampBand(roundBand(v)));
          setEditing(false);
        }}
      >
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <button
      onClick={() => {
        setV(current);
        setEditing(true);
      }}
      className="mt-2 text-[11px] text-accent hover:underline"
    >
      Edit target
    </button>
  );
}

function AddMockModal({
  open,
  onClose,
  defaultSkill,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  defaultSkill: Skill;
  onSaved: () => void;
}) {
  const [skill, setSkill] = useState<Skill>(defaultSkill);
  const [date, setDate] = useState(todayKey());
  const [band, setBand] = useState(6.0);
  const [correct, setCorrect] = useState<number | "">("");
  const [total, setTotal] = useState<number | "">("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setSkill(defaultSkill), [defaultSkill]);

  return (
    <Modal open={open} onClose={onClose} title="Log a new mock">
      <div className="space-y-3">
        <Row label="Skill">
          <div className="flex gap-2">
            {SKILLS.map((s) => (
              <button
                key={s}
                onClick={() => setSkill(s)}
                className={`rounded-lg border px-3 py-1.5 text-[12px] ${
                  s === skill
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border-subtle text-text-muted hover:bg-surface-muted"
                }`}
              >
                {SKILL_LABEL[s]}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Row>
        <Row label="Band score">
          <Input
            type="number"
            min={4}
            max={9}
            step={0.5}
            value={band}
            onChange={(e) => setBand(Number(e.target.value))}
          />
        </Row>
        <Row label="Correct / Total">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Correct"
              value={correct}
              onChange={(e) => setCorrect(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Total"
              value={total}
              onChange={(e) => setTotal(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </Row>
        <Row label="Source">
          <Input
            placeholder="e.g. Cambridge 18 Test 2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </Row>
        <Row label="Notes">
          <Textarea
            rows={3}
            placeholder="Mistakes, weak areas, ideas to revisit…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Row>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await addMock({
                skill,
                date,
                band: clampBand(roundBand(band)),
                correct: typeof correct === "number" ? correct : null,
                total: typeof total === "number" ? total : null,
                source: source.trim() || null,
                notes: notes.trim() || null,
              });
              onSaved();
              onClose();
            } finally {
              setSaving(false);
            }
          }}
        >
          Save mock
        </Button>
      </div>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function weakPoints(mocks: Mock[]): Array<{ label: string; count: number; tone: "default" | "accent" | "warning" | "danger" | "muted" | "success" }> {
  const words = new Map<string, number>();
  for (const m of mocks) {
    if (!m.notes) continue;
    const tokens = m.notes
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    for (const t of tokens) {
      words.set(t, (words.get(t) ?? 0) + 1);
    }
  }
  return Array.from(words.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count], i) => ({
      label: cap(label),
      count,
      tone: i === 0 ? "warning" : i === 1 ? "danger" : "muted",
    }));
}

const STOPWORDS = new Set([
  "the", "and", "with", "from", "this", "that", "have", "more", "less", "into", "about",
  "your", "they", "them", "very", "than", "were", "will", "their", "would", "should",
  "could", "answer", "answers", "question", "questions", "section", "passage", "mock",
  "test", "again", "next", "time", "task", "after", "before",
]);

function cap(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

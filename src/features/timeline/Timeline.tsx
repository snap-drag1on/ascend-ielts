import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Circle,
  SkipForward,
  Clock,
  ChevronRight,
  StickyNote,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useDailyData } from "@/lib/hooks/useDailyData";
import { setSessionStatus, updateSessionNotes, addXp } from "@/lib/db/repositories";
import { SKILL_COLOR, SKILL_LABEL } from "@/lib/utils/ielts";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, hhmmToMinutes, nowHHMM } from "@/lib/utils/time";
import { useClock } from "@/lib/hooks/useClock";
import type { Session, SessionStatus, TimelineBlock } from "@/types";

const BLOCK_ORDER: TimelineBlock[] = ["morning", "midday", "afternoon", "evening"];
const BLOCK_LABEL: Record<TimelineBlock, string> = {
  morning: "🌅 Morning",
  midday: "☀️ Midday",
  afternoon: "🌇 Afternoon",
  evening: "🌙 Evening",
};

export function Timeline() {
  const { snap, refresh } = useDailyData();
  const now = useClock(20_000);
  const [openId, setOpenId] = useState<number | null>(null);

  if (!snap) {
    return <div className="text-text-muted">Loading…</div>;
  }

  async function setStatus(id: number, status: SessionStatus) {
    await setSessionStatus(id, status);
    if (status === "completed") await addXp(20, "session_completed");
    await refresh();
  }

  const byBlock = BLOCK_ORDER.map((b) => ({
    block: b,
    sessions: snap.sessions.filter((s) => s.block === b),
  }));

  const currentMin = hhmmToMinutes(nowHHMM(now));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={formatLongDate(now)}
        title="Daily Timeline"
        description="Your IELTS-prep operating rhythm. Tap a session to complete or take notes."
        actions={
          <Badge tone="accent">
            <Clock size={11} /> Now {nowHHMM(now)}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {byBlock.map(({ block, sessions }) => (
          <Card key={block} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <CardTitle>{BLOCK_LABEL[block]}</CardTitle>
              <Badge tone="muted">{sessions.length} sessions</Badge>
            </div>

            <ul className="relative space-y-2">
              <span className="absolute left-[18px] top-2 bottom-2 w-px bg-border-subtle" />
              <AnimatePresence initial={false}>
                {sessions.map((s, idx) => {
                  const isPast = hhmmToMinutes(s.end_time) < currentMin;
                  const isNow =
                    hhmmToMinutes(s.start_time) <= currentMin &&
                    hhmmToMinutes(s.end_time) > currentMin;
                  const color =
                    SKILL_COLOR[(s.category as keyof typeof SKILL_COLOR)] ?? "#94a3b8";
                  const open = openId === s.id;

                  return (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.02 }}
                      className={cn(
                        "relative ml-8 rounded-xl border bg-surface-muted/40 p-3",
                        "transition-all hover:bg-surface-muted",
                        isNow
                          ? "border-accent/40 ring-1 ring-accent/30"
                          : "border-border-subtle",
                        s.status === "completed" && "opacity-70",
                      )}
                    >
                      <span
                        className="absolute -left-[26px] top-3 grid size-3.5 place-items-center rounded-full ring-2 ring-surface"
                        style={{
                          background:
                            s.status === "completed"
                              ? "rgb(var(--accent))"
                              : isNow
                                ? "rgb(var(--accent))"
                                : color + "55",
                        }}
                      />

                      <button
                        onClick={() => setOpenId(open ? null : s.id)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs tabular-nums text-text-faint">
                            {s.start_time}
                          </div>
                          <div>
                            <div className="font-display text-[14px] font-semibold text-text">
                              {s.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-faint">
                              <span>{s.duration_min} min</span>
                              <span className="opacity-50">·</span>
                              <span style={{ color }}>
                                {SKILL_LABEL[s.category as keyof typeof SKILL_LABEL] ?? cap(s.category)}
                              </span>
                              {isPast && s.status === "pending" && (
                                <>
                                  <span className="opacity-50">·</span>
                                  <span className="text-amber-400">overdue</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusButton
                            current={s.status}
                            onClick={(st) => setStatus(s.id, st)}
                          />
                          <ChevronRight
                            size={14}
                            className={cn(
                              "text-text-faint transition-transform",
                              open && "rotate-90",
                            )}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {open && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 border-t border-border-subtle pt-3"
                          >
                            <NoteEditor session={s} onSaved={refresh} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusButton({
  current,
  onClick,
}: {
  current: SessionStatus;
  onClick: (s: SessionStatus) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <IconBtn
        active={current === "completed"}
        title="Mark completed"
        onClick={(e) => {
          e.stopPropagation();
          onClick(current === "completed" ? "pending" : "completed");
        }}
      >
        {current === "completed" ? <Check size={14} /> : <Circle size={14} />}
      </IconBtn>
      <IconBtn
        active={current === "skipped"}
        title="Skip"
        onClick={(e) => {
          e.stopPropagation();
          onClick(current === "skipped" ? "pending" : "skipped");
        }}
      >
        <SkipForward size={13} />
      </IconBtn>
    </div>
  );
}

function IconBtn({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-lg border text-text-muted transition-colors",
        active
          ? "border-accent/40 bg-accent/15 text-accent"
          : "border-border-subtle hover:bg-surface-elevated hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function NoteEditor({ session, onSaved }: { session: Session; onSaved: () => void }) {
  const [value, setValue] = useState(session.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateSessionNotes(session.id, value);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px] text-text-muted">
        <StickyNote size={12} /> Quick notes / mistakes / vocab
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="What did you learn? Any mistakes? New words?"
      />
      <div className="flex justify-end">
        <Button size="sm" variant="primary" loading={saving} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}

function cap(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

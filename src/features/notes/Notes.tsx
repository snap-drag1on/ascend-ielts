import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Search,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Brain,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { addNote, deleteNote, listNotes, updateNote } from "@/lib/db/repositories";
import type { Note, NoteKind, Skill } from "@/types";
import { SKILL_LABEL, SKILLS } from "@/lib/utils/ielts";
import { cn } from "@/lib/utils/cn";

const KINDS: Array<{ id: NoteKind | "all"; label: string; icon: typeof Plus }> = [
  { id: "all", label: "All", icon: Search },
  { id: "vocab", label: "Vocabulary", icon: BookOpen },
  { id: "mistake", label: "Mistakes", icon: AlertTriangle },
  { id: "grammar", label: "Grammar", icon: Brain },
  { id: "idea", label: "Ideas", icon: Sparkles },
];

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [kind, setKind] = useState<NoteKind | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const refresh = useCallback(async () => {
    setNotes(await listNotes());
  }, []);

  useEffect(() => {
    void refresh();
    const onCmd = () => setOpen(true);
    window.addEventListener("ascend:new-note", onCmd);
    return () => window.removeEventListener("ascend:new-note", onCmd);
  }, [refresh]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return notes.filter((n) => {
      if (kind !== "all" && n.kind !== kind) return false;
      if (!s) return true;
      return (
        n.title.toLowerCase().includes(s) ||
        n.body.toLowerCase().includes(s) ||
        n.tags.toLowerCase().includes(s)
      );
    });
  }, [notes, kind, q]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notes"
        title="Mistake Journal & Knowledge Bank"
        description="Capture vocabulary, grammar, and mistakes. Everything stored locally on this Mac."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={14} /> New note
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-surface-muted/60 p-1">
            {KINDS.map(({ id, label, icon: Icon }) => {
              const active = kind === id;
              return (
                <button
                  key={id}
                  onClick={() => setKind(id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
                    active ? "text-text" : "text-text-muted",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="notes-tab"
                      className="absolute inset-0 rounded-lg bg-surface-elevated shadow-card"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon size={13} className="relative" />
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes, tags…"
              className="pl-8"
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search size={20} />}
            title="No notes yet"
            description="Capture a tricky vocab word, a grammar pattern, or a mistake you want to never repeat."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus size={14} /> Add first note
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="card cursor-pointer p-5 transition-shadow hover:shadow-elevated"
              onClick={() => {
                setEditing(n);
                setOpen(true);
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <Badge tone={kindTone(n.kind)}>{n.kind}</Badge>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await deleteNote(n.id);
                    refresh();
                  }}
                  className="text-text-faint hover:text-rose-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="font-display text-[15px] font-semibold text-text">{n.title}</div>
              <p className="mt-1 line-clamp-4 text-[12.5px] leading-relaxed text-text-muted whitespace-pre-wrap">
                {n.body}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                {n.skill && (
                  <Badge tone="accent">{SKILL_LABEL[n.skill]}</Badge>
                )}
                {n.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((t) => (
                    <Badge key={t} tone="muted">
                      #{t}
                    </Badge>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <NoteModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSaved={refresh}
      />
    </div>
  );
}

function kindTone(k: NoteKind): "accent" | "warning" | "danger" | "success" | "muted" {
  switch (k) {
    case "vocab": return "accent";
    case "grammar": return "success";
    case "mistake": return "warning";
    case "reflection": return "muted";
    case "idea": return "accent";
  }
}

function NoteModal({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Note | null;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<NoteKind>("vocab");
  const [skill, setSkill] = useState<Skill | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setKind(editing.kind);
      setSkill(editing.skill ?? "");
      setTitle(editing.title);
      setBody(editing.body);
      setTags(editing.tags);
    } else if (open) {
      setKind("vocab");
      setSkill("");
      setTitle("");
      setBody("");
      setTags("");
    }
  }, [editing, open]);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateNote(editing.id, {
          kind,
          skill: skill || null,
          title,
          body,
          tags,
        });
      } else {
        await addNote({
          kind,
          skill: skill || null,
          title,
          body,
          tags,
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit note" : "New note"} maxWidth={620}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["vocab", "grammar", "mistake", "idea", "reflection"] as NoteKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-lg border px-3 py-1.5 text-[12px] capitalize ${
                k === kind
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border-subtle text-text-muted hover:bg-surface-muted"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSkill("")}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              skill === ""
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-border-subtle text-text-muted hover:bg-surface-muted"
            }`}
          >
            No skill
          </button>
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                skill === s
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border-subtle text-text-muted hover:bg-surface-muted"
              }`}
            >
              {SKILL_LABEL[s]}
            </button>
          ))}
        </div>
        <Input
          placeholder="Title (e.g. ‘Discrepancy — n. — a difference’)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          rows={8}
          placeholder="Definition, examples, why you got it wrong, links…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Input
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" loading={saving} onClick={save} disabled={!title.trim()}>
          {editing ? "Update" : "Save note"}
        </Button>
      </div>
    </Modal>
  );
}

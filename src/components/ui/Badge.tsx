import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "default" | "accent" | "success" | "warning" | "danger" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-surface-muted text-text-muted border-border-subtle",
  accent: "bg-accent/15 text-accent border-accent/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  muted: "bg-surface-muted/50 text-text-faint border-border-subtle",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "default", ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}

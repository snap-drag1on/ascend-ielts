import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: number; // % change
  className?: string;
  accent?: string;
}

export function Stat({ label, value, hint, icon, trend, className, accent }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "card flex flex-col gap-1.5 p-5",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/30 before:to-transparent",
        className,
      )}
    >
      <div className="flex items-center justify-between text-text-muted">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon ? (
          <span
            className="grid size-7 place-items-center rounded-lg"
            style={{
              background: accent ? `${accent}22` : "rgb(var(--accent) / 0.12)",
              color: accent ?? "rgb(var(--accent))",
            }}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight text-text">{value}</div>
      <div className="flex items-center gap-2 text-xs text-text-faint">
        {trend !== undefined ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              trend >= 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400",
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        ) : null}
        {hint}
      </div>
    </motion.div>
  );
}

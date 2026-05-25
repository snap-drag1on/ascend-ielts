import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface Props {
  value: number; // 0..1
  className?: string;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, className, color = "rgb(var(--accent))", height = 8 }: Props) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface-muted", className)}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${v * 100}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

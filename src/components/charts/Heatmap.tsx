import { motion } from "framer-motion";
import { format, parseISO } from "@/lib/utils/time";

interface Props {
  /** Map of YYYY-MM-DD -> intensity (0..N) */
  values: Record<string, number>;
  /** Number of weeks back (default 16 = ~4 months) */
  weeks?: number;
  cellSize?: number;
}

export function Heatmap({ values, weeks = 16, cellSize = 12 }: Props) {
  // Build a grid of [weeks] columns x 7 rows (Mon..Sun)
  const today = new Date();
  const day = today.getDay() === 0 ? 6 : today.getDay() - 1; // Monday=0
  const start = new Date(today);
  start.setDate(today.getDate() - (weeks - 1) * 7 - day);

  const columns: Array<Array<{ key: string; intensity: number }>> = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col: Array<{ key: string; intensity: number }> = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      col.push({ key, intensity: values[key] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
  }

  const max = Math.max(1, ...Object.values(values));

  function colorFor(intensity: number): string {
    if (intensity <= 0) return "rgb(var(--surface-muted))";
    const t = Math.min(1, intensity / max);
    // alpha ramp on accent
    const a = 0.18 + t * 0.78;
    return `rgb(var(--accent) / ${a.toFixed(3)})`;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-[3px]">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <motion.div
                key={cell.key}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ci * 0.005, duration: 0.25 }}
                title={`${cell.key} · ${cell.intensity}`}
                className="rounded-[3px]"
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: colorFor(cell.intensity),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-faint">
        <span>{format(start, "MMM d")}</span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <span
              key={t}
              className="size-2.5 rounded-[2px]"
              style={{ background: `rgb(var(--accent) / ${0.18 + t * 0.78})` }}
            />
          ))}
          <span>More</span>
        </div>
        <span>{format(today, "MMM d")}</span>
      </div>
      <span className="sr-only">
        Heatmap from {format(parseISO(start.toISOString()), "yyyy-MM-dd")} to today
      </span>
    </div>
  );
}

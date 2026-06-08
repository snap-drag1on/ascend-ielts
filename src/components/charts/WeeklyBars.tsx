import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  day: string;
  minutes: number;
}

interface Props {
  data: Point[];
  height?: number;
}

export function WeeklyBars({ data, height = 220 }: Props) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgb(var(--border-subtle))" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" stroke="rgb(var(--text-faint))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis stroke="rgb(var(--text-faint))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            cursor={{ fill: "rgb(var(--surface-muted))" }}
            contentStyle={{
              background: "rgb(var(--surface-elevated))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="minutes"
            fill="rgb(var(--accent))"
            radius={[6, 6, 2, 2]}
            isAnimationActive
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

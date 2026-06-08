import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SKILL_COLOR } from "@/lib/utils/ielts";

interface Point {
  date: string;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
}

interface Props {
  data: Point[];
  height?: number;
}

export function BandLineChart({ data, height = 280 }: Props) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgb(var(--border-subtle))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="rgb(var(--text-faint))"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[4, 9]}
            stroke="rgb(var(--text-faint))"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "rgb(var(--surface-elevated))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          {(["listening", "reading", "writing", "speaking"] as const).map((k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={SKILL_COLOR[k]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

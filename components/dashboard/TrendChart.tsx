"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrendChart({
  data,
  color = "#0f766e",
}: {
  data: { date: string; score: number }[];
  color?: string;
}) {
  const points = data.map((d) => ({
    t: new Date(d.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    score: d.score,
  }));

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted">
        Not enough data yet
      </div>
    );
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="t"
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted)" }} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          />
          <ReferenceLine y={60} stroke="var(--muted)" strokeDasharray="2 4" />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

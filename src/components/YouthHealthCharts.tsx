"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";
import type { YrbsRow } from "@/lib/liveData";

const metrics = [
  { key: "obesity", name: "Obesity", color: COLORS.red, dash: undefined },
  { key: "sodaDaily", name: "Daily Soda", color: COLORS.orange, dash: "8 4" },
  { key: "physicallyActive", name: "Active 60min/day", color: COLORS.green, dash: "4 3" },
  { key: "bingeDrinking", name: "Binge Drinking", color: COLORS.purple, dash: "12 3 3 3" },
  { key: "smoking", name: "Smoking (30d)", color: COLORS.blue, dash: "2 3" },
] as const;

export function YouthRiskTrendChart({ data, lastUpdated }: { data: YrbsRow[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="NYC Youth Health Behaviors (Grades 9–12)"
      subtitle="% prevalence · NYC YRBS · 2011–2021"
      fullWidth
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="year" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {metrics.map(({ key, name, color, dash }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={dash}
              dot={{ fill: color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

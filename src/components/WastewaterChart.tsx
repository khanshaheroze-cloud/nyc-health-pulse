"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";
import type { WastewaterCitywide } from "@/lib/liveData";

export function WastewaterTrendChart({ data, lastUpdated }: { data: WastewaterCitywide[]; lastUpdated?: string }) {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: Math.round(d.avgCopiesPerL),
  }));

  return (
    <ChartCard
      title="COVID Wastewater Signal (Citywide)"
      subtitle="Avg SARS-CoV-2 copies/L across NYC sewersheds · 6-month window"
      fullWidth
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="date" {...chartTheme.axis} interval={Math.max(1, Math.floor(chartData.length / 8))} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis
            {...chartTheme.axis}
            tickFormatter={(v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : `${v}`}
          />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v.toLocaleString()} copies/L`, "Viral Load"] : [""]}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="SARS-CoV-2"
            stroke={COLORS.cyan}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: COLORS.cyan }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

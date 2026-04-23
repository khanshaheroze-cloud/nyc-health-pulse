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
import type { FluWastewaterRow } from "@/lib/liveData";

export function FluWastewaterChart({ data, lastUpdated }: { data: FluWastewaterRow[]; lastUpdated?: string }) {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: d.concentration,
  }));

  return (
    <ChartCard
      title="Influenza A — Wastewater Signal (NYC)"
      subtitle="Avg copies/L across NYC sewersheds · CDC NWSS · 6-month window"
      fullWidth
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis
            dataKey="date"
            {...chartTheme.axis}
            interval={Math.max(1, Math.floor(chartData.length / 8))}
            tick={{ ...chartTheme.axis.tick, fontSize: 10 }}
          />
          <YAxis
            {...chartTheme.axis}
            tickFormatter={(v: number) =>
              v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : `${v}`
            }
          />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: any) =>
              v != null ? [`${v.toLocaleString()} copies/L`, "Influenza A"] : [""]
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Influenza A"
            stroke={COLORS.orange}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: COLORS.orange }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

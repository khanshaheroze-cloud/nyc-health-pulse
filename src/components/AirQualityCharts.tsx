"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { pm25Neighborhoods, pollutantsByBorough, pm25Trend, COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

// ─── PM2.5 Neighborhood Rankings ──────────────────────────────────────────────

export function Pm25NeighborhoodChart() {
  return (
    <ChartCard
      title="PM2.5 by Neighborhood"
      subtitle="Annual μg/m³ · NYCCAS 2023 · WHO guideline = 5"
      fullWidth
      tall
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...pm25Neighborhoods].reverse()}
          layout="vertical"
          margin={{ left: 12, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" domain={[5.5, 8.5]} {...chartTheme.axis} unit=" μg/m³" tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={130} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v} μg/m³`, "PM2.5"] : [""]}
          />
          <ReferenceLine x={5} stroke={COLORS.red + "66"} strokeDasharray="4 4" label={{ value: "WHO", fill: COLORS.red + "99", fontSize: 9, position: "insideTopRight" }} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
            {pm25Neighborhoods.map((entry) => (
              <Cell key={entry.name} fill={entry.value > 7 ? COLORS.orange : COLORS.green} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Pollutants by Borough ────────────────────────────────────────────────────

export function PollutantsByBoroughChart() {
  return (
    <ChartCard
      title="Air Pollutants by Borough"
      subtitle="PM2.5 (μg/m³) · NO₂ (ppb) · O₃ (ppb) · NYCCAS 2023"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pollutantsByBorough} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar dataKey="pm25" name="PM2.5" fill={COLORS.orange + "cc"} radius={[3, 3, 0, 0]} />
          <Bar dataKey="no2"  name="NO₂"   fill={COLORS.red   + "cc"} radius={[3, 3, 0, 0]} />
          <Bar dataKey="o3"   name="O₃"    fill={COLORS.blue  + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── PM2.5 Annual Trend ───────────────────────────────────────────────────────

export function Pm25TrendChart() {
  return (
    <ChartCard
      title="PM2.5 Annual Trend (Citywide)"
      subtitle="Fine particulates μg/m³ · WHO guideline = 5"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pm25Trend}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="year" {...chartTheme.axis} />
          <YAxis domain={[4, 9]} {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <ReferenceLine
            y={5}
            stroke={COLORS.red + "66"}
            strokeDasharray="5 5"
            label={{ value: "WHO", fill: COLORS.red + "88", fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="PM2.5"
            stroke={COLORS.green}
            strokeWidth={2.5}
            dot={{ fill: COLORS.green, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

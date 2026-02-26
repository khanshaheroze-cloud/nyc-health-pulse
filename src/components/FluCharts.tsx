"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { iliWeeks, iliData, fluVaccinationByBorough, COLORS, BOROUGH_COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

const iliChartData = iliWeeks.map((week, i) => ({
  week,
  Bronx:        iliData.Bronx[i],
  Brooklyn:     iliData.Brooklyn[i],
  Manhattan:    iliData.Manhattan[i],
  Queens:       iliData.Queens[i],
  "Staten Is.": iliData["Staten Is."][i],
  Citywide:     iliData.Citywide[i],
}));

const iliLines = [
  { key: "Citywide",    color: COLORS.yellow },
  { key: "Bronx",       color: COLORS.red },
  { key: "Brooklyn",    color: COLORS.blue },
  { key: "Manhattan",   color: COLORS.purple },
  { key: "Queens",      color: COLORS.green },
  { key: "Staten Is.",  color: COLORS.orange },
] as const;

// ─── Full ILI Chart (with Citywide) ──────────────────────────────────────────

export function IliFullChart() {
  return (
    <ChartCard
      title="ILI ER Visits — All Boroughs + Citywide"
      subtitle="% of all ER visits · Wk42 2025 – Wk3 2026"
      fullWidth
      tall
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={iliChartData}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="week" {...chartTheme.axis} interval={1} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {iliLines.map(({ key, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={key === "Citywide" ? 2.5 : 1.5}
              strokeDasharray={key === "Citywide" ? "5 3" : undefined}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Flu Vaccination by Borough ───────────────────────────────────────────────

export function FluVaccinationChart() {
  return (
    <ChartCard
      title="Adult Flu Vaccination Rate by Borough"
      subtitle="% vaccinated · NYC DOHMH 2023–24 season"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={fluVaccinationByBorough}
          layout="vertical"
          margin={{ left: 12, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 80]} {...chartTheme.axis} unit="%" />
          <YAxis type="category" dataKey="borough" width={90} {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`, "Vaccination rate"] : [""]}
          />
          <Bar dataKey="pct" name="Vaccination %" fill={COLORS.green + "cc"} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

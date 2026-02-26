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
} from "recharts";
import { ChartCard } from "./ChartCard";
import {
  covidMonthly,
  pm25Trend,
  iliWeeks,
  iliData,
  chronicOutcomes,
  COLORS,
  BOROUGH_COLORS,
} from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

// ─── 1. COVID Monthly Trend ────────────────────────────────────────────────────

export function CovidTrendChart() {
  return (
    <ChartCard
      title="COVID-19 Monthly Trend"
      subtitle="Cases & hospitalizations · Nov 2024 – Oct 2025"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={covidMonthly} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="month" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconSize={10}
          />
          <Bar dataKey="cases" name="Cases" fill={COLORS.blue + "99"} radius={[3, 3, 0, 0]} />
          <Bar dataKey="hosp" name="Hospitalizations" fill={COLORS.orange + "99"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 2. PM2.5 Annual Trend ─────────────────────────────────────────────────────

export function AirTrendChart() {
  return (
    <ChartCard
      title="PM2.5 Annual Trend (Citywide)"
      subtitle="Fine particulates μg/m³ · WHO guideline = 5"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pm25Trend}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="year" {...chartTheme.axis} />
          <YAxis domain={[4, 8]} {...chartTheme.axis} />
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

// ─── 3. ILI by Borough ─────────────────────────────────────────────────────────

const iliChartData = iliWeeks.map((week, i) => ({
  week,
  Bronx: iliData.Bronx[i],
  Brooklyn: iliData.Brooklyn[i],
  Manhattan: iliData.Manhattan[i],
  Queens: iliData.Queens[i],
  "Staten Is.": iliData["Staten Is."][i],
}));

const iliLines = [
  { key: "Bronx", color: COLORS.red },
  { key: "Brooklyn", color: COLORS.blue },
  { key: "Manhattan", color: COLORS.purple },
  { key: "Queens", color: COLORS.green },
  { key: "Staten Is.", color: COLORS.orange },
] as const;

export function IliChart() {
  return (
    <ChartCard
      title="ILI ER Visits by Borough"
      subtitle="% of all ER visits · Wk42 2025 – Wk3 2026"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={iliChartData}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="week" {...chartTheme.axis} interval={2} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip {...chartTheme.tooltip} formatter={(v: number | undefined) => v != null ? `${v}%` : ""} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {iliLines.map(({ key, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 4. Chronic Disease by Borough ────────────────────────────────────────────

const boroughs = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."] as const;
const boroughColors = boroughs.map((b) => BOROUGH_COLORS[b]);

export function ChronicChart() {
  return (
    <ChartCard
      title="Chronic Disease by Borough"
      subtitle="CDC PLACES estimates · % of adults"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chronicOutcomes} barGap={1}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="measure" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? `${v}%` : ""}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {boroughs.map((b, i) => (
            <Bar
              key={b}
              dataKey={b}
              fill={boroughColors[i] + "99"}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

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
} from "recharts";
import { ChartCard } from "./ChartCard";
import { covidMonthly, covidByBorough, COLORS, BOROUGH_COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

// ─── COVID Monthly Trend ────────────────────────────────────────────────────

export function CovidMonthlyChart() {
  return (
    <ChartCard
      title="COVID-19 Monthly Trend"
      subtitle="Cases & hospitalizations · Nov 2024 – Oct 2025"
      fullWidth
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={covidMonthly} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="month" {...chartTheme.axis} />
          <YAxis yAxisId="left" {...chartTheme.axis} />
          <YAxis yAxisId="right" orientation="right" {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar yAxisId="left"  dataKey="cases" name="Cases"            fill={COLORS.blue   + "99"} radius={[3, 3, 0, 0]} />
          <Bar yAxisId="left"  dataKey="hosp"  name="Hospitalizations" fill={COLORS.orange + "99"} radius={[3, 3, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="deaths" name="Deaths" stroke={COLORS.red} strokeWidth={2} dot={{ r: 3, fill: COLORS.red }} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── COVID by Borough ─────────────────────────────────────────────────────────

const boroughs = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."] as const;

export function CovidBoroughChart() {
  return (
    <ChartCard
      title="COVID-19 by Borough (90-day)"
      subtitle="Cases & hospitalizations · most recent 90 days"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={covidByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar dataKey="cases" name="Cases"            fill={COLORS.blue   + "99"} radius={[3, 3, 0, 0]} />
          <Bar dataKey="hosp"  name="Hospitalizations" fill={COLORS.orange + "99"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

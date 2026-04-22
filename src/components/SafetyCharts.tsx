"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { chartTheme } from "@/lib/chartTheme";

const BOROUGH_COLORS: Record<string, string> = {
  Bronx: "#EE352E",
  Brooklyn: "#FF6319",
  Manhattan: "#2850AD",
  Queens: "#B933AD",
  "Staten island": "#6CBE45",
  "Staten Island": "#6CBE45",
};

// ─── Crashes by Borough ─────────────────────────────────────────────────────

interface BoroughCrash {
  borough: string;
  crashes: number;
  injured: number;
  killed: number;
  pedInjured: number;
  cyclistInjured: number;
}

export function CrashesByBoroughChart({ data, lastUpdated }: { data: BoroughCrash[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="Crashes by Borough"
      subtitle="Total crashes + injuries · Last 12 months · NYPD"
      tag="LIVE"
      lastUpdated={lastUpdated}
      whyItMatters="Brooklyn and Queens account for the most collisions, reflecting higher VMT and wider arterial networks."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" barGap={4}>
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} tickFormatter={(v: number) => v.toLocaleString("en-US")} />
          <YAxis
            type="category"
            dataKey="borough"
            {...chartTheme.axis}
            tick={{ ...chartTheme.axis.tick, fontSize: 10 }}
            width={80}
          />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, name: string | undefined) => {
              if (v == null) return [""];
              return [v.toLocaleString("en-US"), name === "crashes" ? "Crashes" : "Injured"];
            }}
          />
          <Bar dataKey="crashes" name="Crashes" radius={[0, 3, 3, 0]}>
            {data.map((entry) => (
              <Cell key={entry.borough} fill={BOROUGH_COLORS[entry.borough] ?? "#5b9cf5"} fillOpacity={0.85} />
            ))}
          </Bar>
          <Bar dataKey="injured" name="Injured" fill="#f59e42" fillOpacity={0.6} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Monthly Crash Trend ────────────────────────────────────────────────────

interface MonthlyTrend {
  yr: number;
  mo: number;
  label: string;
  crashes: number;
  killed: number;
}

export function CrashTrendChart({ data, lastUpdated }: { data: MonthlyTrend[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="Monthly Crash Trend"
      subtitle="Crashes and fatalities · Last 24 months · NYPD"
      tag="LIVE"
      lastUpdated={lastUpdated}
      whyItMatters="Summer months typically see more crashes due to higher traffic volume, construction, and outdoor activity."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid {...chartTheme.grid} />
          <XAxis
            dataKey="label"
            {...chartTheme.axis}
            tick={{ ...chartTheme.axis.tick, fontSize: 9 }}
            interval={2}
          />
          <YAxis {...chartTheme.axis} tickFormatter={(v: number) => v.toLocaleString("en-US")} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, name: string | undefined) => {
              if (v == null) return [""];
              return [v.toLocaleString("en-US"), name === "crashes" ? "Crashes" : "Fatalities"];
            }}
          />
          <Line
            type="monotone"
            dataKey="crashes"
            name="crashes"
            stroke="#5b9cf5"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="killed"
            name="killed"
            stroke="#f07070"
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Contributing Factors ───────────────────────────────────────────────────

interface CrashFactor {
  factor: string;
  count: number;
}

export function ContributingFactorsChart({ data, lastUpdated }: { data: CrashFactor[]; lastUpdated?: string }) {
  // Shorten long factor names for readability
  const chartData = data.map((d) => ({
    ...d,
    label: d.factor.length > 30 ? d.factor.slice(0, 28) + "..." : d.factor,
  }));

  return (
    <ChartCard
      title="Top Contributing Factors"
      subtitle="Most common cited factors · Last 12 months · NYPD"
      tag="LIVE"
      lastUpdated={lastUpdated}
      tall
      whyItMatters="Driver inattention and failure to yield remain the leading causes, underscoring the need for traffic calming and enforcement."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" barGap={4}>
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} tickFormatter={(v: number) => v.toLocaleString("en-US")} />
          <YAxis
            type="category"
            dataKey="label"
            {...chartTheme.axis}
            tick={{ ...chartTheme.axis.tick, fontSize: 9 }}
            width={160}
          />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => {
              if (v == null) return [""];
              return [v.toLocaleString("en-US"), "Crashes"];
            }}
            labelFormatter={(label) => {
              const s = String(label);
              const match = data.find((d) => d.factor.startsWith(s.replace("...", "")));
              return match ? match.factor : s;
            }}
          />
          <Bar dataKey="count" name="Crashes" fill="#a78bfa" fillOpacity={0.75} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

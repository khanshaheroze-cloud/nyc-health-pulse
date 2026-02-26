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
import { overdoseTrend, overdoseByBorough, leadTrend, leadByBorough, COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

// ─── Overdose Trend ───────────────────────────────────────────────────────────

export function OverdoseTrendChart() {
  return (
    <ChartCard
      title="Drug Overdose Deaths — NYC"
      subtitle="Annual total · 2017–2024 est. · NYC DOHMH"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={overdoseTrend}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="year" {...chartTheme.axis} />
          <YAxis domain={[1000, 3500]} {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [v.toLocaleString(), "Deaths"] : [""]}
          />
          <Line
            type="monotone"
            dataKey="deaths"
            name="Overdose Deaths"
            stroke={COLORS.yellow}
            strokeWidth={2.5}
            dot={{ fill: COLORS.yellow, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Overdose by Borough ──────────────────────────────────────────────────────

export function OverdoseBoroughChart() {
  return (
    <ChartCard
      title="Overdose Deaths by Borough"
      subtitle="2024 estimate · NYC DOHMH"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={overdoseByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [v.toLocaleString(), "Deaths"] : [""]}
          />
          <Bar dataKey="deaths" name="Deaths" fill={COLORS.yellow + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Lead Trend ───────────────────────────────────────────────────────────────

export function LeadTrendChart() {
  return (
    <ChartCard
      title="Child Blood Lead Levels — Trend"
      subtitle="% of children tested with elevated BLL · NYC DOHMH 2015–2023"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={leadTrend}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="year" {...chartTheme.axis} />
          <YAxis domain={[0, 9]} {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`, "Elevated BLL"] : [""]}
          />
          <Line
            type="monotone"
            dataKey="pct"
            name="Elevated BLL %"
            stroke={COLORS.red}
            strokeWidth={2.5}
            dot={{ fill: COLORS.red, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Lead by Borough ──────────────────────────────────────────────────────────

export function LeadBoroughChart() {
  return (
    <ChartCard
      title="Child Elevated Blood Lead by Borough"
      subtitle="% of tested children · NYC DOHMH 2023"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={leadByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis domain={[0, 4]} {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`, "Elevated BLL"] : [""]}
          />
          <Bar dataKey="pct" name="Elevated BLL %" fill={COLORS.red + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

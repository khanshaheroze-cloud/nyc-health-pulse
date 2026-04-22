"use client";

import {
  BarChart,
  Bar,
  Cell,
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
import type { MaternalMortalityRow, CSectionRow, InfantMortalityRow } from "@/lib/liveData";

// ─── Maternal Mortality by Cause ─────────────────────────────────────────────

export function MaternalMortalityCauseChart({ data, lastUpdated }: { data: MaternalMortalityRow[]; lastUpdated?: string }) {
  const byCause = new Map<string, number>();
  for (const row of data) {
    byCause.set(row.cause, (byCause.get(row.cause) ?? 0) + row.deaths);
  }
  const chartData = [...byCause.entries()]
    .map(([cause, deaths]) => ({ cause, deaths }))
    .sort((a, b) => b.deaths - a.deaths)
    .slice(0, 8);

  return (
    <ChartCard
      title="Pregnancy-Related Mortality by Cause"
      subtitle="NYC · 2016–2017 · Underlying cause of death"
      tall
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...chartData].reverse()}
          layout="vertical"
          margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} />
          <YAxis type="category" dataKey="cause" width={140} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [v, "Deaths"] : [""]}
          />
          <Bar dataKey="deaths" name="Deaths" fill={COLORS.pink + "cc"} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Maternal Mortality by Race/Ethnicity ────────────────────────────────────

const RACE_COLORS: Record<string, string> = {
  "Black non-Latina":       COLORS.purple,
  "White non-Latina":       COLORS.blue,
  "Latina":                 COLORS.orange,
  "Asian/Pacific Islander": COLORS.cyan,
  "Other":                  COLORS.pink,
};

export function MaternalMortalityRaceChart({ data, lastUpdated }: { data: MaternalMortalityRow[]; lastUpdated?: string }) {
  const byRace = new Map<string, number>();
  for (const row of data) {
    if (row.raceEthnicity && row.raceEthnicity !== "All" && row.raceEthnicity !== "Unknown") {
      byRace.set(row.raceEthnicity, (byRace.get(row.raceEthnicity) ?? 0) + row.deaths);
    }
  }
  const chartData = [...byRace.entries()]
    .map(([race, deaths]) => ({ race, deaths }))
    .sort((a, b) => b.deaths - a.deaths);

  return (
    <ChartCard
      title="Pregnancy-Related Deaths by Race/Ethnicity"
      subtitle="NYC · 2016–2017 · Stark disparities persist"
      tag="LIVE"
      lastUpdated={lastUpdated}
      whyItMatters="Black women in NYC face pregnancy-related death rates 8–12x higher than white women. Structural racism and unequal prenatal care access drive this crisis."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="race" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 9 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [v, "Deaths"] : [""]}
          />
          <Bar dataKey="deaths" name="Deaths" radius={[3, 3, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.race} fill={RACE_COLORS[entry.race] ?? COLORS.red + "cc"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── C-Section Rate by Borough ──────────────────────────────────────────────

export function CSectionChart({ data, lastUpdated }: { data: CSectionRow[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="C-Section Rate by Borough"
      subtitle="% of live births delivered via cesarean section · NY State DOH"
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} unit="%" domain={[0, 50]} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, name: string | undefined) =>
              v != null
                ? [name === "csectionPct" ? `${v}%` : v.toLocaleString(), name === "csectionPct" ? "C-Section %" : "Births"]
                : [""]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar dataKey="csectionPct" name="C-Section %" fill={COLORS.pink + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Infant Mortality by Race/Ethnicity ─────────────────────────────────────

export function InfantMortalityChart({ data, lastUpdated }: { data: InfantMortalityRow[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="Infant Mortality Rate by Maternal Race/Ethnicity"
      subtitle="Deaths per 1,000 live births · NYC DOHMH"
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="race" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 9 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, name: string | undefined) =>
              v != null
                ? [`${v} per 1,000`, name === "infantRate" ? "Infant Mortality" : "Neonatal"]
                : [""]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar dataKey="infantRate" name="Infant Mortality" fill={COLORS.red + "cc"} radius={[3, 3, 0, 0]} />
          <Bar dataKey="neonatalRate" name="Neonatal" fill={COLORS.orange + "99"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

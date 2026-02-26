"use client";

import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import {
  raceByBorough as STATIC_RACE,
  asianSubgroupsCitywide as STATIC_ASIAN,
  ageByBorough as STATIC_AGE,
  healthDisparitiesByRace as STATIC_DISPARITIES,
  lifeExpectancyByRace as STATIC_LIFE_EXP,
  COLORS,
} from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";
import type { RaceRow } from "@/lib/liveData";

// ─── Shared colors ─────────────────────────────────────────────────────────────

const RACE_COLORS = {
  "NH White":    COLORS.blue,
  "NH Black":    COLORS.purple,
  "NH Asian":    COLORS.cyan,
  "Hispanic":    COLORS.orange,
  "Other":       "#6b7a94",
};

const DISPARITY_COLORS = {
  "NH Black":  COLORS.purple,
  "Hispanic":  COLORS.orange,
  "NH White":  COLORS.blue,
  "NH Asian":  COLORS.cyan,
};

const AGE_COLORS = {
  "Under 18":   COLORS.cyan,
  "18–34":      COLORS.blue,
  "35–54":      COLORS.purple,
  "55–64":      COLORS.orange,
  "65+":        COLORS.red,
};

const CATEGORY_COLORS: Record<string, string> = {
  "East Asian":      COLORS.blue,
  "South Asian":     COLORS.orange,
  "Southeast Asian": COLORS.green,
  "Other":           "#6b7a94",
};

// ─── Race / Ethnicity — stacked 100% bar ──────────────────────────────────────

export function RacePctByBoroughChart({ data = STATIC_RACE }: { data?: RaceRow[] }) {
  const chartData = data.map(d => {
    const total = d.nhWhite + d.nhBlack + d.nhAsian + d.hispanic + d.other;
    const pct = (n: number) => parseFloat(((n / total) * 100).toFixed(1));
    return {
      borough:    d.borough,
      "NH White": pct(d.nhWhite),
      "NH Black": pct(d.nhBlack),
      "NH Asian": pct(d.nhAsian),
      "Hispanic": pct(d.hispanic),
      "Other":    pct(d.other),
    };
  });

  return (
    <ChartCard title="Race & Ethnicity by Borough" subtitle="% of borough population · ACS 2022" fullWidth>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} tickFormatter={v => `${v}%`} domain={[0, 100]} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(value: number | undefined) => [`${value}%`]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {(Object.keys(RACE_COLORS) as (keyof typeof RACE_COLORS)[]).map(key => (
            <Bar key={key} dataKey={key} stackId="a" fill={RACE_COLORS[key]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Population counts table ──────────────────────────────────────────────────

export function RaceCountsTable({ data = STATIC_RACE }: { data?: RaceRow[] }) {
  const nyc = {
    nhWhite:  data.reduce((s, d) => s + d.nhWhite,  0),
    nhBlack:  data.reduce((s, d) => s + d.nhBlack,  0),
    nhAsian:  data.reduce((s, d) => s + d.nhAsian,  0),
    hispanic: data.reduce((s, d) => s + d.hispanic, 0),
    other:    data.reduce((s, d) => s + d.other,    0),
  };
  const total = nyc.nhWhite + nyc.nhBlack + nyc.nhAsian + nyc.hispanic + nyc.other;
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

  const rows: { label: string; key: keyof typeof nyc; color: string }[] = [
    { label: "Hispanic / Latino",        key: "hispanic", color: COLORS.orange },
    { label: "Non-Hispanic White",        key: "nhWhite",  color: COLORS.blue   },
    { label: "Non-Hispanic Black",        key: "nhBlack",  color: COLORS.purple },
    { label: "Non-Hispanic Asian",        key: "nhAsian",  color: COLORS.cyan   },
    { label: "Other / Multiracial",       key: "other",    color: "#6b7a94"     },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-[13px] font-bold mb-3">NYC Population by Race / Ethnicity</h3>
      <p className="text-[10px] text-muted mb-3">Total NYC: {total.toLocaleString()} · ACS 2022 5-year estimates</p>
      <table className="w-full text-xs border-collapse">
        <tbody>
          {rows.map(({ label, key, color }) => (
            <tr key={key} className="border-b border-border last:border-0">
              <td className="py-2 pr-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-dim">{label}</span>
              </td>
              <td className="py-2 font-semibold tabular-nums">{nyc[key].toLocaleString()}</td>
              <td className="py-2 text-dim tabular-nums">{pct(nyc[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Asian Subgroups — horizontal bar ─────────────────────────────────────────

export function AsianSubgroupsChart({ data = STATIC_ASIAN }: { data?: typeof STATIC_ASIAN }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <ChartCard title="Asian American Subgroups — NYC" subtitle="ACS 2022 · B02015 · NYC total ~1.24 million" tall>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
          <YAxis type="category" dataKey="group" {...chartTheme.axis} width={130} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(value: number | undefined) => [value?.toLocaleString() ?? "—", "Population"]}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? "#6b7a94"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Age Distribution — stacked 100% bar ──────────────────────────────────────

export function AgeByBoroughChart({ data = STATIC_AGE }: { data?: typeof STATIC_AGE }) {
  const chartData = data.map(d => ({
    borough:    d.borough,
    "Under 18": d.u18,
    "18–34":    d.a18_34,
    "35–54":    d.a35_54,
    "55–64":    d.a55_64,
    "65+":      d.a65p,
  }));

  return (
    <ChartCard title="Age Distribution by Borough" subtitle="% of borough population · ACS 2022 estimates">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} tickFormatter={v => `${v}%`} domain={[0, 100]} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(value: number | undefined) => [`${value}%`]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {(Object.keys(AGE_COLORS) as (keyof typeof AGE_COLORS)[]).map(key => (
            <Bar key={key} dataKey={key} stackId="a" fill={AGE_COLORS[key]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Health Disparities — grouped bar ─────────────────────────────────────────

export function HealthDisparitiesChart({ data = STATIC_DISPARITIES }: { data?: typeof STATIC_DISPARITIES }) {
  return (
    <ChartCard title="Health Disparities by Race / Ethnicity" subtitle="NYC DOHMH Community Health Survey 2022 · adults 18+" fullWidth>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="metric" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} tickFormatter={v => `${v}%`} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(value: number | undefined) => [`${value}%`]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {(Object.keys(DISPARITY_COLORS) as (keyof typeof DISPARITY_COLORS)[]).map(key => (
            <Bar key={key} dataKey={key} fill={DISPARITY_COLORS[key] + "cc"} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Life Expectancy by Race ───────────────────────────────────────────────────

export function LifeExpByRaceChart({ data = STATIC_LIFE_EXP }: { data?: typeof STATIC_LIFE_EXP }) {
  const COLORS_MAP: Record<string, string> = {
    "NH Asian":  COLORS.cyan,
    "Hispanic":  COLORS.orange,
    "NH White":  COLORS.blue,
    "NH Black":  COLORS.purple,
  };

  return (
    <ChartCard title="Life Expectancy by Race / Ethnicity" subtitle="NYC · 2019 pre-COVID baseline · NYC DOHMH Vital Statistics">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} domain={[70, 90]} tickFormatter={v => `${v}y`} />
          <YAxis type="category" dataKey="group" {...chartTheme.axis} width={80} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(value: number | undefined) => [`${value} years`, "Life Expectancy"]}
          />
          <Bar dataKey="years" radius={[0, 3, 3, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS_MAP[entry.group] ?? "#6b7a94"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

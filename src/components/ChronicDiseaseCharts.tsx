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
  chronicOutcomes,
  chronicBehaviors,
  erCauses,
  asthmaByBorough,
  lifeExpectancyByBorough,
  pretermBirthByBorough,
  childhoodObesityByBorough,
  mentalHealthEdTrend,
  COLORS,
  BOROUGH_COLORS,
} from "@/lib/data";
import type { CauseOfDeath, HivBoroughRow, CdcPlacesBorough } from "@/lib/liveData";
import { chartTheme } from "@/lib/chartTheme";

const boroughs = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."] as const;
const boroughColors = boroughs.map((b) => BOROUGH_COLORS[b]);
const boroughOpacities = ["ee", "cc", "aa", "dd", "bb"] as const;

// ─── Health Outcomes ──────────────────────────────────────────────────────────

export function HealthOutcomesChart() {
  return (
    <ChartCard
      title="Chronic Disease Outcomes by Borough"
      subtitle="CDC PLACES estimates · % of adults · BRFSS model-based"
      tag="2023"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chronicOutcomes} barGap={1}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="measure" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {boroughs.map((b, i) => (
            <Bar key={b} dataKey={b} fill={boroughColors[i] + boroughOpacities[i]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Health Behaviors ─────────────────────────────────────────────────────────

export function HealthBehaviorsChart() {
  return (
    <ChartCard
      title="Health Risk Behaviors by Borough"
      subtitle="CDC PLACES · % of adults · BRFSS model-based"
      tag="2023"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chronicBehaviors} barGap={1}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="measure" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {boroughs.map((b, i) => (
            <Bar key={b} dataKey={b} fill={boroughColors[i] + boroughOpacities[i]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── ER Causes ────────────────────────────────────────────────────────────────

export function ErCausesChart() {
  return (
    <ChartCard
      title="Top ER Visit Diagnoses"
      subtitle="SPARCS hospital discharge data · NYC 2023"
      tall
      tag="2023"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...erCauses].reverse()}
          layout="vertical"
          margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
          <YAxis type="category" dataKey="cause" width={150} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [v.toLocaleString(), "Visits"] : [""]}
          />
          <Bar dataKey="visits" name="ER Visits" fill={COLORS.red + "cc"} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Asthma by Borough ────────────────────────────────────────────────────────

export function AsthmaByBoroughChart() {
  return (
    <ChartCard
      title="Asthma ED Visit Rate by Borough"
      subtitle="Age-adjusted per 10,000 · NYC DOHMH 2021"
      tag="2021"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={asthmaByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v} per 10K`] : [""]}
          />
          <Bar dataKey="rate" name="ED Rate" fill={COLORS.orange + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Life Expectancy by Borough ───────────────────────────────────────────────

export function LifeExpectancyChart() {
  return (
    <ChartCard
      title="Life Expectancy by Borough"
      subtitle="Years at birth · 2019 pre-COVID · NYC DOHMH Vital Statistics"
      tag="2019"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={lifeExpectancyByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis domain={[75, 85]} {...chartTheme.axis} unit=" yr" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v} years`] : [""]}
          />
          <ReferenceLine y={82} stroke={COLORS.green + "55"} strokeDasharray="4 4" label={{ value: "NYC avg", fill: COLORS.green + "88", fontSize: 10 }} />
          <Bar dataKey="years" name="Life Expectancy" fill={COLORS.purple + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Preterm Birth ────────────────────────────────────────────────────────────

export function PreTermBirthChart() {
  return (
    <ChartCard
      title="Preterm Birth Rate by Borough"
      subtitle="% of live births born before 37 weeks · NYC Vital Statistics 2022"
      tag="2022"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pretermBirthByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis domain={[0, 15]} {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Bar dataKey="pct" name="Preterm %" fill={COLORS.pink + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Childhood Obesity ────────────────────────────────────────────────────────

export function ChildhoodObesityChart() {
  return (
    <ChartCard
      title="Childhood Obesity/Overweight by Borough"
      subtitle="% K–8 students · NYC FITNESSGRAM 2022"
      tag="2022"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={childhoodObesityByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis domain={[0, 60]} {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Bar dataKey="pct" name="Obese/Overweight %" fill={COLORS.red + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Mental Health ED Trend ───────────────────────────────────────────────────

export function MentalHealthEdTrendChart() {
  return (
    <ChartCard
      title="Mental Health ED Visits Trend"
      subtitle="Rate per 100,000 · NYC DOHMH 2018–2023"
      tag="2023"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mentalHealthEdTrend}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="year" {...chartTheme.axis} />
          <YAxis domain={[280, 470]} {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v} per 100K`] : [""]}
          />
          <Line
            type="monotone"
            dataKey="rate"
            name="MH ED Rate"
            stroke={COLORS.purple}
            strokeWidth={2.5}
            dot={{ fill: COLORS.purple, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Leading Causes of Death (live) ───────────────────────────────────────────

export function LeadingCausesChart({ data, lastUpdated }: { data: CauseOfDeath[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="Leading Causes of Death — NYC"
      subtitle="Age-adjusted deaths · NYC DOHMH Vital Statistics"
      fullWidth
      tall
      tag="LIVE"
      lastUpdated={lastUpdated}
      whyItMatters="Heart disease and cancer account for over half of all NYC deaths. Many of these deaths are preventable with early screening and lifestyle changes."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...data].reverse()}
          layout="vertical"
          margin={{ left: 8, right: 32, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
          <YAxis type="category" dataKey="cause" width={170} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [v.toLocaleString(), "Deaths"] : [""]}
          />
          <Bar dataKey="deaths" name="Deaths" fill={COLORS.red + "cc"} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── HIV by Borough (live) ─────────────────────────────────────────────────────

export function HivByBoroughChart({ data, lastUpdated }: { data: HivBoroughRow[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="HIV Diagnoses by Borough"
      subtitle="Rate per 100,000 population · NYC DOHMH HIV Surveillance"
      tag="LIVE"
      lastUpdated={lastUpdated}
      whyItMatters="NYC still has the highest HIV rate of any US city. Free testing is available at any NYC Health + Hospitals location."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, name: string | undefined) =>
              v != null ? [name === "rate" ? `${v} per 100K` : v.toLocaleString(), name === "rate" ? "Rate" : "Diagnoses"] : [""]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar dataKey="rate"      name="Rate per 100K" fill={COLORS.pink   + "cc"} radius={[3, 3, 0, 0]} />
          <Bar dataKey="diagnoses" name="Diagnoses"      fill={COLORS.purple + "99"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── CDC PLACES Live — Outcomes by Borough ────────────────────────────────────

export function CdcPlacesOutcomesChart({ data, lastUpdated }: { data: CdcPlacesBorough[]; lastUpdated?: string }) {
  const chartData = data.map(d => ({
    borough:    d.borough,
    "Obesity":    d.obesity    ?? 0,
    "Diabetes":   d.diabetes   ?? 0,
    "Depression": d.depression ?? 0,
    "High BP":    d.highBP     ?? 0,
    "Asthma":     d.asthma     ?? 0,
  }));

  const MEASURE_COLORS: Record<string, string> = {
    "Obesity":    COLORS.red,
    "Diabetes":   COLORS.orange,
    "Depression": COLORS.purple,
    "High BP":    COLORS.blue,
    "Asthma":     COLORS.cyan,
  };

  return (
    <ChartCard
      title="Chronic Disease Outcomes by Borough"
      subtitle="Age-adjusted prevalence % · CDC PLACES 2025 release · BRFSS county estimates"
      fullWidth
      tag="LIVE"
      lastUpdated={lastUpdated}
      whyItMatters="These rates directly affect your neighbors' quality of life and local hospital wait times. The Bronx has nearly double Manhattan's obesity and diabetes rates."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {(Object.keys(MEASURE_COLORS) as string[]).map(key => (
            <Bar key={key} dataKey={key} fill={MEASURE_COLORS[key] + "cc"} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CdcPlacesBehaviorsChart({ data, lastUpdated }: { data: CdcPlacesBorough[]; lastUpdated?: string }) {
  const chartData = data.map(d => ({
    borough:    d.borough,
    "Smoking":    d.smoking    ?? 0,
    "Inactivity": d.inactivity ?? 0,
    "Uninsured":  d.uninsured  ?? 0,
  }));

  const MEASURE_COLORS: Record<string, string> = {
    "Smoking":    COLORS.red,
    "Inactivity": COLORS.orange,
    "Uninsured":  COLORS.blue,
  };

  return (
    <ChartCard
      title="Health Risk Behaviors by Borough"
      subtitle="Age-adjusted prevalence % · CDC PLACES 2025 release · BRFSS county estimates"
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} />
          <YAxis {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          {(Object.keys(MEASURE_COLORS) as string[]).map(key => (
            <Bar key={key} dataKey={key} fill={MEASURE_COLORS[key] + "cc"} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

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
import { chartTheme } from "@/lib/chartTheme";

const boroughs = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."] as const;
const boroughColors = boroughs.map((b) => BOROUGH_COLORS[b]);

// ─── Health Outcomes ──────────────────────────────────────────────────────────

export function HealthOutcomesChart() {
  return (
    <ChartCard
      title="Chronic Disease Outcomes by Borough"
      subtitle="CDC PLACES estimates · % of adults · BRFSS model-based"
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
            <Bar key={b} dataKey={b} fill={boroughColors[i] + "99"} radius={[3, 3, 0, 0]} />
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
            <Bar key={b} dataKey={b} fill={boroughColors[i] + "99"} radius={[3, 3, 0, 0]} />
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

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { vitaminDByRace, deficiencyRisk, COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

// ─── Vitamin D Deficiency by Race/Ethnicity ───────────────────────────────────

export function VitaminDChart() {
  return (
    <ChartCard
      title="Vitamin D Deficiency by Race/Ethnicity"
      subtitle="% deficient · NHANES national data (NYC proxy)"
      tall
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...vitaminDByRace].reverse()}
          layout="vertical"
          margin={{ left: 12, right: 32, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 40]} {...chartTheme.axis} unit="%" />
          <YAxis type="category" dataKey="group" width={160} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`, "Deficient"] : [""]}
          />
          <Bar dataKey="deficient" name="Vitamin D Deficient" radius={[0, 3, 3, 0]}>
            {vitaminDByRace.map((entry) => (
              <Cell
                key={entry.group}
                fill={entry.deficient > 20 ? COLORS.red : entry.deficient > 10 ? COLORS.orange : COLORS.green}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Deficiency Risk by Population Group ──────────────────────────────────────

export function DeficiencyRiskChart() {
  return (
    <ChartCard
      title="Nutritional Deficiency Risk by Group"
      subtitle="% at risk · NHANES 2017–2020 (Iron & Vitamin D)"
      tall
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...deficiencyRisk].reverse()}
          layout="vertical"
          margin={{ left: 12, right: 32, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 65]} {...chartTheme.axis} unit="%" />
          <YAxis type="category" dataKey="group" width={180} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, _name: string | undefined, props: { payload?: { nutrient?: string } }) =>
              v != null ? [`${v}%`, props.payload?.nutrient ?? "Deficiency risk"] : [""]
            }
          />
          <Bar dataKey="pct" name="At Risk %" radius={[0, 3, 3, 0]}>
            {deficiencyRisk.map((entry) => (
              <Cell
                key={entry.group}
                fill={entry.pct > 40 ? COLORS.red : entry.pct > 20 ? COLORS.orange : COLORS.green}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

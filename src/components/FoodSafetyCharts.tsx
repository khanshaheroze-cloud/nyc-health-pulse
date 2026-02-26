"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { foodByCuisine, foodByBorough, gradeDistribution, COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

// ─── Violations by Cuisine ────────────────────────────────────────────────────

export function ViolationsByCuisineChart() {
  return (
    <ChartCard
      title="Critical Violations by Cuisine Type"
      subtitle="Recent inspections · lower is better"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={foodByCuisine}
          layout="vertical"
          margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} />
          <YAxis type="category" dataKey="cuisine" width={110} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip {...chartTheme.tooltip} />
          <Bar dataKey="violations" name="Violations" fill={COLORS.red + "cc"} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Avg Score by Borough ────────────────────────────────────────────────────

export function ScoreByBoroughChart() {
  return (
    <ChartCard
      title="Avg Inspection Score by Borough"
      subtitle="NYC DOHMH · lower score = better performance"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={foodByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis domain={[0, 40]} {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Bar dataKey="avgScore" name="Avg Score" fill={COLORS.orange + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Grade Distribution ───────────────────────────────────────────────────────

export function GradeDistributionChart() {
  const total = gradeDistribution.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title="Inspection Grade Distribution"
      subtitle="Recent graded restaurants · NYC DOHMH"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={gradeDistribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) => `${name}: ${Math.round((value / total) * 100)}%`}
            labelLine={false}
          >
            {gradeDistribution.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [v, "Restaurants"] : [""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

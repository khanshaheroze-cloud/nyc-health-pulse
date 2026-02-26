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
import {
  rodentByBorough,
  rodentHotspots,
  noiseByBorough,
  noiseByType,
  foodDesertByBorough,
  COLORS,
} from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

// ─── Rodent by Borough ────────────────────────────────────────────────────────

export function RodentByBoroughChart() {
  return (
    <ChartCard
      title="Rodent Inspections by Borough"
      subtitle="Active infestations vs. passed · NYC DOHMH"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rodentByBorough} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar dataKey="passed" name="Passed"  fill={COLORS.green  + "99"} stackId="a" />
          <Bar dataKey="active" name="Active"  fill={COLORS.red    + "cc"} stackId="a" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Rodent Hotspots ──────────────────────────────────────────────────────────

export function RodentHotspotsChart() {
  return (
    <ChartCard
      title="Top Rat Activity Neighborhoods"
      subtitle="Confirmed active infestations · NYC 311 + DOHMH"
      tall
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...rodentHotspots].reverse()}
          layout="vertical"
          margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} />
          <YAxis type="category" dataKey="neighborhood" width={120} {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <Tooltip {...chartTheme.tooltip} />
          <Bar dataKey="active" name="Active Infestations" fill={COLORS.red + "cc"} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Noise by Borough ────────────────────────────────────────────────────────

export function NoiseByBoroughChart() {
  return (
    <ChartCard
      title="311 Noise Complaints by Borough"
      subtitle="Last 7 days · NYC Open Data"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={noiseByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Bar dataKey="complaints" name="Complaints" fill={COLORS.blue + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Noise by Type ────────────────────────────────────────────────────────────

export function NoiseByTypeChart() {
  const total = noiseByType.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard
      title="Noise Complaint Categories"
      subtitle="311 breakdown by type · last 7 days"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={noiseByType}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="count"
          >
            {noiseByType.map((entry) => (
              <Cell key={entry.type} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, name: string | undefined) =>
              v != null ? [`${v} (${Math.round((v / total) * 100)}%)`, name] : [""]
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            iconSize={8}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Food Desert by Borough ───────────────────────────────────────────────────

export function FoodDesertChart() {
  return (
    <ChartCard
      title="Food Desert Prevalence by Borough"
      subtitle="% low-access census tracts · USDA Food Access Atlas"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={foodDesertByBorough} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis domain={[0, 35]} {...chartTheme.axis} unit="%" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined) => v != null ? [`${v}%`, "Low-access tracts"] : [""]}
          />
          <Bar dataKey="pct" name="Low-Access %" fill={COLORS.orange + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

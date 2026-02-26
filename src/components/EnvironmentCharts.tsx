"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import {
  rodentByBorough as STATIC_RODENT_BOROUGH,
  rodentHotspots as STATIC_HOTSPOTS,
  noiseByBorough as STATIC_NOISE_BOROUGH,
  noiseByType    as STATIC_NOISE_TYPE,
  foodDesertByBorough as STATIC_FOOD_DESERT,
  COLORS,
} from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

type RodentBoroughRow = { borough: string; total: number; active: number; passed: number };
type NoiseBoroughRow  = { borough: string; complaints: number };
type NoiseTypeRow     = { type: string; count: number; fill: string };

// ─── Rodent by Borough ────────────────────────────────────────────────────────

export function RodentByBoroughChart({ data = STATIC_RODENT_BOROUGH }: { data?: RodentBoroughRow[] }) {
  return (
    <ChartCard title="Rodent Inspections by Borough" subtitle="Active infestations vs. passed · last 30 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip {...chartTheme.tooltip} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
          <Bar dataKey="passed" name="Passed" fill={COLORS.green  + "99"} stackId="a" />
          <Bar dataKey="active" name="Active"  fill={COLORS.red    + "cc"} stackId="a" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Rodent Hotspots (static — no neighborhood-level API) ─────────────────────

export function RodentHotspotsChart() {
  return (
    <ChartCard title="Top Rat Activity Neighborhoods" subtitle="Confirmed active infestations · NYC 311 + DOHMH" tall>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...STATIC_HOTSPOTS].reverse()}
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

// ─── Noise by Borough ─────────────────────────────────────────────────────────

export function NoiseByBoroughChart({ data = STATIC_NOISE_BOROUGH }: { data?: NoiseBoroughRow[] }) {
  return (
    <ChartCard title="311 Noise Complaints by Borough" subtitle="Last 7 days · NYC Open Data">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
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

export function NoiseByTypeChart({ data = STATIC_NOISE_TYPE }: { data?: NoiseTypeRow[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <ChartCard title="Noise Complaint Categories" subtitle="311 breakdown by type · last 7 days">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="count">
            {data.map((entry) => (
              <Cell key={entry.type} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, name: string | undefined) =>
              v != null ? [`${v} (${Math.round((v / total) * 100)}%)`, name] : [""]
            }
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Food Desert by Borough (static) ─────────────────────────────────────────

export function FoodDesertChart() {
  return (
    <ChartCard title="Food Desert Prevalence by Borough" subtitle="% low-access census tracts · USDA Food Access Atlas">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={STATIC_FOOD_DESERT} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis domain={[0, 35]} {...chartTheme.axis} unit="%" />
          <Tooltip {...chartTheme.tooltip} formatter={(v: number | undefined) => v != null ? [`${v}%`, "Low-access tracts"] : [""]} />
          <Bar dataKey="pct" name="Low-Access %" fill={COLORS.orange + "cc"} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

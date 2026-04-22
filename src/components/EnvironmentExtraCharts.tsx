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
} from "recharts";
import { ChartCard } from "./ChartCard";
import { chartTheme } from "@/lib/chartTheme";
import type { DogBiteByBorough, EmsResponseBorough, BeachWaterRow } from "@/lib/liveData";

const BOROUGH_COLORS: Record<string, string> = {
  Bronx: "#EE352E",
  Brooklyn: "#FF6319",
  Manhattan: "#2850AD",
  Queens: "#B933AD",
  "Staten Is.": "#6CBE45",
  "Staten Island": "#6CBE45",
};

// ─── Dog Bites by Borough ────────────────────────────────────────────────────

export function DogBiteChart({ data, lastUpdated }: { data: DogBiteByBorough[]; lastUpdated?: string }) {
  return (
    <ChartCard
      title="Dog Bite Reports by Borough"
      subtitle="Last 12 months · DOHMH Animal Bite Data"
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, _name: string | undefined, props: { payload?: DogBiteByBorough }) => {
              if (v == null) return [""];
              const breed = props.payload?.topBreed ?? "";
              return [`${v.toLocaleString()} reports${breed ? ` · Top breed: ${breed}` : ""}`, "Bites"];
            }}
          />
          <Bar dataKey="count" name="Reports" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.borough} fill={BOROUGH_COLORS[entry.borough] ?? "#5b9cf5"} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── EMS Response Time by Borough ────────────────────────────────────────────

export function EmsResponseChart({ data, lastUpdated }: { data: EmsResponseBorough[]; lastUpdated?: string }) {
  const chartData = data.map((d) => ({
    ...d,
    avgMinutes: Math.round(d.avgResponseSec / 6) / 10, // to 1 decimal minutes
  }));

  return (
    <ChartCard
      title="EMS Response Time by Borough"
      subtitle="Average time to scene · Last 12 months · NYC Open Data"
      tag="LIVE"
      lastUpdated={lastUpdated}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid {...chartTheme.grid} vertical={false} />
          <XAxis dataKey="borough" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
          <YAxis {...chartTheme.axis} unit=" min" />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, _name: string | undefined, props: { payload?: typeof chartData[number] }) => {
              if (v == null) return [""];
              const mins = Math.floor(v);
              const secs = Math.round((v - mins) * 60);
              const incidents = props.payload?.incidents;
              return [`${mins}m ${secs}s${incidents ? ` · ${incidents.toLocaleString()} incidents` : ""}`, "Avg Response"];
            }}
          />
          <Bar dataKey="avgMinutes" name="Avg Response" radius={[3, 3, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.borough} fill={BOROUGH_COLORS[entry.borough] ?? "#5b9cf5"} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Beach Water Quality ─────────────────────────────────────────────────────

export function BeachWaterChart({ data, lastUpdated }: { data: BeachWaterRow[]; lastUpdated?: string }) {
  const chartData = data.slice(0, 12);
  const EPA_LIMIT = 104;

  return (
    <ChartCard
      title="Beach Water Quality"
      subtitle={`Avg enterococci (MPN/100ml) · EPA advisory threshold = ${EPA_LIMIT}`}
      tag="LIVE"
      lastUpdated={lastUpdated}
      tall
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...chartData].reverse()}
          layout="vertical"
          margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
        >
          <CartesianGrid {...chartTheme.grid} horizontal={false} />
          <XAxis type="number" {...chartTheme.axis} />
          <YAxis
            type="category"
            dataKey="beach"
            width={150}
            {...chartTheme.axis}
            tick={{ ...chartTheme.axis.tick, fontSize: 9 }}
          />
          <Tooltip
            {...chartTheme.tooltip}
            formatter={(v: number | undefined, _name: string | undefined, props: { payload?: BeachWaterRow }) => {
              if (v == null) return [""];
              const row = props.payload;
              const status = v > EPA_LIMIT ? "Above EPA limit" : "Within safe range";
              return [`${v} MPN/100ml · ${status}${row?.borough ? ` · ${row.borough}` : ""}`, "Enterococci"];
            }}
          />
          <Bar dataKey="avgEnterococci" name="Avg Enterococci" radius={[0, 3, 3, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.beach}
                fill={entry.safe ? "#22d3ee" : "#f07070"}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

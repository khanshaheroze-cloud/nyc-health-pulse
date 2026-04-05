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
  ReferenceLine,
} from "recharts";
import { BOROUGH_COLORS } from "@/lib/data";
import { chartTheme } from "@/lib/chartTheme";

const boroughs = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."] as const;
const boroughColors = boroughs.map((b) => BOROUGH_COLORS[b]);
const boroughOpacities = ["ee", "cc", "aa", "dd", "bb"] as const;

interface Props {
  chronicOutcomes: { measure: string; [k: string]: string | number }[];
  inactivityData: { borough: string; pct: number }[];
}

export function OverviewBoroughCharts({ chronicOutcomes, inactivityData }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Chronic Disease Outcomes */}
      <div className="rounded-2xl bg-surface border border-border-light overflow-hidden">
        <div className="p-4 pb-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-text">Chronic Disease by Borough</p>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-hp-green bg-hp-green/10 px-1.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" /> LIVE</span>
          </div>
          <p className="text-[10px] text-dim mt-0.5">CDC PLACES estimates, % of adults</p>
        </div>
        <div className="h-[260px] px-2 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chronicOutcomes} barGap={1}>
              <CartesianGrid {...chartTheme.grid} vertical={false} />
              <XAxis dataKey="measure" {...chartTheme.axis} tick={{ ...chartTheme.axis.tick, fontSize: 10 }} />
              <YAxis {...chartTheme.axis} unit="%" />
              <Tooltip
                {...chartTheme.tooltip}
                formatter={(v: number | undefined) => v != null ? [`${v}%`] : [""]}
              />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} iconSize={8} />
              {boroughs.map((b, i) => (
                <Bar key={b} dataKey={b} fill={boroughColors[i] + boroughOpacities[i]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Physical Inactivity */}
      <div className="rounded-2xl bg-surface border border-border-light overflow-hidden">
        <div className="p-4 pb-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-text">Physical Inactivity by Borough</p>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-hp-green bg-hp-green/10 px-1.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" /> LIVE</span>
          </div>
          <p className="text-[10px] text-dim mt-0.5">% of adults with no leisure-time physical activity</p>
        </div>
        <div className="h-[260px] px-2 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inactivityData} layout="vertical" barSize={28}>
              <CartesianGrid {...chartTheme.grid} horizontal={false} />
              <XAxis type="number" {...chartTheme.axis} unit="%" domain={[0, 40]} />
              <YAxis type="category" dataKey="borough" {...chartTheme.axis} width={80} tick={{ ...chartTheme.axis.tick, fontSize: 11 }} />
              <Tooltip
                {...chartTheme.tooltip}
                formatter={(v: number | undefined) => v != null ? [`${v}%`, "Inactive"] : [""]}
              />
              <ReferenceLine x={28.8} stroke="#f59e42" strokeDasharray="4 3" label={{ value: "NYC avg", position: "top", fontSize: 9, fill: "#f59e42" }} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {inactivityData.map((entry, i) => {
                  const color = BOROUGH_COLORS[entry.borough as keyof typeof BOROUGH_COLORS] || "#4A7C59";
                  return <Cell key={i} fill={color + "cc"} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="px-4 pb-3">
          <p className="text-[9px] text-muted">Bronx has the highest inactivity rate — highlighting the need for accessible fitness options and healthier eating.</p>
        </div>
      </div>
    </div>
  );
}

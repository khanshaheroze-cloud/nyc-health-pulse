"use client";

import { useState, useEffect } from "react";

interface HeatComplaintData {
  total: number;
  byBorough: { borough: string; count: number }[];
  isHeatSeason: boolean;
}

const BOROUGH_COLORS: Record<string, string> = {
  BRONX: "bg-[#EE352E]",
  BROOKLYN: "bg-[#FF6319]",
  MANHATTAN: "bg-[#2850AD]",
  QUEENS: "bg-[#B933AD]",
  "STATEN ISLAND": "bg-[#6CBE45]",
};

function BoroughBar({ borough, count, max }: { borough: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const color = BOROUGH_COLORS[borough.toUpperCase()] ?? "bg-hp-blue";
  const label = borough
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-dim w-24 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-3.5 bg-border/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold w-10 text-right flex-shrink-0">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

export function HeatColdSafety() {
  const [data, setData] = useState<HeatComplaintData | null>(null);

  useEffect(() => {
    fetch("/api/heat-complaints")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d) setData(d as HeatComplaintData);
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const maxCount = data.byBorough.length > 0
    ? Math.max(...data.byBorough.map((b) => b.count))
    : 0;

  if (data.isHeatSeason) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">No-Heat Complaints This Week</h3>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
            <span className="text-[10px] text-hp-green font-semibold">LIVE · 311</span>
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-display font-bold text-[32px] leading-tight text-hp-orange">
            {data.total.toLocaleString()}
          </span>
          <span className="text-[12px] text-dim">complaints citywide</span>
        </div>

        {data.byBorough.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-4">
            {data.byBorough.map((b) => (
              <BoroughBar key={b.borough} borough={b.borough} count={b.count} max={maxCount} />
            ))}
          </div>
        )}

        <div className="border-t border-border pt-3 flex flex-col gap-2">
          <p className="text-[12px] text-dim">
            Your landlord must provide heat (68&deg;F+ day, 62&deg;F+ night) Oct 1 &ndash; May 31.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://portal.311.nyc.gov/article/?kanession=category&selectedCategoryId=702"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-hp-blue hover:underline"
            >
              File a heat complaint &rarr; 311
            </a>
            <a
              href="https://www.nyc.gov/site/hpd/services-and-information/emergency-repair-program.page"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-hp-blue hover:underline"
            >
              HPD Emergency Repair Program &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Summer mode (Jun 1 – Sep 30)
  return (
    <div className="bg-surface border border-border rounded-xl p-4 mt-4">
      <h3 className="text-sm font-bold mb-2">Heat Safety</h3>
      <p className="text-[12px] text-dim mb-3">
        NYC experiences dangerous heat waves each summer. Heat is the #1 weather-related cause of death.
        Check on elderly and vulnerable neighbors during heat advisories.
      </p>

      <div className="border-t border-border pt-3 flex flex-col gap-2">
        <p className="text-[12px] text-dim">
          Stay cool: NYC cooling centers open during heat emergencies.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://www.nyc.gov/site/doh/health/health-topics/climate-and-health-heat.page"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-semibold text-hp-blue hover:underline"
          >
            Find a cooling center &rarr; nyc.gov
          </a>
          <span className="text-[12px] text-dim">
            Check on elderly neighbors during heat waves
          </span>
        </div>
      </div>
    </div>
  );
}

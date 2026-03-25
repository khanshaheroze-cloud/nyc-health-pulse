"use client";

import type { PollenForecast } from "@/lib/liveData";

const LEVEL_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  "None":      { dot: "bg-gray-300",     bg: "bg-gray-50",       text: "text-gray-500" },
  "Low":       { dot: "bg-hp-green",     bg: "bg-hp-green/10",   text: "text-hp-green" },
  "Moderate":  { dot: "bg-hp-yellow",    bg: "bg-hp-yellow/10",  text: "text-hp-yellow" },
  "High":      { dot: "bg-hp-orange",    bg: "bg-hp-orange/10",  text: "text-hp-orange" },
  "Very High": { dot: "bg-hp-red",       bg: "bg-hp-red/10",     text: "text-hp-red" },
};

function levelStyle(level: string) {
  return LEVEL_COLORS[level] ?? LEVEL_COLORS["None"];
}

function LevelDot({ level }: { level: string }) {
  const s = levelStyle(level);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
      <span className={`text-[12px] font-semibold ${s.text}`}>{level}</span>
    </span>
  );
}

interface PollenCardProps {
  data: PollenForecast;
}

export function PollenCard({ data }: PollenCardProps) {
  const overall = levelStyle(data.level);

  return (
    <div className="bg-surface border border-border-light rounded-3xl p-6 overflow-hidden relative">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl ${overall.dot}`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[16px]" role="img" aria-label="pollen">🌿</span>
          <div>
            <h3 className="text-[13px] font-bold">Pollen &amp; Allergy Forecast</h3>
            <p className="text-[10px] text-muted">NYC Metro Area</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${overall.bg} ${overall.text}`}>
          <span className={`w-2 h-2 rounded-full ${overall.dot}`} />
          {data.level}
        </span>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[1px] uppercase text-dim mb-1">Tree</p>
          <LevelDot level={data.tree} />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[1px] uppercase text-dim mb-1">Grass</p>
          <LevelDot level={data.grass} />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[1px] uppercase text-dim mb-1">Weed</p>
          <LevelDot level={data.weed} />
        </div>
      </div>

      {/* Top allergens */}
      {data.topAllergens && (
        <div className="bg-hp-orange/5 border border-hp-orange/15 rounded-lg px-3 py-2 mb-3">
          <p className="text-[10px] font-bold text-hp-orange uppercase tracking-[1px] mb-0.5">Top Allergens</p>
          <p className="text-[12px] font-semibold text-text">{data.topAllergens}</p>
        </div>
      )}

      {/* Note */}
      <p className="text-[11px] text-dim leading-relaxed mb-2">{data.note}</p>

      {/* Source */}
      <p className="text-[9px] text-muted">
        {data.source === "tomorrow.io"
          ? "Source: Tomorrow.io Pollen API"
          : "Seasonal estimate \u00b7 Live pollen API coming soon"}
      </p>
    </div>
  );
}

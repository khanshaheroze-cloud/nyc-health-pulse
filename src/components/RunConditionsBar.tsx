"use client";

import type { RunConditions } from "@/lib/runScoring";

const AQI_COLOR: Record<string, string> = {
  Good: "text-hp-green",
  Moderate: "text-hp-yellow",
  "Unhealthy for Sensitive Groups": "text-hp-orange",
  Unhealthy: "text-hp-red",
  "Very Unhealthy": "text-hp-red",
  Hazardous: "text-hp-red",
};

export function RunConditionsBar({
  conditions,
  cityScore,
  headline,
  pollen,
}: {
  conditions: RunConditions;
  cityScore: number;
  headline: string;
  pollen: { level: string; topAllergens: string[] } | null;
}) {
  const scoreColor =
    cityScore >= 75
      ? "text-hp-green"
      : cityScore >= 55
        ? "text-hp-blue"
        : cityScore >= 40
          ? "text-hp-yellow"
          : "text-hp-red";

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 mb-4 animate-fade-in-up">
      {/* Top row: score + headline */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col items-center">
          <span className={`text-3xl font-extrabold ${scoreColor} font-display`}>{cityScore}</span>
          <span className="text-[10px] text-muted">/100</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-text">{headline}</p>
          <p className="text-[11px] text-dim mt-0.5">
            Based on real-time AQI, weather, UV, and time of day
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
          <span className="text-[10px] font-semibold tracking-widest text-hp-green">LIVE</span>
        </div>
      </div>

      {/* Condition tiles — 4 glass-morphism tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* AQI tile */}
        <div className="bg-surface-sage/80 border border-border rounded-xl p-3 text-center">
          <p className="text-lg mb-0.5">🌬️</p>
          <p className={`text-[18px] font-extrabold ${AQI_COLOR[conditions.aqiCategory] ?? "text-text"}`}>
            {conditions.aqi ?? "—"}
          </p>
          <p className="text-[10px] text-muted font-semibold">AQI</p>
        </div>

        {/* Temperature tile */}
        <div className="bg-surface-sage/80 border border-border rounded-xl p-3 text-center">
          <p className="text-lg mb-0.5">🌡️</p>
          <p className="text-[18px] font-extrabold text-text">
            {conditions.tempF !== null ? `${Math.round(conditions.tempF)}°` : "—"}
          </p>
          <p className="text-[10px] text-muted font-semibold">
            {conditions.feelsLikeF !== null && conditions.feelsLikeF !== conditions.tempF
              ? `Feels ${Math.round(conditions.feelsLikeF)}°`
              : "Temperature"}
          </p>
        </div>

        {/* Pollen tile */}
        <div className="bg-surface-sage/80 border border-border rounded-xl p-3 text-center">
          <p className="text-lg mb-0.5">🌿</p>
          <p className={`text-[18px] font-extrabold ${
            pollen?.level === "High" || pollen?.level === "Very High" ? "text-hp-orange" : "text-text"
          }`}>
            {pollen?.level ?? "—"}
          </p>
          <p className="text-[10px] text-muted font-semibold">Pollen</p>
        </div>

        {/* Overall conditions tile */}
        <div className={`border rounded-xl p-3 text-center ${
          cityScore >= 70
            ? "bg-hp-green/8 border-hp-green/20"
            : cityScore >= 50
              ? "bg-hp-blue/8 border-hp-blue/20"
              : "bg-hp-yellow/8 border-hp-yellow/20"
        }`}>
          <p className="text-lg mb-0.5">🏃</p>
          <p className={`text-[18px] font-extrabold ${scoreColor}`}>
            {cityScore >= 70 ? "Great" : cityScore >= 50 ? "Fair" : "Poor"}
          </p>
          <p className="text-[10px] text-muted font-semibold">Run Conditions</p>
        </div>
      </div>

      {/* Extra condition chips */}
      <div className="flex flex-wrap gap-1.5">
        {conditions.uvIndex !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-border text-[10px] text-dim">
            ☀️ UV {conditions.uvIndex}
          </span>
        )}
        {conditions.windMph !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-border text-[10px] text-dim">
            💨 {Math.round(conditions.windMph)} mph
          </span>
        )}
        {conditions.humidity !== null && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-border text-[10px] text-dim">
            💧 {conditions.humidity}%
          </span>
        )}
        {conditions.weatherLabel && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-border text-[10px] text-dim">
            ☁️ {conditions.weatherLabel}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface AqiObservation {
  ParameterName: string;
  AQI: number;
  Category: { Number: number; Name: string };
  ReportingArea: string;
  DateObserved: string;
  HourObserved: number;
}

interface ApiResponse {
  observations: AqiObservation[];
  timestamp: string;
  error?: string;
}

function aqiColor(category: number): string {
  if (category <= 1) return "#2dd4a0"; // Good
  if (category === 2) return "#f5c542"; // Moderate
  if (category === 3) return "#f59e42"; // USG
  if (category === 4) return "#f07070"; // Unhealthy
  return "#a78bfa"; // Very Unhealthy / Hazardous
}

function aqiBg(category: number): string {
  if (category <= 1) return "rgba(45,212,160,.12)";
  if (category === 2) return "rgba(245,197,66,.12)";
  if (category === 3) return "rgba(245,158,66,.12)";
  if (category === 4) return "rgba(240,112,112,.12)";
  return "rgba(167,139,250,.12)";
}

export function AirNowWidget() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/airnow")
      .then((r) => r.json())
      .then((json: ApiResponse) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError("Could not reach AirNow API"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 mb-4 animate-pulse">
        <div className="h-4 bg-border rounded w-32 mb-3" />
        <div className="h-8 bg-border rounded w-24 mb-2" />
        <div className="h-3 bg-border rounded w-48" />
      </div>
    );
  }

  if (error || !data || data.observations.length === 0) {
    return (
      <div className="bg-surface border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-xl p-4 mb-4">
        <h3 className="text-sm font-bold mb-1">EPA AirNow — Live AQI</h3>
        <p className="text-xs text-dim">
          {error === "AIRNOW_API_KEY not configured"
            ? "Add your AirNow API key to .env.local as AIRNOW_API_KEY to enable live data."
            : (error ?? "No observations returned. Data may not be available for this hour.")}
        </p>
        <p className="text-[10px] text-muted mt-2">
          Get a free key at{" "}
          <span className="text-hp-cyan">airnow.gov/get-started</span>
        </p>
      </div>
    );
  }

  // Deduplicate by parameter, take highest AQI per param
  const byParam = new Map<string, AqiObservation>();
  for (const obs of data.observations) {
    const existing = byParam.get(obs.ParameterName);
    if (!existing || obs.AQI > existing.AQI) byParam.set(obs.ParameterName, obs);
  }
  const dominant = [...byParam.values()].sort((a, b) => b.AQI - a.AQI)[0];
  const { Category } = dominant;

  return (
    <div
      className="rounded-xl p-5 mb-4 border"
      style={{
        background: aqiBg(Category.Number),
        borderColor: aqiColor(Category.Number) + "44",
      }}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-dim mb-0.5">
            Live AQI — EPA AirNow
          </p>
          <p className="text-[10px] text-muted mb-2">
            {dominant.ReportingArea} · {dominant.DateObserved} {dominant.HourObserved}:00
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-display font-bold text-5xl leading-none"
              style={{ color: aqiColor(Category.Number) }}
            >
              {dominant.AQI}
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: aqiColor(Category.Number) }}>
                {Category.Name}
              </p>
              <p className="text-[11px] text-dim">Dominant: {dominant.ParameterName}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[120px]">
          {[...byParam.values()].map((obs) => (
            <div key={obs.ParameterName} className="text-right">
              <span className="text-[10px] text-dim">{obs.ParameterName} </span>
              <span
                className="text-sm font-bold font-display"
                style={{ color: aqiColor(obs.Category.Number) }}
              >
                {obs.AQI}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted mt-3">
        Updated hourly · AQI scale: 0–50 Good · 51–100 Moderate · 101–150 Unhealthy for Sensitive Groups · 151+ Unhealthy
      </p>
    </div>
  );
}

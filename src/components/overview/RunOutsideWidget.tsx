"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CityScore {
  score: number;
  headline: string;
}

interface Conditions {
  aqi: number | null;
  tempF: number | null;
  weatherLabel: string | null;
  uvIndex: number | null;
}

interface RunOutsideWidgetProps {
  /** Server-fetched AQI — used as initial value so homepage numbers stay consistent */
  serverAqi?: number | null;
  /** Server-fetched UV index */
  serverUV?: number | null;
}

export function RunOutsideWidget({ serverAqi, serverUV }: RunOutsideWidgetProps = {}) {
  const [city, setCity] = useState<CityScore | null>(null);
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/run-conditions")
      .then((r) => r.json())
      .then((d) => {
        if (d.city) setCity(d.city);
        if (d.conditions) setConditions(d.conditions);
      })
      .catch(() => {});
  }, []);

  if (!mounted) return <div className="rounded-2xl bg-surface border border-border-light p-6 h-[200px]" />;

  const score = city?.score ?? null;
  const verdictLabel =
    score === null ? "Loading…"
    : score >= 80 ? "Perfect"
    : score >= 65 ? "Great"
    : score >= 50 ? "Decent"
    : score >= 35 ? "Caution"
    : "Stay Inside";

  const verdictColor =
    score === null ? "text-muted"
    : score >= 80 ? "text-good"
    : score >= 65 ? "text-accent"
    : score >= 50 ? "text-caution"
    : "text-alert";

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-6 border-l-4 border-l-hp-green">
      <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-3">
        🏃 Should I Run Outside?
      </p>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className={`text-[22px] font-display ${verdictColor}`}>{verdictLabel}</p>
          {city && <p className="text-[11px] text-dim mt-0.5">{city.headline}</p>}
        </div>
        {score !== null && (
          <div className="text-right">
            <p className="font-display text-[28px] text-text leading-none">{score}</p>
            <p className="text-[9px] text-muted mt-0.5">/ 100</p>
          </div>
        )}
      </div>

      {/* Quick stats — prefer server-provided AQI/UV for homepage consistency */}
      {(conditions || serverAqi != null) && (
        <div className="flex flex-wrap gap-3 text-[11px] text-dim mb-4">
          {(conditions?.tempF ?? null) !== null && <span>🌡️ {conditions!.tempF}°F</span>}
          {(serverAqi ?? conditions?.aqi ?? null) !== null && (
            <span data-aqi-source="server-unified">🌬️ AQI {serverAqi ?? conditions!.aqi}</span>
          )}
          {(serverUV ?? conditions?.uvIndex ?? null) !== null && (
            <span>☀️ UV {serverUV ?? conditions!.uvIndex}</span>
          )}
          {conditions?.weatherLabel && <span>🌤️ {conditions.weatherLabel}</span>}
        </div>
      )}

      <Link
        href="/run-outside"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border-light text-[13px] font-semibold text-dim hover:border-accent/30 hover:text-text transition-colors"
      >
        Check Full Conditions →
      </Link>
    </div>
  );
}

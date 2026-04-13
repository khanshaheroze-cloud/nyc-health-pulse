"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ── Types matching /api/run-conditions response ─────────── */

interface RunConditions {
  aqi: number | null;
  aqiCategory: string;
  uvIndex: number | null;
  tempF: number | null;
  feelsLikeF: number | null;
  humidity: number | null;
  windMph: number | null;
  weatherLabel: string | null;
  hour: number;
}

interface CityScore {
  score: number;
  headline: string;
}

interface ScoredRoute {
  name: string;
  borough: string;
  distanceMi: number;
  difficulty: string;
  surface: string;
  score: number;
  scoreBreakdown: { airQuality: number; safety: number; scenery: number; terrain: number };
  reasons: string[];
  bestFor: string;
}

interface ApiResponse {
  conditions: RunConditions;
  city: CityScore;
  routes: ScoredRoute[];
  pollen: { level: string; topAllergens?: string } | null;
  updatedAt: string;
}

/* ── Verdict helpers ─────────────────────────────────────── */

type Verdict = "Perfect" | "Great" | "Decent" | "Caution" | "Stay Inside";

function getVerdict(score: number): { verdict: Verdict; cssClass: string } {
  if (score >= 80) return { verdict: "Perfect", cssClass: "text-good" };
  if (score >= 65) return { verdict: "Great", cssClass: "text-accent" };
  if (score >= 50) return { verdict: "Decent", cssClass: "text-caution" };
  if (score >= 35) return { verdict: "Caution", cssClass: "text-alert" };
  return { verdict: "Stay Inside", cssClass: "text-alert" };
}

function verdictStroke(score: number): string {
  if (score >= 80) return "var(--color-good)";
  if (score >= 65) return "var(--color-accent)";
  if (score >= 50) return "var(--color-caution)";
  return "var(--color-alert)";
}

/* ── Factor card data ────────────────────────────────────── */

interface Factor {
  icon: string;
  label: string;
  value: string;
  score: number;
  tip: string;
}

function buildFactors(c: RunConditions): Factor[] {
  const factors: Factor[] = [];

  // Air Quality
  const aqi = c.aqi ?? 50;
  const aqiScore = aqi <= 50 ? 100 : aqi <= 100 ? 70 : aqi <= 150 ? 30 : 0;
  factors.push({
    icon: "🌬️",
    label: "Air Quality",
    value: `AQI ${aqi}`,
    score: aqiScore,
    tip: aqi <= 50 ? "Clean air — breathe easy" : aqi <= 100 ? "Moderate — sensitive groups take care" : "Poor — consider indoor exercise",
  });

  // Temperature
  const temp = c.feelsLikeF ?? c.tempF ?? 65;
  const tempScore = (temp >= 45 && temp <= 65) ? 100 : (temp >= 35 && temp <= 75) ? 70 : (temp >= 25 && temp <= 85) ? 40 : 10;
  factors.push({
    icon: "🌡️",
    label: "Temperature",
    value: `${Math.round(temp)}°F feels like`,
    score: tempScore,
    tip: tempScore >= 70 ? "Ideal running temperature" : temp < 35 ? "Very cold — layer up" : "Hot — hydrate frequently",
  });

  // Wind
  const wind = c.windMph ?? 5;
  const windScore = wind <= 10 ? 100 : wind <= 20 ? 60 : 20;
  factors.push({
    icon: "💨",
    label: "Wind",
    value: `${wind} mph`,
    score: windScore,
    tip: wind <= 10 ? "Calm winds" : wind <= 20 ? "Breezy — routes with tree cover help" : "Strong gusts — choose sheltered routes",
  });

  // UV Index
  const uv = c.uvIndex ?? 3;
  const uvScore = uv <= 3 ? 100 : uv <= 6 ? 65 : uv <= 8 ? 35 : 10;
  factors.push({
    icon: "☀️",
    label: "UV Index",
    value: `${uv}`,
    score: uvScore,
    tip: uv <= 3 ? "Low UV — no special protection needed" : uv <= 6 ? "Moderate — sunscreen recommended" : "High UV — hat, sunscreen, and shaded routes",
  });

  // Humidity
  const hum = c.humidity ?? 50;
  const humScore = hum <= 60 ? 100 : hum <= 75 ? 60 : 25;
  factors.push({
    icon: "💧",
    label: "Humidity",
    value: `${hum}%`,
    score: humScore,
    tip: hum <= 60 ? "Comfortable moisture level" : hum <= 75 ? "Humid — you'll sweat more" : "Very humid — high heat stress risk",
  });

  return factors;
}

function factorBarColor(score: number): string {
  if (score >= 70) return "var(--color-good)";
  if (score >= 50) return "var(--color-caution)";
  return "var(--color-alert)";
}

/* ── Smart advice ────────────────────────────────────────── */

function buildAdvice(c: RunConditions, score: number, pollen: ApiResponse["pollen"]): string[] {
  const tips: string[] = [];

  // Time of day
  if (c.hour >= 11 && c.hour <= 15) tips.push("Early morning (6-9 AM) or evening (6-8 PM) offers cooler, calmer conditions.");
  if (c.hour >= 5 && c.hour <= 9) tips.push("You're in the prime running window — temperatures are ideal right now.");

  // AQI
  if (c.aqi !== null && c.aqi > 100) tips.push("AQI is elevated — shorten your run or choose a park route with tree canopy.");
  else if (c.aqi !== null && c.aqi > 50) tips.push("Air quality is moderate — sensitive individuals should watch for symptoms.");

  // Temperature
  const t = c.feelsLikeF ?? c.tempF;
  if (t !== null && t > 80) tips.push("Heat risk — hydrate before, during, and after. Wear light, breathable clothing.");
  if (t !== null && t < 35) tips.push("Cold conditions — warm up indoors first. Layer with moisture-wicking base.");

  // Wind
  if (c.windMph !== null && c.windMph > 15) tips.push("Windy day — start your run into the wind so you have a tailwind coming home.");

  // UV
  if (c.uvIndex !== null && c.uvIndex > 6) tips.push("High UV — apply SPF 30+ sunscreen and wear a hat or visor.");

  // Pollen
  if (pollen && (pollen.level === "High" || pollen.level === "Very High")) {
    tips.push(`Pollen is ${pollen.level.toLowerCase()}${pollen.topAllergens ? ` (${pollen.topAllergens})` : ""} — antihistamine before your run may help.`);
  }

  // Score-based
  if (score >= 80 && tips.length === 0) tips.push("Perfect conditions — consider a longer route today!");
  if (score < 35) tips.push("Conditions are rough. An indoor treadmill or gym workout is the smart call today.");

  return tips;
}

/* ── Component ───────────────────────────────────────────── */

export function RunOutsideContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/run-conditions");
      if (!res.ok) throw new Error("API error");
      const json: ApiResponse = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  /* Loading */
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 rounded-2xl bg-surface-sage" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  /* Error */
  if (error || !data) {
    return (
      <div className="section-card text-center py-12">
        <p className="text-dim mb-4">Unable to load running conditions right now.</p>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="px-5 py-2 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { conditions: c, city, routes, pollen, updatedAt } = data;
  const { verdict, cssClass } = getVerdict(city.score);
  const factors = buildFactors(c);
  const advice = buildAdvice(c, city.score, pollen);
  const topRoutes = routes.slice(0, 3);
  const strokeColor = verdictStroke(city.score);
  const circumference = 2 * Math.PI * 54;
  const strokeDasharray = `${(city.score / 100) * circumference} ${circumference}`;

  return (
    <div className="space-y-6">
      {/* ── Hero: Score Ring + Verdict ── */}
      <div className="section-card flex flex-col sm:flex-row items-center gap-6 sm:gap-10 py-8 px-6">
        {/* Score ring */}
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-border-light)" strokeWidth="7" />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={strokeColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[36px] text-text leading-none">{city.score}</span>
            <span className="text-[10px] text-muted mt-0.5">Run Score</span>
          </div>
        </div>

        {/* Verdict + meta */}
        <div className="text-center sm:text-left flex-1">
          <p className={`font-display text-[28px] sm:text-[32px] leading-snug ${cssClass}`}>
            {verdict === "Perfect" && "Perfect Day to Run"}
            {verdict === "Great" && "Great Conditions"}
            {verdict === "Decent" && "Decent — Get Out There"}
            {verdict === "Caution" && "Not Ideal Today"}
            {verdict === "Stay Inside" && "Stay Inside Today"}
          </p>
          <p className="text-[14px] text-dim mt-2">{city.headline}</p>

          {/* Quick stats strip */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4 text-[12px] text-dim">
            {c.tempF !== null && <span>🌡️ {c.tempF}°F</span>}
            {c.aqi !== null && <span>🌬️ AQI {c.aqi}</span>}
            {c.windMph !== null && <span>💨 {c.windMph} mph</span>}
            {c.weatherLabel && <span>🌤️ {c.weatherLabel}</span>}
            {pollen && <span>🌿 Pollen: {pollen.level}</span>}
          </div>

          <p className="text-[10px] text-muted mt-3">
            Updated {new Date(updatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            {" · "}
            <button onClick={() => { setLoading(true); fetchData(); }} className="text-accent hover:underline">
              Refresh
            </button>
          </p>
        </div>
      </div>

      {/* ── Warning banner ── */}
      {c.aqi !== null && c.aqi > 100 && (
        <div className="bg-alert/8 border border-alert/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-[13px] font-bold text-alert">
              {c.aqi > 150 ? "Hazardous Air Quality" : "Unhealthy Air Quality"}
            </p>
            <p className="text-[11px] text-dim mt-1">
              {c.aqi > 150
                ? "Avoid outdoor exercise. Indoor workout strongly recommended."
                : "Sensitive groups should limit outdoor activity. Consider shorter routes through parks."}
            </p>
          </div>
        </div>
      )}

      {/* ── Factor Breakdown ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Conditions Breakdown</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {factors.map((f) => (
            <div key={f.label} className="bg-surface border border-border-light rounded-2xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{f.icon}</span>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wide">{f.label}</span>
              </div>
              <p className="text-[15px] font-bold text-text mb-2">{f.value}</p>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-border-light mb-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${f.score}%`, backgroundColor: factorBarColor(f.score) }}
                />
              </div>
              <p className="text-[10px] text-dim leading-snug">{f.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Smart Advice ── */}
      {advice.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Smart Advice</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {advice.map((tip, i) => (
              <div key={i} className="bg-surface border-l-4 border-l-accent rounded-xl p-4">
                <p className="text-[13px] text-text leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Routes Right Now ── */}
      {city.score >= 35 && topRoutes.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Best Routes Right Now</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topRoutes.map((route, i) => (
              <div key={route.name} className="bg-surface border border-border-light rounded-2xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-accent bg-accent/8 px-2 py-0.5 rounded-full">
                    #{i + 1}
                  </span>
                  <span className="text-[18px] font-display text-text">{route.score}</span>
                </div>
                <p className="text-[13px] font-bold text-text leading-snug mb-1">{route.name}</p>
                <p className="text-[11px] text-dim">{route.borough} · {route.distanceMi} mi · {route.difficulty}</p>
                {route.reasons.length > 0 && (
                  <p className="text-[10px] text-muted mt-2 italic">{route.reasons[0]}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <Link
              href="/run-routes"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors"
            >
              Explore All Routes →
            </Link>
          </div>
        </div>
      )}

      {/* ── Hourly Forecast Strip ── */}
      {c.tempF !== null && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Next 6 Hours</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex gap-2 min-w-max">
              {Array.from({ length: 6 }).map((_, i) => {
                const hour = (c.hour + i) % 24;
                const isNow = i === 0;
                // Simple estimate: temp drops ~1°F per hour after peak
                const estTemp = Math.round((c.tempF ?? 65) - i * (c.hour >= 14 ? 1 : -0.5));
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 rounded-xl border text-center px-4 py-3 min-w-[90px] ${
                      isNow ? "bg-accent/6 border-accent/20" : "bg-surface border-border-light"
                    }`}
                  >
                    <p className="text-[11px] font-bold text-text mb-1">
                      {isNow ? "Now" : `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "am" : "pm"}`}
                    </p>
                    <p className="text-[13px] font-bold text-text">{estTemp}°F</p>
                    {c.aqi !== null && (
                      <div
                        className="w-2 h-2 rounded-full mx-auto mt-1.5"
                        style={{
                          backgroundColor: c.aqi <= 50 ? "var(--color-good)" : c.aqi <= 100 ? "var(--color-caution)" : "var(--color-alert)",
                        }}
                        title={`AQI ${c.aqi}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Data Sources ── */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
        <p className="text-[10px] text-hp-green font-semibold">
          Powered by EPA AirNow · Open-Meteo Weather · NYPD Collisions · NYC Open Data
        </p>
      </div>
    </div>
  );
}

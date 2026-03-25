"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { UnifiedSearch } from "./UnifiedSearch";
import type { Route } from "@/lib/routes";

/* ── Count-up hook ─────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Props {
  aqi: number | null;
  aqiCategory: string | null;
  pollen: { level: string; topAllergens?: string } | null;
  uvIndex: number | null;
  tempF: number | null;
  feelsLikeF: number | null;
  weatherLabel: string | null;
  humidity: number | null;
  windMph: number | null;
  suggestedRoute: Route | null;
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function aqiColor(aqi: number) {
  if (aqi <= 50)  return { ring: "#4A7C59", text: "#4A7C59", label: "Good" };
  if (aqi <= 100) return { ring: "#C4964A", text: "#C4964A", label: "Moderate" };
  if (aqi <= 150) return { ring: "#C45A4A", text: "#C45A4A", label: "USG" };
  return           { ring: "#C45A4A", text: "#C45A4A", label: "Unhealthy" };
}

function uvLabel(uv: number) {
  if (uv <= 2)  return { text: "Low",       color: "#4A7C59" };
  if (uv <= 5)  return { text: "Moderate",   color: "#C4964A" };
  if (uv <= 7)  return { text: "High",       color: "#C4704A" };
  if (uv <= 10) return { text: "Very High",  color: "#C45A4A" };
  return         { text: "Extreme",    color: "#7c3aed" };
}

function pollenColor(level: string) {
  if (level === "None" || level === "Low") return "#4A7C59";
  if (level === "Moderate") return "#C4964A";
  return "#C45A4A";
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function timeGreeting(): string {
  const tod = getTimeOfDay();
  if (tod === "morning") return "Good morning";
  if (tod === "afternoon") return "Good afternoon";
  if (tod === "evening") return "Good evening";
  return "Tonight";
}

function buildAdvice(aqi: number | null, pollen: { level: string } | null, uv: number | null, tempF: number | null): { verdict: string; tips: string[]; good: boolean } {
  const tips: string[] = [];
  let bad = 0;
  const tod = getTimeOfDay();

  if (aqi != null) {
    if (aqi <= 50) {
      tips.push(tod === "morning"
        ? "Air quality is excellent — perfect for a morning run"
        : tod === "evening"
        ? "Air quality is good — great for an evening walk"
        : "Air quality is good — great for outdoor exercise");
    } else if (aqi <= 100) {
      tips.push("Air is moderate — sensitive groups should limit prolonged outdoor exertion");
      bad++;
    } else {
      tips.push("Air quality is unhealthy — consider exercising indoors");
      bad += 2;
    }
  }

  if (pollen) {
    if (pollen.level === "High" || pollen.level === "Very High") {
      tips.push(tod === "morning"
        ? "Pollen is high — early morning is actually peak pollen time, consider waiting"
        : "Pollen is high — allergy sufferers should take medication before going out");
      bad++;
    } else if (pollen.level === "Moderate") {
      tips.push("Moderate pollen — antihistamine recommended if you have allergies");
    }
  }

  if (uv != null && uv > 5) {
    if (tod === "afternoon") {
      tips.push(`UV is ${uv > 7 ? "very " : ""}high — avoid direct sun between 11am-3pm, wear SPF 30+`);
    } else {
      tips.push(`UV is ${uv > 7 ? "very " : ""}high — wear sunscreen and sunglasses`);
    }
    bad++;
  }

  if (tempF != null) {
    if (tempF > 90) {
      tips.push(tod === "morning"
        ? "Heat expected today — exercise now before it gets hotter"
        : "Heat advisory conditions — hydrate extra and avoid direct sun");
      bad++;
    } else if (tempF < 25) {
      tips.push("Extreme cold — dress in layers and cover exposed skin");
      bad++;
    }
  }

  if (tod === "night") {
    if (bad === 0) return { verdict: "Clear night — good for a late walk or early morning planning", tips, good: true };
    return { verdict: "Conditions aren't ideal — plan for tomorrow instead", tips, good: false };
  }

  if (bad === 0) return { verdict: "Great day for outdoor activity", tips, good: true };
  if (bad === 1) return { verdict: "Decent day — check conditions before heading out", tips, good: true };
  return { verdict: "Consider indoor exercise today", tips, good: false };
}

/* ── Action Chips ──────────────────────────────────────────────────────── */

const ACTION_CHIPS = [
  { href: "/building-health", icon: "🏠", label: "My Building" },
  { href: "/eat-smart",       icon: "🥗", label: "Eat Smart" },
  { href: "/neighborhood",    icon: "📍", label: "My Hood" },
  { href: "/food-safety",     icon: "🍽️", label: "Restaurant" },
  { href: "/run-routes",      icon: "🏃", label: "Run Route" },
  { href: "/find-care",       icon: "👨‍⚕️", label: "Doctor" },
];

/* ── Stagger animation wrapper ─────────────────────────────────────────── */

function StaggerTile({ index, children }: { index: number; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
      }}
    >
      {children}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function OutdoorHero({ aqi, aqiCategory, pollen, uvIndex, tempF, feelsLikeF, weatherLabel, humidity, windMph, suggestedRoute }: Props) {
  // Defer time-dependent advice to useEffect to avoid hydration mismatch
  const [advice, setAdvice] = useState<{ verdict: string; tips: string[]; good: boolean }>({ verdict: "Checking conditions…", tips: [], good: true });
  const aqiStyle = aqi != null ? aqiColor(aqi) : null;
  const uvStyle = uvIndex != null ? uvLabel(uvIndex) : null;
  const aqiAnimated = useCountUp(aqi ?? 0);
  const [greeting, setGreeting] = useState("");

  const aqiLevel = aqi != null ? (aqi <= 50 ? "good" : aqi <= 100 ? "moderate" : "unhealthy") : undefined;

  // AQI ring animation
  const aqiPct = aqi != null ? Math.min(aqi / 200, 1) : 0;
  const ringCircumference = 2 * Math.PI * 36;
  const ringOffset = ringCircumference * (1 - aqiPct);

  useEffect(() => {
    setGreeting(timeGreeting());
    setAdvice(buildAdvice(aqi, pollen, uvIndex, tempF));
  }, [aqi, pollen, uvIndex, tempF]);

  /* Build condition tiles array for staggered render */
  const tiles: React.ReactNode[] = [];

  const tileStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: "16px",
  };
  const aqiTileStyle: React.CSSProperties = {
    ...tileStyle,
    background: "rgba(255,255,255,0.92)",
    borderColor: "rgba(74,124,89,0.15)",
  };

  // AQI tile (primary)
  if (aqi != null && aqiStyle) {
    tiles.push(
      <Link
        key="aqi"
        href="/air-quality"
        className="outdoor-tile outdoor-tile-aqi flex flex-col items-center justify-center rounded-2xl px-5 py-5 transition-all hover:scale-[1.02] btn-press"
        data-level={aqiLevel}
        style={aqiTileStyle}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-1">Air Quality</p>
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 my-1">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke={`${aqiStyle.ring}20`} strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={aqiStyle.ring}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl sm:text-4xl font-extrabold tabular-nums leading-none" style={{ color: aqiStyle.text }}>
              {aqiAnimated}
            </span>
          </div>
        </div>
        <p className="text-[12px] font-bold mt-1" style={{ color: aqiStyle.text }}>{aqiCategory}</p>
      </Link>
    );
  }

  // Pollen tile
  if (pollen) {
    tiles.push(
      <Link key="pollen" href="/air-quality" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5 card-hover" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">Pollen</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold leading-none" style={{ color: pollenColor(pollen.level) }}>{pollen.level}</p>
        {pollen.topAllergens && <p className="text-[12px] text-muted mt-2 truncate max-w-full">{pollen.topAllergens}</p>}
      </Link>
    );
  }

  // UV tile
  if (uvIndex != null && uvStyle) {
    tiles.push(
      <div key="uv" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">UV Index</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold leading-none" style={{ color: uvStyle.color }}>{uvIndex}</p>
        <p className="text-[12px] font-medium mt-2" style={{ color: uvStyle.color }}>{uvStyle.text}</p>
      </div>
    );
  }

  // Wind + Humidity combined tile
  if (windMph != null) {
    tiles.push(
      <div key="wind" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">Wind</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold text-text leading-none">{windMph}<span className="text-lg font-bold text-dim ml-1">mph</span></p>
        {humidity != null && (
          <p className="text-[12px] text-muted mt-2">Humidity {humidity}%</p>
        )}
      </div>
    );
  } else if (humidity != null) {
    // Show standalone humidity tile if no wind data
    tiles.push(
      <div key="humidity" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">Humidity</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold text-text leading-none">{humidity}<span className="text-lg font-bold text-dim">%</span></p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Search bar */}
      <div className="relative bg-surface border border-border rounded-xl overflow-hidden animate-fade-in-up p-5 mb-4">
        <UnifiedSearch />
      </div>

      {/* Quick action pills */}
      <div className="flex flex-nowrap md:flex-wrap gap-2.5 mt-7 overflow-x-auto scrollbar-none pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        {ACTION_CHIPS.map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="action-pill inline-flex items-center gap-2 px-4 py-3 sm:py-2.5 rounded-full bg-surface border border-border text-[13px] font-medium text-dim whitespace-nowrap flex-shrink-0 hover:border-accent hover:text-hp-green hover:bg-accent-bg hover:-translate-y-px hover:shadow-sm transition-all duration-200"
          >
            <span className="text-base">{chip.icon}</span>
            {chip.label}
          </Link>
        ))}
      </div>

      {/* ── Immersive hero ───────────────────────────────────── */}
      <div
        className="outdoor-hero relative overflow-hidden rounded-[32px]"
        style={{
          background: "linear-gradient(135deg, #EEF2ED 0%, #EDF3F8 50%, #FDF2ED 100%)",
          marginTop: "0",
        }}
      >
        {/* Gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, var(--color-surface-sage) 0%, var(--color-surface-sky) 50%, var(--color-surface-peach) 100%)",
          }}
        />

        {/* Radial overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 80% 20%, rgba(74,124,89,0.06), transparent 60%)",
          }}
        />

        {/* Content */}
        <div className="relative px-5 py-6 sm:px-10 sm:py-10">
          {/* Header row: greeting + temp */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-2">
            <div>
              <h2 className="font-display text-[22px] sm:text-[28px] leading-snug text-text">
                {greeting ? `${greeting} — ` : ""}Should I go outside?
              </h2>
              <p className="text-[14px] text-dim mt-1">Real-time conditions · Updated hourly</p>
            </div>
            {tempF != null && (
              <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 sm:ml-4">
                <p className="font-display text-[36px] sm:text-[48px] font-bold text-text leading-none">{tempF}°</p>
                <p className="text-[13px] text-dim sm:mt-1">
                  {feelsLikeF != null && feelsLikeF !== tempF ? `Feels ${feelsLikeF}°` : ""}
                  {feelsLikeF != null && feelsLikeF !== tempF && weatherLabel ? " · " : ""}
                  {weatherLabel ?? ""}
                </p>
              </div>
            )}
          </div>

          {/* Condition tiles — 4-column grid, 2x2 on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {tiles.map((tile, i) => (
              <StaggerTile key={i} index={i}>
                {tile}
              </StaggerTile>
            ))}
          </div>

          {/* Advice bar */}
          <div className="outdoor-advice rounded-xl px-4 py-3.5 flex items-start gap-2.5">
            <span className="text-hp-green text-[16px] mt-0.5 flex-shrink-0">
              {advice.good ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4v5M8 11.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              )}
            </span>
            <div>
              <p className="text-[14px] text-dim">
                <strong className="text-hp-green">{advice.verdict}</strong>
              </p>
              {advice.tips.length > 0 && (
                <ul className="text-[12px] text-dim mt-1 space-y-0.5">
                  {advice.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                </ul>
              )}
            </div>
          </div>

          {/* Park suggestion */}
          {suggestedRoute && advice.good && (
            <Link href="/run-routes" className="flex items-center gap-2 mt-3 rounded-xl px-4 py-3 bg-hp-blue/8 border border-hp-blue/15 hover:bg-hp-blue/12 btn-press transition-all group">
              <span className="text-sm">{suggestedRoute.icon}</span>
              <p className="text-[13px] font-semibold text-hp-blue group-hover:underline">
                Try: {suggestedRoute.name} ({suggestedRoute.distance})
              </p>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-hp-blue">
                <path d="M5 3l4 4-4 4"/>
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";

/* ── Count-up ────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const safeTarget = isNaN(target) ? 0 : target;
  const [value, setValue] = useState(safeTarget);
  const prevTarget = useRef(safeTarget);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (safeTarget === prevTarget.current) return;

    const from = prevTarget.current;
    prevTarget.current = safeTarget;

    if (safeTarget === 0) { setValue(0); return; }

    const startTime = performance.now();
    function step(now: number) {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (safeTarget - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafRef.current);
  }, [safeTarget, duration]);

  return value;
}

/* ── Helpers ─────────────────────────────────── */
function aqiMeta(aqi: number) {
  if (aqi <= 50)  return { label: "Good",       color: "#4A7C59", desc: "Safe for all groups", ring: "url(#aqiGoodGrad)" };
  if (aqi <= 100) return { label: "Moderate",    color: "#C4964A", desc: "Sensitive groups should limit prolonged outdoor exertion", ring: "url(#aqiModGrad)" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "#C4704A", desc: "Reduce prolonged outdoor exertion if sensitive", ring: "url(#aqiUsgGrad)" };
  return           { label: "Unhealthy",    color: "#C45A4A", desc: "Everyone should reduce outdoor exertion", ring: "url(#aqiBadGrad)" };
}

function getRecommendations(aqi: number): string[] {
  if (aqi <= 50) return [
    "All outdoor activities are safe — enjoy your run or walk",
    "Great day to open windows and let fresh air circulate",
    "UV may still be high — wear sunscreen for extended time outside",
    "Check pollen levels if you have seasonal allergies",
  ];
  if (aqi <= 100) return [
    "Most people can be active outdoors normally",
    "If you have asthma or heart disease, consider reducing prolonged exertion",
    "Indoor exercise is a good alternative for sensitive individuals",
    "Keep windows closed if you notice irritation",
  ];
  if (aqi <= 150) return [
    "Sensitive groups should move exercise indoors",
    "Keep windows and doors closed — run air purifier if available",
    "Limit time outside, especially near heavy traffic areas",
    "Monitor symptoms — coughing or shortness of breath means go inside",
  ];
  return [
    "Everyone should avoid prolonged outdoor activity",
    "Keep all windows closed and use air purifiers",
    "Wear an N95 mask if you must go outside",
    "Check on elderly neighbors and those with respiratory conditions",
  ];
}

/* ── Pollutant data ──────────────────────────── */
interface PollutantInfo {
  name: string;
  value: number;
  unit: string;
  icon: string;
  max: number;
  color: string;
}

interface AirQualityHeroProps {
  aqi: number | null;
  category: string | null;
  pm25: number;
  no2: number | null;
  o3: number | null;
  period: string;
}

export function AirQualityHero({ aqi, category, pm25, no2, o3, period }: AirQualityHeroProps) {
  const displayAqi = aqi ?? (pm25 ? Math.round(pm25 * 4.2) : 0);
  const meta = aqiMeta(displayAqi);
  const animatedAqi = useCountUp(displayAqi);
  const recommendations = getRecommendations(displayAqi);

  // Ring geometry
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(displayAqi / 200, 1);
  const offset = circumference * (1 - pct);

  // Pollutant bars
  const pollutants: PollutantInfo[] = [
    { name: "PM2.5", value: pm25, unit: "μg/m³", icon: "🫁", max: 15, color: pm25 > 7 ? "#C4704A" : "#4A7C59" },
    ...(no2 != null ? [{ name: "NO₂", value: no2, unit: "ppb", icon: "🏭", max: 40, color: no2 > 25 ? "#C4704A" : "#3B7CB8" }] : []),
    ...(o3 != null ? [{ name: "Ozone", value: o3, unit: "ppb", icon: "☀️", max: 60, color: o3 > 40 ? "#C4704A" : "#a78bfa" }] : []),
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* ── AQI Hero ─────────────────────────── */}
      <div
        className="relative overflow-hidden animate-fade-in-up"
        style={{ borderRadius: 32, padding: "40px 24px" }}
      >
        {/* Gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, var(--color-surface-sage) 0%, var(--color-surface-sky) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 30%, rgba(74,124,89,0.06), transparent 60%)",
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          {/* AQI Ring */}
          <div className="relative w-[120px] h-[120px] mb-4 aqi-ring-glow" style={{ "--ring-color": meta.color } as React.CSSProperties}>
            <svg className="w-[120px] h-[120px] -rotate-90" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="aqiGoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4A7C59" />
                  <stop offset="100%" stopColor="#2dd4a0" />
                </linearGradient>
                <linearGradient id="aqiModGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C4964A" />
                  <stop offset="100%" stopColor="#f5c542" />
                </linearGradient>
                <linearGradient id="aqiUsgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C4704A" />
                  <stop offset="100%" stopColor="#f59e42" />
                </linearGradient>
                <linearGradient id="aqiBadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C45A4A" />
                  <stop offset="100%" stopColor="#f07070" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-border-light)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={meta.ring}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl font-bold leading-none" style={{ color: meta.color }}>
                {animatedAqi}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted mt-1">AQI</span>
            </div>
          </div>

          {/* Status */}
          <p className="text-[18px] font-bold" style={{ color: meta.color }}>
            {category ?? meta.label}
          </p>
          <p className="text-[14px] text-dim mt-1 max-w-[400px]">{meta.desc}</p>
          <p className="text-[11px] text-muted mt-2">NYCCAS {period} (latest available survey) · EPA AirNow</p>
        </div>
      </div>

      {/* ── Pollutant Breakdown ──────────────── */}
      <div className={`grid gap-3 ${pollutants.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {pollutants.map((p) => {
          const fillPct = Math.round(Math.min((p.value / p.max) * 100, 100) * 10) / 10;
          return (
            <div key={p.name} className="bg-surface border border-border-light rounded-2xl p-5 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{p.icon}</span>
                <span className="text-[13px] font-bold text-text">{p.name}</span>
              </div>
              <p className="font-display text-[28px] font-bold leading-none" style={{ color: p.color }}>
                {p.value.toFixed(1)}
                <span className="text-[13px] font-sans font-normal text-muted ml-1">{p.unit}</span>
              </p>
              {/* Bar indicator */}
              <div className="mt-3 h-1 rounded-full bg-border-light overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${fillPct}%`, background: p.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Health Recommendations ────────────── */}
      <div className="bg-surface-sage rounded-3xl p-7 animate-fade-in-up">
        <h3 className="text-[13px] font-bold uppercase tracking-[1.5px] text-muted mb-4">Health Recommendations</h3>
        <ul className="space-y-3">
          {recommendations.map((tip, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg className="w-4 h-4 text-hp-green flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[14px] text-dim leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

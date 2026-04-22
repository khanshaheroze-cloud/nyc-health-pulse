"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { CountUp } from "@/components/CountUp";

/* ── AQI helpers ─────────────────────────────────────────── */

function aqiColor(aqi: number) {
  if (aqi <= 50)  return "#4A7C59";
  if (aqi <= 100) return "#C4964A";
  if (aqi <= 150) return "#C45A4A";
  return "#C45A4A";
}

function aqiLabel(aqi: number) {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "USG";
  return "Unhealthy";
}

/* ── Mini AQI Ring ───────────────────────────────────────── */

function AqiMiniRing({ aqi }: { aqi: number }) {
  const size = 64;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(aqi / 200, 1);
  const offset = circ * (1 - pct);
  const color = aqiColor(aqi);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color }}><CountUp value={aqi} durationMs={700} storageKey="hero-aqi" className="text-[16px] font-display font-bold leading-none" /></span>
        <span className="text-[8px] text-muted leading-none mt-0.5">AQI</span>
      </div>
    </div>
  );
}

/* ── Time helpers ────────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good evening";
}

function getOutdoorAdvice(aqi: number | null, tempF: number | null): string {
  if (aqi != null && aqi > 100) return "Consider indoor exercise today";
  if (tempF != null && tempF > 95) return "Heat advisory — stay hydrated";
  if (tempF != null && tempF < 20) return "Bundle up — extreme cold";
  if (aqi != null && aqi <= 50) return "Great day to be outside";
  if (aqi != null && aqi <= 100) return "Decent day — sensitive groups take care";
  return "Check conditions before heading out";
}

/* ── Props ───────────────────────────────────────────────── */

interface HeroBannerProps {
  aqi: number | null;
  aqiCategory: string | null;
  tempF: number | null;
  weatherLabel: string | null;
}

/* ── Component ───────────────────────────────────────────── */

export function HeroBanner({ aqi, aqiCategory, tempF, weatherLabel }: HeroBannerProps) {
  const { user, profile } = useAuth();
  const [greeting, setGreeting] = useState("Good morning");
  const [userName, setUserName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [hoodName, setHoodName] = useState<string | null>(null);
  const [hoodBorough, setHoodBorough] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());

    // If logged in with a profile, use that; otherwise try localStorage
    if (user && profile?.display_name) {
      setUserName(profile.display_name.split(" ")[0]);
    } else {
      try {
        const name = localStorage.getItem("pulse-user-name");
        if (name) setUserName(name);
      } catch {}
    }

    // Neighborhood: profile first, then localStorage
    if (user && profile?.neighborhood) {
      // Profile neighborhood is just a name string
      setHoodName(profile.neighborhood);
      setHoodBorough(null);
    } else {
      try {
        const saved = localStorage.getItem("pulse-my-neighborhood");
        if (saved) {
          const parsed = JSON.parse(saved);
          setHoodName(parsed.name);
          setHoodBorough(parsed.borough);
        }
      } catch {}
    }

    // Listen for neighborhood changes (localStorage mode)
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setHoodName(detail.name);
        setHoodBorough(detail.borough);
      }
    };
    window.addEventListener("pulse-my-neighborhood-change", handler);
    return () => window.removeEventListener("pulse-my-neighborhood-change", handler);
  }, [user, profile]);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      localStorage.setItem("pulse-user-name", trimmed);
      setUserName(trimmed);
    }
    setEditingName(false);
    setNameInput("");
  };

  if (!mounted) return <div className="h-[120px]" />;

  const safeAqi = aqi ?? 0;
  const advice = getOutdoorAdvice(aqi, tempF);

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-5 sm:p-6 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        {/* Left: greeting + info */}
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] sm:text-[24px] font-display font-bold text-text leading-tight">
            {greeting}{userName ? `, ${userName}` : ""}
          </h1>
          <p className="text-[13px] text-dim mt-0.5">Here&apos;s your pulse for today.</p>

          {/* Name setter */}
          {!userName && !editingName && !user && (
            <button
              onClick={() => setEditingName(true)}
              className="text-[11px] text-muted hover:text-dim transition-colors mt-1"
            >
              Set your name →
            </button>
          )}
          {!userName && user && (
            <Link
              href="/settings"
              className="text-[11px] text-muted hover:text-dim transition-colors mt-1 inline-block"
            >
              Set your name →
            </Link>
          )}
          {editingName && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                placeholder="Your first name"
                className="w-32 px-2 py-1 text-[12px] bg-bg border border-border rounded-lg text-text placeholder:text-muted outline-none focus:border-accent/50"
                autoFocus
              />
              <button onClick={saveName} className="text-[11px] font-semibold text-accent hover:underline">Save</button>
              <button onClick={() => setEditingName(false)} className="text-[11px] text-muted hover:text-dim">Cancel</button>
            </div>
          )}

          {/* Location + weather */}
          <div className="mt-3 space-y-0.5">
            {hoodName ? (
              <p className="text-[12px] text-dim">
                📍 {hoodName}{hoodBorough ? `, ${hoodBorough}` : ""}
              </p>
            ) : (
              <Link href={user ? "/settings" : "/neighborhood"} className="text-[12px] text-accent hover:underline">
                📍 Set your neighborhood →
              </Link>
            )}

            <p className="text-[12px] text-dim">
              {tempF != null && <>{Math.round(tempF)}°F</>}
              {weatherLabel && <> · {weatherLabel}</>}
              {tempF != null && <> · {advice}</>}
            </p>
          </div>
        </div>

        {/* Right: AQI mini ring */}
        {safeAqi > 0 && (
          <Link href="/air-quality" className="hover:opacity-80 transition-opacity">
            <AqiMiniRing aqi={safeAqi} />
          </Link>
        )}
      </div>
    </div>
  );
}

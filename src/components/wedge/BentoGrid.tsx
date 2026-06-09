"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { neighborhoods } from "@/lib/neighborhoodData";

interface BentoGridProps {
  aqi: number | null;
  aqiCategory: string | null;
  tempF: number | null;
  uvIndex: number | null;
  pollenLevel: string | null;
}

function LiveBadge() {
  return (
    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[9px] font-bold tracking-[1.5px] uppercase text-[#C24A37] bg-[#FEF0E5] px-1.5 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-[#C24A37] hero-pulse-dot" />
      LIVE
    </span>
  );
}

interface TileProps {
  href: string;
  iconBg: string;
  iconColor: string;
  emoji: string;
  label: string;
  title: string;
  className?: string;
  live?: boolean;
  children?: React.ReactNode;
}

function Tile({ href, iconBg, iconColor, emoji, label, title, className = "", live, children }: TileProps) {
  return (
    <Link
      href={href}
      className={`relative bg-white border border-[#E6E5DE] rounded-2xl p-[18px] flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 transition-transform duration-150 ${className}`}
    >
      {live && <LiveBadge />}
      <div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-2" style={{ background: iconBg, color: iconColor }}>
          {emoji}
        </div>
        <span className="text-[11px] font-semibold tracking-[1px] uppercase text-[#6B716B]">{label}</span>
      </div>
      <div>
        <h3 className="font-display text-[20px] text-[#1A1A1A] leading-tight mt-1">{title}</h3>
        {children}
      </div>
    </Link>
  );
}

function SecondaryTile({ href, emoji, label, title }: { href: string; emoji: string; label: string; title: string }) {
  return (
    <Link
      href={href}
      className="relative bg-white border border-[#EFEEE6] rounded-2xl p-[14px] flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 transition-transform duration-150"
    >
      <div>
        <span className="text-[28px] block mb-1">{emoji}</span>
        <span className="text-[10px] font-semibold tracking-[1px] uppercase text-[#6B716B]">{label}</span>
      </div>
      <h3 className="font-display text-[17px] text-[#1A1A1A] leading-tight mt-1">{title}</h3>
    </Link>
  );
}

function NeighborhoodTile() {
  const [hood, setHood] = useState<{ name: string; slug: string; borough: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pulse-my-neighborhood");
      if (saved) setHood(JSON.parse(saved));
    } catch {}
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setHood(detail);
      else setHood(null);
    };
    window.addEventListener("pulse-my-neighborhood-change", handler);
    return () => window.removeEventListener("pulse-my-neighborhood-change", handler);
  }, []);

  const data = hood ? neighborhoods.find(n => n.slug === hood.slug) : null;
  const hoodHref = hood ? `/neighborhood/${hood.slug}` : "/neighborhood";
  const hoodTitle = hood ? hood.name : "Neighborhood pulse";
  const subtitle = data
    ? `LE ${data.metrics.lifeExp.toFixed(0)} · PM2.5 ${data.metrics.pm25.toFixed(1)}`
    : undefined;

  return (
    <Link
      href={hoodHref}
      className="relative bg-white border border-[#E6E5DE] rounded-2xl p-[18px] flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 transition-transform duration-150"
    >
      <div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-2" style={{ background: "#E5F1E8", color: "#2F8F4D" }}>
          🏘
        </div>
        <span className="text-[11px] font-semibold tracking-[1px] uppercase text-[#6B716B]">Your neighborhood</span>
      </div>
      <div>
        <h3 className="font-display text-[20px] text-[#1A1A1A] leading-tight mt-1">{hoodTitle}</h3>
        {subtitle && <p className="text-[12px] text-[#6B716B] mt-0.5">{subtitle}</p>}
      </div>
    </Link>
  );
}

export function BentoGrid({ aqi, aqiCategory, tempF, uvIndex, pollenLevel }: BentoGridProps) {
  const aqiDisplay = aqi ?? 42;
  const aqiLabel = aqiCategory ?? "Good";
  const tempDisplay = tempF != null ? `${Math.round(tempF)}°F` : "--°F";
  const uvDisplay = uvIndex != null ? String(uvIndex) : "--";
  const pollenDisplay = pollenLevel ?? "Low";

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-20">
      <h2 className="font-display text-[28px] text-[#1A1A1A] mb-2">The rest of PulseNYC</h2>
      <p className="text-[15px] text-[#6B716B] mb-6 max-w-2xl">
        Everything else still works exactly as it does today — air quality, neighborhood health, fitness, building safety. We just put the thing you&apos;ll use daily up front.
      </p>

      {/* Primary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" style={{ gridAutoRows: "140px" }}>
        {/* A — Air Quality (2x2) */}
        <Link
          href="/air-quality"
          className="relative bg-white border border-[#E6E5DE] rounded-2xl p-[18px] flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 transition-transform duration-150 col-span-2 row-span-2"
        >
          <LiveBadge />
          <div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-2" style={{ background: "#FEF0E5", color: "#C66E1C" }}>
              🌤
            </div>
            <span className="text-[11px] font-semibold tracking-[1px] uppercase text-[#6B716B]">Air Quality · NYC</span>
            <div data-testid="aqi-value" data-aqi={aqiDisplay} className="text-[42px] font-semibold text-[#1A1A1A] leading-none mt-1">{aqiDisplay}</div>
            <span className="text-[13px] text-[#6B716B]">{aqiLabel} · EPA AirNow</span>
          </div>
          <div>
            <h3 className="font-display text-[20px] text-[#1A1A1A] leading-tight">Should I run outside?</h3>
            <p className="text-[13px] text-[#6B716B] mt-0.5">UV {uvDisplay} · Pollen {pollenDisplay} · Temp {tempDisplay}</p>
          </div>
        </Link>

        {/* B — Smart Run Routes */}
        <Tile href="/run-routes" iconBg="#E6EEF9" iconColor="#2A6BC9" emoji="🏃" label="Smart Run Routes" title="20 scored routes" live />

        {/* C — Your Neighborhood (reactive) */}
        <NeighborhoodTile />

        {/* D — Today's Workout */}
        <Tile href="/workouts" iconBg="#FBEAE7" iconColor="#C24A37" emoji="💪" label="Today's workout" title="Ready to train" />

        {/* E — NYC Health Data */}
        <Tile href="/health-data" iconBg="#F3EAFB" iconColor="#7A4FB5" emoji="📊" label="NYC Health Data" title="8 categories" />
      </div>

      {/* Secondary row */}
      <p className="text-[12px] font-semibold tracking-[1.5px] uppercase text-[#6B716B] mt-6 mb-3">
        MORE FROM PULSENYC
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5" style={{ gridAutoRows: "120px" }}>
        <SecondaryTile href="/building-health" emoji="🏢" label="Building Safety" title="Is my building safe?" />
        <SecondaryTile href="/find-care" emoji="🩺" label="Find Care" title="Clinics + crisis" />
        <SecondaryTile href="/safety" emoji="🚦" label="Street Safety" title="Vision Zero data" />
      </div>
    </div>
  );
}

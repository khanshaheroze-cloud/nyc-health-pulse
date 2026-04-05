"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { neighborhoods } from "@/lib/neighborhoodData";

interface SavedHood {
  slug: string;
  name: string;
  borough: string;
}

function aqiDotColor(pm25: number): string {
  if (pm25 <= 9) return "#4A7C59";
  if (pm25 <= 12) return "#C4964A";
  return "#C45A4A";
}

function StatCard({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-bg rounded-xl px-3 py-2.5 min-w-[72px]">
      <span className="text-[18px] font-display font-bold leading-none" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="text-[9px] text-muted mt-1 leading-none text-center">{label}</span>
    </div>
  );
}

export function NeighborhoodBar() {
  const [hood, setHood] = useState<SavedHood | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("pulse-my-neighborhood");
      if (saved) setHood(JSON.parse(saved));
    } catch {}

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setHood(detail);
    };
    window.addEventListener("pulse-my-neighborhood-change", handler);
    return () => window.removeEventListener("pulse-my-neighborhood-change", handler);
  }, []);

  if (!mounted) return null;

  // No neighborhood set
  if (!hood) {
    return (
      <div className="rounded-2xl bg-surface border border-border-light p-5 text-center animate-fade-in-up">
        <p className="text-[13px] font-semibold text-text">📍 Set your neighborhood</p>
        <p className="text-[12px] text-dim mt-1">Get hyper-local health, safety & food data</p>
        <Link
          href="/neighborhood"
          className="mt-3 inline-flex items-center px-4 py-2 rounded-xl border border-accent/30 text-[12px] font-semibold text-accent hover:bg-accent/5 transition-colors"
        >
          Choose Neighborhood →
        </Link>
      </div>
    );
  }

  const data = neighborhoods.find((n) => n.slug === hood.slug);
  if (!data) return null;

  const m = data.metrics;
  const pm25Color = aqiDotColor(m.pm25);

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted">
          📍 Your Neighborhood — {hood.name}
        </p>
        <Link href={`/neighborhood/${hood.slug}`} className="text-[11px] text-accent font-semibold hover:underline">
          Full Report →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatCard value={m.pm25.toFixed(1)} label="PM2.5 μg/m³" color={pm25Color} />
        <StatCard value={m.lifeExp.toFixed(1)} label="Life Exp" />
        <StatCard value={`${m.poverty.toFixed(0)}%`} label="Poverty" />
        <StatCard value={m.overdoseRate.toFixed(0)} label="Overdose/100K" />
        <StatCard value={`${m.obesity.toFixed(0)}%`} label="Obesity" />
      </div>
    </div>
  );
}

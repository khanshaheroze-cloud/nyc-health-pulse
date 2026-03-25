"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { neighborhoods } from "@/lib/neighborhoodData";
import { NeighborhoodSearch } from "./NeighborhoodSearch";

const STORAGE_KEY = "pulse-my-neighborhood";

interface NeighborhoodData {
  slug: string;
  name: string;
  borough: string;
}

const POPULAR = [
  { label: "Upper West Side", slug: "upper-west-side" },
  { label: "Williamsburg", slug: "williamsburg-bushwick" },
  { label: "Astoria", slug: "long-island-city-astoria" },
  { label: "South Bronx", slug: "hunts-point-mott-haven" },
];

export function MyNeighborhood() {
  const [myHood, setMyHood] = useState<NeighborhoodData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = neighborhoods.find((n) => n.slug === parsed.slug);
        if (match) {
          setMyHood({ slug: match.slug, name: match.name, borough: match.borough });
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  const handleSelect = useCallback((n: { slug: string; name: string; borough: string }) => {
    const data = { slug: n.slug, name: n.name, borough: n.borough };
    setMyHood(data);
    setEditing(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("pulse-my-neighborhood-change", { detail: data }));
    } catch {}
  }, []);

  const handlePopularClick = useCallback((slug: string) => {
    const match = neighborhoods.find((n) => n.slug === slug);
    if (match) handleSelect(match);
  }, [handleSelect]);

  if (!loaded) return null;

  // Not set yet or editing — show banner CTA
  if (!myHood || editing) {
    return (
      <div className="neighborhood-banner mt-7 rounded-3xl overflow-hidden animate-fade-in-up">
        <div className="relative px-6 py-8 sm:px-8 sm:py-8">
          {/* Two-column layout on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Left: text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[22px] text-white leading-snug">
                  {myHood ? "Change Your Neighborhood" : "Set Your Neighborhood"}
                </h3>
                {editing && myHood && (
                  <button
                    onClick={() => setEditing(false)}
                    className="text-[12px] text-white/70 hover:text-white transition-colors sm:hidden"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <p className="text-[14px] text-white/85 mt-1">
                Personalize Pulse NYC with hyper-local health, safety &amp; food data
              </p>
            </div>

            {/* Right: search input */}
            <div className="flex-shrink-0 sm:w-[320px]">
              <div className="flex items-center justify-between mb-2 sm:hidden">
                {/* spacer for mobile */}
              </div>
              {editing && myHood && (
                <button
                  onClick={() => setEditing(false)}
                  className="text-[12px] text-white/70 hover:text-white transition-colors mb-2 hidden sm:block"
                >
                  ← Cancel
                </button>
              )}
              <div className="neighborhood-search-wrapper">
                <NeighborhoodSearch
                  placeholder="Where do you live?"
                  onSelectNeighborhood={(n) => handleSelect(n)}
                />
              </div>
            </div>
          </div>

          {/* Popular neighborhood chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {POPULAR.map((p) => (
              <button
                key={p.slug}
                onClick={() => handlePopularClick(p.slug)}
                className="text-[12px] font-medium text-white/90 px-3 py-1.5 rounded-full border border-white/25 hover:bg-white/15 hover:border-white/40 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Set — show personalized strip
  const hood = neighborhoods.find((n) => n.slug === myHood.slug);

  return (
    <div className="neighborhood-banner mt-7 rounded-3xl overflow-hidden animate-fade-in-up">
      <div className="relative px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-lg sm:text-xl flex-shrink-0">📍</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] sm:text-[15px] font-bold text-white truncate">{myHood.name}</h3>
                <span className="text-[11px] text-white/70">{myHood.borough}</span>
              </div>
              {hood && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-[11px] sm:text-[12px] text-white/80">
                    PM2.5: <strong className="text-white">{hood.metrics.pm25.toFixed(1)}</strong>
                  </span>
                  <span className="text-[11px] sm:text-[12px] text-white/80">
                    Life exp: <strong className="text-white">{hood.metrics.lifeExp.toFixed(1)}</strong>yr
                  </span>
                  <span className="text-[11px] sm:text-[12px] text-white/80 hidden sm:inline">
                    Poverty: <strong className="text-white">{hood.metrics.poverty.toFixed(0)}</strong>%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href={`/neighborhood/${myHood.slug}`}
              className="text-[11px] sm:text-[12px] font-semibold text-white/90 hover:text-white hover:underline transition-colors whitespace-nowrap"
            >
              View profile →
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="text-white/60 hover:text-white transition-colors"
              title="Change neighborhood"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2l2 2-8 8H2v-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

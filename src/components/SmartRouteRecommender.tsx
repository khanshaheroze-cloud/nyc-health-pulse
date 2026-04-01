"use client";

import { useEffect, useState, useMemo } from "react";
import type { ScoredRoute, RunConditions } from "@/lib/runScoring";
import { RunConditionsBar } from "./RunConditionsBar";

type Borough = "All" | "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";
type Difficulty = "All" | "Easy" | "Moderate" | "Hilly";
type SortBy = "score" | "distance-asc" | "distance-desc" | "name";

const BOROUGHS: Borough[] = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const DIFFICULTIES: Difficulty[] = ["All", "Easy", "Moderate", "Hilly"];

const SURFACE_ICON: Record<string, string> = {
  Paved: "🛣️", Dirt: "🌲", Boardwalk: "🏖️", Elevated: "🌿", Mixed: "🔀",
};
const DIFFICULTY_ICON: Record<string, string> = {
  Easy: "🟢", Moderate: "🟡", Hilly: "🔴",
};

interface ApiResponse {
  conditions: RunConditions;
  city: { score: number; headline: string };
  routes: ScoredRoute[];
  pollen: { level: string; topAllergens: string[] } | null;
  updatedAt: string;
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted w-6 text-right">{value}</span>
    </div>
  );
}

function RouteScoreBadge({ score }: { score: number }) {
  // Compute total from breakdown if score is missing/NaN
  const s = typeof score === "number" && !isNaN(score) ? score : 0;
  const color = s >= 80 ? "text-hp-green bg-hp-green/10 border-hp-green/30"
    : s >= 65 ? "text-hp-blue bg-hp-blue/10 border-hp-blue/30"
    : s >= 50 ? "text-hp-yellow bg-hp-yellow/10 border-hp-yellow/30"
    : "text-hp-red bg-hp-red/10 border-hp-red/30";

  return (
    <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${color}`}>
      <span className="text-[16px] font-extrabold leading-none">{s}</span>
      <span className="text-[8px] font-semibold opacity-60">/100</span>
    </div>
  );
}

export function SmartRouteRecommender() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [borough, setBorough] = useState<Borough>("All");
  const [difficulty, setDifficulty] = useState<Difficulty>("All");
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [carFreeOnly, setCarFreeOnly] = useState(false);
  const [raceRoutesOnly, setRaceRoutesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("score");

  useEffect(() => {
    fetch("/api/run-conditions")
      .then((r) => r.json())
      .then((d: ApiResponse) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let routes = data.routes;
    if (borough !== "All") routes = routes.filter((r) => r.borough === borough);
    if (difficulty !== "All") routes = routes.filter((r) => r.difficulty === difficulty);
    if (carFreeOnly) routes = routes.filter((r) => r.carFree);
    if (raceRoutesOnly) routes = routes.filter((r) => (r as typeof r & { tag?: string }).tag === "race");
    routes = routes.filter((r) => r.distanceMi <= maxDistance);
    if (sortBy === "distance-asc") routes = [...routes].sort((a, b) => a.distanceMi - b.distanceMi);
    else if (sortBy === "distance-desc") routes = [...routes].sort((a, b) => b.distanceMi - a.distanceMi);
    else if (sortBy === "name") routes = [...routes].sort((a, b) => a.name.localeCompare(b.name));
    return routes;
  }, [data, borough, difficulty, maxDistance, carFreeOnly, raceRoutesOnly, sortBy]);

  const topPick = data ? data.routes[0] : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="skeleton w-16 h-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex gap-3">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center">
        <p className="text-dim text-[13px]">Unable to load running conditions.</p>
        <button onClick={() => { setError(false); setLoading(true); fetch("/api/run-conditions").then(r => r.json()).then((d: ApiResponse) => { setData(d); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
          className="mt-2 text-[12px] text-accent font-semibold hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Conditions hero */}
      <RunConditionsBar
        conditions={data.conditions}
        cityScore={data.city.score}
        headline={data.city.headline}
        pollen={data.pollen}
      />

      {/* Top Pick */}
      {topPick && (
        <div className="bg-hp-green/8 border border-hp-green/20 rounded-2xl p-4 sm:p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-hp-green">Top Pick Right Now</span>
          </div>
          <div className="flex items-start gap-4">
            <RouteScoreBadge score={topPick.score} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-text">{topPick.icon} {topPick.name}</p>
              <p className="text-[12px] text-dim mt-0.5">{topPick.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">{topPick.distance}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">{topPick.surface}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-muted">{topPick.borough}</span>
                {topPick.carFree && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-hp-green/10 border border-hp-green/20 text-hp-green font-semibold">Car-Free</span>
                )}
              </div>
              {/* Score breakdown bars */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                <div>
                  <p className="text-[9px] text-muted mb-0.5">🌬️ Air Quality</p>
                  <ScoreBar value={topPick.scoreBreakdown.airQuality} max={25} color="bg-hp-green" />
                </div>
                <div>
                  <p className="text-[9px] text-muted mb-0.5">🛡️ Safety</p>
                  <ScoreBar value={topPick.scoreBreakdown.safety} max={25} color="bg-hp-blue" />
                </div>
                <div>
                  <p className="text-[9px] text-muted mb-0.5">🏞️ Scenery</p>
                  <ScoreBar value={topPick.scoreBreakdown.scenery} max={25} color="bg-hp-blue" />
                </div>
                <div>
                  <p className="text-[9px] text-muted mb-0.5">⛰️ Terrain</p>
                  <ScoreBar value={topPick.scoreBreakdown.terrain} max={25} color="bg-hp-purple" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted">Filter Curated Routes</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted font-semibold">Borough</label>
            <select value={borough} onChange={(e) => setBorough(e.target.value as Borough)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-surface-sage border border-border text-text focus:outline-none focus:ring-1 focus:ring-hp-green/40">
              {BOROUGHS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted font-semibold">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-surface-sage border border-border text-text focus:outline-none focus:ring-1 focus:ring-hp-green/40">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted font-semibold">Max Distance</label>
            <select value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-surface-sage border border-border text-text focus:outline-none focus:ring-1 focus:ring-hp-green/40">
              <option value={2}>≤ 2 mi</option>
              <option value={4}>≤ 4 mi</option>
              <option value={7}>≤ 7 mi</option>
              <option value={10}>≤ 10 mi</option>
              <option value={15}>≤ 15 mi</option>
              <option value={30}>Any distance</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted font-semibold">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-surface-sage border border-border text-text focus:outline-none focus:ring-1 focus:ring-hp-green/40">
              <option value="score">Best Score</option>
              <option value="distance-asc">Shortest First</option>
              <option value="distance-desc">Longest First</option>
              <option value="name">A-Z</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <label className="inline-flex items-center gap-2 text-[12px] text-text cursor-pointer select-none">
              <input type="checkbox" checked={carFreeOnly} onChange={(e) => setCarFreeOnly(e.target.checked)} className="accent-[var(--color-hp-green)] w-3.5 h-3.5" />
              Car-free only
            </label>
            <label className="inline-flex items-center gap-2 text-[12px] text-text cursor-pointer select-none">
              <input type="checkbox" checked={raceRoutesOnly} onChange={(e) => setRaceRoutesOnly(e.target.checked)} className="accent-[var(--color-hp-green)] w-3.5 h-3.5" />
              NYRR Race Routes
            </label>
          </div>
        </div>
      </div>

      {/* Route list */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        {filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <p className="text-dim text-[13px]">No routes match your filters.</p>
          </div>
        ) : (
          filtered.map((route) => (
            <div key={route.name} className="bg-surface border border-border rounded-2xl p-4 card-hover transition-all">
              <div className="flex items-start gap-3">
                <RouteScoreBadge score={route.score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-bold text-text">{route.icon} {route.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sage border border-border text-muted font-medium">{route.bestFor}</span>
                  </div>
                  <p className="text-[11px] text-dim mt-1 line-clamp-2">{route.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sage border border-border text-muted">📍 {route.borough}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sage border border-border text-muted">📏 {route.distance}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sage border border-border text-muted">{SURFACE_ICON[route.surface] ?? "🛣️"} {route.surface}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sage border border-border text-muted">{DIFFICULTY_ICON[route.difficulty]} {route.difficulty}</span>
                    {route.carFree && <span className="text-[10px] px-2 py-0.5 rounded-full bg-hp-green/10 border border-hp-green/20 text-hp-green font-semibold">Car-Free</span>}
                    {(route as typeof route & { tag?: string }).tag === "race" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-hp-orange/10 border border-hp-orange/20 text-hp-orange font-semibold">🏅 NYRR Race</span>}
                  </div>

                  {/* Score breakdown mini */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-text">{route.scoreBreakdown.airQuality}/25</p>
                      <p className="text-[8px] text-muted">Air</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-text">{route.scoreBreakdown.safety}/25</p>
                      <p className="text-[8px] text-muted">Safety</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-text">{route.scoreBreakdown.scenery}/25</p>
                      <p className="text-[8px] text-muted">Scenery</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-text">{route.scoreBreakdown.terrain}/25</p>
                      <p className="text-[8px] text-muted">Terrain</p>
                    </div>
                  </div>

                  {route.reasons.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      {route.reasons.map((r, j) => (
                        <p key={j} className="text-[10px] text-dim italic">• {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-[10px] text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
          <span className="text-hp-green font-semibold tracking-widest">LIVE</span>
          <span>· Scores update every 5 min</span>
        </div>
        <span>{filtered.length} route{filtered.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

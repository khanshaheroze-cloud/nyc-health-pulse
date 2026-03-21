"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Route data — curated NYC running/walking paths                    */
/* ------------------------------------------------------------------ */
interface Route {
  name: string;
  borough: "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";
  distance: string;
  surface: "Paved" | "Dirt" | "Boardwalk" | "Elevated" | "Mixed";
  difficulty: "Easy" | "Moderate" | "Hilly";
  description: string;
  carFree: boolean;
  icon: string;
}

const ROUTES: Route[] = [
  // Manhattan
  {
    name: "Central Park Full Loop",
    borough: "Manhattan",
    distance: "6.1 mi",
    surface: "Paved",
    difficulty: "Moderate",
    description: "The classic NYC run — counterclockwise, car-free. Gentle hills on the north end.",
    carFree: true,
    icon: "🌳",
  },
  {
    name: "Central Park Reservoir (Bridle Path)",
    borough: "Manhattan",
    distance: "1.58 mi",
    surface: "Dirt",
    difficulty: "Easy",
    description: "Softer surface, great skyline views, less crowded than the main loop.",
    carFree: true,
    icon: "🏞️",
  },
  {
    name: "Hudson River Greenway",
    borough: "Manhattan",
    distance: "12.9 mi",
    surface: "Paved",
    difficulty: "Easy",
    description: "Manhattan's west side waterfront — Battery Park to Inwood. Flat, scenic, car-free.",
    carFree: true,
    icon: "🌊",
  },
  {
    name: "East River Greenway (South)",
    borough: "Manhattan",
    distance: "4.4 mi",
    surface: "Paved",
    difficulty: "Easy",
    description: "Midtown to Battery Park with stunning bridge views. Best at sunset.",
    carFree: true,
    icon: "🌉",
  },
  {
    name: "The High Line",
    borough: "Manhattan",
    distance: "1.5 mi",
    surface: "Elevated",
    difficulty: "Easy",
    description: "Elevated walking path — go before 9am. Too crowded for running later.",
    carFree: true,
    icon: "🌿",
  },
  // Brooklyn
  {
    name: "Prospect Park Loop",
    borough: "Brooklyn",
    distance: "3.35 mi",
    surface: "Paved",
    difficulty: "Moderate",
    description: "Brooklyn's Central Park — car-free, beautiful rolling hills. Run counterclockwise.",
    carFree: true,
    icon: "🌳",
  },
  {
    name: "Brooklyn Waterfront Greenway",
    borough: "Brooklyn",
    distance: "14+ mi",
    surface: "Paved",
    difficulty: "Easy",
    description: "Dumbo to Red Hook to Bay Ridge waterfront. Flat with incredible harbor views.",
    carFree: true,
    icon: "🌊",
  },
  {
    name: "Brooklyn Bridge",
    borough: "Brooklyn",
    distance: "1.3 mi",
    surface: "Paved",
    difficulty: "Easy",
    description: "Iconic but crowded — run early or late. Slight incline from Brooklyn side.",
    carFree: false,
    icon: "🌉",
  },
  // Queens
  {
    name: "Flushing Meadows Corona Park",
    borough: "Queens",
    distance: "2.5 mi",
    surface: "Paved",
    difficulty: "Easy",
    description: "Past the Unisphere and USTA tennis center. Wide paths, flat, family-friendly.",
    carFree: true,
    icon: "🌐",
  },
  {
    name: "Forest Park (Oak Trail)",
    borough: "Queens",
    distance: "3.5 mi",
    surface: "Dirt",
    difficulty: "Hilly",
    description: "Queens' hidden gem — largest continuous oak forest in NYC. Real trail running.",
    carFree: true,
    icon: "🌲",
  },
  // Bronx
  {
    name: "Van Cortlandt Park (XC Trail)",
    borough: "Bronx",
    distance: "3.1 mi",
    surface: "Dirt",
    difficulty: "Hilly",
    description: "Classic cross-country course. The Putnam Trail is flatter if you want an easier option.",
    carFree: true,
    icon: "⛰️",
  },
  {
    name: "Pelham Bay / Orchard Beach",
    borough: "Bronx",
    distance: "1.8 mi",
    surface: "Paved",
    difficulty: "Easy",
    description: "NYC's largest park — feels like you left the city. Flat shore path.",
    carFree: true,
    icon: "🏖️",
  },
  // Staten Island
  {
    name: "Staten Island Greenbelt (White Trail)",
    borough: "Staten Island",
    distance: "8+ mi",
    surface: "Dirt",
    difficulty: "Hilly",
    description: "NYC's best trail running — dense forest, rolling hills. Feels like upstate.",
    carFree: true,
    icon: "🌲",
  },
  {
    name: "FDR Boardwalk",
    borough: "Staten Island",
    distance: "2.5 mi",
    surface: "Boardwalk",
    difficulty: "Easy",
    description: "South Beach to Midland Beach — ocean views, flat boardwalk. Great morning run.",
    carFree: true,
    icon: "🏖️",
  },
];

const BOROUGHS = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const;
const SURFACES = ["All", "Paved", "Dirt", "Boardwalk", "Elevated"] as const;
const DIFFICULTIES = ["All", "Easy", "Moderate", "Hilly"] as const;

const BOROUGH_COLORS: Record<string, string> = {
  Manhattan: "#2850AD",
  Brooklyn: "#FF6319",
  Queens: "#B933AD",
  Bronx: "#EE352E",
  "Staten Island": "#6CBE45",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function ActiveRoutesGuide() {
  const [borough, setBorough] = useState<string>("All");
  const [surface, setSurface] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("All");

  const filtered = ROUTES.filter((r) => {
    if (borough !== "All" && r.borough !== borough) return false;
    if (surface !== "All" && r.surface !== surface) return false;
    if (difficulty !== "All" && r.difficulty !== difficulty) return false;
    return true;
  });

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🗺️</span>
        <div>
          <h3 className="text-[13px] font-bold text-text">NYC Running & Walking Routes</h3>
          <p className="text-[10px] text-muted">14 curated routes across all five boroughs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Borough filter */}
        <div>
          <p className="text-[9px] text-muted font-semibold mb-1 uppercase tracking-wide">Borough</p>
          <div className="flex gap-1 flex-wrap">
            {BOROUGHS.map((b) => (
              <button
                key={b}
                onClick={() => setBorough(b)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                  borough === b
                    ? "bg-hp-green/10 text-hp-green border-hp-green/20"
                    : "text-dim border-border hover:text-text"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Surface filter */}
        <div>
          <p className="text-[9px] text-muted font-semibold mb-1 uppercase tracking-wide">Surface</p>
          <div className="flex gap-1 flex-wrap">
            {SURFACES.map((s) => (
              <button
                key={s}
                onClick={() => setSurface(s)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                  surface === s
                    ? "bg-hp-blue/10 text-hp-blue border-hp-blue/20"
                    : "text-dim border-border hover:text-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty filter */}
        <div>
          <p className="text-[9px] text-muted font-semibold mb-1 uppercase tracking-wide">Difficulty</p>
          <div className="flex gap-1 flex-wrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                  difficulty === d
                    ? "bg-hp-purple/10 text-hp-purple border-hp-purple/20"
                    : "text-dim border-border hover:text-text"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Route cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-[12px] text-dim text-center py-6">No routes match your filters. Try broadening your search.</p>
        )}
        {filtered.map((route) => (
          <div
            key={route.name}
            className="border border-border rounded-lg p-3 hover:bg-bg/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{route.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[12px] font-bold text-text">{route.name}</p>
                  {route.carFree && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-hp-green/10 text-hp-green">
                      CAR-FREE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-dim leading-relaxed">{route.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: (BOROUGH_COLORS[route.borough] ?? "#666") + "18",
                      color: BOROUGH_COLORS[route.borough] ?? "#666",
                    }}
                  >
                    {route.borough}
                  </span>
                  <span className="text-[9px] text-dim">
                    {route.distance}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-border/50 text-dim font-medium">
                    {route.surface}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    route.difficulty === "Hilly"
                      ? "bg-hp-orange/10 text-hp-orange"
                      : route.difficulty === "Moderate"
                        ? "bg-hp-yellow/10 text-hp-yellow"
                        : "bg-hp-green/10 text-hp-green"
                  }`}>
                    {route.difficulty}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display text-[16px] font-bold text-text">{route.distance}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-muted mt-3 text-center">
        Distances are approximate. Always check park hours and seasonal closures at nycgovparks.org.
      </p>
    </div>
  );
}

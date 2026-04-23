"use client";

import { useState, useCallback } from "react";
import type { Route } from "@/lib/curatedRoutes";
import { ROUTES } from "@/lib/curatedRoutes";

export type { Route };
export { ROUTES };

/* ------------------------------------------------------------------ */
/*  Haversine distance (miles)                                         */
/* ------------------------------------------------------------------ */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setBorough("All"); // show all so nearest is meaningful
      },
      () => {
        setLocationError("Location access denied.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Filter & sort
  let filtered = ROUTES.filter((r) => {
    if (borough !== "All" && r.borough !== borough) return false;
    if (surface !== "All" && r.surface !== surface) return false;
    if (difficulty !== "All" && r.difficulty !== difficulty) return false;
    return true;
  });

  // If user location available, add distance and sort by proximity
  type RouteWithDist = Route & { awayMi?: number };
  let routesWithDist: RouteWithDist[] = filtered;
  if (userLocation) {
    routesWithDist = filtered.map((r) => ({
      ...r,
      awayMi: haversine(userLocation.lat, userLocation.lng, r.lat, r.lng),
    }));
    routesWithDist.sort((a, b) => (a.awayMi ?? 0) - (b.awayMi ?? 0));
  }

  const nearest = routesWithDist[0] as RouteWithDist | undefined;

  return (
    <div className="space-y-4">
      {/* Location-based recommendation */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <div>
              <h3 className="text-[13px] font-bold text-text">Find a Run Near You</h3>
              <p className="text-[10px] text-muted">
                {userLocation
                  ? "Sorted by distance from your location"
                  : "Share your location to find the closest trail"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLocate}
            disabled={locating}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-hp-green text-white hover:bg-hp-green/90 disabled:opacity-50 transition-all"
          >
            {locating ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Locating...
              </span>
            ) : userLocation ? "Update Location" : "Use My Location"}
          </button>
        </div>

        {locationError && (
          <p className="text-[11px] text-hp-red mb-2">{locationError}</p>
        )}

        {/* Recommended route card */}
        {userLocation && nearest && (
          <div className="border-2 border-hp-green/30 bg-hp-green/5 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-hp-green text-white">RECOMMENDED</span>
              <span className="text-[10px] text-dim">Closest to you</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{nearest.icon}</span>
              <div className="flex-1">
                <h4 className="text-[14px] font-bold text-text">{nearest.name}</h4>
                <p className="text-[11px] text-dim mt-0.5">{nearest.description}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: (BOROUGH_COLORS[nearest.borough] ?? "#666") + "18",
                      color: BOROUGH_COLORS[nearest.borough] ?? "#666",
                    }}
                  >
                    {nearest.borough}
                  </span>
                  <span className="text-[10px] font-semibold text-text">{nearest.distance}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-border/50 text-dim font-medium">{nearest.surface}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    nearest.difficulty === "Hilly"
                      ? "bg-hp-orange/10 text-hp-orange"
                      : nearest.difficulty === "Moderate"
                        ? "bg-hp-yellow/10 text-hp-yellow"
                        : "bg-hp-green/10 text-hp-green"
                  }`}>
                    {nearest.difficulty}
                  </span>
                  {nearest.carFree && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-hp-green/10 text-hp-green">CAR-FREE</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {nearest.highlights.map((h) => (
                    <span key={h} className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-hp-blue/8 text-hp-blue border border-hp-blue/15">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-display text-[22px] font-bold text-hp-green">
                  {nearest.awayMi?.toFixed(1)}
                </p>
                <p className="text-[9px] text-dim">mi away</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All routes with filters */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🗺️</span>
          <div>
            <h3 className="text-[13px] font-bold text-text">All Routes</h3>
            <p className="text-[10px] text-muted">{routesWithDist.length} routes {userLocation ? "sorted by distance" : "across 5 boroughs"}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
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
          {routesWithDist.length === 0 && (
            <p className="text-[12px] text-dim text-center py-6">No routes match your filters.</p>
          )}
          {routesWithDist.map((route) => (
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
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-hp-green/10 text-hp-green">CAR-FREE</span>
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
                    <span className="text-[9px] text-dim">{route.distance}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-border/50 text-dim font-medium">{route.surface}</span>
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
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {route.highlights.map((h) => (
                      <span key={h} className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-hp-blue/8 text-hp-blue border border-hp-blue/15">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-[16px] font-bold text-text">{route.distance}</p>
                  {route.awayMi != null && (
                    <p className="text-[10px] text-hp-green font-semibold">{route.awayMi.toFixed(1)} mi away</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[9px] text-muted mt-3 text-center">
          Distances are approximate. Check park hours and seasonal closures at nycgovparks.org.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface AmenityCounts {
  water: number;
  restrooms: number;
  subway: number;
  citibike: number;
}

interface RouteAmenitiesProps {
  lat: number;
  lng: number;
  radius?: number;
}

const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  "hp-blue":   { bg: "bg-hp-blue/8",   border: "border-hp-blue/20" },
  "hp-purple": { bg: "bg-hp-purple/8", border: "border-hp-purple/20" },
  "hp-orange": { bg: "bg-hp-orange/8", border: "border-hp-orange/20" },
  "hp-green":  { bg: "bg-hp-green/8",  border: "border-hp-green/20" },
};

const AMENITY_TYPES = [
  { key: "water", icon: "🚰", label: "Water Fountains", color: "hp-blue" },
  { key: "restrooms", icon: "🚻", label: "Restrooms", color: "hp-purple" },
  { key: "subway", icon: "🚇", label: "Subway Stations", color: "hp-orange" },
  { key: "citibike", icon: "🚲", label: "Citi Bike Docks", color: "hp-green" },
] as const;

export function RouteAmenities({ lat, lng, radius = 500 }: RouteAmenitiesProps) {
  const [counts, setCounts] = useState<AmenityCounts | null>(null);
  const [fountainSeason, setFountainSeason] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/route-amenities?lat=${lat}&lng=${lng}&radius=${radius}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCounts(data.counts ?? null);
          setFountainSeason(data.fountainSeason ?? true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lat, lng, radius]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-surface-sage rounded-xl" />
        ))}
      </div>
    );
  }

  if (!counts) return null;

  const total = counts.water + counts.restrooms + counts.subway + counts.citibike;
  if (total === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 mb-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-bold text-text">Nearby Amenities</span>
        <span className="text-[10px] text-muted">within {Math.round(radius)}m</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AMENITY_TYPES.map(({ key, icon, label, color }) => {
          const count = counts[key as keyof AmenityCounts];
          return (
            <div
              key={key}
              className={`rounded-xl p-3 text-center border transition-colors ${
                count > 0
                  ? `${COLOR_MAP[color]?.bg ?? ""} ${COLOR_MAP[color]?.border ?? ""}`
                  : "bg-surface-sage border-border opacity-50"
              }`}
            >
              <p className="text-lg mb-0.5">{icon}</p>
              <p className="text-[16px] font-extrabold text-text">{count}</p>
              <p className="text-[9px] text-muted font-semibold">{label}</p>
            </div>
          );
        })}
      </div>

      {!fountainSeason && counts.water > 0 && (
        <p className="text-[10px] text-hp-orange mt-2 font-medium">
          ⚠️ Water fountains are typically off Nov–Mar. Bring your own water.
        </p>
      )}
    </div>
  );
}

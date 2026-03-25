"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NearbyRestaurant {
  name: string;
  cuisine: string;
  grade: string | null;
  score: number | null;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  chainSlug: string | null;
  isHealthy: boolean;
}

interface MenuItem {
  name: string;
  cal: number;
  protein: number;
  fat: number;
  carbs: number;
  sodium: number;
  fiber?: number;
  sugar?: number;
  tags?: string[];
}

interface RestaurantChain {
  name: string;
  slug: string;
  emoji: string;
  category: string;
  items: MenuItem[];
  orderingTip?: string;
}

interface RefuelSuggestion {
  restaurant: NearbyRestaurant;
  chain: RestaurantChain | null;
  topMeals: MenuItem[]; // Under 600 cal, sorted by protein
  walkMinutes: number;
}

interface RefuelNearbyProps {
  endLat: number;
  endLng: number;
  routeDistanceMi?: number;
}

export function RefuelNearby({ endLat, endLng, routeDistanceMi }: RefuelNearbyProps) {
  const [suggestions, setSuggestions] = useState<RefuelSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRefuel() {
      setLoading(true);
      try {
        // Fetch nearby Grade A restaurants within 400m (~0.25mi / 5-min walk)
        const res = await fetch(
          `/api/nearby-food?lat=${endLat}&lng=${endLng}&radius=400&gradeA=true`,
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const restaurants: NearbyRestaurant[] = data.results ?? [];

        // Fetch chain nutrition data
        let chains: RestaurantChain[] = [];
        try {
          const mod = await import("@/lib/restaurantData");
          chains = (mod.RESTAURANT_CHAINS ?? []) as RestaurantChain[];
        } catch {
          // If dynamic import fails, we just won't have nutrition data
        }

        // Match restaurants to chains and build suggestions
        const matched: RefuelSuggestion[] = [];

        for (const r of restaurants) {
          const chain = r.chainSlug
            ? chains.find((c) => c.slug === r.chainSlug) ?? null
            : null;

          // Get meals under 600 cal, sorted by protein (best recovery food)
          const topMeals = chain
            ? chain.items
                .filter((m) => m.cal <= 600)
                .sort((a, b) => b.protein - a.protein)
                .slice(0, 3)
            : [];

          const walkMinutes = Math.round((r.distance / 1000) * 12); // ~5 km/h walking

          matched.push({ restaurant: r, chain, topMeals, walkMinutes });
        }

        // Prioritize: chains with nutrition data first, then healthy cuisines, then by distance
        matched.sort((a, b) => {
          if (a.topMeals.length > 0 && b.topMeals.length === 0) return -1;
          if (b.topMeals.length > 0 && a.topMeals.length === 0) return 1;
          if (a.restaurant.isHealthy && !b.restaurant.isHealthy) return -1;
          if (b.restaurant.isHealthy && !a.restaurant.isHealthy) return 1;
          return a.restaurant.distance - b.restaurant.distance;
        });

        if (!cancelled) {
          setSuggestions(matched.slice(0, 4));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setLoading(false);
        }
      }
    }

    fetchRefuel();
    return () => { cancelled = true; };
  }, [endLat, endLng]);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🍽️</span>
          <div className="h-4 w-40 bg-surface-sage rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface-sage rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  // Estimate calories burned for context
  const calBurned = routeDistanceMi ? Math.round(routeDistanceMi * 100) : null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 mb-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍽️</span>
          <h3 className="text-[14px] font-bold text-text">Refuel Nearby</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-hp-orange/10 border border-hp-orange/20 text-hp-orange font-bold uppercase tracking-wide">
            Eat Smart
          </span>
        </div>
        <Link
          href="/eat-smart"
          className="text-[11px] text-hp-green font-semibold hover:underline"
        >
          Full Guide →
        </Link>
      </div>
      <p className="text-[11px] text-muted mb-3">
        Grade A restaurants within a 5-min walk of your route endpoint
        {calBurned && (
          <span className="ml-1 text-hp-green font-semibold">
            · ~{calBurned} cal burned
          </span>
        )}
      </p>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((s) => {
          const isExpanded = expanded === s.restaurant.name;
          return (
            <div
              key={s.restaurant.name + s.restaurant.address}
              className="border border-border rounded-xl overflow-hidden transition-all"
            >
              {/* Restaurant row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : s.restaurant.name)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-sage/50 transition-colors"
              >
                {/* Grade badge */}
                <div className="w-9 h-9 rounded-lg bg-hp-green/10 border border-hp-green/20 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-extrabold text-hp-green">
                    {s.restaurant.grade ?? "–"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-text truncate">
                      {s.chain?.emoji ?? "🍴"} {s.restaurant.name}
                    </span>
                    {s.restaurant.isHealthy && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-hp-green/8 text-hp-green font-semibold shrink-0">
                        Healthy
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate">
                    {s.restaurant.cuisine} · {s.walkMinutes} min walk
                    {s.topMeals.length > 0 && ` · ${s.topMeals.length} meals under 600 cal`}
                  </p>
                </div>

                {/* Expand chevron */}
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  className={`text-muted shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                >
                  <path d="M3 5 L6 8 L9 5" />
                </svg>
              </button>

              {/* Expanded: meal suggestions */}
              {isExpanded && (
                <div className="border-t border-border bg-surface-sage/30 px-3 pb-3 pt-2">
                  {s.topMeals.length > 0 ? (
                    <>
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">
                        Recovery meals under 600 cal
                      </p>
                      <div className="space-y-1.5">
                        {s.topMeals.map((meal) => (
                          <div
                            key={meal.name}
                            className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-border/50"
                          >
                            <div>
                              <span className="text-[12px] font-semibold text-text">
                                {meal.name}
                              </span>
                              <div className="flex gap-2 mt-0.5">
                                {meal.tags?.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-hp-blue/8 text-hp-blue font-semibold"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className="text-[13px] font-bold text-text">{meal.cal} cal</p>
                              <p className="text-[10px] text-muted">
                                {meal.protein}g protein · {meal.carbs}g carbs
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {s.chain?.orderingTip && (
                        <p className="text-[10px] text-dim mt-2 italic">
                          💡 {s.chain.orderingTip}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-[11px] text-muted">
                      <p className="mb-1">
                        No calorie data available for this restaurant. Look for:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Grilled proteins over fried</li>
                        <li>Rice bowls, salads, or wraps</li>
                        <li>Ask for dressing/sauce on the side</li>
                      </ul>
                    </div>
                  )}
                  <p className="text-[10px] text-muted mt-2">
                    📍 {s.restaurant.address}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

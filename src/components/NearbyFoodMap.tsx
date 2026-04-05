"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CHAINS } from "@/lib/restaurantData";
import { CHAINS as EAT_SMART_CHAINS, getChainTopPicks } from "@/lib/eatSmartData";
import { getHealthyTip, getDirectionsUrl, type HealthyTip } from "@/lib/cuisineTips";

const MapImpl = dynamic(() => import("./_NearbyFoodMapImpl"), { ssr: false });

/* ── Types ───────────────────────────────────────────────── */

export interface NearbyRestaurant {
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
  bestPick?: { name: string; calories: number; protein: number; pulseScore: number };
  healthyTip?: HealthyTip | null;
}

/* ── Component ───────────────────────────────────────────── */

export function NearbyFoodMap() {
  const [results, setResults] = useState<NearbyRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [zip, setZip] = useState("");
  const [filter, setFilter] = useState<"all" | "chains" | "tips" | "gradeA">("all");
  const [showMap, setShowMap] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/nearby-food?lat=${lat}&lng=${lng}&radius=1600`);
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setResults(json.results ?? []);
      setUserLoc({ lat, lng });
      setShowMap(true);
    } catch {
      setError("Couldn't load nearby restaurants. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLoading(false);
        setError("Location permission denied. Try entering a zip code.");
      },
      { timeout: 8000 }
    );
  };

  const searchByZip = async () => {
    if (!zip || zip.length < 5) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$select=avg(latitude) as lat,avg(longitude) as lng&$where=zipcode='${zip}'&$limit=1`
      );
      const data = await res.json();
      if (data?.[0]?.lat && data?.[0]?.lng) {
        fetchNearby(Number(data[0].lat), Number(data[0].lng));
      } else {
        setError("Zip code not found in NYC. Try another.");
        setLoading(false);
      }
    } catch {
      setError("Couldn't geocode zip. Try using location instead.");
      setLoading(false);
    }
  };

  // Enrich results with PulseScore best picks + cuisine tips
  const enriched = results.map((r) => {
    const out = { ...r };

    // Chain enrichment
    if (r.chainSlug && !r.bestPick) {
      const eatChain = EAT_SMART_CHAINS.find(c => c.slug === r.chainSlug);
      if (eatChain) {
        const top = getChainTopPicks(eatChain, 1)[0];
        if (top) out.bestPick = { name: top.name, calories: top.calories, protein: top.protein ?? 0, pulseScore: top.pulseScore };
      }
    }

    // Cuisine tip enrichment for non-chains
    if (!r.chainSlug && !r.healthyTip) {
      out.healthyTip = getHealthyTip(r.cuisine, r.name);
    }

    return out;
  });

  const filtered = enriched.filter((r) => {
    if (filter === "chains") return r.chainSlug !== null;
    if (filter === "tips") return r.healthyTip != null || r.chainSlug !== null;
    if (filter === "gradeA") return r.grade === "A";
    return true;
  });

  const chainMatch = (slug: string | null) => {
    if (!slug) return null;
    return CHAINS.find((c) => c.slug === slug);
  };

  // Filter counts
  const chainCount = enriched.filter(r => r.chainSlug !== null).length;
  const tipCount = enriched.filter(r => r.healthyTip != null || r.chainSlug !== null).length;
  const gradeACount = enriched.filter(r => r.grade === "A").length;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-[13px] font-bold text-text">Healthy Food Near Me</p>
            <p className="text-[10px] text-dim">Real restaurants from NYC DOHMH inspections + smart ordering tips</p>
          </div>
        </div>

        {/* Location controls */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <button
            onClick={useMyLocation}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-hp-blue/10 border border-hp-blue/20 text-[12px] font-bold text-hp-blue hover:bg-hp-blue/15 transition-colors disabled:opacity-50"
          >
            {loading ? "Finding..." : "📍 Use My Location"}
          </button>
          <div className="flex-1 flex gap-2">
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="Or enter ZIP"
              className="flex-1 bg-bg border border-border rounded-xl px-3 py-2.5 text-[12px] text-text placeholder:text-muted outline-none focus:border-hp-blue/50 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && searchByZip()}
            />
            <button
              onClick={searchByZip}
              disabled={loading || zip.length < 5}
              className="px-4 py-2.5 rounded-xl bg-bg border border-border text-[12px] font-semibold text-dim hover:text-text transition-colors disabled:opacity-50"
            >
              Go
            </button>
          </div>
        </div>

        {error && <p className="text-[11px] text-hp-red mt-2">{error}</p>}
      </div>

      {/* Map + Results */}
      {showMap && userLoc && (
        <>
          {/* Filter bar */}
          <div className="flex gap-1.5 p-3 border-b border-border overflow-x-auto">
            {([
              ["all", "All", enriched.length],
              ["chains", "Chains w/ Nutrition", chainCount],
              ["tips", "Local w/ Tips", tipCount],
              ["gradeA", "Grade A Only", gradeACount],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => { setFilter(key as typeof filter); setSelectedIdx(null); }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                  filter === key
                    ? "bg-hp-green/10 border-hp-green/30 text-hp-green"
                    : "border-border text-dim hover:text-text"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Map */}
          <div className="relative h-[450px] w-full">
            <MapImpl
              center={[userLoc.lat, userLoc.lng]}
              restaurants={filtered}
              selectedIndex={selectedIdx}
              onMarkerClick={(i: number) => setSelectedIdx(i)}
            />
            {/* Legend */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-border/50 flex gap-3 z-10">
              <span className="flex items-center gap-1 text-[9px] text-dim">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#4A7C59" }} /> Chain
              </span>
              <span className="flex items-center gap-1 text-[9px] text-dim">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-white border border-gray-300" /> Local
              </span>
              <span className="flex items-center gap-1 text-[9px] text-dim">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#5b9cf5" }} /> You
              </span>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50">
            {filtered.length === 0 && (
              <p className="text-[12px] text-muted text-center py-6">No restaurants found with this filter.</p>
            )}
            {filtered.map((r, i) => {
              const chain = chainMatch(r.chainSlug);
              const distMi = (r.distance / 1609.34).toFixed(2);
              const dirUrl = getDirectionsUrl(r.lat, r.lng, r.name, r.address);
              return (
                <div
                  key={i}
                  className="px-4 py-2.5 flex items-start gap-3 cursor-pointer hover:bg-bg/50 transition-colors"
                  onClick={() => setSelectedIdx(i)}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {chain ? chain.emoji : r.isHealthy ? "🥗" : "🍴"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-bold text-text truncate">{r.name}</p>
                      {r.grade && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          r.grade === "A" ? "bg-hp-green/10 text-hp-green" :
                          r.grade === "B" ? "bg-hp-orange/10 text-hp-orange" :
                          "bg-hp-red/10 text-hp-red"
                        }`}>
                          {r.grade}
                        </span>
                      )}
                      {r.chainSlug && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">CHAIN</span>
                      )}
                    </div>
                    <p className="text-[10px] text-dim">
                      {r.cuisine} · {distMi} mi · {r.address}
                    </p>

                    {/* Chain best pick */}
                    {r.bestPick && (
                      <p className="text-[10px] text-hp-green font-semibold mt-0.5">
                        💪 {r.bestPick.name} ({r.bestPick.calories} cal, {r.bestPick.protein}g P, Score: {r.bestPick.pulseScore})
                      </p>
                    )}

                    {/* Cuisine tip for non-chains */}
                    {!r.chainSlug && r.healthyTip && (
                      <div className="mt-1 text-[10px]">
                        <span className="text-hp-green font-semibold">💡 </span>
                        <span className="text-dim line-through">{r.healthyTip.defaultOrder}</span>
                        <span className="text-text font-medium"> → {r.healthyTip.smartOrder}</span>
                        <span className="text-hp-green font-semibold"> ({r.healthyTip.estimatedSavings})</span>
                      </div>
                    )}

                    {/* Directions + Full menu row */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <a
                        href={dirUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-accent bg-accent/5 rounded-full hover:bg-accent/10 transition-colors no-underline"
                      >
                        🧭 Directions
                      </a>
                      {chain && (
                        <Link href={`/restaurants/${chain.slug}`} onClick={e => e.stopPropagation()} className="text-[10px] text-dim hover:underline">
                          Full menu →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t border-border bg-bg/50">
            <p className="text-[9px] text-muted">
              Data: NYC DOHMH Restaurant Inspections · Grade A = lowest violation score · {filtered.length} results within ~1 mi
            </p>
          </div>
        </>
      )}

      {/* Pre-search state */}
      {!showMap && !loading && (
        <div className="px-4 py-6 text-center">
          <p className="text-[11px] text-dim">
            Tap &quot;Use My Location&quot; or enter your zip code to find restaurants with nutrition data and health grades near you.
          </p>
          <div className="flex justify-center gap-3 mt-3">
            <Link href="#quick-picks" className="text-[10px] text-hp-blue hover:underline">
              Or browse curated chain picks below ↓
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

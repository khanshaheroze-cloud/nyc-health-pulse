"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { CHAINS as EAT_SMART_CHAINS, getChainTopPicks } from "@/lib/eatSmartData";
import { getHealthyTip, getMarkerIcon, getDirectionsUrl } from "@/lib/cuisineTips";
import { getRestaurantMenu } from "@/lib/eat-smart/useRestaurantMenu";
import { quickLogMenuItem, removeQuickLog } from "@/lib/eat-smart/quickLog";
import { formatDistance } from "@/lib/eat-smart/distance";
import { useDistanceUnit } from "@/lib/eat-smart/useDistanceUnit";
import type { RestaurantMenu } from "@/lib/eat-smart/types";
import { LazyMenuModal, preloadMenuModal } from "./LazyMenuModal";
import { QuickLogToast } from "./QuickLogToast";

const MapImpl = dynamic(() => import("./_EatSmartMapHeroImpl"), { ssr: false });

/* ── Types ───────────────────────────────────────────────── */

export interface NearbyResult {
  name: string;
  cuisine: string;
  grade: string | null;
  score: number | null;
  address: string;
  lat: number;
  lng: number;
  distance: number;  // meters from API
  chainSlug: string | null;
  isHealthy: boolean;
}

export interface EnrichedResult extends NearbyResult {
  isChain: boolean;
  icon: string;
  bestPick: { name: string; calories: number; protein: number; pulseScore: number } | null;
  healthyTip: { category: string; defaultOrder: string; smartOrder: string; tip: string; estimatedSavings: string } | null;
}

type RadiusOption = 0.25 | 0.5 | 1 | 2;
type FilterOption = "all" | "chains" | "local" | "grade-a";

const RADIUS_OPTIONS: { value: RadiusOption; label: string }[] = [
  { value: 0.25, label: "0.25 mi" },
  { value: 0.5, label: "0.5 mi" },
  { value: 1, label: "1 mi" },
  { value: 2, label: "2 mi" },
];

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chains", label: "Chains with menus" },
  { value: "local", label: "Local with tips" },
  { value: "grade-a", label: "Grade A only" },
];

/* ── Component ───────────────────────────────────────────── */

export function EatSmartMapHero() {
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [zip, setZip] = useState("");

  // Map controls
  const [radius, setRadius] = useState<RadiusOption>(0.5);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapPanned, setMapPanned] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Modal / toast
  const [modalMenu, setModalMenu] = useState<{ menu: RestaurantMenu; distance?: string; grade?: string | null } | null>(null);
  const [toastData, setToastData] = useState<{ itemName: string; restaurantName: string; calories: number; protein: number; logId: string } | null>(null);
  const [distanceUnit, setDistanceUnit] = useDistanceUnit();

  // Map ref for flyTo
  const flyToRef = useRef<((lat: number, lng: number) => void) | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number, radiusMi: number = 0.5) => {
    setLoading(true);
    setError("");
    try {
      const radiusMeters = Math.round(radiusMi * 1609.34);
      const res = await fetch(`/api/nearby-food?lat=${lat}&lng=${lng}&radius=${radiusMeters}`);
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      const raw: NearbyResult[] = json.results ?? [];

      const enriched: EnrichedResult[] = raw.slice(0, 100).map((r) => {
        const isChain = r.chainSlug !== null;
        const icon = getMarkerIcon(r.cuisine, r.chainSlug, r.isHealthy);
        let bestPick: EnrichedResult["bestPick"] = null;
        if (r.chainSlug) {
          const menu = getRestaurantMenu(r.chainSlug, r.cuisine, r.name, r.name);
          if (menu) {
            const foodItems = menu.items.filter(i => !i.isDrink && i.availabilityStatus !== "discontinued");
            const top = foodItems.sort((a, b) => b.pulseScore - a.pulseScore)[0];
            if (top) bestPick = { name: top.name, calories: top.calories, protein: top.protein, pulseScore: top.pulseScore };
          }
          if (!bestPick) {
            const chain = EAT_SMART_CHAINS.find(c => c.slug === r.chainSlug);
            if (chain) {
              const top = getChainTopPicks(chain, 1)[0];
              if (top) bestPick = { name: top.name, calories: top.calories, protein: top.protein ?? 0, pulseScore: top.pulseScore };
            }
          }
        }
        const healthyTip = !isChain ? getHealthyTip(r.cuisine, r.name) : null;
        return { ...r, isChain, icon, bestPick, healthyTip };
      });

      setResults(enriched);
      setUserLoc({ lat, lng });
      setHasLocation(true);
      setMapPanned(false);
    } catch {
      setError("Couldn't load restaurants. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (navigator.geolocation && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((perm) => {
        if (perm.state === "granted") {
          navigator.geolocation.getCurrentPosition(
            (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude, 0.5),
            () => {},
            { timeout: 5000 },
          );
        }
      }).catch(() => {});
    }
  }, [fetchNearby]);

  // Document-level listener for popup buttons
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const menuBtn = target.closest("[data-menu-open]") as HTMLElement | null;
      const logBtn = target.closest("[data-quick-log]") as HTMLElement | null;

      if (menuBtn) {
        try {
          const d = JSON.parse(menuBtn.getAttribute("data-menu-open") ?? "{}");
          const menu = getRestaurantMenu(d.chainSlug, d.cuisine, d.name, d.name);
          if (menu) setModalMenu({ menu, distance: d.distance, grade: d.grade });
        } catch { /* ignore */ }
      }

      if (logBtn) {
        try {
          const d = JSON.parse(logBtn.getAttribute("data-quick-log") ?? "{}");
          const menu = getRestaurantMenu(d.chainSlug, d.cuisine, d.name, d.name);
          if (menu && menu.items.length > 0) {
            const foodItems = menu.items.filter(i => !i.isDrink);
            const topItem = [...(foodItems.length > 0 ? foodItems : menu.items)].sort((a, b) => b.pulseScore - a.pulseScore)[0];
            const result = quickLogMenuItem({
              item: topItem,
              restaurantName: menu.restaurantName,
              restaurantId: menu.restaurantId,
              source: "map-quick-log",
            });
            logBtn.textContent = "\u2713 Logged";
            logBtn.style.opacity = "0.7";
            setToastData({
              itemName: topItem.name,
              restaurantName: menu.restaurantName,
              calories: topItem.calories,
              protein: topItem.protein,
              logId: result.logId,
            });
          }
        } catch { /* ignore */ }
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude, radius),
      () => {
        setLoading(false);
        setError("Location denied. Try entering a ZIP code.");
      },
      { timeout: 8000 },
    );
  };

  const searchByZip = async () => {
    if (!zip || zip.length < 5) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$select=avg(latitude) as lat,avg(longitude) as lng&$where=zipcode='${zip}'&$limit=1`,
      );
      const data = await res.json();
      if (data?.[0]?.lat && data?.[0]?.lng) {
        fetchNearby(Number(data[0].lat), Number(data[0].lng), radius);
      } else {
        setError("ZIP not found in NYC.");
        setLoading(false);
      }
    } catch {
      setError("Couldn't geocode ZIP.");
      setLoading(false);
    }
  };

  const handleRadiusChange = (r: RadiusOption) => {
    setRadius(r);
    if (userLoc) fetchNearby(userLoc.lat, userLoc.lng, r);
  };

  const searchThisArea = () => {
    if (mapCenter) fetchNearby(mapCenter.lat, mapCenter.lng, radius);
  };

  const handleMapMove = useCallback((center: { lat: number; lng: number }) => {
    setMapCenter(center);
    setMapPanned(true);
  }, []);

  // Apply filter
  const filtered = results.filter((r) => {
    if (filter === "chains") return r.isChain;
    if (filter === "local") return !r.isChain && r.healthyTip != null;
    if (filter === "grade-a") return r.grade === "A";
    return true;
  });

  const handleCardClick = (r: EnrichedResult) => {
    setSelectedId(`${r.lat}-${r.lng}`);
    flyToRef.current?.(r.lat, r.lng);
  };

  const handleSeeMenu = (r: EnrichedResult) => {
    const menu = getRestaurantMenu(r.chainSlug, r.cuisine, r.name, r.name);
    if (menu) setModalMenu({ menu, distance: formatDistance(r.distance, distanceUnit), grade: r.grade });
  };

  const handleQuickLog = (r: EnrichedResult) => {
    const menu = getRestaurantMenu(r.chainSlug, r.cuisine, r.name, r.name);
    if (menu && menu.items.length > 0) {
      const foodItems = menu.items.filter(i => !i.isDrink);
      const topItem = [...(foodItems.length > 0 ? foodItems : menu.items)].sort((a, b) => b.pulseScore - a.pulseScore)[0];
      const result = quickLogMenuItem({
        item: topItem,
        restaurantName: menu.restaurantName,
        restaurantId: menu.restaurantId,
        source: "map-quick-log",
      });
      setToastData({
        itemName: topItem.name,
        restaurantName: menu.restaurantName,
        calories: topItem.calories,
        protein: topItem.protein,
        logId: result.logId,
      });
    }
  };

  if (!mounted) return <div className="rounded-2xl bg-surface border border-border-light h-[460px] animate-pulse" />;

  const chainCount = filtered.filter(r => r.isChain).length;
  const localCount = filtered.filter(r => !r.isChain).length;

  return (
    <div>
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-[20px] font-display font-bold text-text">Eat Smart NYC</h1>
        <p className="text-[13px] text-dim mt-0.5">
          {hasLocation ? "Healthy picks near you — tap any pin." : "Share your location to see pins near you."}
        </p>
      </div>

      <div className="rounded-2xl bg-surface border border-border-light overflow-hidden">
        {/* Toolbar */}
        {hasLocation && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border-light bg-bg/50">
            {/* Search this area */}
            {mapPanned && (
              <button
                onClick={searchThisArea}
                className="px-3 py-1.5 rounded-full bg-accent text-white text-[11px] font-bold hover:bg-accent/90 transition-colors animate-fade-in-up"
              >
                Search this area
              </button>
            )}

            {/* Radius dropdown */}
            <div className="relative">
              <select
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value) as RadiusOption)}
                className="appearance-none bg-white border border-border-light rounded-full px-3 py-1.5 pr-7 text-[11px] font-bold text-text cursor-pointer hover:border-accent/30 transition-colors"
              >
                {RADIUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-dim pointer-events-none">&#9662;</span>
            </div>

            {/* Filter dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterOption)}
                className="appearance-none bg-white border border-border-light rounded-full px-3 py-1.5 pr-7 text-[11px] font-bold text-text cursor-pointer hover:border-accent/30 transition-colors"
              >
                {FILTER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-dim pointer-events-none">&#9662;</span>
            </div>

            {/* Distance unit */}
            <div className="relative">
              <select
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value as "blocks" | "imperial" | "miles")}
                className="appearance-none bg-white border border-border-light rounded-full px-3 py-1.5 pr-7 text-[11px] font-bold text-text cursor-pointer hover:border-accent/30 transition-colors"
              >
                <option value="blocks">🏙️ Blocks</option>
                <option value="imperial">📏 Feet / Miles</option>
                <option value="miles">🌐 Miles</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-dim pointer-events-none">&#9662;</span>
            </div>

            {/* Result count */}
            <span className="text-[10px] text-dim ml-auto hidden sm:inline">
              {filtered.length} results in {radius} mi · {chainCount} chains · {localCount} local
            </span>
          </div>
        )}

        {/* Map area */}
        <div className="relative h-[55vh] min-h-[460px] max-h-[700px] lg:h-[55vh] w-full" style={{ minHeight: hasLocation ? undefined : "300px" }}>
          {hasLocation && userLoc ? (
            <>
              <MapImpl
                center={[userLoc.lat, userLoc.lng]}
                restaurants={filtered}
                selectedId={selectedId}
                onMapMove={handleMapMove}
                flyToRef={flyToRef}
                distanceUnit={distanceUnit}
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
              {/* Mobile result count */}
              <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-border/50 z-10 sm:hidden">
                <span className="text-[9px] text-dim font-medium">{filtered.length} results</span>
              </div>
            </>
          ) : (
            /* No-location state */
            <div className="flex flex-col items-center justify-center h-full bg-bg/30 px-6">
              {loading ? (
                <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              ) : (
                <>
                  <p className="text-[32px] mb-3">📍</p>
                  <p className="text-[15px] font-bold text-text mb-1">Find healthy food near you</p>
                  <p className="text-[12px] text-dim mb-4 text-center max-w-[280px]">
                    We'll show restaurants from NYC DOHMH inspections with smart ordering tips and PulseScore ratings.
                  </p>
                  <button
                    onClick={requestLocation}
                    className="px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors mb-3"
                  >
                    Use My Location
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      value={zip}
                      onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="Or enter ZIP"
                      className="bg-white border border-border-light rounded-lg px-3 py-2 text-[12px] text-text placeholder:text-muted outline-none focus:border-accent/50 transition-colors w-[120px]"
                      onKeyDown={(e) => e.key === "Enter" && searchByZip()}
                    />
                    <button
                      onClick={searchByZip}
                      disabled={zip.length < 5}
                      className="px-3 py-2 rounded-lg bg-white border border-border-light text-[12px] font-semibold text-dim hover:text-text transition-colors disabled:opacity-50"
                    >
                      Go
                    </button>
                  </div>
                  {error && <p className="text-[11px] text-hp-red mt-2">{error}</p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nearby results list below map */}
      {hasLocation && filtered.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted whitespace-nowrap">Nearby</p>
            <div className="flex-1 h-px bg-border-light" />
            <p className="text-[10px] text-dim">{filtered.length} restaurants</p>
          </div>

          {/* Card grid — scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:snap-none scrollbar-hide">
            {filtered
              .sort((a, b) => {
                const scoreA = a.bestPick?.pulseScore ?? 0;
                const scoreB = b.bestPick?.pulseScore ?? 0;
                if (scoreB !== scoreA) return scoreB - scoreA;
                return a.distance - b.distance;
              })
              .slice(0, 20)
              .map((r) => {
                const distLabel = formatDistance(r.distance, distanceUnit);
                return (
                  <div
                    key={`${r.lat}-${r.lng}-${r.name}`}
                    className="flex-shrink-0 w-[240px] md:w-auto snap-start rounded-xl bg-surface border border-border-light p-3.5 cursor-pointer hover:border-accent/30 hover:shadow-sm transition-all"
                    onClick={() => handleCardClick(r)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-text truncate">{r.icon} {r.name}</p>
                        <p className="text-[10px] text-dim">{r.cuisine} · {distLabel}</p>
                      </div>
                      {r.grade && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          r.grade === "A" ? "bg-hp-green/10 text-hp-green"
                            : r.grade === "B" ? "bg-hp-orange/10 text-hp-orange"
                            : "bg-hp-red/10 text-hp-red"
                        }`}>
                          {r.grade}
                        </span>
                      )}
                    </div>

                    {r.bestPick && (
                      <div className="mb-2">
                        <p className="text-[10px] text-hp-green font-semibold">
                          Score {r.bestPick.pulseScore} · {r.bestPick.name}
                        </p>
                        <p className="text-[9px] text-dim">{r.bestPick.calories} cal · {r.bestPick.protein}g protein</p>
                      </div>
                    )}

                    {!r.isChain && r.healthyTip && (
                      <div className="mb-2">
                        <p className="text-[10px] text-dim line-through">{r.healthyTip.defaultOrder}</p>
                        <p className="text-[10px] text-text font-medium">→ {r.healthyTip.smartOrder}</p>
                        <p className="text-[9px] text-hp-green font-semibold">{r.healthyTip.estimatedSavings}</p>
                      </div>
                    )}

                    <div className="flex gap-1.5 mt-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSeeMenu(r); }}
                        onMouseEnter={preloadMenuModal}
                        className="flex-1 py-1.5 rounded-lg border border-border-light text-[10px] font-bold text-text hover:bg-bg transition-colors"
                      >
                        See menu →
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuickLog(r); }}
                        className="flex-1 py-1.5 rounded-lg bg-accent text-white text-[10px] font-bold hover:bg-accent/90 transition-colors"
                      >
                        + I ate this
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {hasLocation && filtered.length === 0 && !loading && (
        <div className="mt-4 text-center py-6">
          <p className="text-[12px] text-dim">No healthy-graded restaurants in this area. Try expanding your radius or panning the map.</p>
        </div>
      )}

      {/* Menu modal + undo toast */}
      <LazyMenuModal
        open={!!modalMenu}
        menu={modalMenu?.menu ?? null}
        distance={modalMenu?.distance}
        grade={modalMenu?.grade}
        onOpenChange={(o) => { if (!o) setModalMenu(null); }}
      />
      {toastData && (
        <QuickLogToast
          itemName={toastData.itemName}
          restaurantName={toastData.restaurantName}
          calories={toastData.calories}
          protein={toastData.protein}
          logId={toastData.logId}
          onUndo={(logId) => { removeQuickLog(logId); setToastData(null); }}
          onDismiss={() => setToastData(null)}
        />
      )}
    </div>
  );
}

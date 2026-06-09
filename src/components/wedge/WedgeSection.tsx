"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { WedgeHero } from "./WedgeHero";
import { WedgeSearch } from "./WedgeSearch";
import { QuickFilterChips, type ChipId } from "./QuickFilterChips";
import { MealTypeToggle } from "./MealTypeToggle";
import { LiveResultsStrip, type ResultSpot, type SortKey } from "./LiveResultsStrip";
import { SpotModal } from "./SpotModal";
import { AppWaitlistCapture } from "../AppWaitlistCapture";
import { detectMealType, type MealCategory } from "@/lib/inferMealType";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { reverseGeocode } from "@/lib/geocode";
import { neighborhoods } from "@/lib/neighborhoodData";
import {
  readLocation,
  writeLocation,
  subscribeLocation,
  requestBrowserLocation,
  type LocationStatus,
} from "@/lib/locationStore";

const LocalMap = dynamic(() => import("./LocalMap").then(m => m.LocalMap), { ssr: false });

const TIMES_SQUARE = { lat: 40.758, lng: -73.9855 };
const MEAL_LS_KEY = "pulsenyc:mealType";

interface ApiRestaurant {
  slug: string;
  restaurantName: string;
  priceRange: number;
  priceTier?: string;
  walkMinutes: number;
  lat: number;
  lng: number;
  address: string;
  grade: string;
  inspectedAt?: string | null;
  isGeneric: boolean;
  category: string;
  topPicks: { name: string; calories: number; protein: number; pulseScore: number }[];
  bestDrink?: { name: string; calories: number; protein: number } | null;
  locationCount?: number;
  otherLocations?: { address: string; walkMinutes: number; grade: string }[];
  orderingTip?: string;
}

function readCachedMeal(): MealCategory | null {
  try {
    const v = localStorage.getItem(MEAL_LS_KEY);
    if (v && ["breakfast", "lunch", "coffee", "snack", "dinner"].includes(v)) return v as MealCategory;
  } catch {}
  return null;
}

function findNearestNeighborhood(lat: number, lng: number) {
  let best = neighborhoods[0];
  let bestDist = Infinity;
  for (const n of neighborhoods) {
    const centroid = NEIGHBORHOOD_CENTROIDS[n.slug];
    if (!centroid) continue;
    const d = (lat - centroid.lat) ** 2 + (lng - centroid.lng) ** 2;
    if (d < bestDist) { bestDist = d; best = n; }
  }
  return best;
}

const NEIGHBORHOOD_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "kingsbridge-riverdale": { lat: 40.8840, lng: -73.9070 },
  "northeast-bronx": { lat: 40.8680, lng: -73.8470 },
  "fordham-bronx-park": { lat: 40.8610, lng: -73.8820 },
  "pelham-throgs-neck": { lat: 40.8280, lng: -73.8240 },
  "crotona-tremont": { lat: 40.8440, lng: -73.8930 },
  "high-bridge-morrisania": { lat: 40.8310, lng: -73.9140 },
  "hunts-point-mott-haven": { lat: 40.8150, lng: -73.9050 },
  "greenpoint": { lat: 40.7270, lng: -73.9510 },
  "downtown-heights-slope": { lat: 40.6870, lng: -73.9780 },
  "bedford-stuyvesant-crown-heights": { lat: 40.6810, lng: -73.9390 },
  "east-new-york": { lat: 40.6640, lng: -73.8790 },
  "sunset-park": { lat: 40.6500, lng: -74.0020 },
  "borough-park": { lat: 40.6350, lng: -73.9920 },
  "east-flatbush-flatbush": { lat: 40.6490, lng: -73.9560 },
  "canarsie-flatlands": { lat: 40.6390, lng: -73.9010 },
  "bensonhurst-bay-ridge": { lat: 40.6230, lng: -74.0080 },
  "coney-island-sheepshead-bay": { lat: 40.5830, lng: -73.9530 },
  "williamsburg-bushwick": { lat: 40.7030, lng: -73.9260 },
  "washington-heights-inwood": { lat: 40.8520, lng: -73.9310 },
  "central-harlem-morningside-heights": { lat: 40.8100, lng: -73.9540 },
  "east-harlem": { lat: 40.7940, lng: -73.9430 },
  "upper-west-side": { lat: 40.7870, lng: -73.9730 },
  "upper-east-side-gramercy": { lat: 40.7680, lng: -73.9580 },
  "chelsea-clinton": { lat: 40.7500, lng: -73.9960 },
  "greenwich-village-soho": { lat: 40.7280, lng: -74.0010 },
  "union-square-lower-east-side": { lat: 40.7200, lng: -73.9870 },
  "lower-manhattan": { lat: 40.7100, lng: -74.0100 },
  "long-island-city-astoria": { lat: 40.7560, lng: -73.9240 },
  "west-queens": { lat: 40.7390, lng: -73.8810 },
  "flushing-clearview": { lat: 40.7650, lng: -73.8120 },
  "bayside-meadows": { lat: 40.7620, lng: -73.7700 },
  "ridgewood-forest-hills": { lat: 40.7120, lng: -73.8600 },
  "fresh-meadows": { lat: 40.7360, lng: -73.7830 },
  "southwest-queens": { lat: 40.6810, lng: -73.8350 },
  "jamaica": { lat: 40.7030, lng: -73.7900 },
  "southeast-queens": { lat: 40.6700, lng: -73.7600 },
  "rockaways": { lat: 40.5930, lng: -73.7820 },
  "port-richmond": { lat: 40.6330, lng: -74.1370 },
  "stapleton-st-george": { lat: 40.6290, lng: -74.0770 },
  "willowbrook": { lat: 40.5920, lng: -74.1380 },
  "south-beach-tottenville": { lat: 40.5530, lng: -74.1420 },
};

function syncNeighborhood(lat: number, lng: number, source: "gps" | "manual") {
  const hood = findNearestNeighborhood(lat, lng);
  if (!hood) return;
  const detail = { slug: hood.slug, name: hood.name, borough: hood.borough };
  try {
    localStorage.setItem("pulse-my-neighborhood", JSON.stringify(detail));
  } catch {}
  window.dispatchEvent(new CustomEvent("pulse-my-neighborhood-change", { detail }));
}

export function WedgeSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(TIMES_SQUARE);
  const [locationLabel, setLocationLabel] = useState("Set location");
  const [isDefault, setIsDefault] = useState(true);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  // accuracy > 2km (desktop IP geolocation): show the resolved neighborhood
  // and ask for confirmation instead of silently using it
  const [lowConfidenceHood, setLowConfidenceHood] = useState<string | null>(null);

  const [activeChips, setActiveChips] = useState<Set<ChipId>>(() => new Set(["high-protein"]));
  const [mealType, setMealType] = useState<MealCategory>(() => detectMealType());

  const [allSpots, setAllSpots] = useState<ResultSpot[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapVisible, setMapVisible] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("score");

  const spotSlug = searchParams.get("spot");

  const anyPriceFilter = activeChips.has("price-1") || activeChips.has("price-2") || activeChips.has("price-3");

  // Filter spots by active chips, then sort by the selected key
  const spots = useMemo(() => {
    let filtered = allSpots;
    if (activeChips.has("quick")) {
      filtered = filtered.filter(r => r.walkMinutes <= 5);
    }
    if (anyPriceFilter) {
      filtered = filtered.filter(r => {
        const tier = r.priceTier || (r.priceRange <= 1 ? "$" : r.priceRange <= 2 ? "$$" : "$$$");
        if (activeChips.has("price-1") && tier === "$") return true;
        if (activeChips.has("price-2") && tier === "$$") return true;
        if (activeChips.has("price-3") && tier === "$$$") return true;
        return false;
      });
    }
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "protein": return (b.topPickProtein ?? 0) - (a.topPickProtein ?? 0);
        case "calories": return (a.topPickCalories || 9999) - (b.topPickCalories || 9999);
        case "distance": return a.walkMinutes - b.walkMinutes;
        case "protein-per-dollar":
          return (b.topPickProtein ?? 0) / Math.max(1, b.priceRange) - (a.topPickProtein ?? 0) / Math.max(1, a.priceRange);
        case "score":
        default:
          return (b.topPickScore ?? 0) - (a.topPickScore ?? 0);
      }
    });
    return sorted.slice(0, 5);
  }, [allSpots, activeChips, anyPriceFilter, sortBy]);

  const activeSpot = useMemo(() => {
    if (!spotSlug) return null;
    return allSpots.find(s => s.slug === spotSlug || s.name === spotSlug) ?? null;
  }, [spotSlug, allSpots]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && spots.length > 0) {
      console.group("PulseNYC homepage state");
      console.log("Meal context:", mealType);
      console.log("Spots returned (count):", spots.length);
      console.log("Spot summary:", spots.map(s => ({ name: s.name, category: s.category, topPick: s.topPickName })));
      console.groupEnd();
    }
  }, [mealType, spots]);

  useEffect(() => {
    const cached = readLocation();
    if (cached) {
      setCoords({ lat: cached.lat, lng: cached.lng });
      setLocationLabel(cached.label ?? "Saved location");
      setIsDefault(false);
      setLocationStatus("success");
      syncNeighborhood(cached.lat, cached.lng, cached.source === "manual" ? "manual" : "gps");
    }
    const cachedMeal = readCachedMeal();
    if (cachedMeal) setMealType(cachedMeal);

    // Live sync: setting a location on /eat-smart (or anywhere) updates here too
    return subscribeLocation((loc) => {
      setCoords({ lat: loc.lat, lng: loc.lng });
      if (loc.label) setLocationLabel(loc.label);
      setIsDefault(false);
      setLocationStatus("success");
    });
  }, []);

  const fetchResults = useCallback(async (lat: number, lng: number, meal: MealCategory) => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetchWithTimeout(`/api/smart-menu/near-me?lat=${lat}&lng=${lng}&meal=${meal}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const restaurants: ApiRestaurant[] = data.restaurants || [];

      const mapped: ResultSpot[] = restaurants.map(r => {
        const topPick = r.topPicks[0];
        return {
          slug: r.slug,
          name: r.restaurantName,
          walkMinutes: r.walkMinutes,
          topPickName: topPick?.name ?? "",
          topPickProtein: topPick?.protein ?? 0,
          topPickCalories: topPick?.calories ?? 0,
          topPickScore: topPick?.pulseScore ?? 0,
          topPicks: r.topPicks,
          bestDrink: r.bestDrink ?? null,
          priceRange: r.priceRange,
          priceTier: r.priceTier,
          lat: r.lat,
          lng: r.lng,
          address: r.address,
          grade: r.grade,
          inspectedAt: r.inspectedAt ?? null,
          isGeneric: r.isGeneric,
          category: r.category,
          locationCount: r.locationCount ?? 1,
          otherLocations: r.otherLocations ?? [],
          orderingTip: r.orderingTip,
        };
      });

      setAllSpots(mapped);
      setFetchedAt(Date.now());
      setTotalCount(restaurants.length);
    } catch {
      setAllSpots([]);
      setTotalCount(0);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(coords.lat, coords.lng, mealType);
  }, [coords, mealType, fetchResults]);

  const handleRequestLocation = useCallback(async () => {
    setLocationStatus("locating");
    setLowConfidenceHood(null);

    const result = await requestBrowserLocation(10_000);

    if (result.status !== "success") {
      setLocationStatus(result.status);
      return;
    }

    const { lat, lng } = result.coords!;
    const hood = findNearestNeighborhood(lat, lng);

    if (result.lowConfidence) {
      // Desktop IP-level accuracy: show the resolved neighborhood and ask the
      // user to confirm instead of silently committing a city-block guess.
      setCoords({ lat, lng });
      setLowConfidenceHood(hood?.name ?? "your area");
      setLocationStatus("success");
      setIsDefault(false);
      setLocationLabel(hood ? `Near ${hood.name}?` : "Near you (approximate)");
      return;
    }

    setCoords({ lat, lng });
    setIsDefault(false);
    setLocationStatus("success");

    const geo = await reverseGeocode(lat, lng);
    const label = geo?.label ?? `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°W`;
    setLocationLabel(label);
    writeLocation({ lat, lng, label, source: "gps", accuracy: result.accuracy });
    syncNeighborhood(lat, lng, "gps");
  }, []);

  const confirmLowConfidence = useCallback(() => {
    setLowConfidenceHood(null);
    const label = locationLabel.replace(/^Near | \?$|\?$/g, "");
    writeLocation({ lat: coords.lat, lng: coords.lng, label, source: "gps" });
    setLocationLabel(label);
    syncNeighborhood(coords.lat, coords.lng, "gps");
  }, [coords, locationLabel]);

  const handleManualLocation = useCallback(async (query: string, resolvedCoords?: { lat: number; lng: number }) => {
    setLowConfidenceHood(null);
    if (resolvedCoords) {
      const { lat, lng } = resolvedCoords;
      writeLocation({ lat, lng, label: query, source: "manual" });
      setCoords({ lat, lng });
      setLocationLabel(query);
      setIsDefault(false);
      setLocationStatus("success");
      syncNeighborhood(lat, lng, "manual");
      return;
    }

    const isZip = /^\d{5}$/.test(query);
    if (isZip) {
      try {
        const res = await fetch(
          `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$select=avg(latitude) as lat,avg(longitude) as lng&$where=zipcode='${query}'&$limit=1`
        );
        const rows = await res.json();
        if (rows.length > 0 && rows[0].lat && rows[0].lng) {
          const lat = parseFloat(rows[0].lat);
          const lng = parseFloat(rows[0].lng);
          writeLocation({ lat, lng, label: query, source: "manual" });
          setCoords({ lat, lng });
          setLocationLabel(query);
          setIsDefault(false);
          setLocationStatus("success");
          syncNeighborhood(lat, lng, "manual");
          return;
        }
      } catch {}
    }

    const label = query;
    writeLocation({ ...TIMES_SQUARE, label, source: "manual" });
    setLocationLabel(label);
    setIsDefault(false);
    setLocationStatus("success");
  }, []);

  const handleChipToggle = useCallback((id: ChipId) => {
    setActiveChips(prev => {
      const next = new Set(prev);
      if (id === "high-protein") return next;
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleMealChange = useCallback((meal: MealCategory) => {
    setMealType(meal);
    try { localStorage.setItem(MEAL_LS_KEY, meal); } catch {}
  }, []);

  const handleSpotClick = useCallback((slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("spot", slug);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleModalClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("spot");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }, [searchParams, router]);

  return (
    <>
      <div>
          <WedgeHero />
          <WedgeSearch
            locationLabel={locationLabel}
            onRequestLocation={handleRequestLocation}
            onManualLocation={handleManualLocation}
            locationStatus={locationStatus}
          />
          {lowConfidenceHood && (
            <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-2">
              <div className="flex flex-wrap items-center gap-2 bg-[#FBF6E8] border border-[#F0E3B5] rounded-xl px-3 py-2 text-[12px] text-[#8A6A1C]">
                <span>Your location looks approximate — are you near <strong>{lowConfidenceHood}</strong>?</span>
                <button type="button" onClick={confirmLowConfidence} className="font-semibold text-[#2F8F4D] hover:underline">
                  Yes, use it
                </button>
                <span className="text-[#C9BD96]">·</span>
                <span>or enter an address above for exact results</span>
              </div>
            </div>
          )}
          <MealTypeToggle active={mealType} onChange={handleMealChange} />
          <QuickFilterChips active={activeChips} onToggle={handleChipToggle} />
          <LiveResultsStrip
            spots={spots}
            totalCount={totalCount}
            isDefault={isDefault}
            locationLabel={locationLabel}
            loading={loading}
            mealLabel={mealType === "coffee" ? "Coffee" : mealType === "breakfast" ? "Breakfast" : mealType === "lunch" ? "Lunch" : mealType === "dinner" ? "Dinner" : "Snack"}
            onSpotClick={handleSpotClick}
            fetchedAt={fetchedAt}
            sortBy={sortBy}
            onSortChange={setSortBy}
            fetchError={fetchError}
            onRetry={() => fetchResults(coords.lat, coords.lng, mealType)}
          />

          {/* Waitlist — THE primary email capture, shown contextually after a
              successful result set (weekly digest merged into its confirmation) */}
          {!loading && spots.length > 0 && (
            <div className="mt-10">
              <p className="text-center text-[15px] font-semibold text-[#1A1A1A] mb-3">
                Take this with you — the app ships Q3 2026
              </p>
              <AppWaitlistCapture />
            </div>
          )}

          {/* 3-block radius local map */}
          {!loading && spots.length > 0 && (
            <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-8 mb-8">
              <LocalMap
                center={coords}
                spots={spots}
                isDefault={isDefault}
                onSpotClick={handleSpotClick}
                onVisible={() => setMapVisible(true)}
                visible={mapVisible}
              />
            </div>
          )}
      </div>

      {spotSlug && (
        <SpotModal
          spot={activeSpot}
          onClose={handleModalClose}
          meal={mealType}
        />
      )}
    </>
  );
}

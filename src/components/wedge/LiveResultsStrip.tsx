"use client";

import { formatRelative } from "@/lib/freshness";

export type SortKey = "score" | "protein" | "calories" | "distance" | "protein-per-dollar";

export interface ResultSpot {
  slug: string;
  name: string;
  walkMinutes: number;
  topPickName: string;
  topPickProtein: number;
  topPickCalories?: number;
  topPickScore?: number;
  /** Estimated price of the recommended order; null = show the ~$ band */
  topPickPrice?: number | null;
  topPicks?: { name: string; calories: number; protein: number; pulseScore: number }[];
  bestDrink?: { name: string; calories: number; protein: number } | null;
  priceRange: number;
  priceTier?: string;
  lat?: number;
  lng?: number;
  address?: string;
  grade?: string;
  inspectedAt?: string | null;
  isGeneric?: boolean;
  category?: string;
  locationCount?: number;
  otherLocations?: { address: string; walkMinutes: number; grade: string }[];
  orderingTip?: string;
}

interface LiveResultsStripProps {
  spots: ResultSpot[];
  totalCount: number;
  isDefault: boolean;
  locationLabel: string;
  loading: boolean;
  mealLabel?: string;
  onSpotClick?: (slug: string) => void;
  fetchedAt?: number | null;
  sortBy?: SortKey;
  onSortChange?: (key: SortKey) => void;
  fetchError?: boolean;
  onRetry?: () => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "PulseScore" },
  { key: "protein", label: "Protein" },
  { key: "calories", label: "Calories" },
  { key: "distance", label: "Distance" },
  { key: "protein-per-dollar", label: "Protein per $" },
];

function priceTierFallback(range: number): string {
  if (range <= 1) return "$";
  if (range <= 2) return "$$";
  return "$$$";
}

// Price is never hidden: exact estimate when known, a ~$ band when not
function orderPriceLabel(spot: ResultSpot): string {
  if (spot.topPickPrice != null) return `~$${spot.topPickPrice}`;
  if (spot.priceRange <= 1) return "~$5–10";
  if (spot.priceRange <= 2) return "~$10–15";
  return "~$15+";
}

export function LiveResultsStrip({ spots, totalCount, isDefault, locationLabel, loading, mealLabel, onSpotClick, fetchedAt, sortBy = "score", onSortChange, fetchError, onRetry }: LiveResultsStripProps) {
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? "PulseScore";
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
        <h2 className="font-display text-[28px] text-[#1A1A1A] leading-tight">
          {spots.length > 0
            ? `${spots.length} ${mealLabel || ""} spot${spots.length === 1 ? "" : "s"} near you, ranked by ${sortLabel}`
            : "Spots near you"}
        </h2>
        <span className="text-[13px] text-[#6B716B] flex-shrink-0">
          {fetchedAt ? `Updated ${formatRelative(fetchedAt)}` : "Updating"} · {totalCount} spot{totalCount === 1 ? "" : "s"} within 10 min walk
        </span>
      </div>

      {/* Sort selector */}
      <div className="mb-5 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-[#6B716B] mr-0.5">Sort:</span>
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onSortChange?.(o.key)}
            aria-pressed={sortBy === o.key}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
              sortBy === o.key
                ? "bg-[#E5F1E8] text-[#2F8F4D] border-[#2F8F4D]/30 font-semibold"
                : "bg-white text-[#6B716B] border-[#E6E5DE] hover:border-[#2F8F4D]/30"
            }`}
          >
            {o.label}
          </button>
        ))}
        <a href="/methodology" className="text-[11px] text-[#2A6BC9] hover:underline ml-1">
          How PulseScore works
        </a>
      </div>

      {/* Default location hint */}
      {isDefault && spots.length > 0 && (
        <p className="text-[12px] text-[#6B716B] italic mb-4">
          Showing spots near Times Square — set your location for personalized results.
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E6E5DE] rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-[#E6E5DE] rounded w-3/4 mb-3" />
              <div className="flex gap-1.5 mb-3">
                <div className="h-5 bg-[#E6E5DE] rounded-full w-16" />
                <div className="h-5 bg-[#E6E5DE] rounded-full w-16" />
              </div>
              <div className="border-t border-dashed border-[#E6E5DE] pt-2">
                <div className="h-3 bg-[#E6E5DE] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state — never confuse a failed fetch with "no spots nearby" */}
      {!loading && fetchError && (
        <div className="bg-white border border-[#E6B0A8] rounded-2xl p-6 text-center">
          <p className="text-[14px] text-[#C45A4A] mb-3">Couldn&apos;t load spots — NYC&apos;s data servers may be slow right now.</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-[#2F8F4D] text-white text-[13px] font-semibold hover:bg-[#267A3F] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && spots.length === 0 && (
        <div className="bg-white border border-[#E6E5DE] rounded-2xl p-6 text-center text-[14px] text-[#6B716B]">
          No healthy spots open within 10 min walk of {locationLabel}. Try widening the radius.
        </div>
      )}

      {/* Cards grid. Generic venues render as <button> — they have no
          /restaurants/* page, and a crawlable/cmd-clickable href would 404. */}
      {!loading && spots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {spots.map((spot) => {
            const Card = spot.isGeneric ? ("button" as const) : ("a" as const);
            return (
            <Card
              key={spot.slug + spot.walkMinutes}
              {...(spot.isGeneric
                ? { type: "button" as const, onClick: () => onSpotClick?.(spot.slug) }
                : {
                    href: `/restaurants/${spot.slug}`,
                    onClick: (e: React.MouseEvent) => {
                      if (onSpotClick && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                        e.preventDefault();
                        onSpotClick(spot.slug);
                      }
                    },
                  })}
              className="bg-white border border-[#E6E5DE] rounded-2xl p-4 hover:-translate-y-0.5 transition-transform duration-150 block text-left w-full focus:outline-none focus:ring-2 focus:ring-[#2F8F4D]/40 focus:ring-offset-2"
            >
              {spot.isGeneric && spot.category && (
                <span className="text-[11px] tracking-[1px] uppercase text-[#6B716B] font-semibold block mb-1">
                  {spot.category}
                </span>
              )}
              <p className="font-semibold text-[15px] text-[#1A1A1A] mb-0.5">
                {spot.name}
              </p>
              {(spot.locationCount ?? 1) > 1 && (
                <p className="text-[11px] text-[#6B716B] mb-1.5">
                  {spot.locationCount} locations nearby · nearest {spot.walkMinutes} min
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mb-3 mt-1.5">
                <span className="bg-[#E6EEF9] text-[#2A6BC9] text-[11px] px-2 py-0.5 rounded-full">
                  {spot.walkMinutes} min walk
                </span>
                {spot.topPickProtein > 0 && (
                  <span className="bg-[#E5F1E8] text-[#2F8F4D] text-[11px] px-2 py-0.5 rounded-full">
                    {spot.topPickProtein}g protein
                  </span>
                )}
                {(spot.topPickCalories ?? 0) > 0 && (
                  <span className="bg-[#FDF1E2] text-[#B06A1E] text-[11px] px-2 py-0.5 rounded-full">
                    {spot.isGeneric ? "~" : ""}{spot.topPickCalories} cal
                  </span>
                )}
                {spot.grade && (
                  <span className="bg-[#E5F1E8] text-[#2F8F4D] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#2F8F4D]/20" title="DOHMH inspection grade">
                    Grade {spot.grade}
                  </span>
                )}
                <span className="bg-[#F0EFE8] text-[#1A1A1A] text-[11px] px-2 py-0.5 rounded-full">
                  {spot.priceTier || priceTierFallback(spot.priceRange)}
                </span>
              </div>
              <div className="border-t border-dashed border-[#E6E5DE] pt-2 text-[13px] text-[#6B716B]">
                {spot.topPickName ? (
                  <>
                    <strong className="text-[#1A1A1A]">Order:</strong> {spot.topPickName}
                    <span className="text-[#1A1A1A] font-semibold whitespace-nowrap"> — {orderPriceLabel(spot)}</span>
                    {spot.isGeneric && <span className="text-[11px] text-[#9A9F9A] ml-1">est.</span>}
                  </>
                ) : (
                  <>
                    <strong className="text-[#1A1A1A]">Smart ordering tips</strong>
                    {spot.orderingTip ? ` — ${spot.orderingTip.slice(0, 90)}${spot.orderingTip.length > 90 ? "…" : ""}` : " inside"}
                  </>
                )}
              </div>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

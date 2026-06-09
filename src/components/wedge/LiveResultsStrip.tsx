"use client";

export interface ResultSpot {
  slug: string;
  name: string;
  walkMinutes: number;
  topPickName: string;
  topPickProtein: number;
  priceRange: number;
  priceTier?: string;
  lat?: number;
  lng?: number;
  address?: string;
  grade?: string;
  isGeneric?: boolean;
  category?: string;
}

interface LiveResultsStripProps {
  spots: ResultSpot[];
  totalCount: number;
  isDefault: boolean;
  locationLabel: string;
  loading: boolean;
  mealLabel?: string;
  onSpotClick?: (slug: string) => void;
}

function priceTierFallback(range: number): string {
  if (range <= 1) return "$";
  if (range <= 2) return "$$";
  return "$$$";
}

export function LiveResultsStrip({ spots, totalCount, isDefault, locationLabel, loading, mealLabel, onSpotClick }: LiveResultsStripProps) {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
        <h2 className="font-display text-[28px] text-[#1A1A1A] leading-tight">
          {spots.length > 0
            ? `${spots.length} ${mealLabel || ""} spot${spots.length === 1 ? "" : "s"} near you, ranked by protein per dollar`
            : "Spots near you"}
        </h2>
        <span className="text-[13px] text-[#6B716B] flex-shrink-0">
          Updated just now · {totalCount} spot{totalCount === 1 ? "" : "s"} within 10 min walk
        </span>
      </div>

      {/* Sort pill — TODO: turn into a sort selector once we add distance/price sort */}
      <div className="mb-5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-[#6B716B] bg-white border border-[#E6E5DE]">
          ↓ Protein per dollar
        </span>
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

      {/* Empty state */}
      {!loading && spots.length === 0 && (
        <div className="bg-white border border-[#E6E5DE] rounded-2xl p-6 text-center text-[14px] text-[#6B716B]">
          No healthy spots open within 10 min walk of {locationLabel}. Try widening the radius.
        </div>
      )}

      {/* Cards grid */}
      {!loading && spots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {spots.map((spot) => (
            <a
              key={spot.slug + spot.walkMinutes}
              href={`/restaurants/${spot.slug}`}
              onClick={(e) => {
                if (onSpotClick && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                  e.preventDefault();
                  onSpotClick(spot.slug);
                }
              }}
              className="bg-white border border-[#E6E5DE] rounded-2xl p-4 hover:-translate-y-0.5 transition-transform duration-150 block focus:outline-none focus:ring-2 focus:ring-[#2F8F4D]/40 focus:ring-offset-2"
            >
              {spot.isGeneric && spot.category && (
                <span className="text-[11px] tracking-[1px] uppercase text-[#6B716B] font-semibold block mb-1">
                  {spot.category}
                </span>
              )}
              <p className="font-semibold text-[15px] text-[#1A1A1A] mb-2">
                {spot.name}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="bg-[#E6EEF9] text-[#2A6BC9] text-[11px] px-2 py-0.5 rounded-full">
                  {spot.walkMinutes} min walk
                </span>
                <span className="bg-[#E5F1E8] text-[#2F8F4D] text-[11px] px-2 py-0.5 rounded-full">
                  {spot.topPickProtein}g protein
                </span>
                {spot.isGeneric && (
                  <span className="inline-flex items-center gap-1 bg-[#FBF6E8] text-[#8A6A1C] text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-[#F0E3B5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F8F4D]" />
                    PulseNYC pick
                  </span>
                )}
                <span className="bg-[#F0EFE8] text-[#1A1A1A] text-[11px] px-2 py-0.5 rounded-full">
                  {spot.priceTier || priceTierFallback(spot.priceRange)}
                </span>
              </div>
              <div className="border-t border-dashed border-[#E6E5DE] pt-2 text-[13px] text-[#6B716B]">
                <strong className="text-[#1A1A1A]">Order:</strong> {spot.topPickName}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatRelative, formatMonthYear } from "@/lib/freshness";

export type SortKey = "score" | "protein" | "calories" | "distance" | "protein-per-dollar";

export interface ResultSpot {
  /** Unique venue identity (API restaurantId) — React key + dedupe + modal
   *  lookup. slug is NOT unique: all generic venues of one template share it. */
  id: string;
  slug: string;
  name: string;
  walkMinutes: number;
  topPickName: string;
  topPickProtein: number;
  topPickCalories?: number;
  topPickScore?: number;
  /** Estimated price of the recommended order; null = show the ~$ band */
  topPickPrice?: number | null;
  topPicks?: { name: string; calories: number; protein: number; pulseScore: number; overCalTarget?: boolean }[];
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
  verifiedBadge?: "verified" | "needs-recheck" | null;
  verifiedAt?: string | null;
  verifiedSlug?: string | null;
  openState?: "open" | "closed" | "unknown";
  hoursChip?: { label: string; tone: "open" | "closed" | "unknown" } | null;
  /** DOHMH CAMIS — the /spot/[venueId] key for real generic venues */
  camis?: string | null;
  /** Round 7 liveness (see src/lib/liveness.ts) */
  liveness?: string;
  livenessCheckedAt?: string | null;
  /** Present only on liveness-gated venues — dims the map pin, never ranks */
  livenessLabel?: string | null;
  /** Google place_id — anchors directions to the storefront door */
  placeId?: string | null;
  /** Refined category (owner override → Places types → DOHMH heuristic) */
  refinedCategory?: string | null;
  /** Chip label + icon for the refined category */
  categoryChip?: { label: string; icon: string } | null;
  /** 'places' = bodega ingestion path (no DOHMH grade — NYS retail store) */
  source?: "dohmh" | "places";
}

interface LiveResultsStripProps {
  spots: ResultSpot[];
  /** Over-$15 venues — never inside the promised five, shown under a divider */
  splurgeSpots?: ResultSpot[];
  /** Venues with no coherent picks — never ranked, shown as guidance cards */
  guidanceSpots?: ResultSpot[];
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
  /** Opens the location editor — the origin line's "Update location" action */
  onEditLocation?: () => void;
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

// One-tap community correction (Round 7): "This place is closed" lives in the
// card's overflow — two distinct reports soft-exclude the venue immediately
// (the flywheel where APIs lag reality). A sibling of the card element, not a
// child: the card itself may be a <button>, and nesting buttons is invalid.
function ClosedReportOverflow({ spot }: { spot: ResultSpot }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const report = async () => {
    setState("sending");
    try {
      await fetch("/api/eat-smart/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: spot.camis ?? spot.id,
          venueName: spot.name,
          address: spot.address ?? null,
          field: "closed",
          message: "one-tap card report",
          reportedAt: new Date().toISOString(),
        }),
      });
    } catch {}
    setState("sent");
  };

  return (
    <div className="absolute top-2 right-2 z-[1]">
      <button
        type="button"
        aria-label={`More options for ${spot.name}`}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-6 h-6 flex items-center justify-center rounded-md text-[#9A9F9A] hover:text-[#1A1A1A] hover:bg-[#F5F0EB] text-[14px] leading-none"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-[#E6E5DE] rounded-xl shadow-lg p-1">
          {state === "sent" ? (
            <p className="text-[11px] text-[#2F8F4D] px-2 py-1.5">Thanks — flagged for review.</p>
          ) : (
            <button
              type="button"
              disabled={state === "sending"}
              onClick={(e) => { e.stopPropagation(); report(); }}
              className="w-full text-left text-[12px] text-[#B0503F] px-2 py-1.5 rounded-lg hover:bg-[#F9F1EF] disabled:opacity-50"
            >
              🚫 This place is closed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// One result card — shared by the ranked five and the "Worth a splurge" row.
// Generic venues render as <button> — they have no /restaurants/* page, and a
// crawlable/cmd-clickable href would 404.
function SpotCard({ spot, onSpotClick }: { spot: ResultSpot; onSpotClick?: (slug: string) => void }) {
  // Verified independents have a real detail page; un-verified
  // generics render as <button> (no crawlable 404 href)
  const detailHref = spot.verifiedSlug
    ? `/restaurants/${spot.verifiedSlug}`
    : !spot.isGeneric
      ? `/restaurants/${spot.slug}`
      : null;
  const Card = detailHref ? ("a" as const) : ("button" as const);
  return (
    <div className="relative">
    <ClosedReportOverflow spot={spot} />
    <Card
      {...(detailHref
        ? {
            href: detailHref,
            onClick: (e: React.MouseEvent) => {
              if (onSpotClick && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                onSpotClick(spot.id);
              }
            },
          }
        : { type: "button" as const, onClick: () => onSpotClick?.(spot.id) })}
      data-venue-id={spot.id}
      data-venue-name={spot.name}
      className="bg-white border border-[#E6E5DE] rounded-2xl p-4 hover:-translate-y-0.5 transition-transform duration-150 block text-left w-full h-full focus:outline-none focus:ring-2 focus:ring-[#2F8F4D]/40 focus:ring-offset-2"
    >
      {spot.isGeneric && (spot.categoryChip || spot.category) && (
        <span className="text-[11px] tracking-[1px] uppercase text-[#6B716B] font-semibold block mb-1">
          {spot.categoryChip ? `${spot.categoryChip.icon} ${spot.categoryChip.label}` : spot.category}
        </span>
      )}
      <p className="font-semibold text-[15px] text-[#1A1A1A] mb-0.5">
        {spot.name}
      </p>
      {spot.verifiedBadge === "verified" && (
        <span data-testid="card-verified-badge" className="inline-flex items-center gap-1 bg-[#E5F1E8] text-[#2F8F4D] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#2F8F4D]/25 mb-1">
          ✓ Menu verified{spot.verifiedAt ? ` ${formatMonthYear(spot.verifiedAt)}` : ""}
        </span>
      )}
      {spot.verifiedBadge === "needs-recheck" && (
        <span className="inline-flex items-center gap-1 bg-[#FBF6E8] text-[#8A6A1C] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#F0E3B5] mb-1">
          ⟳ Verified — needs re-check
        </span>
      )}
      {(spot.locationCount ?? 1) > 1 && (
        <p className="text-[11px] text-[#6B716B] mb-1.5">
          {spot.locationCount} locations nearby · nearest {spot.walkMinutes} min
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3 mt-1.5 tabular-nums">
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
        {spot.grade ? (
          <span className="bg-[#E5F1E8] text-[#2F8F4D] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#2F8F4D]/20" title="DOHMH inspection grade">
            Grade {spot.grade}
          </span>
        ) : spot.source === "places" ? (
          // Bodegas/delis are licensed by NY State Ag & Markets, not DOHMH —
          // they have no letter grade. Never show a fake one (Round 7 phase 5).
          <span className="bg-[#EDEBF7] text-[#6B5BB5] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-[#6B5BB5]/20" title="Licensed by NY State Agriculture & Markets, not the NYC DOHMH letter-grade system">
            NYS retail food store
          </span>
        ) : null}
        <span className="bg-[#F0EFE8] text-[#1A1A1A] text-[11px] px-2 py-0.5 rounded-full">
          {spot.priceTier || priceTierFallback(spot.priceRange)}
        </span>
        {spot.hoursChip && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              spot.hoursChip.tone === "open"
                ? "bg-[#E5F1E8] text-[#2F8F4D] border-[#2F8F4D]/25"
                : spot.hoursChip.tone === "closed"
                ? "bg-[#F3E3E0] text-[#B0503F] border-[#B0503F]/20"
                : "bg-[#F0EFE8] text-[#8A8F8A] border-[#E6E5DE]"
            }`}
          >
            {spot.hoursChip.label}
          </span>
        )}
      </div>
      <div className="border-t border-dashed border-[#E6E5DE] pt-2 text-[13px] text-[#6B716B]">
        {spot.topPickName ? (
          <>
            <strong className="text-[#1A1A1A]">Order:</strong> {spot.topPickName}
            <span className="text-[#1A1A1A] font-semibold whitespace-nowrap"> — {orderPriceLabel(spot)}</span>
            {spot.isGeneric && <span className="text-[11px] text-[#9A9F9A] ml-1">est.</span>}
            {spot.topPicks?.[0]?.overCalTarget && (
              <span className="text-[11px] text-[#B06A1E] ml-1">over the 600-cal target</span>
            )}
          </>
        ) : (
          <>
            <strong className="text-[#1A1A1A]">Smart ordering tips</strong>
            {spot.orderingTip ? ` — ${spot.orderingTip.slice(0, 90)}${spot.orderingTip.length > 90 ? "…" : ""}` : " inside"}
          </>
        )}
      </div>
    </Card>
    </div>
  );
}

export function LiveResultsStrip({ spots: rawSpots, splurgeSpots: rawSplurge = [], guidanceSpots: rawGuidance = [], totalCount, isDefault, locationLabel, loading, mealLabel, onSpotClick, fetchedAt, sortBy = "score", onSortChange, fetchError, onRetry, onEditLocation }: LiveResultsStripProps) {
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label ?? "PulseScore";

  // Render-level safety net (July 6 audit: sort clicks duplicated cards —
  // "Court Square Diner" twelve times). Dedupe by venue identity ACROSS the
  // three sections — ranked claims a venue first, splurge next, guidance
  // last — so no venue can render twice regardless of upstream state. The
  // headline count derives from this rendered set, never from raw props.
  const seen = new Set<string>();
  const dedupe = (arr: ResultSpot[]) =>
    arr.filter((s) => {
      const key = s.id || `${s.name}-${s.address ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const spots = dedupe(rawSpots);
  const splurgeSpots = dedupe(rawSplurge);
  const guidanceSpots = dedupe(rawGuidance);
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
          {spots.some((s) => s.openState === "unknown") && (
            <span className="text-[#8A8F8A]"> · hours estimated for some spots</span>
          )}
        </span>
      </div>

      {/* Origin transparency (round 5): the user never infers the origin from
          venue names — it's stated, with a one-click correction path. */}
      {!loading && spots.length > 0 && (
        <p data-testid="origin-line" className="text-[12px] text-[#6B716B] mb-2">
          Near <strong className="text-[#1A1A1A]">{isDefault ? "Times Square (default)" : locationLabel}</strong>
          {" · wrong? "}
          <button
            type="button"
            onClick={onEditLocation}
            className="text-[#2A6BC9] hover:underline font-medium"
          >
            Update location
          </button>
        </p>
      )}

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

      {/* The ranked five — under-$15 picks only */}
      {!loading && spots.length > 0 && (
        <div data-testid="ranked-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} onSpotClick={onSpotClick} />
          ))}
        </div>
      )}

      {/* Over-$15 venues never enter the promised five — they live here, under
          an explicit divider, so the hero's "under $15" stays literally true */}
      {!loading && splurgeSpots.length > 0 && (
        <div data-testid="splurge-section" className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-[#E6E5DE]" />
            <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#8A8F8A]">
              Worth a splurge · over $15
            </span>
            <span className="h-px flex-1 bg-[#E6E5DE]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {splurgeSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onSpotClick={onSpotClick} />
            ))}
          </div>
        </div>
      )}

      {/* Venues with no coherent picks for this meal never occupy a ranked
          slot (July 5 audit: Mango Mango at #4 with zero picks). They live
          here — findable, honestly framed as guidance, visibly not ranked. */}
      {!loading && guidanceSpots.length > 0 && (
        <div data-testid="guidance-section" className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-[#E6E5DE]" />
            <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#8A8F8A]">
              Nearby · ordering guidance only
            </span>
            <span className="h-px flex-1 bg-[#E6E5DE]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {guidanceSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onSpotClick={onSpotClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Places enrichment layer — every tunable threshold in ONE place ─────────
// Round 7 (July 2026): Google Places is the liveness/type/geometry/hours
// source of truth; DOHMH stays the health-grade source of truth. The business
// rule behind every number here: a wrong pointer (closed venue, wrong address)
// is a product-killing error; an imprecise estimate is not.

export const PLACES_CONFIG = {
  /** DOHMH venues with NO confident Places match whose last inspection is
   *  older than this are liveness 'unverified-stale' → excluded from ranked.
   *  (Dead permits stop being inspected but persist in the dataset — the
   *  "Yards Bar & Grill" class.) */
  STALE_INSPECTION_MONTHS: 14,

  /** A Places name-match farther than this from the DOHMH point is NOT the
   *  same storefront — it's the commissary/production-kitchen pattern (the
   *  "Maman at Austell Pl" class) → liveness 'address-mismatch'. */
  MATCH_MAX_DISTANCE_M: 150,

  /** Minimum name similarity (max of token-overlap and Jaro-Winkler on
   *  normalized names) for a Places result to count as a match at all. */
  NAME_SIMILARITY_THRESHOLD: 0.62,

  /** Enrichment results cache this long (per CAMIS / per bodega cell). */
  CACHE_TTL_DAYS: 7,

  /** Hard daily budget of Google Places API calls; past it the layer serves
   *  cache-only. Override with env PLACES_DAILY_BUDGET. */
  DAILY_BUDGET_DEFAULT: 1000,

  /** Location bias radius for searchText venue matching. */
  SEARCH_BIAS_RADIUS_M: 500,

  /** Radius of a bodega-ingestion cell (matches the ranked-results radius). */
  BODEGA_CELL_RADIUS_M: 800,

  /** Two distinct community "this place is closed" reports soft-exclude a
   *  venue immediately, pending review from the report queue. */
  COMMUNITY_CLOSED_REPORT_THRESHOLD: 2,

  /** In-memory LRU size per lambda (venues + cells). */
  MEMORY_LRU_MAX: 500,

  /** When a query's hours coverage reaches this, the "Open now" filter chip
   *  may show (never claim open for unknowns regardless). */
  OPEN_NOW_CHIP_COVERAGE_PCT: 80,
} as const;

/** Cells the nightly cron pre-warms (LIC launch area + Manhattan core).
 *  Warming = hitting our own ranked endpoint, which lazily enriches exactly
 *  the venues real users would see. */
export const WARM_CELLS: { label: string; lat: number; lng: number }[] = [
  { label: "LIC Court Square", lat: 40.7471, lng: -73.9445 },
  { label: "LIC Davis St", lat: 40.7444, lng: -73.9489 },
  { label: "LIC Hunters Point", lat: 40.7425, lng: -73.9536 },
  { label: "Times Square", lat: 40.758, lng: -73.9855 },
  { label: "Midtown East", lat: 40.7549, lng: -73.9749 },
  { label: "Union Square", lat: 40.7359, lng: -73.9911 },
  { label: "FiDi", lat: 40.7075, lng: -74.0089 },
  { label: "Columbus Circle", lat: 40.768, lng: -73.9819 },
];

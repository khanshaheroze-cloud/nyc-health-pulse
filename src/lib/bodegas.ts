// ─── Bodega / deli ingestion helpers (Round 7 phase 5) ──────────────────────
// Bodegas and delis without full prepared-food permits are licensed by NY
// State Agriculture & Markets, NOT the NYC DOHMH restaurant program, so they
// are invisible to the DOHMH-only pipeline — yet the hero literally promises
// picks "even at the bodega". Google Places is the ingestion path: a cached
// per-cell searchNearby for convenience-store/deli types yields candidates
// with name, geometry, hours and businessStatus. These merge into the
// candidate pool as `source: 'places'`, `category: 'deli_bodega'`, and never
// carry a letter grade (the card shows "NYS retail food store" instead).
//
// Pure module — the logic here (dedupe vs DOHMH, liveness-from-status) is
// fixture-tested; the actual Places fetch + candidate assembly lives in the
// near-me route.

import { nameSimilarity } from "@/lib/places";
import { PLACES_CONFIG } from "@/lib/placesConfig";
import type { BusinessStatus } from "@/lib/places";
import type { Liveness } from "@/lib/liveness";

/** The generic-template key the bodega picks live under (genericRestaurants). */
export const BODEGA_CUISINE_KEY = "bodega";

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** A Places bodega is a duplicate of an existing DOHMH venue when a DOHMH
 *  venue sits within the dedup distance AND its name is similar enough — the
 *  same storefront registered under both regulators. We keep the DOHMH record
 *  (it has a letter grade) and drop the Places one. Pure + testable. */
export function isDuplicateOfDohmh(
  place: { displayName: string; lat: number; lng: number },
  dohmhVenues: { name: string; lat: number; lng: number }[],
  distanceM: number = PLACES_CONFIG.BODEGA_DEDUP_DISTANCE_M,
  nameThreshold: number = PLACES_CONFIG.BODEGA_DEDUP_NAME_SIMILARITY,
): boolean {
  for (const v of dohmhVenues) {
    if (haversineM(place.lat, place.lng, v.lat, v.lng) > distanceM) continue;
    if (nameSimilarity(place.displayName, v.name) >= nameThreshold) return true;
  }
  return false;
}

/** Liveness for a Places-sourced bodega — it IS a live Places record, so a
 *  present businessStatus decides directly (no DOHMH inspection to weigh).
 *  A community "closed" report still overrides this upstream. */
export function bodegaLiveness(status: BusinessStatus | null): Liveness {
  if (status === "CLOSED_PERMANENTLY") return "closed-permanent";
  if (status === "CLOSED_TEMPORARILY") return "closed-temporary";
  return "places-verified";
}

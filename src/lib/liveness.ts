// ─── Venue liveness model (Round 7) ──────────────────────────────────────────
// DOHMH has no permanent-closure flag: dead permits stop being inspected and
// persist in the dataset. Google Places is the liveness source of truth; a
// venue's liveness decides whether it may occupy a RANKED slot. A wrong
// pointer (closed venue, wrong address) is a product-killing error; an
// imprecise estimate is not.
//
// Pure module — safe to import from client components. The Supabase-backed
// community-closed lookup lives in src/lib/communityClosed.ts (server only).

import type { PlacesEnrichment } from "@/lib/places";
import { PLACES_CONFIG } from "@/lib/placesConfig";

export type Liveness =
  /** Confident Places match, businessStatus OPERATIONAL */
  | "places-verified"
  /** No Places information (layer disabled / not attempted / no match but
   *  recently inspected) — DOHMH is the only evidence. Stays rankable:
   *  new/renamed venues must not be punished. */
  | "dohmh-only"
  /** No confident Places match AND last inspection older than 14 months —
   *  the Yards Bar & Grill class. Excluded from ranked. */
  | "unverified-stale"
  /** Confident NAME match beyond the 150m distance gate — the commissary /
   *  production-kitchen pattern (Maman at Austell Pl). Never walkable. */
  | "address-mismatch"
  | "closed-permanent"
  | "closed-temporary"
  /** ≥2 community "this place is closed" reports — soft-excluded immediately,
   *  pending review. The flywheel where APIs lag reality. */
  | "community-closed";

/** Liveness states that may never occupy a ranked slot. */
export const RANKED_EXCLUDED_LIVENESS: ReadonlySet<Liveness> = new Set([
  "unverified-stale",
  "address-mismatch",
  "closed-permanent",
  "closed-temporary",
  "community-closed",
] as Liveness[]);

/** Map-pin label for gated venues (dimmed dot on the map, never a rank). */
export function livenessLabel(liveness: Liveness): string | null {
  switch (liveness) {
    case "closed-permanent":
      return "Permanently closed — report if wrong";
    case "closed-temporary":
      return "Temporarily closed";
    case "unverified-stale":
      return "Unverified — may have closed";
    case "address-mismatch":
      return "Listed address may be a commercial kitchen";
    case "community-closed":
      return "Reported closed by users — under review";
    default:
      return null;
  }
}

export function monthsSince(dateStr: string | null | undefined, now: Date = new Date()): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return (now.getTime() - t) / (1000 * 60 * 60 * 24 * 30.44);
}

/** The liveness gate — pure, fixture-tested branch by branch.
 *  enrichment === null means the lookup was NOT attempted (no key / budget /
 *  network): that is "no information", never "no match" — behavior must be
 *  identical to the pre-Places app, so everything stays dohmh-only. */
export function computeLiveness(
  enrichment: PlacesEnrichment | null,
  inspectedAt: string | null | undefined,
  communityClosed: boolean,
  now: Date = new Date(),
): Liveness {
  if (communityClosed) return "community-closed";
  if (!enrichment) return "dohmh-only";

  if (enrichment.status === "matched" && enrichment.place) {
    if (enrichment.place.businessStatus === "CLOSED_PERMANENTLY") return "closed-permanent";
    if (enrichment.place.businessStatus === "CLOSED_TEMPORARILY") return "closed-temporary";
    return "places-verified";
  }

  if (enrichment.status === "address-mismatch") return "address-mismatch";

  // No confident match: stale inspection means the permit is probably dead
  // (Yards: no match + May 2025 inspection). A recent inspection keeps the
  // venue rankable — new/renamed venues shouldn't be punished.
  const months = monthsSince(inspectedAt, now);
  if (months !== null && months > PLACES_CONFIG.STALE_INSPECTION_MONTHS) return "unverified-stale";
  return "dohmh-only";
}

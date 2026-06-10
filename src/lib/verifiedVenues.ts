import venuesJson from "@/data/verified-venues.json";

// The data moat: hand-verified, menu-level data on independent restaurants.
// Source of truth is the committed src/data/verified-venues.json (designed to
// move to a DB later — keep all access behind this module).
//
// Freshness is a first-class field: `verifiedAt` older than RECHECK_DAYS
// downgrades the badge to "needs re-check" automatically. The weekly
// operating workflow lives in README.md ("Venue verification workflow").

export type VerificationStatus = "verified" | "estimated";

export interface Verification {
  status: VerificationStatus;
  verifiedAt: string | null; // ISO date
  verifiedBy: string | null;
  sourceNotes: string | null;
}

export interface VerifiedMenuItem {
  name: string;
  price: number | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  sodium?: number | null;
  isRecommended: boolean;
  orderHack?: string | null;
  verification: Verification;
}

export interface VerifiedVenue {
  id: string;
  name: string;
  slug: string;
  address: string;
  lat: number;
  lng: number;
  neighborhood: string;
  venueType: string;
  dohmhCamis: string;
  dohmhDba: string;
  dohmhGrade: string | null;
  dohmhInspectedAt: string | null;
  priceBand: 1 | 2 | 3 | null;
  hours: { days: string; open: string; close: string }[];
  verification: Verification;
  menuItems: VerifiedMenuItem[];
}

const VENUES = venuesJson as unknown as VerifiedVenue[];

/** Re-verify SLA: anything older than this needs a walk-in re-check */
export const REVERIFY_DAYS = 90;
/** Past this, the verified badge auto-downgrades to "needs re-check" */
export const STALE_DAYS = 120;

export type BadgeState = "verified" | "needs-recheck" | "estimated";

export function badgeState(v: { status: VerificationStatus; verifiedAt: string | null }): BadgeState {
  if (v.status !== "verified" || !v.verifiedAt) return "estimated";
  const ageDays = (Date.now() - new Date(v.verifiedAt).getTime()) / 86_400_000;
  return ageDays > STALE_DAYS ? "needs-recheck" : "verified";
}

export function getVerifiedVenues(): VerifiedVenue[] {
  return VENUES;
}

export function getVenueBySlug(slug: string): VerifiedVenue | undefined {
  return VENUES.find((v) => v.slug === slug);
}

export function getVenueByCamis(camis: string): VerifiedVenue | undefined {
  return VENUES.find((v) => v.dohmhCamis === camis);
}

/** Venues with in-person-verified menus (drives badges + detail pages) */
export function getMenuVerifiedVenues(): VerifiedVenue[] {
  return VENUES.filter((v) => v.verification.status === "verified" && v.menuItems.length > 0);
}

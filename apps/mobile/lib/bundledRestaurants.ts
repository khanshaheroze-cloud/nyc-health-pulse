/* ── Offline seed loader — a THIN loader, not a scorer (App v1 phase 1) ──────
 * data/nyc-restaurants-seed.json holds REAL near-me responses captured from
 * production (scripts/refresh-seed.mjs): 12 cells × 4 meals in the exact
 * frozen contract shape. Offline mode therefore renders identically to online
 * mode — same honesty labels, same picks, same excluded[] — under a visible
 * "Offline — showing saved results" banner. No client-side scoring exists.
 */
import seedJson from "../data/nyc-restaurants-seed.json";
import type { ApiRestaurant, MealParam, NearMeResponse } from "./types";

interface SeedCell {
  id: string;
  label: string;
  lat: number;
  lng: number;
  meals: Record<string, NearMeResponse>;
}

interface SeedFile {
  generatedAt: string;
  source: string;
  cells: SeedCell[];
}

const seed = seedJson as unknown as SeedFile;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface SeedResult {
  response: NearMeResponse;
  /** Which saved cell answered — shown in the offline banner. */
  cellLabel: string;
  /** How far the user is from that cell's center (honesty: a Bronx user
   *  offline sees "saved results near Astoria", not a silent lie). */
  cellDistanceM: number;
  generatedAt: string;
}

/** Nearest-cell lookup. Distances/walk minutes are recomputed from the USER'S
 *  coords so "3 min walk" stays true even when the cell center is blocks off.
 *  Falls back through meals if the exact one wasn't captured ("coffee" → the
 *  seed's closest daypart). */
export function getSeedNearMe(lat: number, lng: number, meal: MealParam): SeedResult | null {
  if (!seed.cells?.length) return null;

  let best: SeedCell | null = null;
  let bestDist = Infinity;
  for (const cell of seed.cells) {
    const d = haversineMeters(lat, lng, cell.lat, cell.lng);
    if (d < bestDist) {
      best = cell;
      bestDist = d;
    }
  }
  if (!best) return null;

  const fallbackOrder: MealParam[] = [meal, "lunch", "dinner", "breakfast", "snack"];
  const found = fallbackOrder.find((m) => best!.meals[m]);
  if (!found) return null;
  const raw = best.meals[found];

  const rescale = (r: ApiRestaurant): ApiRestaurant => {
    const distance = Math.round(haversineMeters(lat, lng, r.lat, r.lng));
    return { ...r, distance, walkMinutes: Math.round(distance / 80) };
  };

  return {
    response: {
      restaurants: raw.restaurants.map(rescale),
      excluded: (raw.excluded ?? []).map(rescale),
    },
    cellLabel: best.label,
    cellDistanceM: Math.round(bestDist),
    generatedAt: seed.generatedAt,
  };
}

/** Debug helper (DebugOverlay). */
export function getSeedInfo(): { cells: number; generatedAt: string } {
  return { cells: seed.cells?.length ?? 0, generatedAt: seed.generatedAt };
}

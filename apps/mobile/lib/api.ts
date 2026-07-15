/* ── PulseNYC API client — typed against the FROZEN web contract ─────────────
 * (lib/types.ts, generated from live responses July 14 2026). The app renders
 * server intelligence; it never re-derives venue truth client-side.
 */
import type { ApiRestaurant, MealParam, NearMeResponse } from "./types";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://pulsenyc.app";

/** Every request gets an explicit budget — skeletons → content | error+retry,
 *  never an infinite spinner (web round-4 class). */
const DEFAULT_TIMEOUT_MS = 12_000;

export async function apiFetch<T>(path: string, init?: RequestInit, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Defensive dedupe by restaurantId — the ONE stable venue key (never name,
 *  never slug: all generic venues of a template share a slug, and same-name
 *  chains collide). Same fix class as web round 6's duplicate-card bug. */
export function dedupeByRestaurantId(list: ApiRestaurant[]): ApiRestaurant[] {
  const seen = new Set<string>();
  return list.filter((r) => {
    if (!r?.restaurantId || seen.has(r.restaurantId)) return false;
    seen.add(r.restaurantId);
    return true;
  });
}

/** The near-me contract. Sanitizes both arrays through the dedupe guard. */
export async function fetchNearMe(lat: number, lng: number, meal: MealParam): Promise<NearMeResponse> {
  const data = await apiFetch<NearMeResponse>(
    `/api/smart-menu/near-me?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&meal=${meal}`,
  );
  return {
    restaurants: dedupeByRestaurantId(data.restaurants ?? []),
    excluded: dedupeByRestaurantId(data.excluded ?? []),
  };
}

/** One-tap community correction — same endpoint + shape as the web card
 *  overflow. Two distinct reports soft-exclude the venue pending review. */
export async function reportVenueClosed(venue: {
  restaurantId: string;
  camis: string | null;
  restaurantName: string;
  address?: string;
}): Promise<void> {
  await apiFetch("/api/eat-smart/report-error", {
    method: "POST",
    body: JSON.stringify({
      venueId: venue.camis ?? venue.restaurantId,
      venueName: venue.restaurantName,
      address: venue.address ?? null,
      field: "closed",
      message: "one-tap app report",
      reportedAt: new Date().toISOString(),
    }),
  });
}

/** Free-text "report an error" from the venue sheet. */
export async function reportVenueError(
  venue: { restaurantId: string; camis: string | null; restaurantName: string; address?: string },
  field: string,
  message: string,
): Promise<void> {
  await apiFetch("/api/eat-smart/report-error", {
    method: "POST",
    body: JSON.stringify({
      venueId: venue.camis ?? venue.restaurantId,
      venueName: venue.restaurantName,
      address: venue.address ?? null,
      field,
      message,
      reportedAt: new Date().toISOString(),
    }),
  });
}

import { API_TIMEOUT_MS, MAX_RETRIES } from "@/lib/geo";
import { RouteError } from "@/lib/routes/errors";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function getMapboxToken(): string {
  if (!MAPBOX_TOKEN) throw new RouteError("MISSING_MAPBOX_TOKEN");
  return MAPBOX_TOKEN;
}

export async function fetchWithRetry(url: string, tag: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });

      if (res.status === 429) {
        if (attempt === retries) throw new RouteError("MAPBOX_RATE_LIMIT");
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        await res.text().catch(() => {});
        if (attempt === retries) return null;
        continue;
      }

      return await res.json();
    } catch (error: unknown) {
      if (error instanceof RouteError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[mapbox/${tag}] attempt ${attempt + 1}: ${msg}`);
      if (msg.includes("TimeoutError") || msg.includes("aborted") || msg.includes("timeout")) {
        if (attempt === retries) throw new RouteError("MAPBOX_TIMEOUT");
      }
      if (attempt === retries) return null;
    }
  }
  return null;
}

export interface OptimizationResult {
  geojson: GeoJSON.LineString;
  distanceMi: number;
  durationSec: number;
  legs: any[];
}

export async function fetchOptimizedTrip(
  coordString: string, label: string,
): Promise<OptimizationResult | null> {
  const token = getMapboxToken();
  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/walking/${coordString}?roundtrip=true&source=first&destination=first&geometries=geojson&overview=full&steps=true&exclude=ferry&access_token=${token}`;
  const data = await fetchWithRetry(url, `opt-${label}`);
  if (!data?.trips?.[0]) return null;
  const trip = data.trips[0];
  return {
    geojson: trip.geometry,
    distanceMi: (trip.distance || 0) / 1609.34,
    durationSec: trip.duration || 0,
    legs: trip.legs || [],
  };
}

export async function fetchDirections(
  coordString: string, label: string,
): Promise<OptimizationResult | null> {
  const token = getMapboxToken();
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordString}?geometries=geojson&overview=full&steps=true&exclude=ferry&access_token=${token}`;
  const data = await fetchWithRetry(url, `dir-${label}`);
  if (!data?.routes?.[0]) return null;
  const route = data.routes[0];
  return {
    geojson: route.geometry,
    distanceMi: (route.distance || 0) / 1609.34,
    durationSec: route.duration || 0,
    legs: route.legs || [],
  };
}

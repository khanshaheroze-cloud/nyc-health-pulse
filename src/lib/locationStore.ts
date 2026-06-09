"use client";

// Single shared location store. Every location-aware surface (homepage wedge,
// /eat-smart, hooks) reads and writes THIS store under ONE localStorage key —
// setting your location anywhere sets it everywhere. Components subscribe to
// live changes via the custom event.

export const LOCATION_KEY = "pulsenyc:lastLocation";
export const LOCATION_EVENT = "pulsenyc-location-change";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Five-borough bounding box (W, S, E, N)
export const NYC_BBOX = { west: -74.2589, south: 40.4774, east: -73.7004, north: 40.9176 };

export type LocationSource = "gps" | "manual" | "ip";

export interface StoredLocation {
  lat: number;
  lng: number;
  label?: string;
  source: LocationSource;
  /** GPS accuracy in meters, when known */
  accuracy?: number;
  ts: number;
}

export type LocationStatus =
  | "idle"
  | "locating"
  | "success"
  | "denied"
  | "unavailable"
  | "timeout"
  | "out_of_area";

export function isInNYC(lat: number, lng: number): boolean {
  return lat >= NYC_BBOX.south && lat <= NYC_BBOX.north && lng >= NYC_BBOX.west && lng <= NYC_BBOX.east;
}

/** Desktop IP geolocation is typically km-scale — treat as low confidence */
export const LOW_CONFIDENCE_ACCURACY_M = 2000;

export function readLocation(): StoredLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw) as StoredLocation;
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") return null;
    if (Date.now() - (loc.ts ?? 0) > TTL_MS) return null;
    return loc;
  } catch {
    return null;
  }
}

export function writeLocation(loc: Omit<StoredLocation, "ts"> & { ts?: number }): StoredLocation {
  const stored: StoredLocation = { ...loc, ts: loc.ts ?? Date.now() };
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(stored));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(LOCATION_EVENT, { detail: stored }));
  } catch {}
  return stored;
}

/** Subscribe to location changes from ANY surface. Returns unsubscribe. */
export function subscribeLocation(cb: (loc: StoredLocation) => void): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<StoredLocation>).detail;
    if (detail) cb(detail);
  };
  window.addEventListener(LOCATION_EVENT, handler);
  return () => window.removeEventListener(LOCATION_EVENT, handler);
}

export interface GeoRequestResult {
  status: LocationStatus;
  coords?: { lat: number; lng: number };
  accuracy?: number;
  lowConfidence?: boolean;
}

/**
 * One geolocation request with the full state machine: resolves with a
 * terminal status — never hangs, never resolves out-of-NYC coords as success.
 */
export function requestBrowserLocation(timeoutMs = 10_000): Promise<GeoRequestResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ status: "unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        if (!isInNYC(lat, lng)) {
          resolve({ status: "out_of_area", coords: { lat, lng }, accuracy });
          return;
        }
        resolve({
          status: "success",
          coords: { lat, lng },
          accuracy,
          lowConfidence: accuracy != null && accuracy > LOW_CONFIDENCE_ACCURACY_M,
        });
      },
      (err) => {
        resolve({ status: err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable" });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

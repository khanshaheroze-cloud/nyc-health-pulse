import * as Location from "expo-location";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "pulse-location-cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const NYC_DEFAULT = { lat: 40.7128, lng: -74.006 };

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy: number | null;
  source: "gps" | "cache" | "default";
}

interface LocationCache {
  lat: number;
  lng: number;
  accuracy: number | null;
  ts: number;
}

let pendingPromise: Promise<LocationResult | null> | null = null;
let watchSubscription: Location.LocationSubscription | null = null;
let onLocationUpdate: ((loc: LocationResult) => void) | null = null;

async function getCachedLocation(): Promise<LocationResult | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: LocationCache = JSON.parse(raw);
    if (Date.now() - cached.ts > CACHE_TTL) return null;
    return { lat: cached.lat, lng: cached.lng, accuracy: cached.accuracy, source: "cache" };
  } catch {
    return null;
  }
}

async function saveLocationCache(loc: LocationResult): Promise<void> {
  try {
    const entry: LocationCache = { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, ts: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

export function getUserLocation(): Promise<LocationResult | null> {
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async (): Promise<LocationResult | null> => {
    // Try cache first for instant response
    const cached = await getCachedLocation();
    if (cached) return cached;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;

      // Fast fix with Balanced accuracy
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((r) => setTimeout(() => r(null), 8000)),
      ]);

      if (!loc) return null;

      const result: LocationResult = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        source: "gps",
      };

      await saveLocationCache(result);
      return result;
    } catch {
      return null;
    }
  })().finally(() => { pendingPromise = null; });

  return pendingPromise;
}

export async function startLocationWatch(
  callback: (loc: LocationResult) => void,
): Promise<void> {
  if (watchSubscription) return;
  onLocationUpdate = callback;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;

    watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 50,
        timeInterval: 30000,
      },
      (loc) => {
        const result: LocationResult = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          source: "gps",
        };
        saveLocationCache(result);
        onLocationUpdate?.(result);
      },
    );
  } catch {}
}

export function stopLocationWatch(): void {
  watchSubscription?.remove();
  watchSubscription = null;
  onLocationUpdate = null;
}

export async function checkPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status as "granted" | "denied" | "undetermined";
}

export function openLocationSettings(): void {
  Linking.openSettings();
}

export async function getLocationDebug(): Promise<string> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      const req = await Location.requestForegroundPermissionsAsync();
      if (req.status !== "granted") return `Permission denied (${req.status})`;
    }

    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) return "Location services OFF on device";

    const loc = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((r) => setTimeout(() => r(null), 10000)),
    ]);

    if (!loc) return "Location unavailable";
    return `GPS: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)} (acc: ${loc.coords.accuracy?.toFixed(0) ?? "?"}m)`;
  } catch (e: any) {
    return `Error: ${e?.message ?? "unknown"}`;
  }
}

export function resetLocationCache() {
  AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
  pendingPromise = null;
}

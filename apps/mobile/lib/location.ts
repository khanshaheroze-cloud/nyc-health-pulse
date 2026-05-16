import * as Location from "expo-location";

let cachedResult: { lat: number; lng: number } | null = null;
let pendingPromise: Promise<{ lat: number; lng: number } | null> | null = null;

export const NYC_DEFAULT = { lat: 40.7128, lng: -74.006 };

export function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (cachedResult) return Promise.resolve(cachedResult);
  if (pendingPromise) return pendingPromise;

  pendingPromise = Promise.race([
    (async (): Promise<{ lat: number; lng: number } | null> => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return null;

        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
        }

        const result = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        cachedResult = result;
        return result;
      } catch {
        return null;
      }
    })(),
    new Promise<null>((r) => setTimeout(() => r(null), 8000)),
  ]).finally(() => {
    pendingPromise = null;
  });

  return pendingPromise;
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
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      new Promise<null>((r) => setTimeout(() => r(null), 10000)),
    ]);

    if (!loc) return "Location unavailable — tap to retry";
    return `GPS: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
  } catch (e: any) {
    return `Error: ${e?.message ?? "unknown"}`;
  }
}

export function resetLocationCache() {
  cachedResult = null;
  pendingPromise = null;
}

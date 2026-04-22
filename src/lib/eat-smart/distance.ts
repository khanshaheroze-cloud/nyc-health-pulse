const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_MILE = 1609.34;
const METERS_PER_BLOCK = 80; // NYC short block ≈ 80 m (264 ft)

export type DistanceUnit = "blocks" | "imperial" | "miles";

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

/**
 * User-facing distance string.
 * Default mode is "blocks" — NYC short blocks (≈ 80 m / 264 ft).
 * Switches to miles when ≥ 0.5 mi (800 m) in blocks mode.
 */
export function formatDistance(meters: number, unit: DistanceUnit = "blocks"): string {
  if (unit === "blocks") {
    if (meters < METERS_PER_BLOCK) return "< 1 block";
    if (meters < 800) {
      const blocks = Math.round(meters / METERS_PER_BLOCK);
      return blocks === 1 ? "1 block" : `${blocks} blocks`;
    }
    // ≥ 0.5 mi → switch to miles
    const mi = meters / METERS_PER_MILE;
    return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
  }

  if (unit === "imperial") {
    const mi = meters / METERS_PER_MILE;
    if (mi < 0.1) return `${Math.round(meters * 3.281)} ft`;
    return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
  }

  // miles-only
  const mi = meters / METERS_PER_MILE;
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
}

import { EARTH_RADIUS_M } from "./constants";

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function movePoint(lat: number, lng: number, bearingDeg: number, distanceM: number): { lat: number; lng: number } {
  const R = EARTH_RADIUS_M;
  const d = distanceM / R;
  const brng = bearingDeg * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
  );
  return { lat: lat2 * 180 / Math.PI, lng: lng2 * 180 / Math.PI };
}

export function bearingBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const la1 = lat1 * Math.PI / 180;
  const la2 = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

export function isValidCoord(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

export function metersToMiles(meters: number): number {
  return meters / 1609.34;
}

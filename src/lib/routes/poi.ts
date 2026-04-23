import { haversineM, isValidCoord, areSameLandmass, getLandmass, type Landmass } from "@/lib/geo";
import { fetchWithRetry } from "@/lib/mapbox/client";
import type { ParkPoint, NearbyPOI } from "./types";

function extractCoordinates(feature: any): { lat: number; lng: number } | null {
  try {
    if (feature.latitude && feature.longitude) {
      const lat = parseFloat(feature.latitude);
      const lng = parseFloat(feature.longitude);
      if (isValidCoord(lat, lng)) return { lat, lng };
    }
    const geom = feature.the_geom || feature.geometry;
    if (!geom) return null;
    if (geom.type === "Point") {
      return { lat: geom.coordinates[1], lng: geom.coordinates[0] };
    }
    if (geom.type === "MultiPolygon" || geom.type === "Polygon") {
      const ring = geom.type === "MultiPolygon" ? geom.coordinates[0][0] : geom.coordinates[0];
      if (!ring || ring.length === 0) return null;
      let sumLat = 0, sumLng = 0;
      const n = Math.min(ring.length, 30);
      for (let i = 0; i < n; i++) { sumLng += ring[i][0]; sumLat += ring[i][1]; }
      if (isValidCoord(sumLat / n, sumLng / n)) return { lat: sumLat / n, lng: sumLng / n };
    }
    if (geom.type === "LineString") {
      const mid = Math.floor(geom.coordinates.length / 2);
      return { lat: geom.coordinates[mid][1], lng: geom.coordinates[mid][0] };
    }
    if (geom.type === "MultiLineString") {
      const line = geom.coordinates[0];
      const mid = Math.floor(line.length / 2);
      return { lat: line[mid][1], lng: line[mid][0] };
    }
    return null;
  } catch { return null; }
}

export async function fetchNearbyPOI(
  lat: number, lng: number, radiusMeters: number, startLandmass: Landmass | null,
): Promise<NearbyPOI> {
  const radius = Math.max(500, Math.min(radiusMeters, 5000));

  const [parksRaw, waterfrontRaw] = await Promise.all([
    fetchWithRetry(
      `https://data.cityofnewyork.us/resource/enfk-uwib.json?$where=within_circle(the_geom,${lat},${lng},${radius})&$limit=40`,
      "parks-fetch",
    ),
    fetchWithRetry(
      `https://data.cityofnewyork.us/resource/9y58-8zvz.json?$where=within_circle(the_geom,${lat},${lng},${radius})&$limit=25`,
      "waterfront-fetch",
    ),
  ]);

  let parks: ParkPoint[] = (parksRaw || [])
    .map((p: any) => {
      const coords = extractCoordinates(p);
      if (!coords) return null;
      return {
        lat: coords.lat, lng: coords.lng,
        name: p.signname || p.name311 || p.typecategory || "Park",
        dist: haversineM(lat, lng, coords.lat, coords.lng),
        type: "park" as const,
        area: p.shape_area ? parseFloat(p.shape_area) : undefined,
      };
    })
    .filter((p: ParkPoint | null): p is ParkPoint => p !== null && p.dist > 100)
    .sort((a: ParkPoint, b: ParkPoint) => {
      const aScore = (a.area || 5000) / Math.max(a.dist, 100);
      const bScore = (b.area || 5000) / Math.max(b.dist, 100);
      return bScore - aScore;
    });

  let waterfront: ParkPoint[] = (waterfrontRaw || [])
    .map((w: any) => {
      const coords = extractCoordinates(w);
      if (!coords) return null;
      return {
        lat: coords.lat, lng: coords.lng,
        name: w.name || w.location || "Waterfront",
        dist: haversineM(lat, lng, coords.lat, coords.lng),
        type: "waterfront" as const,
      };
    })
    .filter((w: ParkPoint | null): w is ParkPoint => w !== null && w.dist > 100)
    .sort((a: ParkPoint, b: ParkPoint) => a.dist - b.dist);

  if (startLandmass) {
    parks = parks.filter((p) => areSameLandmass(startLandmass, getLandmass(p.lat, p.lng)));
    waterfront = waterfront.filter((w) => areSameLandmass(startLandmass, getLandmass(w.lat, w.lng)));
  }

  return { parks, waterfront };
}

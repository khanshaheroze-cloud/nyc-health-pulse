import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface GenerateRequest {
  startLat: number;
  startLng: number;
  distanceMiles: number;
  routeType: "loop" | "out-back";
  difficulty: "beginner" | "intermediate" | "advanced";
  optimizeFor: string[];
  preferParks?: boolean;
}

interface RouteCandidate {
  geojson: GeoJSON.LineString;
  distance: number;
  elevationGain: number;
  estimatedMinutes: number;
  runScore: number;
  scoreBreakdown: { airQuality: number; safety: number; scenery: number; terrain: number };
  lowQuality: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** Running pace by difficulty (min/mile) */
const PACE_MAP: Record<string, number> = {
  beginner: 12,
  intermediate: 9.5,
  advanced: 7.5,
};

// ── Isochrone: get walkable boundary from start ────────────────────────

async function getIsochrone(
  lat: number,
  lng: number,
  distanceMiles: number,
): Promise<GeoJSON.Polygon | null> {
  if (!MAPBOX_TOKEN) return null;
  // Isochrone needs to cover the full running distance in any direction
  // Walking speed ~3mph, so minutes = (distance/2) / 3 * 60 = distance * 10
  const minutes = Math.min(60, Math.max(15, Math.round(distanceMiles * 10)));
  try {
    const res = await fetch(
      `https://api.mapbox.com/isochrone/v1/mapbox/walking/${lng},${lat}?contours_minutes=${minutes}&polygons=true&access_token=${MAPBOX_TOKEN}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) {
      console.error("[run-routes/generate] Isochrone failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    const poly = data?.features?.[0]?.geometry as GeoJSON.Polygon | undefined;
    return poly ?? null;
  } catch (error) {
    console.error("[run-routes/generate] Isochrone error:", error);
    return null;
  }
}

/** Check if a point is inside a GeoJSON polygon (ray casting) */
function pointInPolygon(lat: number, lng: number, polygon: GeoJSON.Polygon): boolean {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Nearby parks: fetch park centroids for waypoint biasing ──────────

interface ParkPoint { lat: number; lng: number }

async function fetchNearbyParks(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<ParkPoint[]> {
  try {
    const url = `https://data.cityofnewyork.us/resource/ghu2-eden.json?$where=within_circle(the_geom,${lat},${lng},${radiusMeters})&$limit=30&$select=the_geom`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[run-routes/generate] Parks fetch failed:", res.status);
      return [];
    }
    const data = await res.json();
    const points: ParkPoint[] = [];
    for (const row of data) {
      const geom = row.the_geom;
      if (!geom?.coordinates) continue;
      const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
      for (const poly of polys) {
        if (poly[0]?.length > 0) {
          const ring = poly[0];
          const n = Math.min(ring.length, 20);
          let sumLat = 0, sumLng = 0;
          for (let i = 0; i < n; i++) { sumLng += ring[i][0]; sumLat += ring[i][1]; }
          points.push({ lat: sumLat / n, lng: sumLng / n });
        }
      }
    }
    return points;
  } catch (error) {
    console.error("[run-routes/generate] Parks error:", error);
    return [];
  }
}

// ── Waterfront access areas ──────────────────────────────────────────

async function fetchNearbyWaterfront(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<ParkPoint[]> {
  try {
    const url = `https://data.cityofnewyork.us/resource/9y58-8zvz.json?$where=within_circle(the_geom,${lat},${lng},${radiusMeters})&$limit=20`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const points: ParkPoint[] = [];
    for (const row of data) {
      const geom = row.the_geom;
      if (!geom?.coordinates) continue;
      if (geom.type === "Point") {
        points.push({ lat: geom.coordinates[1], lng: geom.coordinates[0] });
      } else if (geom.type === "MultiPolygon" || geom.type === "Polygon") {
        const ring = geom.type === "MultiPolygon" ? geom.coordinates[0][0] : geom.coordinates[0];
        if (ring?.length > 0) {
          const n = Math.min(ring.length, 20);
          let sumLat = 0, sumLng = 0;
          for (let i = 0; i < n; i++) { sumLng += ring[i][0]; sumLat += ring[i][1]; }
          points.push({ lat: sumLat / n, lng: sumLng / n });
        }
      }
    }
    return points;
  } catch (error) {
    console.error("[run-routes/generate] Waterfront error:", error);
    return [];
  }
}

// ── Park-first waypoint generation ──────────────────────────────────

/**
 * Generate waypoints routed THROUGH nearby parks and waterfront instead of
 * random compass-angle points. Falls back to compass angles when no
 * parks/waterfront are found.
 */
function generateParkFirstWaypoints(
  startLat: number,
  startLng: number,
  parkPoints: ParkPoint[],
  waterfrontPoints: ParkPoint[],
  radiusMiles: number,
  routeType: "loop" | "out-back",
): { lat: number; lng: number }[] | null {
  // Sort by distance from start, skip very close ones (already in a park)
  const withDist = (pts: ParkPoint[]) =>
    pts
      .map(p => ({ ...p, dist: haversineMeters(startLat, startLng, p.lat, p.lng) }))
      .filter(p => p.dist > 200)
      .sort((a, b) => a.dist - b.dist);

  const sortedParks = withDist(parkPoints);
  const sortedWaterfront = withDist(waterfrontPoints);

  if (sortedParks.length === 0 && sortedWaterfront.length === 0) return null;

  const waypoints: { lat: number; lng: number }[] = [];

  // Add nearest park
  if (sortedParks.length > 0) {
    waypoints.push({ lat: sortedParks[0].lat, lng: sortedParks[0].lng });
    console.log(`[run-routes/generate] Park waypoint: ${sortedParks[0].lat.toFixed(5)}, ${sortedParks[0].lng.toFixed(5)} (${Math.round(sortedParks[0].dist)}m away)`);
  }

  // Add nearest waterfront if it's in a different direction (>300m from park waypoint)
  if (sortedWaterfront.length > 0) {
    const wf = sortedWaterfront[0];
    const tooClose = waypoints.length > 0 &&
      haversineMeters(waypoints[0].lat, waypoints[0].lng, wf.lat, wf.lng) < 300;
    if (!tooClose) {
      waypoints.push({ lat: wf.lat, lng: wf.lng });
      console.log(`[run-routes/generate] Waterfront waypoint: ${wf.lat.toFixed(5)}, ${wf.lng.toFixed(5)} (${Math.round(wf.dist)}m away)`);
    }
  }

  // If we only have 1 waypoint, add a second park for a better loop
  if (waypoints.length < 2 && sortedParks.length > 1) {
    const second = sortedParks[1];
    if (haversineMeters(waypoints[0].lat, waypoints[0].lng, second.lat, second.lng) > 300) {
      waypoints.push({ lat: second.lat, lng: second.lng });
      console.log(`[run-routes/generate] Second park waypoint: ${second.lat.toFixed(5)}, ${second.lng.toFixed(5)} (${Math.round(second.dist)}m away)`);
    }
  }

  // For longer routes (>5mi), try to add a third waypoint for better coverage
  if (waypoints.length >= 2 && radiusMiles > 0.7) {
    const allSorted = [...sortedParks.slice(1), ...sortedWaterfront.slice(1)]
      .filter(p => waypoints.every(wp => haversineMeters(wp.lat, wp.lng, p.lat, p.lng) > 400))
      .sort((a, b) => a.dist - b.dist);
    if (allSorted.length > 0) {
      waypoints.push({ lat: allSorted[0].lat, lng: allSorted[0].lng });
    }
  }

  if (waypoints.length === 0) return null;

  console.log(`[run-routes/generate] Using ${waypoints.length} park/waterfront waypoints (park-first mode)`);
  return waypoints;
}

// ── Waypoint generation ───────────────────────────────────────────────

function generateRawWaypoints(
  lat: number,
  lng: number,
  radiusMiles: number,
  angles: number[],
): { lat: number; lng: number }[] {
  const latDeg = radiusMiles / 69;
  const lngDeg = radiusMiles / 53;
  return angles.map((angle) => {
    const rad = (angle * Math.PI) / 180;
    return {
      lat: lat + latDeg * Math.cos(rad),
      lng: lng + lngDeg * Math.sin(rad),
    };
  });
}

/** Find nearest park centroid to a given location */
function nearestPark(
  lat: number,
  lng: number,
  parkPoints: ParkPoint[],
  maxDistDeg: number,
): ParkPoint | null {
  let best: ParkPoint | null = null;
  let bestDist = Infinity;
  for (const pk of parkPoints) {
    const d = Math.sqrt((pk.lat - lat) ** 2 + (pk.lng - lng) ** 2);
    if (d < bestDist && d < maxDistDeg) {
      bestDist = d;
      best = pk;
    }
  }
  return best;
}

/**
 * Generate waypoints constrained to isochrone + biased toward parks.
 *
 * KEY FIX: No longer calls validateWaypoint (reverse geocoding) for each point.
 * The isochrone polygon already ensures points are on walkable land.
 * If no isochrone, we accept all waypoints — Mapbox Directions API will snap
 * them to the nearest routable road anyway.
 */
function generateConstrainedWaypoints(
  startLat: number,
  startLng: number,
  radiusMiles: number,
  angles: number[],
  isochrone: GeoJSON.Polygon | null,
  parkPoints: ParkPoint[],
  optimizeGreen: boolean,
): { lat: number; lng: number }[] {
  const raw = generateRawWaypoints(startLat, startLng, radiusMiles, angles);
  const validated: { lat: number; lng: number }[] = [];

  for (const wp of raw) {
    let candidate = wp;

    // 1. Constrain to isochrone if available
    if (isochrone && !pointInPolygon(candidate.lat, candidate.lng, isochrone)) {
      // Move 40% toward start to get inside boundary
      candidate = {
        lat: candidate.lat + (startLat - candidate.lat) * 0.4,
        lng: candidate.lng + (startLng - candidate.lng) * 0.4,
      };
      // If still outside, move another 30%
      if (!pointInPolygon(candidate.lat, candidate.lng, isochrone)) {
        candidate = {
          lat: candidate.lat + (startLat - candidate.lat) * 0.3,
          lng: candidate.lng + (startLng - candidate.lng) * 0.3,
        };
      }
      // If still outside after two shifts, accept anyway — Directions API will snap
      // (Skipping too many waypoints makes routes too short)
    }

    // 2. Bias toward parks if available
    if (parkPoints.length > 0) {
      const maxBiasDist = radiusMiles / 69 * 0.5;
      const nearest = nearestPark(candidate.lat, candidate.lng, parkPoints, maxBiasDist);
      if (nearest) {
        const blend = optimizeGreen ? 0.6 : 0.3;
        candidate = {
          lat: candidate.lat + (nearest.lat - candidate.lat) * blend,
          lng: candidate.lng + (nearest.lng - candidate.lng) * blend,
        };
      }
    }

    // 3. Basic NYC bounds check (no API call needed)
    if (candidate.lat >= 40.4 && candidate.lat <= 40.95 &&
        candidate.lng >= -74.3 && candidate.lng <= -73.7) {
      validated.push(candidate);
    }
  }

  return validated;
}

// ── Mapbox Directions ─────────────────────────────────────────────────

async function getDirections(
  coords: { lat: number; lng: number }[],
): Promise<{ geojson: GeoJSON.LineString; distanceMeters: number; durationSeconds: number } | null> {
  if (!MAPBOX_TOKEN || coords.length < 2) return null;

  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  // FIX: Removed `exclude=motorway` — invalid for walking profile, caused 422 errors
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[run-routes/generate] Directions API failed:", res.status, errText);
      return null;
    }
    const data = await res.json();
    if (!data.routes?.[0]) {
      console.error("[run-routes/generate] Directions API returned no routes for coords:", coordStr.substring(0, 100));
      return null;
    }
    return {
      geojson: data.routes[0].geometry as GeoJSON.LineString,
      distanceMeters: data.routes[0].distance,
      durationSeconds: data.routes[0].duration,
    };
  } catch (error) {
    console.error("[run-routes/generate] Directions API error:", error);
    return null;
  }
}

// ── Scoring functions ─────────────────────────────────────────────────

/** Sample evenly-spaced points along a route */
function sampleRoutePoints(coords: [number, number][], n: number): [number, number][] {
  if (coords.length <= n) return coords;
  const step = Math.max(1, Math.floor(coords.length / n));
  const out: [number, number][] = [];
  for (let i = 0; i < coords.length && out.length < n; i += step) {
    out.push(coords[i]);
  }
  return out;
}

/** Elevation sampling */
async function sampleElevation(coords: [number, number][]): Promise<number> {
  const samples = sampleRoutePoints(coords, 6);
  if (samples.length < 2) return 0;

  const elevations: number[] = [];
  await Promise.all(
    samples.map(async ([lng, lat]) => {
      try {
        const res = await fetch(
          `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&units=Feet&wkid=4326`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (res.ok) {
          const data = await res.json();
          const elev = parseFloat(data?.value ?? "0");
          if (!isNaN(elev) && elev > -100) elevations.push(elev);
        }
      } catch (error) {
        console.error("[run-routes/generate] Elevation sample failed:", error instanceof Error ? error.message : error);
      }
    }),
  );

  if (elevations.length < 2) return 0;
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) gain += diff;
  }
  return Math.round(gain);
}

/**
 * Street Safety scoring — single batch query for crash density
 * Uses bounding box around route for ONE API call.
 * Scale: 0 crashes/mi = 25, 50+ crashes/mi = 0 (ped/cyclist injuries in 2 years)
 */
async function scoreSafety(
  coords: [number, number][],
  routeDistanceMiles: number,
): Promise<{ pts: number; crashCount: number }> {
  // Compute bounding box with 100m buffer
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const radius = Math.max(200, haversineMeters(minLat, minLng, maxLat, maxLng) / 2 + 100);

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const dateStr = twoYearsAgo.toISOString().split("T")[0];

  let totalCrashes = 0;
  try {
    const url = `https://data.cityofnewyork.us/resource/h9gi-nx95.json?$where=within_circle(location,${centerLat},${centerLng},${radius}) AND crash_date>'${dateStr}' AND (number_of_pedestrians_injured>0 OR number_of_pedestrians_killed>0 OR number_of_cyclist_injured>0 OR number_of_cyclist_killed>0)&$select=count(*) as cnt&$limit=1`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      totalCrashes = parseInt(data[0]?.cnt ?? "0", 10);
    }
  } catch (error) {
    console.error("[run-routes/generate] Safety query failed:", error instanceof Error ? error.message : error);
  }

  // NYC-calibrated scale: crash density per-mile within the route's bounding box.
  // NYC average is ~100-200 ped/cyclist crashes per sq-mile per 2 years.
  // Parks/residential: ~20-50, Midtown/Downtown: 200-400.
  // 0 crashes/mi = 25, 300+ = 0 (linear)
  const crashesPerMile = routeDistanceMiles > 0 ? totalCrashes / routeDistanceMiles : totalCrashes;
  const pts = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(crashesPerMile / 300, 1)))));

  return { pts, crashCount: totalCrashes };
}

/** Haversine distance in meters between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Extract lat/lng from various NYC Open Data geometry formats */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCoords(row: any): { lat: number; lng: number } | null {
  // Point geometry
  if (row.the_geom?.coordinates) {
    const c = row.the_geom.coordinates;
    if (Array.isArray(c) && c.length >= 2) return { lat: c[1], lng: c[0] };
  }
  // Flat lat/lng fields
  if (row.latitude && row.longitude) return { lat: +row.latitude, lng: +row.longitude };
  if (row.lat && row.lng) return { lat: +row.lat, lng: +row.lng };
  return null;
}

/** Safe fetch that never throws — returns empty array on error */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSafe(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("[run-routes/generate] Scenery fetch failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Scenery scoring (0-25) — water proximity + green space + landmarks
 * Uses 3 verified NYC Open Data sources + tree density.
 * Water (0-10) + Green (0-10) + Landmarks (0-5) = 0-25
 *
 * Working datasets:
 * - 9y58-8zvz: Waterfront access points (the_geom Point)
 * - ghu2-eden: NYC Parks properties (the_geom MultiPolygon)
 * - buis-pvji: LPC landmarks (the_geom MultiPolygon)
 * - uvpi-gqnh: Street trees (latitude/longitude fields)
 */
async function scoreScenery(
  coords: [number, number][],
): Promise<number> {
  const samples = sampleRoutePoints(coords, 10);
  if (samples.length === 0) return 0;

  // Compute bounding box center + radius for batch queries
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lng, lat] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const radius = Math.max(500, haversineMeters(minLat, minLng, maxLat, maxLng) / 2 + 300);
  const buf = 0.003; // ~300m in lat/lng degrees for tree query

  // Batch fetch all scenery data in parallel (4 API calls)
  const [waterfront, parks, landmarks, treesData] = await Promise.all([
    // Waterfront access points
    fetchSafe(`https://data.cityofnewyork.us/resource/9y58-8zvz.json?$where=within_circle(the_geom,${centerLat},${centerLng},${radius})&$limit=100`),
    // NYC Parks properties
    fetchSafe(`https://data.cityofnewyork.us/resource/ghu2-eden.json?$where=within_circle(the_geom,${centerLat},${centerLng},${radius})&$limit=50&$select=the_geom`),
    // LPC individual landmarks
    fetchSafe(`https://data.cityofnewyork.us/resource/buis-pvji.json?$where=within_circle(the_geom,${centerLat},${centerLng},${radius})&$limit=50&$select=the_geom`),
    // Tree count in bounding box (proxy for green canopy)
    fetchSafe(`https://data.cityofnewyork.us/resource/uvpi-gqnh.json?$where=latitude>${minLat - buf} AND latitude<${maxLat + buf} AND longitude>${minLng - buf} AND longitude<${maxLng + buf}&$select=count(*) as cnt&$limit=1`),
  ]);

  console.log("[run-routes/generate] Scenery data — waterfront:", waterfront.length, "parks:", parks.length, "landmarks:", landmarks.length, "trees:", treesData[0]?.cnt ?? 0);

  // Extract coordinates from features
  const waterCoords = waterfront.map(extractCoords).filter(Boolean) as { lat: number; lng: number }[];

  // For parks/landmarks with polygon geometry, extract centroid from first coords
  const parkCoords: { lat: number; lng: number }[] = [];
  for (const p of parks) {
    const geom = p.the_geom;
    if (!geom?.coordinates) continue;
    // Get first coordinate of first ring of first polygon
    const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
    for (const poly of polys) {
      if (poly[0]?.length > 0) {
        // Average first ring for centroid
        let sumLat = 0, sumLng = 0;
        const ring = poly[0];
        const n = Math.min(ring.length, 20);
        for (let i = 0; i < n; i++) {
          sumLng += ring[i][0];
          sumLat += ring[i][1];
        }
        parkCoords.push({ lat: sumLat / n, lng: sumLng / n });
      }
    }
  }

  const landmarkCoords: { lat: number; lng: number }[] = [];
  for (const l of landmarks) {
    const geom = l.the_geom;
    if (!geom?.coordinates) continue;
    const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
    if (polys[0]?.[0]?.[0]) {
      landmarkCoords.push({ lat: polys[0][0][0][1], lng: polys[0][0][0][0] });
    }
  }

  // Tree density score: >500 trees = high, <50 = low
  const treeCount = parseInt(treesData[0]?.cnt ?? "0", 10);
  const treeDensityBonus = Math.min(3, Math.round(3 * Math.min(treeCount / 500, 1)));

  // Score each sample point
  let waterHits = 0, greenHits = 0, landmarkHits = 0;

  for (const [lng, lat] of samples) {
    // Water: within 250m of waterfront access point
    if (waterCoords.some(w => haversineMeters(lat, lng, w.lat, w.lng) < 250)) waterHits++;
    // Green: within 300m of park centroid
    if (parkCoords.some(g => haversineMeters(lat, lng, g.lat, g.lng) < 300)) greenHits++;
    // Landmarks: within 400m
    if (landmarkCoords.some(l => haversineMeters(lat, lng, l.lat, l.lng) < 400)) landmarkHits++;
  }

  const total = samples.length;
  const waterScore = Math.round(10 * (waterHits / total));                   // 0-10
  const greenScore = Math.min(10, Math.round(7 * (greenHits / total)) + treeDensityBonus); // 0-10
  const landmarkScore = Math.round(5 * (landmarkHits / total));              // 0-5

  console.log("[run-routes/generate] Scenery scores — water:", waterScore, "green:", greenScore, "landmarks:", landmarkScore);

  return waterScore + greenScore + landmarkScore; // 0-25
}

/** AQI score (0-25) */
function scoreAqi(aqi: number | null): number {
  const effectiveAqi = aqi ?? 35;
  return Math.round(Math.max(0, Math.min(25, 25 - effectiveAqi / 4)));
}

/** Terrain score (0-25) based on difficulty preference */
function scoreTerrain(elevGain: number, difficulty: string): number {
  if (difficulty === "beginner") {
    return Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(elevGain / 500, 1)))));
  }
  if (difficulty === "advanced") {
    return Math.round(Math.max(0, Math.min(25, 25 * Math.min(elevGain / 500, 1))));
  }
  return 15; // intermediate
}

/** Apply optimization weights and compute final score */
function computeFinalScore(
  breakdown: RouteCandidate["scoreBreakdown"],
  optimizeFor: string[],
): number {
  const weights = { airQuality: 1, safety: 1, scenery: 1, terrain: 1 };
  for (const pref of optimizeFor) {
    if (pref === "air") weights.airQuality = 2;
    if (pref === "safety") weights.safety = 2;
    if (pref === "green") weights.scenery = 2;
    if (pref === "flat" || pref === "scenic") weights.terrain = 2;
  }
  const totalWeight = weights.airQuality + weights.safety + weights.scenery + weights.terrain;
  const weighted =
    (breakdown.airQuality * weights.airQuality +
      breakdown.safety * weights.safety +
      breakdown.scenery * weights.scenery +
      breakdown.terrain * weights.terrain) /
    totalWeight;
  return Math.round(Math.min(100, weighted * 4));
}

// ── Fetch AQI directly from AirNow (no self-referencing internal fetch) ──

async function fetchCityAqi(): Promise<number | null> {
  try {
    const key = process.env.AIRNOW_API_KEY;
    if (!key) return null;
    const res = await fetch(
      `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=10001&distance=25&API_KEY=${key}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();
    const pm25 = data.find((d) => d.ParameterName === "PM2.5");
    return pm25?.AQI ?? data[0]?.AQI ?? null;
  } catch {
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[run-routes/generate] POST handler started");
  console.log("[run-routes/generate] Mapbox token exists:", !!MAPBOX_TOKEN);

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: "Mapbox token not configured" }, { status: 503 });
  }

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch (error) {
    console.error("[run-routes/generate] Invalid request body:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { startLat, startLng, distanceMiles, routeType, difficulty, optimizeFor, preferParks: preferParksParam } = body;
  const preferParks = preferParksParam !== false; // default true
  console.log("[run-routes/generate] Request:", { startLat, startLng, distanceMiles, routeType, difficulty, preferParks });

  if (!startLat || !startLng || !distanceMiles) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // 1. Fetch AQI, isochrone, parks, and waterfront in parallel
    const searchRadius = Math.min(5000, distanceMiles * 800);
    const [cityAqi, isochrone, parkPoints, waterfrontPoints] = await Promise.all([
      fetchCityAqi(),
      getIsochrone(startLat, startLng, distanceMiles),
      fetchNearbyParks(startLat, startLng, searchRadius),
      preferParks ? fetchNearbyWaterfront(startLat, startLng, searchRadius) : Promise.resolve([]),
    ]);

    console.log("[run-routes/generate] Parallel fetch done — AQI:", cityAqi, "isochrone:", !!isochrone, "parks:", parkPoints.length, "waterfront:", waterfrontPoints.length);

    // Walking routes are ~7-8x the radius (streets aren't straight lines).
    // 3mi request → radius 0.43mi → 4 waypoints → ~3mi walking distance.
    const radius = routeType === "loop" ? distanceMiles / 7 : distanceMiles / 3;
    const optimizeGreen = optimizeFor.includes("green");

    // 2a. Park-first: try to route through parks/waterfront directly
    const parkFirstWaypoints = preferParks
      ? generateParkFirstWaypoints(startLat, startLng, parkPoints, waterfrontPoints, radius, routeType)
      : null;

    // 2b. Define candidate angle sets — more waypoints for longer routes
    const baseSets =
      routeType === "loop"
        ? distanceMiles >= 6
          ? [
              [0, 60, 120, 180, 240, 300],
              [30, 90, 150, 210, 270, 330],
              [0, 72, 144, 216, 288],
              [45, 135, 225, 315],
              [0, 90, 180, 270],
            ]
          : [
              [0, 90, 180, 270],
              [45, 135, 225, 315],
              [0, 120, 240],
              [60, 180, 300],
              [30, 150, 270],
              [0, 72, 144, 216, 288],
            ]
        : [
            [0],
            [45],
            [90],
            [135],
            [180],
            [270],
          ];
    const candidateAngleSets = baseSets;

    // 3. Generate and score candidates
    const candidates: RouteCandidate[] = [];

    // 3a. Try park-first waypoints as first candidate
    if (parkFirstWaypoints && parkFirstWaypoints.length > 0) {
      const start = { lat: startLat, lng: startLng };
      const routeCoords =
        routeType === "loop"
          ? [start, ...parkFirstWaypoints, start]
          : [start, ...parkFirstWaypoints];

      console.log("[run-routes/generate] Trying park-first route with", parkFirstWaypoints.length, "waypoints");
      const directions = await getDirections(routeCoords);
      if (directions) {
        const distMiles = directions.distanceMeters / 1609.34;
        const geoCoords = directions.geojson.coordinates as [number, number][];
        console.log("[run-routes/generate] Park-first route:", distMiles.toFixed(2), "mi");

        const [elevGain, safetyResult, sceneryPts] = await Promise.all([
          sampleElevation(geoCoords),
          scoreSafety(geoCoords, distMiles),
          scoreScenery(geoCoords),
        ]);

        const breakdown = {
          airQuality: scoreAqi(cityAqi),
          safety: safetyResult.pts,
          scenery: sceneryPts,
          terrain: scoreTerrain(elevGain, difficulty),
        };

        const runScore = computeFinalScore(breakdown, optimizeFor);
        const estMinutes = Math.round(distMiles * (PACE_MAP[difficulty] ?? 10));

        console.log("[run-routes/generate] Park-first scored:", { runScore, breakdown, distMiles: distMiles.toFixed(2), elevGain });

        candidates.push({
          geojson: directions.geojson,
          distance: Math.round(distMiles * 100) / 100,
          elevationGain: elevGain,
          estimatedMinutes: estMinutes,
          runScore,
          scoreBreakdown: breakdown,
          lowQuality: runScore < 40,
        });
      } else {
        console.log("[run-routes/generate] Park-first directions failed, falling back to compass angles");
      }
    }

    // 3b. Generate compass-angle candidates (fewer needed if park-first succeeded)
    for (const angles of candidateAngleSets) {
      // Generate isochrone-constrained, park-biased waypoints (no API calls — pure math)
      const waypoints = generateConstrainedWaypoints(
        startLat, startLng, radius, angles,
        isochrone, parkPoints, optimizeGreen,
      );

      console.log("[run-routes/generate] Angles:", angles, "→ waypoints:", waypoints.length, "of", angles.length);

      if (waypoints.length === 0) {
        console.log("[run-routes/generate] No valid waypoints for angles:", angles);
        continue;
      }

      // Build route coordinates
      const start = { lat: startLat, lng: startLng };
      const routeCoords =
        routeType === "loop"
          ? [start, ...waypoints, start]
          : [start, ...waypoints]; // out-and-back: Mapbox returns A→B, we double it client-side

      const directions = await getDirections(routeCoords);
      if (!directions) {
        console.log("[run-routes/generate] Directions failed for angles:", angles);
        continue;
      }

      const distMiles = directions.distanceMeters / 1609.34;
      const geoCoords = directions.geojson.coordinates as [number, number][];

      console.log("[run-routes/generate] Got route:", distMiles.toFixed(2), "mi,", geoCoords.length, "coords for angles:", angles);

      // Score all 4 factors in parallel
      const [elevGain, safetyResult, sceneryPts] = await Promise.all([
        sampleElevation(geoCoords),
        scoreSafety(geoCoords, distMiles),
        scoreScenery(geoCoords),
      ]);

      const breakdown = {
        airQuality: scoreAqi(cityAqi),
        safety: safetyResult.pts,
        scenery: sceneryPts,
        terrain: scoreTerrain(elevGain, difficulty),
      };

      const runScore = computeFinalScore(breakdown, optimizeFor);
      const estMinutes = Math.round(distMiles * (PACE_MAP[difficulty] ?? 10));

      console.log("[run-routes/generate] Scored route:", { runScore, breakdown, distMiles: distMiles.toFixed(2), elevGain });

      candidates.push({
        geojson: directions.geojson,
        distance: Math.round(distMiles * 100) / 100,
        elevationGain: elevGain,
        estimatedMinutes: estMinutes,
        runScore,
        scoreBreakdown: breakdown,
        lowQuality: runScore < 40,
      });

      // Stop after finding 3 candidates (scoring is expensive)
      if (candidates.length >= 3) break;
    }

    if (candidates.length === 0) {
      console.error("[run-routes/generate] Zero candidates after trying all angle sets");
      return NextResponse.json({
        routes: [],
        error: "Could not generate routes for this location. Try a different starting point or distance.",
      });
    }

    // Return top 2 by score
    candidates.sort((a, b) => b.runScore - a.runScore);
    console.log("[run-routes/generate] Returning", Math.min(2, candidates.length), "routes");
    return NextResponse.json({ routes: candidates.slice(0, 2) });
  } catch (error) {
    console.error("[run-routes/generate] Unhandled error:", error);
    return NextResponse.json(
      { error: "Route generation failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

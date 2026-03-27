import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ============================================================
// CONSTANTS
// ============================================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const EARTH_RADIUS_M = 6371000;
const NYC_BOUNDS = { minLat: 40.49, maxLat: 40.92, minLng: -74.27, maxLng: -73.68 };
const PACE_MIN_PER_MILE: Record<string, number> = { easy: 12, moderate: 9.5, hard: 7.5, beginner: 12, intermediate: 9.5, advanced: 7.5 };
const MAX_MAPBOX_WAYPOINTS = 12;
const API_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

// ============================================================
// TYPES
// ============================================================

interface GenerateRequest {
  lat?: number;
  lng?: number;
  startLat?: number;
  startLng?: number;
  distanceMiles: number;
  routeType: "loop" | "out-and-back" | "out-back";
  difficulty: string;
  preferParks?: boolean;
  optimizeFor?: string[];
  timeOfDay?: string;
}

interface RouteCandidate {
  waypoints: { lat: number; lng: number }[];
  label: string;
}

interface ParkPoint {
  lat: number;
  lng: number;
  name: string;
  dist: number;
  type: "park" | "waterfront";
  area?: number;
}

// ============================================================
// UTILITY: Haversine Distance
// ============================================================

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// UTILITY: Move a point by bearing + distance
// ============================================================

function movePoint(lat: number, lng: number, bearingDeg: number, distanceM: number): { lat: number; lng: number } {
  const R = EARTH_RADIUS_M;
  const d = distanceM / R;
  const brng = bearingDeg * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );
  return { lat: lat2 * 180 / Math.PI, lng: lng2 * 180 / Math.PI };
}

// ============================================================
// UTILITY: Bearing between two points (degrees)
// ============================================================

function bearingBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const la1 = lat1 * Math.PI / 180;
  const la2 = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// ============================================================
// UTILITY: Validate coordinates
// ============================================================

function isValidCoord(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function isInNYC(lat: number, lng: number): boolean {
  return lat >= NYC_BOUNDS.minLat && lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng && lng <= NYC_BOUNDS.maxLng;
}

// ============================================================
// UTILITY: Landmass detection (water avoidance)
// ============================================================

type Landmass = "manhattan" | "brooklyn-queens" | "bronx" | "staten-island";

function getLandmass(lat: number, lng: number): Landmass | null {
  // Manhattan: narrow island
  if (lng >= -74.02 && lng <= -73.93 && lat >= 40.70 && lat <= 40.88) return "manhattan";
  // Bronx: north of Harlem River
  if (lat >= 40.80 && lng >= -73.94 && lng <= -73.74) return "bronx";
  // Staten Island: southwest
  if (lat >= 40.49 && lat <= 40.65 && lng >= -74.26 && lng <= -74.05) return "staten-island";
  // Brooklyn + Queens: western Long Island
  if (lat >= 40.55 && lat <= 40.80 && lng >= -74.05 && lng <= -73.68) return "brooklyn-queens";
  return null;
}

function areSameLandmass(a: Landmass | null, b: Landmass | null): boolean {
  if (a === null || b === null) return true;
  return a === b;
}

function hasWaterCrossing(coordinates: [number, number][]): boolean {
  for (let i = 1; i < coordinates.length; i++) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    const lm1 = getLandmass(lat1, lng1);
    const lm2 = getLandmass(lat2, lng2);
    if (lm1 && lm2 && lm1 !== lm2) {
      const dist = haversineM(lat1, lng1, lat2, lng2);
      if (dist > 800) {
        console.log(`[run-routes/water-check] Route crosses water: ${lm1} → ${lm2}, gap ${Math.round(dist)}m`);
        return true;
      }
    }
  }
  return false;
}

// ============================================================
// UTILITY: Fetch with timeout + retry
// ============================================================

async function fetchWithRetry(url: string, tag: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
      if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        console.error(`[run-routes/${tag}] HTTP ${res.status} (attempt ${attempt + 1}): ${body.substring(0, 200)}`);
        if (attempt === retries) return null;
        continue;
      }
      return await res.json();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[run-routes/${tag}] Fetch error (attempt ${attempt + 1}): ${msg}`);
      if (attempt === retries) return null;
    }
  }
  return null;
}

// ============================================================
// NYC OPEN DATA: Parks + Waterfront
// ============================================================

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
      const lat = sumLat / n, lng = sumLng / n;
      if (isValidCoord(lat, lng)) return { lat, lng };
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

async function fetchNearbyParksAndWaterfront(
  lat: number, lng: number, radiusMeters: number,
): Promise<{ parks: ParkPoint[]; waterfront: ParkPoint[] }> {
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

  const parks: ParkPoint[] = (parksRaw || [])
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

  const waterfront: ParkPoint[] = (waterfrontRaw || [])
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

  console.log(`[run-routes/parks] Found ${parks.length} parks, ${waterfront.length} waterfront within ${radius}m`);
  return { parks, waterfront };
}

// ============================================================
// WAYPOINT CANDIDATE GENERATION
// ============================================================

function generateCandidates(
  lat: number, lng: number, distanceMiles: number,
  routeType: string, parks: ParkPoint[], waterfront: ParkPoint[],
  preferParks: boolean,
): RouteCandidate[] {
  const candidates: RouteCandidate[] = [];
  const legDistanceM = (distanceMiles * 1609.34) / 3;

  // Park-biased candidates
  if (preferParks && parks.length > 0) {
    const bestPark = parks[0];
    const parkBearing = bearingBetween(lat, lng, bestPark.lat, bestPark.lng);
    const returnBearing = (parkBearing + 120 + Math.random() * 60) % 360;
    const returnPoint = movePoint(lat, lng, returnBearing, legDistanceM * 0.7);

    candidates.push({
      waypoints: [{ lat: bestPark.lat, lng: bestPark.lng }, returnPoint],
      label: `park-${bestPark.name.substring(0, 20)}`,
    });

    // Park + waterfront combo
    if (waterfront.length > 0) {
      const bestWF = waterfront[0];
      const angleDiff = Math.abs(
        bearingBetween(lat, lng, bestPark.lat, bestPark.lng) -
        bearingBetween(lat, lng, bestWF.lat, bestWF.lng),
      );
      const normalized = angleDiff > 180 ? 360 - angleDiff : angleDiff;
      if (normalized > 30) {
        candidates.push({
          waypoints: [{ lat: bestPark.lat, lng: bestPark.lng }, { lat: bestWF.lat, lng: bestWF.lng }],
          label: "park-waterfront-combo",
        });
      }
    }

    // Two parks
    if (parks.length >= 2 && haversineM(bestPark.lat, bestPark.lng, parks[1].lat, parks[1].lng) > 300) {
      candidates.push({
        waypoints: [{ lat: bestPark.lat, lng: bestPark.lng }, { lat: parks[1].lat, lng: parks[1].lng }],
        label: "two-parks",
      });
    }

    // Through-park (past center)
    if (bestPark.dist < legDistanceM * 2) {
      const throughBearing = bearingBetween(lat, lng, bestPark.lat, bestPark.lng);
      const throughPoint = movePoint(bestPark.lat, bestPark.lng, throughBearing, 300);
      const returnBearing2 = (throughBearing + 150) % 360;
      const returnPoint2 = movePoint(lat, lng, returnBearing2, legDistanceM * 0.6);
      candidates.push({
        waypoints: [throughPoint, returnPoint2],
        label: `through-park`,
      });
    }
  }

  // Waterfront-only
  if (preferParks && waterfront.length > 0 && candidates.length < 4) {
    if (waterfront.length >= 2) {
      candidates.push({
        waypoints: [{ lat: waterfront[0].lat, lng: waterfront[0].lng }, { lat: waterfront[1].lat, lng: waterfront[1].lng }],
        label: "waterfront-path",
      });
    } else {
      const wfBearing = bearingBetween(lat, lng, waterfront[0].lat, waterfront[0].lng);
      const retPt = movePoint(lat, lng, (wfBearing + 140) % 360, legDistanceM * 0.7);
      candidates.push({
        waypoints: [{ lat: waterfront[0].lat, lng: waterfront[0].lng }, retPt],
        label: "waterfront-loop",
      });
    }
  }

  // Compass-angle fallbacks
  const anglesSets = [[0, 120, 240], [45, 165, 285], [0, 90, 180, 270]];
  for (const angles of anglesSets) {
    if (candidates.length >= 5) break;
    const wps = angles.map((a) => {
      const dist = legDistanceM * (0.7 + Math.random() * 0.3);
      return movePoint(lat, lng, a, dist);
    });
    if (wps.every((wp) => isValidCoord(wp.lat, wp.lng) && isInNYC(wp.lat, wp.lng))) {
      candidates.push({ waypoints: wps, label: `compass-${angles.length}pt` });
    }
  }

  // Out-and-back
  if (routeType === "out-and-back" || routeType === "out-back") {
    if (preferParks && parks.length > 0) {
      candidates.push({ waypoints: [{ lat: parks[0].lat, lng: parks[0].lng }], label: "out-back-park" });
    }
    const randomBearing = Math.random() * 360;
    const endPt = movePoint(lat, lng, randomBearing, (distanceMiles * 1609.34) / 2);
    if (isValidCoord(endPt.lat, endPt.lng)) {
      candidates.push({ waypoints: [endPt], label: "out-back-compass" });
    }
  }

  console.log(`[run-routes/candidates] Generated ${candidates.length}: ${candidates.map((c) => c.label).join(", ")}`);
  return candidates;
}

// ============================================================
// MAPBOX ROUTE FETCHING (Optimization API + Directions fallback)
// ============================================================

async function fetchRoute(
  startLat: number, startLng: number,
  waypoints: { lat: number; lng: number }[],
  routeType: string, label: string,
): Promise<{ geojson: any; distanceMi: number; durationSec: number; legs: any[] } | null> {
  if (!MAPBOX_TOKEN) return null;

  const allPoints = [{ lat: startLat, lng: startLng }, ...waypoints];
  // Validate every coordinate
  for (const pt of allPoints) {
    if (!isValidCoord(pt.lat, pt.lng) || pt.lat < 40 || pt.lat > 41 || pt.lng > -73 || pt.lng < -75) {
      console.error(`[run-routes/mapbox/${label}] Bad coord: ${pt.lat},${pt.lng}`);
      return null;
    }
  }

  // CRITICAL: Mapbox uses lng,lat order
  const coordString = allPoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const isLoop = routeType === "loop";

  // Attempt 1: Optimization API (best for loops)
  if (isLoop && allPoints.length >= 2 && allPoints.length <= MAX_MAPBOX_WAYPOINTS) {
    const optUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/walking/${coordString}?roundtrip=true&source=first&destination=first&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
    console.log(`[run-routes/mapbox/${label}] Trying Optimization API (${allPoints.length} pts)`);
    const optData = await fetchWithRetry(optUrl, `opt-${label}`);
    if (optData?.trips?.[0]) {
      const trip = optData.trips[0];
      const distMi = (trip.distance || 0) / 1609.34;
      console.log(`[run-routes/mapbox/${label}] Optimization OK: ${distMi.toFixed(2)}mi`);
      return { geojson: trip.geometry, distanceMi: distMi, durationSec: trip.duration || 0, legs: trip.legs || [] };
    }
    console.warn(`[run-routes/mapbox/${label}] Optimization failed, trying Directions`);
  }

  // Attempt 2: Directions API
  let dirCoords = coordString;
  if (isLoop) dirCoords += `;${startLng},${startLat}`;
  const dirUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${dirCoords}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
  console.log(`[run-routes/mapbox/${label}] Trying Directions API`);
  const dirData = await fetchWithRetry(dirUrl, `dir-${label}`);
  if (dirData?.routes?.[0]) {
    const route = dirData.routes[0];
    const distMi = (route.distance || 0) / 1609.34;
    console.log(`[run-routes/mapbox/${label}] Directions OK: ${distMi.toFixed(2)}mi`);
    return { geojson: route.geometry, distanceMi: distMi, durationSec: route.duration || 0, legs: route.legs || [] };
  }

  // Attempt 3: Simplified 2-point
  if (allPoints.length > 2) {
    console.warn(`[run-routes/mapbox/${label}] Trying simplified 2-point`);
    const simpleCoord = `${startLng},${startLat};${allPoints[1].lng},${allPoints[1].lat};${startLng},${startLat}`;
    const simpleUrl = `https://api.mapbox.com/directions/v5/mapbox/walking/${simpleCoord}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
    const simpleData = await fetchWithRetry(simpleUrl, `simple-${label}`);
    if (simpleData?.routes?.[0]) {
      const route = simpleData.routes[0];
      const distMi = (route.distance || 0) / 1609.34;
      console.log(`[run-routes/mapbox/${label}] Simplified OK: ${distMi.toFixed(2)}mi`);
      return { geojson: route.geometry, distanceMi: distMi, durationSec: route.duration || 0, legs: route.legs || [] };
    }
  }

  console.error(`[run-routes/mapbox/${label}] All attempts failed`);
  return null;
}

// ============================================================
// DISTANCE CALIBRATION
// ============================================================

async function fetchCalibratedRoute(
  startLat: number, startLng: number,
  candidate: RouteCandidate, targetMiles: number, routeType: string,
): Promise<{ geojson: any; distanceMi: number; durationSec: number; legs: any[] } | null> {
  const TOLERANCE = 0.35;
  let currentWaypoints = [...candidate.waypoints];
  let bestResult: { geojson: any; distanceMi: number; durationSec: number; legs: any[] } | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await fetchRoute(startLat, startLng, currentWaypoints, routeType, `${candidate.label}-cal${attempt}`);
    if (!result) break;

    const ratio = result.distanceMi / targetMiles;
    if (Math.abs(ratio - 1) <= TOLERANCE) return result;

    if (!bestResult || Math.abs(result.distanceMi - targetMiles) < Math.abs(bestResult.distanceMi - targetMiles)) {
      bestResult = result;
    }

    const scaleFactor = 1 / ratio;
    console.log(`[run-routes/calibrate/${candidate.label}] Got ${result.distanceMi.toFixed(2)}mi, target ${targetMiles}mi, scale ${scaleFactor.toFixed(2)}`);

    currentWaypoints = currentWaypoints.map((wp) => {
      const bearing = bearingBetween(startLat, startLng, wp.lat, wp.lng);
      const currentDist = haversineM(startLat, startLng, wp.lat, wp.lng);
      return movePoint(startLat, startLng, bearing, currentDist * Math.max(0.3, Math.min(scaleFactor, 2.0)));
    });
  }
  return bestResult;
}

// ============================================================
// SCORING
// ============================================================

async function scoreAirQuality(): Promise<number> {
  const data = await fetchWithRetry(
    "https://data.cityofnewyork.us/resource/c3uy-2p5r.json?$limit=1&$order=start_date DESC",
    "aqi", 1,
  );
  if (data?.[0]?.mean_mcg_m3) {
    const val = parseInt(data[0].mean_mcg_m3);
    return Math.round(25 * Math.max(0.2, 1 - val / 180));
  }
  // Also try AirNow if available
  const key = process.env.AIRNOW_API_KEY;
  if (key) {
    const airData = await fetchWithRetry(
      `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=10001&distance=25&API_KEY=${key}`,
      "airnow", 1,
    );
    if (airData?.[0]?.AQI) {
      const aqi = airData[0].AQI;
      return Math.round(Math.max(0, Math.min(25, 25 - aqi / 4)));
    }
  }
  return 18; // NYC average fallback
}

async function scoreSafety(routeCoords: [number, number][], distMi: number): Promise<number> {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lng, lat] of routeCoords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const radius = Math.max(200, haversineM(minLat, minLng, maxLat, maxLng) / 2 + 100);

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const dateStr = twoYearsAgo.toISOString().split("T")[0];

  const data = await fetchWithRetry(
    `https://data.cityofnewyork.us/resource/h9gi-nx95.json?$where=within_circle(location,${centerLat},${centerLng},${radius}) AND crash_date>'${dateStr}' AND (number_of_pedestrians_injured>0 OR number_of_cyclist_injured>0)&$select=count(*) as cnt&$limit=1`,
    "safety", 1,
  );

  const crashes = parseInt(data?.[0]?.cnt ?? "0", 10);
  const perMile = distMi > 0 ? crashes / distMi : crashes;
  const pts = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(perMile / 300, 1)))));
  console.log(`[run-routes/safety] ${crashes} crashes (${Math.round(perMile)}/mi) → ${pts}/25`);
  return pts;
}

// Major NYC parks — bounding boxes for parks where point-based detection fails
const MAJOR_PARKS: { name: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
  { name: "Central Park", minLat: 40.764, maxLat: 40.800, minLng: -73.981, maxLng: -73.949 },
  { name: "Prospect Park", minLat: 40.655, maxLat: 40.674, minLng: -73.974, maxLng: -73.958 },
  { name: "Flushing Meadows", minLat: 40.736, maxLat: 40.754, minLng: -73.851, maxLng: -73.833 },
  { name: "Van Cortlandt Park", minLat: 40.884, maxLat: 40.906, minLng: -73.898, maxLng: -73.876 },
  { name: "Pelham Bay Park", minLat: 40.856, maxLat: 40.878, minLng: -73.815, maxLng: -73.785 },
  { name: "Forest Park", minLat: 40.695, maxLat: 40.714, minLng: -73.860, maxLng: -73.830 },
  { name: "Riverside Park", minLat: 40.787, maxLat: 40.828, minLng: -73.977, maxLng: -73.968 },
  { name: "Inwood Hill Park", minLat: 40.868, maxLat: 40.878, minLng: -73.930, maxLng: -73.918 },
  { name: "Astoria Park", minLat: 40.773, maxLat: 40.782, minLng: -73.928, maxLng: -73.918 },
  { name: "DUMBO/Brooklyn Bridge Park", minLat: 40.696, maxLat: 40.704, minLng: -73.999, maxLng: -73.989 },
  { name: "Hudson River Greenway", minLat: 40.709, maxLat: 40.820, minLng: -74.016, maxLng: -74.008 },
  { name: "East River Park", minLat: 40.710, maxLat: 40.733, minLng: -73.978, maxLng: -73.972 },
  { name: "Governors Island", minLat: 40.687, maxLat: 40.695, minLng: -74.022, maxLng: -74.012 },
  { name: "Randall's Island", minLat: 40.787, maxLat: 40.804, minLng: -73.929, maxLng: -73.914 },
  { name: "The High Line", minLat: 40.739, maxLat: 40.754, minLng: -74.008, maxLng: -74.004 },
  { name: "Battery Park / Battery Park City", minLat: 40.700, maxLat: 40.718, minLng: -74.020, maxLng: -74.008 },
  { name: "Washington Square Park", minLat: 40.729, maxLat: 40.733, minLng: -73.999, maxLng: -73.995 },
  { name: "Union Square Park", minLat: 40.734, maxLat: 40.738, minLng: -73.992, maxLng: -73.988 },
  { name: "McCarren Park", minLat: 40.719, maxLat: 40.724, minLng: -73.953, maxLng: -73.947 },
  { name: "Marine Park", minLat: 40.594, maxLat: 40.613, minLng: -73.930, maxLng: -73.910 },
];

// Major NYC park centroids — fallback detection for routes near large parks
// where bounding-box or API point-based detection may miss
const MAJOR_PARK_CENTROIDS = [
  { name: "Central Park",          lat: 40.7829, lng: -73.9654 },
  { name: "Prospect Park",         lat: 40.6602, lng: -73.9690 },
  { name: "Flushing Meadows",      lat: 40.7400, lng: -73.8408 },
  { name: "Van Cortlandt Park",    lat: 40.8972, lng: -73.8862 },
  { name: "Riverside Park",        lat: 40.8015, lng: -73.9714 },
  { name: "Inwood Hill Park",      lat: 40.8677, lng: -73.9212 },
  { name: "Randall's Island",      lat: 40.7934, lng: -73.9213 },
  { name: "Hudson River Greenway", lat: 40.7580, lng: -74.0100 },
];

/** ~500m proximity threshold in degrees (rough, works at NYC latitude) */
const PARK_CENTROID_THRESHOLD = 0.005;

function isNearMajorParkCentroid(lat: number, lng: number): boolean {
  return MAJOR_PARK_CENTROIDS.some(
    (p) => Math.abs(lat - p.lat) < PARK_CENTROID_THRESHOLD && Math.abs(lng - p.lng) < PARK_CENTROID_THRESHOLD,
  );
}

function isInMajorPark(lat: number, lng: number): boolean {
  return MAJOR_PARKS.some(
    (p) => lat >= p.minLat && lat <= p.maxLat && lng >= p.minLng && lng <= p.maxLng,
  ) || isNearMajorParkCentroid(lat, lng);
}

function scoreScenery(
  routeCoords: [number, number][], parks: ParkPoint[], waterfront: ParkPoint[],
): { score: number; parkPercent: number; waterPercent: number } {
  const step = Math.max(1, Math.floor(routeCoords.length / 15));
  let parkHits = 0, waterHits = 0, total = 0;

  for (let i = 0; i < routeCoords.length; i += step) {
    const [lng, lat] = routeCoords[i];
    total++;
    if (parks.some((p) => haversineM(lat, lng, p.lat, p.lng) < 300) || isInMajorPark(lat, lng)) parkHits++;
    if (waterfront.some((w) => haversineM(lat, lng, w.lat, w.lng) < 250)) waterHits++;
  }

  if (total === 0) return { score: 0, parkPercent: 0, waterPercent: 0 };
  const parkPct = Math.round((parkHits / total) * 100);
  const waterPct = Math.round((waterHits / total) * 100);
  const score = Math.min(Math.round(15 * (parkHits / total)) + Math.round(10 * (waterHits / total)), 25);
  console.log(`[run-routes/scenery] ${parkPct}% park, ${waterPct}% water → ${score}/25`);
  return { score, parkPercent: parkPct, waterPercent: waterPct };
}

async function scoreTerrain(routeCoords: [number, number][], difficulty: string): Promise<{ score: number; elevGain: number }> {
  const step = Math.max(1, Math.floor(routeCoords.length / 6));
  const elevations: number[] = [];

  const samples: [number, number][] = [];
  for (let i = 0; i < routeCoords.length; i += step) samples.push(routeCoords[i]);

  await Promise.all(
    samples.map(async ([lng, lat]) => {
      const data = await fetchWithRetry(
        `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&units=Feet&wkid=4326`,
        "elevation", 1,
      );
      if (data?.value !== undefined) {
        const v = parseFloat(data.value);
        if (!isNaN(v) && v > -100) elevations.push(v);
      }
    }),
  );

  if (elevations.length < 2) return { score: 15, elevGain: 0 };

  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) gain += diff;
  }

  // Score based on difficulty preference
  let score: number;
  if (difficulty === "easy" || difficulty === "beginner") {
    score = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(gain / 500, 1)))));
  } else if (difficulty === "hard" || difficulty === "advanced") {
    score = Math.round(Math.max(0, Math.min(25, 25 * Math.min(gain / 500, 1))));
  } else {
    score = gain <= 20 ? 20 : gain <= 80 ? 25 : gain <= 200 ? 20 : 15;
  }

  console.log(`[run-routes/terrain] Gain: ${Math.round(gain)}ft → ${score}/25`);
  return { score, elevGain: Math.round(gain) };
}

// ============================================================
// EXPORT URLS (Google Maps / Apple Maps)
// ============================================================

function buildExportUrls(
  startLat: number, startLng: number,
  waypoints: { lat: number; lng: number }[],
  routeType: string,
): { googleMaps: string; appleMaps: string } {
  const googleParts = [
    `${startLat},${startLng}`,
    ...waypoints.map((wp) => `${wp.lat},${wp.lng}`),
  ];
  if (routeType === "loop") googleParts.push(`${startLat},${startLng}`);
  const googleMaps = `https://www.google.com/maps/dir/${googleParts.join("/")}/@${startLat},${startLng},14z/data=!4m2!4m1!3e2`;

  const dest = waypoints.length > 0
    ? `${waypoints[0].lat},${waypoints[0].lng}`
    : `${startLat},${startLng}`;
  const appleMaps = `https://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${dest}&dirflg=w`;

  return { googleMaps, appleMaps };
}

// ============================================================
// TURN-BY-TURN DIRECTIONS
// ============================================================

interface DirectionStep {
  instruction: string;
  distance: string;
  streetName: string;
}

function parseDirections(legs: any[]): DirectionStep[] {
  const steps: DirectionStep[] = [];
  if (!legs) return steps;
  for (const leg of legs) {
    if (!leg.steps) continue;
    for (const step of leg.steps) {
      if (!step.maneuver?.instruction) continue;
      const distM = step.distance || 0;
      const distMi = distM / 1609.34;
      const distStr = distMi >= 0.1 ? `${distMi.toFixed(1)} mi` : `${Math.round(distM * 3.281)} ft`;
      steps.push({
        instruction: step.maneuver.instruction,
        distance: distStr,
        streetName: step.name || "",
      });
    }
  }
  return steps;
}

function generateRouteSummary(
  directions: DirectionStep[], distance: number, durationMin: number,
  sceneryDetail: { parkPercent: number; waterPercent: number },
): string {
  if (directions.length === 0) return "";
  const streets = Array.from(new Set(
    directions.map((d) => d.streetName).filter((s) => s && s.toLowerCase() !== "unnamed road" && s.trim() !== ""),
  ));
  const parts: string[] = [];
  parts.push(`This ${distance.toFixed(1)}-mile route takes about ${durationMin} minutes at your pace.`);
  if (streets.length >= 3) {
    parts.push(`You'll run along ${streets.slice(0, 3).join(", ")}, and more.`);
  } else if (streets.length > 0) {
    parts.push(`You'll run along ${streets.join(" and ")}.`);
  }
  if (sceneryDetail.parkPercent > 30) parts.push(`About ${sceneryDetail.parkPercent}% of the route passes through parks.`);
  if (sceneryDetail.waterPercent > 20) parts.push(`${sceneryDetail.waterPercent}% runs along the waterfront.`);
  return parts.join(" ");
}

// ============================================================
// MAIN POST HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[run-routes/generate] === New request ===");

  try {
    const body = await request.json() as GenerateRequest;

    // Support both old (startLat/startLng) and new (lat/lng) field names
    const lat = body.lat ?? body.startLat;
    const lng = body.lng ?? body.startLng;
    const dist = Number(body.distanceMiles);
    const routeType = body.routeType === "out-back" ? "out-and-back" : (body.routeType || "loop");
    const difficulty = body.difficulty || "moderate";
    const preferParks = body.preferParks !== false;

    console.log(`[run-routes/generate] lat=${lat}, lng=${lng}, dist=${dist}mi, type=${routeType}, parks=${preferParks}`);

    if (!lat || !lng || !isValidCoord(lat, lng)) {
      return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
    }
    if (!isInNYC(lat, lng)) {
      return NextResponse.json({ error: "Smart Run Routes is currently available in NYC only." }, { status: 400 });
    }
    if (!dist || dist < 0.5 || dist > 26.2) {
      return NextResponse.json({ error: "Distance must be 0.5–26.2 miles." }, { status: 400 });
    }
    if (!MAPBOX_TOKEN) {
      console.error("[run-routes/generate] MAPBOX_TOKEN missing!");
      return NextResponse.json({ error: "Route service temporarily unavailable." }, { status: 503 });
    }

    // Fetch parks + waterfront
    const radiusMeters = Math.round(dist * 800);
    const { parks, waterfront } = await fetchNearbyParksAndWaterfront(lat, lng, radiusMeters);

    // Generate candidates
    const candidates = generateCandidates(lat, lng, dist, routeType, parks, waterfront, preferParks);

    // Water avoidance: filter waypoints to same landmass as start
    const startLandmass = getLandmass(lat, lng);
    console.log(`[run-routes/water-check] Start landmass: ${startLandmass}`);
    for (const candidate of candidates) {
      candidate.waypoints = candidate.waypoints.filter((wp) => {
        const wpLandmass = getLandmass(wp.lat, wp.lng);
        const same = areSameLandmass(startLandmass, wpLandmass);
        if (!same) {
          console.log(`[run-routes/water-check] Rejected waypoint on ${wpLandmass} (start is ${startLandmass}): ${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`);
        }
        return same;
      });
    }
    const validCandidates = candidates.filter((c) => c.waypoints.length > 0);

    if (validCandidates.length === 0) {
      return NextResponse.json({ error: "Could not plan routes. Try a different starting point." }, { status: 500 });
    }

    // Fetch routes in parallel
    const routeResults = (
      await Promise.all(
        validCandidates.map((c) =>
          fetchCalibratedRoute(lat, lng, c, dist, routeType)
            .then((r) => (r ? { ...r, candidate: c } : null)),
        ),
      )
    ).filter((r): r is NonNullable<typeof r> => {
      if (!r) return false;
      const coords: [number, number][] = r.geojson?.coordinates || [];
      if (hasWaterCrossing(coords)) {
        console.log(`[run-routes/water-check] Discarding route with water crossing: ${r.candidate.label}`);
        return false;
      }
      return true;
    });

    console.log(`[run-routes/generate] ${routeResults.length}/${candidates.length} candidates produced routes`);

    if (routeResults.length === 0) {
      return NextResponse.json({ error: "Route generation failed. Please try again." }, { status: 500 });
    }

    // Score all routes
    const aqScore = await scoreAirQuality();

    const scored = await Promise.all(
      routeResults.map(async (result) => {
        const coords: [number, number][] = result.geojson.coordinates || [];
        const [safety, terrainResult] = await Promise.all([
          scoreSafety(coords, result.distanceMi),
          scoreTerrain(coords, difficulty),
        ]);
        const sceneryResult = scoreScenery(coords, parks, waterfront);
        const pace = PACE_MIN_PER_MILE[difficulty] || 9.5;

        const breakdown = {
          airQuality: aqScore,
          safety,
          scenery: sceneryResult.score,
          terrain: terrainResult.score,
        };
        // Distance accuracy penalty: routes far from target get penalized heavily
        const distError = Math.abs(result.distanceMi - dist) / dist;
        // 0% error = 0 penalty, 10% = -5, 20% = -10, 30% = -15, 40%+ = -20
        const distPenalty = Math.round(Math.min(distError * 50, 20));
        const rawScore = breakdown.airQuality + breakdown.safety + breakdown.scenery + breakdown.terrain;
        const runScore = Math.max(0, rawScore - distPenalty);

        const directions = parseDirections(result.legs);
        const exportUrls = buildExportUrls(lat, lng, result.candidate.waypoints, routeType);
        const summary = generateRouteSummary(directions, Math.round(result.distanceMi * 100) / 100, Math.round(result.distanceMi * pace), sceneryResult);

        return {
          geojson: result.geojson,
          distance: Math.round(result.distanceMi * 100) / 100,
          estimatedMinutes: Math.round(result.distanceMi * pace),
          elevationGain: terrainResult.elevGain,
          runScore,
          scoreBreakdown: breakdown,
          sceneryDetail: { parkPercent: sceneryResult.parkPercent, waterPercent: sceneryResult.waterPercent },
          directions,
          summary,
          exportUrls,
          distancePenalty: distPenalty,
          lowQuality: runScore < 40,
          candidateLabel: result.candidate.label,
          waypoints: result.candidate.waypoints,
        };
      }),
    );

    // Sort and return top 3
    scored.sort((a, b) => b.runScore - a.runScore);
    const topRoutes = scored.slice(0, 3);

    const elapsed = Date.now() - startTime;
    console.log(`[run-routes/generate] Returning ${topRoutes.length} routes. Best: ${topRoutes[0]?.runScore}/100 (${topRoutes[0]?.candidateLabel}). ${elapsed}ms`);

    return NextResponse.json({
      routes: topRoutes.map((r, i) => ({
        ...r,
        id: `route-${i + 1}`,
        rank: i + 1,
        label: i === 0 ? "Best Route" : i === 1 ? "Alternative" : "Explorer",
        isTopPick: i === 0,
      })),
      meta: {
        startLat: lat,
        startLng: lng,
        targetDistance: dist,
        routeType,
        preferParks,
        nearbyParks: parks.length,
        nearbyWaterfront: waterfront.length,
        candidatesGenerated: candidates.length,
        routesReturned: topRoutes.length,
        processingMs: elapsed,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[run-routes/generate] UNHANDLED:", msg);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

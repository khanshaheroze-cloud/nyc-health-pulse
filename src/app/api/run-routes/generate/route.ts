import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface GenerateRequest {
  startLat: number;
  startLng: number;
  distanceMiles: number;
  routeType: "loop" | "out-back";
  difficulty: "beginner" | "intermediate" | "advanced";
  optimizeFor: string[];
}

interface RouteCandidate {
  geojson: GeoJSON.LineString;
  distance: number;
  elevationGain: number;
  estimatedMinutes: number;
  runScore: number;
  scoreBreakdown: { airQuality: number; safety: number; greenSpace: number; terrain: number };
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
  const minutes = Math.min(60, Math.round((distanceMiles * 10) / 2));
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

// ── Greenway data: fetch nearby greenways/bike paths ──────────────────

interface GreenwayPoint { lat: number; lng: number }

async function fetchNearbyGreenways(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<GreenwayPoint[]> {
  try {
    const url = `https://data.cityofnewyork.us/resource/7vsa-caz7.json?$where=within_circle(the_geom,${lat},${lng},${radiusMeters})&$limit=50&$select=the_geom`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error("[run-routes/generate] Greenways fetch failed:", res.status);
      return [];
    }
    const data = await res.json();
    const points: GreenwayPoint[] = [];
    for (const row of data) {
      const geom = row.the_geom;
      if (!geom) continue;
      const coords =
        geom.type === "MultiLineString"
          ? geom.coordinates.flat()
          : geom.type === "LineString"
            ? geom.coordinates
            : [];
      for (const c of coords) {
        if (Array.isArray(c) && c.length >= 2) {
          points.push({ lat: c[1], lng: c[0] });
        }
      }
    }
    return points;
  } catch (error) {
    console.error("[run-routes/generate] Greenways error:", error);
    return [];
  }
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

/** Find nearest greenway point to a given location */
function nearestGreenway(
  lat: number,
  lng: number,
  greenways: GreenwayPoint[],
  maxDistDeg: number,
): GreenwayPoint | null {
  let best: GreenwayPoint | null = null;
  let bestDist = Infinity;
  for (const gw of greenways) {
    const d = Math.sqrt((gw.lat - lat) ** 2 + (gw.lng - lng) ** 2);
    if (d < bestDist && d < maxDistDeg) {
      bestDist = d;
      best = gw;
    }
  }
  return best;
}

/**
 * Generate waypoints constrained to isochrone + biased toward greenways.
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
  greenways: GreenwayPoint[],
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
      // If still outside after two shifts, skip this waypoint
      if (!pointInPolygon(candidate.lat, candidate.lng, isochrone)) {
        continue;
      }
    }

    // 2. Bias toward greenways if available
    if (greenways.length > 0) {
      const maxBiasDist = radiusMiles / 69 * 0.5;
      const nearest = nearestGreenway(candidate.lat, candidate.lng, greenways, maxBiasDist);
      if (nearest) {
        const blend = optimizeGreen ? 0.6 : 0.4;
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
 * Street Safety scoring — per-mile crash density
 * Scale: 0 crashes/mi = 25, 200+ crashes/mi = 0
 */
async function scoreSafety(
  coords: [number, number][],
  routeDistanceMiles: number,
): Promise<{ pts: number; crashCount: number }> {
  const samples = sampleRoutePoints(coords, 6);
  let totalCrashes = 0;

  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const dateStr = threeYearsAgo.toISOString().split("T")[0];

  await Promise.all(
    samples.map(async ([lng, lat]) => {
      try {
        const url = `https://data.cityofnewyork.us/resource/h9gi-nx95.json?$where=within_circle(location,${lat},${lng},100) AND crash_date>'${dateStr}' AND (number_of_pedestrians_injured>0 OR number_of_pedestrians_killed>0 OR number_of_cyclist_injured>0 OR number_of_cyclist_killed>0)&$select=count(*) as cnt&$limit=1`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(6000),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          totalCrashes += parseInt(data[0]?.cnt ?? "0", 10);
        }
      } catch (error) {
        console.error("[run-routes/generate] Safety query failed:", error instanceof Error ? error.message : error);
      }
    }),
  );

  const crashesPerMile = routeDistanceMiles > 0 ? totalCrashes / routeDistanceMiles : totalCrashes;
  const pts = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(crashesPerMile / 200, 1)))));

  return { pts, crashCount: totalCrashes };
}

/**
 * Green Space scoring — parks + greenways
 * Samples points along route, checks proximity to parks AND greenways
 */
async function scoreGreenSpace(
  coords: [number, number][],
): Promise<number> {
  const samples = sampleRoutePoints(coords, 8);
  let nearGreen = 0;

  await Promise.all(
    samples.map(async ([lng, lat]) => {
      let found = false;

      // Check parks (200m radius)
      try {
        const parkUrl = `https://data.cityofnewyork.us/resource/enfk-uwib.json?$where=within_circle(the_geom,${lat},${lng},200)&$limit=1&$select=gispropnum`;
        const res = await fetch(parkUrl, {
          signal: AbortSignal.timeout(5000),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) found = true;
        }
      } catch (error) {
        console.error("[run-routes/generate] Parks query failed:", error instanceof Error ? error.message : error);
      }

      // Check greenways (150m radius) if not already near a park
      if (!found) {
        try {
          const gwUrl = `https://data.cityofnewyork.us/resource/7vsa-caz7.json?$where=within_circle(the_geom,${lat},${lng},150)&$limit=1&$select=ft_facilit`;
          const res = await fetch(gwUrl, {
            signal: AbortSignal.timeout(5000),
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.length > 0) found = true;
          }
        } catch (error) {
          console.error("[run-routes/generate] Greenways score query failed:", error instanceof Error ? error.message : error);
        }
      }

      if (found) nearGreen++;
    }),
  );

  return samples.length > 0 ? Math.round(25 * (nearGreen / samples.length)) : 0;
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
  const weights = { airQuality: 1, safety: 1, greenSpace: 1, terrain: 1 };
  for (const pref of optimizeFor) {
    if (pref === "air") weights.airQuality = 2;
    if (pref === "safety") weights.safety = 2;
    if (pref === "green") weights.greenSpace = 2;
    if (pref === "flat" || pref === "scenic") weights.terrain = 2;
  }
  const totalWeight = weights.airQuality + weights.safety + weights.greenSpace + weights.terrain;
  const weighted =
    (breakdown.airQuality * weights.airQuality +
      breakdown.safety * weights.safety +
      breakdown.greenSpace * weights.greenSpace +
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

  const { startLat, startLng, distanceMiles, routeType, difficulty, optimizeFor } = body;
  console.log("[run-routes/generate] Request:", { startLat, startLng, distanceMiles, routeType, difficulty });

  if (!startLat || !startLng || !distanceMiles) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // 1. Fetch AQI, isochrone, and nearby greenways in parallel
    const [cityAqi, isochrone, greenways] = await Promise.all([
      fetchCityAqi(),
      getIsochrone(startLat, startLng, distanceMiles),
      fetchNearbyGreenways(startLat, startLng, Math.min(3000, distanceMiles * 400)),
    ]);

    console.log("[run-routes/generate] Parallel fetch done — AQI:", cityAqi, "isochrone:", !!isochrone, "greenways:", greenways.length);

    const radius = distanceMiles / (2 * Math.PI);
    const optimizeGreen = optimizeFor.includes("green");

    // 2. Define candidate angle sets
    const candidateAngleSets =
      routeType === "loop"
        ? [
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

    // 3. Generate and score candidates
    const candidates: RouteCandidate[] = [];

    for (const angles of candidateAngleSets) {
      // Generate isochrone-constrained, greenway-biased waypoints (no API calls — pure math)
      const waypoints = generateConstrainedWaypoints(
        startLat, startLng, radius, angles,
        isochrone, greenways, optimizeGreen,
      );

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
      const [elevGain, safetyResult, greenPts] = await Promise.all([
        sampleElevation(geoCoords),
        scoreSafety(geoCoords, distMiles),
        scoreGreenSpace(geoCoords),
      ]);

      const breakdown = {
        airQuality: scoreAqi(cityAqi),
        safety: safetyResult.pts,
        greenSpace: greenPts,
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

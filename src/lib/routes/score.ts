import { haversineM, MAJOR_PARKS, MAJOR_PARK_CENTROIDS, PARK_CENTROID_THRESHOLD_DEG, PACE_MIN_PER_MILE } from "@/lib/geo";
import { fetchWithRetry } from "@/lib/mapbox/client";
import { scoreGeneratedRoute } from "@/lib/runScoring";
import type { ScoreBreakdown, SceneryDetail, ParkPoint, DirectionStep, OptimizeFactor, ConstructedRoute, ScoredRoute, Coordinate } from "./types";

function isNearMajorParkCentroid(lat: number, lng: number): boolean {
  return MAJOR_PARK_CENTROIDS.some(
    (p) => Math.abs(lat - p.lat) < PARK_CENTROID_THRESHOLD_DEG && Math.abs(lng - p.lng) < PARK_CENTROID_THRESHOLD_DEG,
  );
}

function isInMajorPark(lat: number, lng: number): boolean {
  return MAJOR_PARKS.some(
    (p) => lat >= p.minLat && lat <= p.maxLat && lng >= p.minLng && lng <= p.maxLng,
  ) || isNearMajorParkCentroid(lat, lng);
}

export async function scoreAirQuality(): Promise<number> {
  const data = await fetchWithRetry(
    "https://data.cityofnewyork.us/resource/c3uy-2p5r.json?$limit=1&$order=start_date DESC",
    "aqi", 1,
  );
  if (data?.[0]?.mean_mcg_m3) {
    const val = parseInt(data[0].mean_mcg_m3);
    return Math.round(25 * Math.max(0.2, 1 - val / 180));
  }
  const key = process.env.AIRNOW_API_KEY;
  if (key) {
    const airData = await fetchWithRetry(
      `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=10001&distance=25&API_KEY=${key}`,
      "airnow", 1,
    );
    if (airData?.[0]?.AQI) {
      return Math.round(Math.max(0, Math.min(25, 25 - airData[0].AQI / 4)));
    }
  }
  return 18;
}

export async function scoreSafety(routeCoords: [number, number][], distMi: number): Promise<number> {
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
  return Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(perMile / 300, 1)))));
}

export function scoreScenery(
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
  return { score, parkPercent: parkPct, waterPercent: waterPct };
}

export async function scoreTerrain(
  routeCoords: [number, number][], difficulty: string,
): Promise<{ score: number; elevGain: number }> {
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

  let score: number;
  if (difficulty === "easy" || difficulty === "beginner") {
    score = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(gain / 500, 1)))));
  } else if (difficulty === "hard" || difficulty === "advanced") {
    score = Math.round(Math.max(0, Math.min(25, 25 * Math.min(gain / 500, 1))));
  } else {
    score = gain <= 20 ? 20 : gain <= 80 ? 25 : gain <= 200 ? 20 : 15;
  }

  return { score, elevGain: Math.round(gain) };
}

export function parseDirections(legs: any[]): DirectionStep[] {
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

export function buildExportUrls(
  startLat: number, startLng: number,
  waypoints: Coordinate[], routeType: string,
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

export function generateRouteSummary(
  directions: DirectionStep[], distance: number, durationMin: number,
  sceneryDetail: SceneryDetail,
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

export async function scoreRoute(
  result: ConstructedRoute,
  targetMiles: number,
  difficulty: string,
  optimizeFor: OptimizeFactor[],
  parks: ParkPoint[],
  waterfront: ParkPoint[],
  airScore: number,
  startLat: number, startLng: number,
): Promise<ScoredRoute> {
  const coords = (result.geojson?.coordinates || []) as [number, number][];

  const [safety, terrainResult] = await Promise.all([
    scoreSafety(coords, result.distanceMi),
    scoreTerrain(coords, difficulty),
  ]);
  const sceneryResult = scoreScenery(coords, parks, waterfront);
  const pace = PACE_MIN_PER_MILE[difficulty] || 9.5;

  const breakdown: ScoreBreakdown = {
    airQuality: airScore,
    safety,
    scenery: sceneryResult.score,
    terrain: terrainResult.score,
  };

  const distError = Math.abs(result.distanceMi - targetMiles) / targetMiles;
  const distPenalty = Math.round(Math.min(distError * 50, 20));
  const weightedScore = scoreGeneratedRoute(breakdown, optimizeFor);
  const runScore = Math.max(0, weightedScore - distPenalty);

  const directions = parseDirections(result.legs);
  const exportUrls = buildExportUrls(startLat, startLng, result.candidate.waypoints, "loop");
  const estimatedMinutes = Math.round(result.distanceMi * pace);
  const summary = generateRouteSummary(directions, Math.round(result.distanceMi * 100) / 100, estimatedMinutes, sceneryResult);

  return {
    id: "",
    rank: 0,
    label: "",
    isTopPick: false,
    geojson: result.geojson,
    distance: Math.round(result.distanceMi * 100) / 100,
    estimatedMinutes,
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
}

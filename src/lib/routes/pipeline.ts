import { routeStaysOnLandmass, type Landmass } from "@/lib/geo";
import { RouteError } from "./errors";
import { validate, type ValidatedRequest } from "./validate";
import { fetchNearbyPOI } from "./poi";
import { generateCandidates } from "./candidates";
import { calibrateRoute } from "./calibrate";
import { scoreAirQuality, scoreRoute } from "./score";
import type { GenerateResult, ConstructedRoute, ScoredRoute } from "./types";

export async function generateRoutes(body: Record<string, any>): Promise<GenerateResult> {
  const startTime = Date.now();

  // Step 1: Validate
  const req: ValidatedRequest = validate(body);

  // Step 2: Fetch nearby POI
  const radiusMeters = Math.round(req.distanceMiles * 800);
  const { parks, waterfront } = await fetchNearbyPOI(req.lat, req.lng, radiusMeters, req.landmass);

  // Step 3: Generate candidates
  const candidates = generateCandidates(
    req.lat, req.lng, req.distanceMiles, req.routeType,
    parks, waterfront, req.preferParks, req.landmass,
  );

  if (candidates.length === 0) {
    throw new RouteError("NO_CANDIDATES");
  }

  // Step 4: Construct + calibrate routes (parallel)
  const allResults = (
    await Promise.all(
      candidates.map((c) =>
        calibrateRoute(req.lat, req.lng, c, req.distanceMiles, req.routeType)
          .catch(() => null),
      ),
    )
  ).filter((r): r is ConstructedRoute => r !== null);

  // Step 5: Filter cross-water routes
  let routeResults = allResults;
  if (req.landmass) {
    routeResults = allResults.filter((result) => {
      const coords = (result.geojson?.coordinates || []) as [number, number][];
      if (coords.length === 0) return true;
      return routeStaysOnLandmass(coords, req.landmass as Landmass).valid;
    });

    if (routeResults.length === 0 && allResults.length > 0) {
      throw new RouteError("ALL_ROUTES_CROSS_WATER");
    }
  }

  if (routeResults.length === 0) {
    throw new RouteError("NO_VIABLE_ROUTES");
  }

  // Step 6: Score all routes (parallel)
  const airScore = await scoreAirQuality();

  const scored = await Promise.all(
    routeResults.map((result) =>
      scoreRoute(
        result, req.distanceMiles, req.difficulty,
        req.optimizeFor, parks, waterfront, airScore,
        req.lat, req.lng,
      ),
    ),
  );

  // Sort and label top 3
  scored.sort((a, b) => b.runScore - a.runScore);
  const topRoutes: ScoredRoute[] = scored.slice(0, 3).map((r, i) => ({
    ...r,
    id: `route-${i + 1}`,
    rank: i + 1,
    label: i === 0 ? "Best Route" : i === 1 ? "Alternative" : "Explorer",
    isTopPick: i === 0,
  }));

  return {
    routes: topRoutes,
    meta: {
      startLat: req.lat,
      startLng: req.lng,
      targetDistance: req.distanceMiles,
      routeType: req.routeType,
      preferParks: req.preferParks,
      nearbyParks: parks.length,
      nearbyWaterfront: waterfront.length,
      candidatesGenerated: candidates.length,
      routesReturned: topRoutes.length,
      processingMs: Date.now() - startTime,
      landmass: req.landmass,
    },
  };
}

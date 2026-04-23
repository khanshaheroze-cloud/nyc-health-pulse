import { bearingBetween, haversineM, movePoint, DISTANCE_TOLERANCE, MAX_CALIBRATION_ITERATIONS } from "@/lib/geo";
import { constructRoute } from "./construct";
import type { RouteCandidate, ConstructedRoute } from "./types";

export async function calibrateRoute(
  startLat: number, startLng: number,
  candidate: RouteCandidate, targetMiles: number, routeType: string,
): Promise<ConstructedRoute | null> {
  let currentWaypoints = [...candidate.waypoints];
  let bestResult: ConstructedRoute | null = null;

  for (let attempt = 0; attempt < MAX_CALIBRATION_ITERATIONS; attempt++) {
    const currentCandidate: RouteCandidate = { ...candidate, waypoints: currentWaypoints };
    const result = await constructRoute(startLat, startLng, currentCandidate, routeType);
    if (!result) break;

    const ratio = result.distanceMi / targetMiles;
    if (Math.abs(ratio - 1) <= DISTANCE_TOLERANCE) return result;

    if (!bestResult || Math.abs(result.distanceMi - targetMiles) < Math.abs(bestResult.distanceMi - targetMiles)) {
      bestResult = result;
    }

    const scaleFactor = 1 / ratio;
    currentWaypoints = currentWaypoints.map((wp) => {
      const bearing = bearingBetween(startLat, startLng, wp.lat, wp.lng);
      const currentDist = haversineM(startLat, startLng, wp.lat, wp.lng);
      return movePoint(startLat, startLng, bearing, currentDist * Math.max(0.3, Math.min(scaleFactor, 2.0)));
    });
  }

  return bestResult;
}

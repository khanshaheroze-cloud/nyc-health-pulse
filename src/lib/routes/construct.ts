import { isValidCoord, MAX_MAPBOX_WAYPOINTS } from "@/lib/geo";
import { fetchOptimizedTrip, fetchDirections } from "@/lib/mapbox/client";
import type { RouteCandidate, Coordinate, ConstructedRoute } from "./types";

function coordString(points: Coordinate[]): string {
  return points.map((p) => `${p.lng},${p.lat}`).join(";");
}

function validatePoints(points: Coordinate[]): boolean {
  return points.every(
    (pt) => isValidCoord(pt.lat, pt.lng) && pt.lat > 40 && pt.lat < 41 && pt.lng < -73 && pt.lng > -75,
  );
}

export async function constructRoute(
  startLat: number, startLng: number,
  candidate: RouteCandidate, routeType: string,
): Promise<ConstructedRoute | null> {
  const allPoints: Coordinate[] = [{ lat: startLat, lng: startLng }, ...candidate.waypoints];
  if (!validatePoints(allPoints)) return null;

  const coords = coordString(allPoints);
  const isLoop = routeType === "loop";
  const label = candidate.label;

  // Tier 1: Optimization API (best for loops with multiple waypoints)
  if (isLoop && allPoints.length >= 2 && allPoints.length <= MAX_MAPBOX_WAYPOINTS) {
    const result = await fetchOptimizedTrip(coords, label);
    if (result) return { ...result, candidate };
  }

  // Tier 2: Directions API
  let dirCoords = coords;
  if (isLoop) dirCoords += `;${startLng},${startLat}`;
  const dirResult = await fetchDirections(dirCoords, label);
  if (dirResult) return { ...dirResult, candidate };

  // Tier 3: Simplified 2-point fallback
  if (allPoints.length > 2) {
    const simpleCoords = `${startLng},${startLat};${allPoints[1].lng},${allPoints[1].lat};${startLng},${startLat}`;
    const simpleResult = await fetchDirections(simpleCoords, `simple-${label}`);
    if (simpleResult) return { ...simpleResult, candidate };
  }

  return null;
}

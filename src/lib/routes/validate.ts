import { isValidCoord, NYC_BOUNDS, getLandmass } from "@/lib/geo";
import { getMapboxToken } from "@/lib/mapbox/client";
import { RouteError } from "./errors";
import type { RouteRequest } from "./types";

export interface ValidatedRequest extends RouteRequest {
  landmass: ReturnType<typeof getLandmass>;
}

function isInNYC(lat: number, lng: number): boolean {
  return lat >= NYC_BOUNDS.minLat && lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng && lng <= NYC_BOUNDS.maxLng;
}

export function validate(body: Record<string, any>): ValidatedRequest {
  const lat = Number(body.lat ?? body.startLat);
  const lng = Number(body.lng ?? body.startLng);
  const distanceMiles = Number(body.distanceMiles);

  if (!isValidCoord(lat, lng)) throw new RouteError("INVALID_COORDS");
  if (!isInNYC(lat, lng)) throw new RouteError("OUTSIDE_NYC");
  if (!distanceMiles || distanceMiles < 0.5 || distanceMiles > 26.2) throw new RouteError("INVALID_DISTANCE");

  getMapboxToken();

  const routeType = body.routeType === "out-back" ? "out-and-back" as const : (body.routeType || "loop") as "loop" | "out-and-back";
  const difficulty = (body.difficulty || "moderate") as RouteRequest["difficulty"];
  const preferParks = body.preferParks !== false;
  const optimizeFor = body.optimizeFor ?? [];
  const landmass = getLandmass(lat, lng);

  return {
    lat,
    lng,
    distanceMiles,
    routeType,
    difficulty,
    preferParks,
    optimizeFor,
    timeOfDay: body.timeOfDay,
    landmass,
  };
}

export type RouteErrorCode =
  | "INVALID_COORDS"
  | "OUTSIDE_NYC"
  | "INVALID_DISTANCE"
  | "MISSING_MAPBOX_TOKEN"
  | "NO_CANDIDATES"
  | "ALL_ROUTES_CROSS_WATER"
  | "MAPBOX_TIMEOUT"
  | "MAPBOX_RATE_LIMIT"
  | "MAPBOX_ERROR"
  | "CALIBRATION_FAILED"
  | "NO_VIABLE_ROUTES"
  | "WATER_ORIGIN"
  | "UNEXPECTED";

const STATUS_MAP: Record<RouteErrorCode, number> = {
  INVALID_COORDS: 400,
  OUTSIDE_NYC: 400,
  INVALID_DISTANCE: 400,
  MISSING_MAPBOX_TOKEN: 503,
  NO_CANDIDATES: 500,
  ALL_ROUTES_CROSS_WATER: 500,
  MAPBOX_TIMEOUT: 504,
  MAPBOX_RATE_LIMIT: 429,
  MAPBOX_ERROR: 502,
  CALIBRATION_FAILED: 500,
  NO_VIABLE_ROUTES: 500,
  WATER_ORIGIN: 400,
  UNEXPECTED: 500,
};

const MESSAGE_MAP: Record<RouteErrorCode, string> = {
  INVALID_COORDS: "Invalid coordinates.",
  OUTSIDE_NYC: "Smart Run Routes is currently available in NYC only.",
  INVALID_DISTANCE: "Distance must be 0.5–26.2 miles.",
  MISSING_MAPBOX_TOKEN: "Route service temporarily unavailable.",
  NO_CANDIDATES: "Could not plan routes. Try a different starting point.",
  ALL_ROUTES_CROSS_WATER: "All routes crossed water — try moving your start point inland.",
  MAPBOX_TIMEOUT: "Route service timed out. Please try again.",
  MAPBOX_RATE_LIMIT: "Too many requests. Please wait a moment.",
  MAPBOX_ERROR: "Route service error. Please try again.",
  CALIBRATION_FAILED: "Could not calibrate route distance. Try a different location.",
  NO_VIABLE_ROUTES: "Route generation failed. Please try again.",
  WATER_ORIGIN: "Starting point appears to be in water. Move to a nearby street.",
  UNEXPECTED: "An unexpected error occurred.",
};

export class RouteError extends Error {
  readonly code: RouteErrorCode;
  readonly httpStatus: number;

  constructor(code: RouteErrorCode, detail?: string) {
    const base = MESSAGE_MAP[code];
    super(detail ? `${base} ${detail}` : base);
    this.code = code;
    this.httpStatus = STATUS_MAP[code];
    this.name = "RouteError";
  }

  toJSON() {
    return { error: this.message, code: this.code };
  }
}

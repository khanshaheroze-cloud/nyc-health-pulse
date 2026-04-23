import type { Landmass } from "@/lib/geo";

export interface RouteRequest {
  lat: number;
  lng: number;
  distanceMiles: number;
  routeType: "loop" | "out-and-back";
  difficulty: "easy" | "moderate" | "hard" | "beginner" | "intermediate" | "advanced";
  preferParks: boolean;
  optimizeFor: OptimizeFactor[];
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
}

export type OptimizeFactor = "air" | "safety" | "green" | "flat" | "hilly";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface ParkPoint extends Coordinate {
  name: string;
  dist: number;
  type: "park" | "waterfront";
  area?: number;
}

export interface RouteCandidate {
  waypoints: Coordinate[];
  label: string;
  strategy: "park-magnet" | "radial-loop" | "greenway" | "compass-fallback" | "out-back";
}

export interface ConstructedRoute {
  geojson: GeoJSON.LineString;
  distanceMi: number;
  durationSec: number;
  legs: MapboxLeg[];
  candidate: RouteCandidate;
}

export interface MapboxLeg {
  steps?: MapboxStep[];
  distance?: number;
  duration?: number;
}

export interface MapboxStep {
  maneuver?: { instruction?: string };
  distance?: number;
  name?: string;
}

export interface ScoreBreakdown {
  airQuality: number;
  safety: number;
  scenery: number;
  terrain: number;
}

export interface SceneryDetail {
  parkPercent: number;
  waterPercent: number;
}

export interface DirectionStep {
  instruction: string;
  distance: string;
  streetName: string;
}

export interface ScoredRoute {
  id: string;
  rank: number;
  label: string;
  isTopPick: boolean;
  geojson: GeoJSON.LineString;
  distance: number;
  estimatedMinutes: number;
  elevationGain: number;
  runScore: number;
  scoreBreakdown: ScoreBreakdown;
  sceneryDetail: SceneryDetail;
  directions: DirectionStep[];
  summary: string;
  exportUrls: { googleMaps: string; appleMaps: string };
  distancePenalty: number;
  lowQuality: boolean;
  candidateLabel: string;
  waypoints: Coordinate[];
}

export interface GenerateResult {
  routes: ScoredRoute[];
  meta: RouteMeta;
}

export interface RouteMeta {
  startLat: number;
  startLng: number;
  targetDistance: number;
  routeType: string;
  preferParks: boolean;
  nearbyParks: number;
  nearbyWaterfront: number;
  candidatesGenerated: number;
  routesReturned: number;
  processingMs: number;
  landmass: Landmass | null;
}

export interface NearbyPOI {
  parks: ParkPoint[];
  waterfront: ParkPoint[];
}

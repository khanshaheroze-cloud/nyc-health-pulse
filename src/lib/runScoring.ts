/**
 * Smart Run Routes — Scoring Algorithm (v2)
 *
 * Scores routes 0-100 using 4 location-based factors:
 *   Air Quality (0-25), Street Safety (0-25), Green Space (0-25), Terrain (0-25)
 */

import type { Route } from "./routes";

export interface RunConditions {
  aqi: number | null;
  aqiCategory: string;
  uvIndex: number | null;
  tempF: number | null;
  feelsLikeF: number | null;
  humidity: number | null;
  windMph: number | null;
  weatherLabel: string | null;
  hour: number;
}

export interface ScoreBreakdown {
  airQuality: number;
  safety: number;
  greenSpace: number;
  terrain: number;
}

export interface ScoredRoute extends Route {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
  bestFor: string;
}

/**
 * Per-route AQI adjustments based on location characteristics.
 * Routes near highways/heavy traffic get a penalty; park routes get a bonus.
 */
const ROUTE_AQI_MODIFIER: Record<string, number> = {
  // Park routes — cleaner air
  "Central Park Full Loop": -8,
  "Central Park Reservoir (Bridle Path)": -10,
  "Prospect Park Loop": -8,
  "Van Cortlandt Park (XC Trail)": -12,
  "Forest Park (Oak Trail)": -10,
  "Staten Island Greenbelt (White Trail)": -12,
  "Flushing Meadows Corona Park": -5,
  "Pelham Bay / Orchard Beach": -10,
  // Waterfront/urban — moderate
  "Hudson River Greenway": -3,
  "East River Greenway (South)": 0,
  "Brooklyn Waterfront Greenway": -2,
  "FDR Boardwalk": -6,
  // Urban/traffic-adjacent
  "Brooklyn Bridge": 5,
  "The High Line": 2,
  // Race routes — mixed urban + park
  "NYC Marathon Course": 2,
  "Brooklyn Half Marathon": -3,
  "NYC Half Marathon": 0,
  "Queens 10K": -5,
  "Bronx 10 Mile": -3,
  "Staten Island Half Marathon": -8,
};

/** Per-route crash density (pre-computed from NYPD data patterns) */
const ROUTE_CRASH_SCORE: Record<string, number> = {
  "Central Park Full Loop": 23,
  "Central Park Reservoir (Bridle Path)": 25,
  "Prospect Park Loop": 22,
  "Van Cortlandt Park (XC Trail)": 24,
  "Forest Park (Oak Trail)": 25,
  "Staten Island Greenbelt (White Trail)": 25,
  "Pelham Bay / Orchard Beach": 24,
  "FDR Boardwalk": 23,
  "Flushing Meadows Corona Park": 21,
  "Hudson River Greenway": 18,
  "Brooklyn Waterfront Greenway": 17,
  "East River Greenway (South)": 16,
  "Brooklyn Bridge": 10,
  "The High Line": 14,
  // Race routes — on race day streets are closed, but for training they're mixed
  "NYC Marathon Course": 12,
  "Brooklyn Half Marathon": 18,
  "NYC Half Marathon": 14,
  "Queens 10K": 21,
  "Bronx 10 Mile": 16,
  "Staten Island Half Marathon": 20,
};

/** Per-route green space coverage (0-25) */
const ROUTE_GREEN_SCORE: Record<string, number> = {
  "Central Park Full Loop": 25,
  "Central Park Reservoir (Bridle Path)": 25,
  "Prospect Park Loop": 25,
  "Van Cortlandt Park (XC Trail)": 25,
  "Forest Park (Oak Trail)": 25,
  "Staten Island Greenbelt (White Trail)": 25,
  "Pelham Bay / Orchard Beach": 22,
  "Flushing Meadows Corona Park": 20,
  "Hudson River Greenway": 15,
  "Brooklyn Waterfront Greenway": 12,
  "East River Greenway (South)": 10,
  "FDR Boardwalk": 14,
  "Brooklyn Bridge": 3,
  "The High Line": 18,
  "NYC Marathon Course": 14,
  "Brooklyn Half Marathon": 18,
  "NYC Half Marathon": 10,
  "Queens 10K": 20,
  "Bronx 10 Mile": 16,
  "Staten Island Half Marathon": 20,
};

/** Per-route elevation gain estimates (feet) */
const ROUTE_ELEVATION: Record<string, number> = {
  "Central Park Full Loop": 180,
  "Central Park Reservoir (Bridle Path)": 20,
  "Prospect Park Loop": 120,
  "Van Cortlandt Park (XC Trail)": 280,
  "Forest Park (Oak Trail)": 220,
  "Staten Island Greenbelt (White Trail)": 350,
  "Pelham Bay / Orchard Beach": 15,
  "Flushing Meadows Corona Park": 10,
  "Hudson River Greenway": 30,
  "Brooklyn Waterfront Greenway": 20,
  "East River Greenway (South)": 25,
  "FDR Boardwalk": 5,
  "Brooklyn Bridge": 60,
  "The High Line": 10,
  "NYC Marathon Course": 600,
  "Brooklyn Half Marathon": 200,
  "NYC Half Marathon": 180,
  "Queens 10K": 20,
  "Bronx 10 Mile": 280,
  "Staten Island Half Marathon": 300,
};

/** AQI sub-score (0-25). Lower AQI = higher score. Route-specific modifier applied. */
function aqiScore(aqi: number | null, routeName: string): { pts: number; reason: string | null } {
  if (aqi === null) return { pts: 18, reason: null };
  const modifier = ROUTE_AQI_MODIFIER[routeName] ?? 0;
  const effectiveAqi = Math.max(0, aqi + modifier);
  const pts = Math.round(Math.max(0, Math.min(25, 25 - effectiveAqi / 4)));
  let reason: string | null = null;
  if (effectiveAqi <= 50) reason = "Clean air along this route";
  else if (effectiveAqi <= 100) reason = "Moderate air quality";
  else reason = "Poor air quality — consider an alternate route";
  return { pts, reason };
}

/** Safety sub-score (0-25) from pre-computed crash data */
function safetyScore(routeName: string): { pts: number; reason: string | null } {
  const pts = ROUTE_CRASH_SCORE[routeName] ?? 18;
  let reason: string | null = null;
  if (pts >= 22) reason = "Very low traffic exposure";
  else if (pts <= 12) reason = "Higher traffic — stay alert at crossings";
  return { pts, reason };
}

/** Green space sub-score (0-25) */
function greenScore(routeName: string): { pts: number; reason: string | null } {
  const pts = ROUTE_GREEN_SCORE[routeName] ?? 15;
  let reason: string | null = null;
  if (pts >= 23) reason = "Fully within park/greenway";
  else if (pts <= 10) reason = "Limited green space";
  return { pts, reason };
}

/** Terrain sub-score (0-25). Varies by route difficulty preference */
function terrainScore(routeName: string, difficulty: string): { pts: number; reason: string | null } {
  const elev = ROUTE_ELEVATION[routeName] ?? 50;
  let pts: number;
  let reason: string | null = null;

  if (difficulty === "Easy") {
    // Flat is better
    pts = Math.round(Math.max(0, Math.min(25, 25 * (1 - Math.min(elev / 400, 1)))));
    if (elev > 200) reason = "Significant hills on this route";
  } else if (difficulty === "Hilly") {
    // Hills are better
    pts = Math.round(Math.max(0, Math.min(25, 25 * Math.min(elev / 300, 1))));
    if (elev < 50) reason = "Very flat — limited hill training";
  } else {
    // Moderate — middle ground
    pts = Math.round(15 + Math.min(5, elev / 60));
    if (pts > 25) pts = 25;
  }
  return { pts, reason };
}

function bestForLabel(route: Route): string {
  if (route.tag === "race") return "Race route";
  if (route.distanceMi <= 2) return "Quick run";
  if (route.distanceMi <= 4) return "Training run";
  if (route.distanceMi <= 7) return "Long run";
  if (route.surface === "Dirt") return "Trail running";
  return "Distance run";
}

/** Score a single route given current conditions */
export function scoreRoute(route: Route, conditions: RunConditions): ScoredRoute {
  const air = aqiScore(conditions.aqi, route.name);
  const safe = safetyScore(route.name);
  const green = greenScore(route.name);
  const terrain = terrainScore(route.name, route.difficulty);

  const breakdown: ScoreBreakdown = {
    airQuality: air.pts,
    safety: safe.pts,
    greenSpace: green.pts,
    terrain: terrain.pts,
  };

  const score = Math.min(100, air.pts + safe.pts + green.pts + terrain.pts);
  const reasons = [air.reason, safe.reason, green.reason, terrain.reason].filter(Boolean) as string[];

  return {
    ...route,
    score,
    scoreBreakdown: breakdown,
    reasons,
    bestFor: bestForLabel(route),
  };
}

/** Score all routes and sort by score descending */
export function scoreAllRoutes(routes: Route[], conditions: RunConditions): ScoredRoute[] {
  return routes.map((r) => scoreRoute(r, conditions)).sort((a, b) => b.score - a.score);
}

/** Overall "Run Score" for the city right now */
export function cityRunScore(conditions: RunConditions): { score: number; headline: string } {
  // City-wide score based on weather conditions
  let score = 50; // baseline

  // AQI factor (±25)
  if (conditions.aqi !== null) {
    if (conditions.aqi <= 50) score += 25;
    else if (conditions.aqi <= 100) score += 15;
    else if (conditions.aqi <= 150) score += 0;
    else score -= 15;
  } else {
    score += 15;
  }

  // Temperature factor (±15)
  const t = conditions.feelsLikeF ?? conditions.tempF;
  if (t !== null) {
    if (t >= 45 && t <= 65) score += 15;
    else if (t >= 35 && t <= 75) score += 8;
    else if (t >= 25 && t <= 85) score += 0;
    else score -= 10;
  }

  // UV factor (±5)
  if (conditions.uvIndex !== null) {
    if (conditions.uvIndex <= 3) score += 5;
    else if (conditions.uvIndex <= 6) score += 2;
    else score -= 3;
  }

  // Time of day (±5)
  if (conditions.hour >= 5 && conditions.hour <= 10) score += 5;
  else if (conditions.hour >= 10 && conditions.hour <= 15) score -= 2;
  else if (conditions.hour >= 21 || conditions.hour < 5) score -= 5;

  score = Math.max(0, Math.min(100, score));

  let headline: string;
  if (score >= 80) headline = "Perfect conditions for a run";
  else if (score >= 65) headline = "Great day to get outside";
  else if (score >= 50) headline = "Decent running conditions";
  else if (score >= 35) headline = "Consider a shorter route today";
  else headline = "Indoor workout recommended";

  return { score, headline };
}

/** Score a generated route based on its scoring data */
export function scoreGeneratedRoute(breakdown: ScoreBreakdown, optimizeFor: string[]): number {
  let weights = { airQuality: 1, safety: 1, greenSpace: 1, terrain: 1 };

  // 2x boost for selected optimization preferences
  for (const pref of optimizeFor) {
    if (pref === "air") weights.airQuality = 2;
    if (pref === "safety") weights.safety = 2;
    if (pref === "green") weights.greenSpace = 2;
    if (pref === "flat" || pref === "hilly") weights.terrain = 2;
  }

  const totalWeight = weights.airQuality + weights.safety + weights.greenSpace + weights.terrain;
  const weighted =
    (breakdown.airQuality * weights.airQuality +
      breakdown.safety * weights.safety +
      breakdown.greenSpace * weights.greenSpace +
      breakdown.terrain * weights.terrain) /
    totalWeight;

  // Normalize: each factor is 0-25, weighted average is 0-25, scale to 0-100
  return Math.round(Math.min(100, weighted * 4));
}

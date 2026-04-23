import { type Landmass } from "./constants";

export function getLandmass(lat: number, lng: number): Landmass | null {
  if (lat >= 40.49 && lat <= 40.66 && lng >= -74.26 && lng <= -74.04) {
    return "staten-island";
  }

  if (lat >= 40.80 && lat <= 40.92 && lng >= -73.94 && lng <= -73.74) {
    return "bronx";
  }

  if (lng >= -74.02 && lat >= 40.70 && lat < 40.80) {
    let eastEdge: number;
    if (lat < 40.71) {
      eastEdge = -73.975;
    } else if (lat < 40.75) {
      eastEdge = -73.965;
    } else {
      eastEdge = -73.94;
    }
    if (lng <= eastEdge) {
      return "manhattan";
    }
  }

  if (lat >= 40.80 && lat <= 40.88 && lng >= -73.97 && lng <= -73.91) {
    return "manhattan";
  }

  if (lat >= 40.49 && lat <= 40.80 && lng >= -74.05 && lng <= -73.68) {
    return "brooklyn-queens";
  }

  return null;
}

export function areSameLandmass(a: Landmass | null, b: Landmass | null): boolean {
  if (a === null || b === null) return true;
  return a === b;
}

export function routeStaysOnLandmass(
  coordinates: [number, number][],
  startLandmass: Landmass,
): { valid: boolean; violationCount: number; firstViolation?: string } {
  let violationCount = 0;
  let firstViolation: string | undefined;

  for (let i = 0; i < coordinates.length; i++) {
    const [lng, lat] = coordinates[i];
    const pointLandmass = getLandmass(lat, lng);
    if (pointLandmass === null) continue;
    if (pointLandmass !== startLandmass) {
      violationCount++;
      if (!firstViolation) {
        firstViolation = `Point ${i}: (${lat.toFixed(4)}, ${lng.toFixed(4)}) is on ${pointLandmass}, not ${startLandmass}`;
      }
    }
  }

  return { valid: violationCount <= 2, violationCount, firstViolation };
}

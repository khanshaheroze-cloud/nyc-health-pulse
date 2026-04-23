import { haversineM, movePoint, bearingBetween, isValidCoord, NYC_BOUNDS, milesToMeters, areSameLandmass, getLandmass, type Landmass } from "@/lib/geo";
import type { RouteCandidate, ParkPoint, Coordinate } from "./types";

function isInNYC(lat: number, lng: number): boolean {
  return lat >= NYC_BOUNDS.minLat && lat <= NYC_BOUNDS.maxLat &&
    lng >= NYC_BOUNDS.minLng && lng <= NYC_BOUNDS.maxLng;
}

function parkMagnetCandidates(
  lat: number, lng: number, legDistanceM: number,
  parks: ParkPoint[], waterfront: ParkPoint[],
): RouteCandidate[] {
  const candidates: RouteCandidate[] = [];
  if (parks.length === 0) return candidates;

  const bestPark = parks[0];
  const parkBearing = bearingBetween(lat, lng, bestPark.lat, bestPark.lng);
  const returnBearing = (parkBearing + 120 + Math.random() * 60) % 360;
  const returnPoint = movePoint(lat, lng, returnBearing, legDistanceM * 0.7);

  candidates.push({
    waypoints: [{ lat: bestPark.lat, lng: bestPark.lng }, returnPoint],
    label: `park-${bestPark.name.substring(0, 20)}`,
    strategy: "park-magnet",
  });

  if (waterfront.length > 0) {
    const bestWF = waterfront[0];
    const angleDiff = Math.abs(
      bearingBetween(lat, lng, bestPark.lat, bestPark.lng) -
      bearingBetween(lat, lng, bestWF.lat, bestWF.lng),
    );
    const normalized = angleDiff > 180 ? 360 - angleDiff : angleDiff;
    if (normalized > 30) {
      candidates.push({
        waypoints: [{ lat: bestPark.lat, lng: bestPark.lng }, { lat: bestWF.lat, lng: bestWF.lng }],
        label: "park-waterfront-combo",
        strategy: "park-magnet",
      });
    }
  }

  if (parks.length >= 2 && haversineM(bestPark.lat, bestPark.lng, parks[1].lat, parks[1].lng) > 300) {
    candidates.push({
      waypoints: [{ lat: bestPark.lat, lng: bestPark.lng }, { lat: parks[1].lat, lng: parks[1].lng }],
      label: "two-parks",
      strategy: "park-magnet",
    });
  }

  if (bestPark.dist < legDistanceM * 2) {
    const throughBearing = bearingBetween(lat, lng, bestPark.lat, bestPark.lng);
    const throughPoint = movePoint(bestPark.lat, bestPark.lng, throughBearing, 300);
    const returnBearing2 = (throughBearing + 150) % 360;
    const returnPoint2 = movePoint(lat, lng, returnBearing2, legDistanceM * 0.6);
    candidates.push({
      waypoints: [throughPoint, returnPoint2],
      label: "through-park",
      strategy: "park-magnet",
    });
  }

  return candidates;
}

function greenwayCandidates(
  lat: number, lng: number, legDistanceM: number,
  waterfront: ParkPoint[],
): RouteCandidate[] {
  const candidates: RouteCandidate[] = [];
  if (waterfront.length === 0) return candidates;

  if (waterfront.length >= 2) {
    candidates.push({
      waypoints: [{ lat: waterfront[0].lat, lng: waterfront[0].lng }, { lat: waterfront[1].lat, lng: waterfront[1].lng }],
      label: "waterfront-path",
      strategy: "greenway",
    });
  } else {
    const wfBearing = bearingBetween(lat, lng, waterfront[0].lat, waterfront[0].lng);
    const retPt = movePoint(lat, lng, (wfBearing + 140) % 360, legDistanceM * 0.7);
    candidates.push({
      waypoints: [{ lat: waterfront[0].lat, lng: waterfront[0].lng }, retPt],
      label: "waterfront-loop",
      strategy: "greenway",
    });
  }

  return candidates;
}

function radialLoopCandidates(
  lat: number, lng: number, legDistanceM: number,
): RouteCandidate[] {
  const candidates: RouteCandidate[] = [];
  const anglesSets = [[0, 120, 240], [45, 165, 285], [0, 90, 180, 270]];

  for (const angles of anglesSets) {
    const wps = angles.map((a) => {
      const dist = legDistanceM * (0.7 + Math.random() * 0.3);
      return movePoint(lat, lng, a, dist);
    });
    if (wps.every((wp) => isValidCoord(wp.lat, wp.lng) && isInNYC(wp.lat, wp.lng))) {
      candidates.push({ waypoints: wps, label: `compass-${angles.length}pt`, strategy: "radial-loop" });
    }
  }

  return candidates;
}

function outAndBackCandidates(
  lat: number, lng: number, distanceMiles: number,
  parks: ParkPoint[],
): RouteCandidate[] {
  const candidates: RouteCandidate[] = [];

  if (parks.length > 0) {
    candidates.push({
      waypoints: [{ lat: parks[0].lat, lng: parks[0].lng }],
      label: "out-back-park",
      strategy: "out-back",
    });
  }

  const randomBearing = Math.random() * 360;
  const endPt = movePoint(lat, lng, randomBearing, milesToMeters(distanceMiles) / 2);
  if (isValidCoord(endPt.lat, endPt.lng)) {
    candidates.push({ waypoints: [endPt], label: "out-back-compass", strategy: "out-back" });
  }

  return candidates;
}

function filterToLandmass(candidates: RouteCandidate[], startLandmass: Landmass | null): RouteCandidate[] {
  if (!startLandmass) return candidates;

  for (const c of candidates) {
    c.waypoints = c.waypoints.filter((wp) => areSameLandmass(startLandmass, getLandmass(wp.lat, wp.lng)));
  }

  return candidates.filter((c) => c.waypoints.length > 0);
}

export function generateCandidates(
  lat: number, lng: number,
  distanceMiles: number, routeType: string,
  parks: ParkPoint[], waterfront: ParkPoint[],
  preferParks: boolean, startLandmass: Landmass | null,
): RouteCandidate[] {
  const legDistanceM = milesToMeters(distanceMiles) / 3;
  let candidates: RouteCandidate[] = [];

  if (routeType === "out-and-back") {
    candidates.push(...outAndBackCandidates(lat, lng, distanceMiles, parks));
  }

  if (preferParks) {
    candidates.push(...parkMagnetCandidates(lat, lng, legDistanceM, parks, waterfront));
  }

  if (preferParks && candidates.length < 4) {
    candidates.push(...greenwayCandidates(lat, lng, legDistanceM, waterfront));
  }

  candidates.push(...radialLoopCandidates(lat, lng, legDistanceM));

  return filterToLandmass(candidates, startLandmass);
}

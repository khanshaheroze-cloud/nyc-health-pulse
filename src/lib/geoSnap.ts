// Cache-key coordinate snapping for upstream geo queries.
//
// Next's data cache keys fetch() by URL. Raw user coordinates (5+ decimals)
// make every user a cache miss, so the flagship surface paid a cold DOHMH
// round-trip (~15s observed) on every new visitor. Snapping the query center
// to a coarse grid means everyone in the same ~500m–1km cell shares one
// cached upstream response (TTL via next.revalidate).
//
// Correctness: the fetch radius is PADDED by the worst-case snap displacement
// and results are re-filtered by true distance from the user's real position,
// so snapping never changes what a user sees — only how often we hit Socrata.

/** ~0.005° ≈ 550m N-S grid — for small fixed radii (near-me's 800m) */
export const GRID_FINE = 0.005;
/** ~0.01° ≈ 1.1km N-S grid — for user-selected radii up to ~3.2km */
export const GRID_COARSE = 0.01;

/** Worst-case meters between a point and its snapped cell center */
export function snapPadMeters(gridDeg: number): number {
  const halfLat = (gridDeg / 2) * 111_320; // deg lat → m
  const halfLng = (gridDeg / 2) * 111_320 * Math.cos((40.7 * Math.PI) / 180);
  return Math.ceil(Math.sqrt(halfLat * halfLat + halfLng * halfLng));
}

export function snapCoords(lat: number, lng: number, gridDeg: number): { lat: string; lng: string } {
  const snap = (v: number) => (Math.round(v / gridDeg) * gridDeg).toFixed(4);
  return { lat: snap(lat), lng: snap(lng) };
}

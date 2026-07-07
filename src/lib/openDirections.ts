export interface DirectionsTarget {
  lat?: number;
  lng?: number;
  address?: string;
  name: string;
  /** Google place_id (Round 7 enrichment) — when present, directions anchor
   *  to the storefront DOOR instead of a raw lat/lng dot. DOHMH coordinates
   *  are block-face geocoding, not the entrance. */
  placeId?: string | null;
}

/** Pure URL builder (unit-tested): place-anchored when a place_id exists,
 *  raw-coordinate/search fallback otherwise. */
export function directionsUrl(spot: DirectionsTarget): string {
  if (spot.placeId) {
    const dest = encodeURIComponent([spot.name, spot.address].filter(Boolean).join(" "));
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${spot.placeId}`;
  }
  if (spot.lat && spot.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
  }
  if (spot.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.name}, ${spot.address}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name)}`;
}

export function openDirections(spot: DirectionsTarget) {
  // TODO: when we ship the iOS app, branch on platform to use maps://?q=... (Apple Maps)
  // instead of the Google Maps URL. Add a `platform` arg or read from a context.
  window.open(directionsUrl(spot), "_blank", "noopener,noreferrer");
}

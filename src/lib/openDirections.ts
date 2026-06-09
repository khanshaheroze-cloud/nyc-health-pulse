export function openDirections(spot: { lat?: number; lng?: number; address?: string; name: string }) {
  // TODO: when we ship the iOS app, branch on platform to use maps://?q=... (Apple Maps)
  // instead of the Google Maps URL. Add a `platform` arg or read from a context.
  let url: string;
  if (spot.lat && spot.lng) {
    url = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
  } else if (spot.address) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${spot.name}, ${spot.address}`
    )}`;
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name)}`;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

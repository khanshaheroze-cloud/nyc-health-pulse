export const EARTH_RADIUS_M = 6_371_000;

export const NYC_BOUNDS = {
  minLat: 40.49,
  maxLat: 40.92,
  minLng: -74.27,
  maxLng: -73.68,
} as const;

export type Landmass = "manhattan" | "brooklyn-queens" | "bronx" | "staten-island";

export const MAJOR_PARKS = [
  { name: "Central Park", minLat: 40.764, maxLat: 40.800, minLng: -73.981, maxLng: -73.949 },
  { name: "Prospect Park", minLat: 40.655, maxLat: 40.674, minLng: -73.974, maxLng: -73.958 },
  { name: "Flushing Meadows", minLat: 40.736, maxLat: 40.754, minLng: -73.851, maxLng: -73.833 },
  { name: "Van Cortlandt Park", minLat: 40.884, maxLat: 40.906, minLng: -73.898, maxLng: -73.876 },
  { name: "Pelham Bay Park", minLat: 40.856, maxLat: 40.878, minLng: -73.815, maxLng: -73.785 },
  { name: "Forest Park", minLat: 40.695, maxLat: 40.714, minLng: -73.860, maxLng: -73.830 },
  { name: "Riverside Park", minLat: 40.787, maxLat: 40.828, minLng: -73.977, maxLng: -73.968 },
  { name: "Inwood Hill Park", minLat: 40.868, maxLat: 40.878, minLng: -73.930, maxLng: -73.918 },
  { name: "Astoria Park", minLat: 40.773, maxLat: 40.782, minLng: -73.928, maxLng: -73.918 },
  { name: "DUMBO/Brooklyn Bridge Park", minLat: 40.696, maxLat: 40.704, minLng: -73.999, maxLng: -73.989 },
  { name: "Hudson River Greenway", minLat: 40.709, maxLat: 40.820, minLng: -74.016, maxLng: -74.008 },
  { name: "East River Park", minLat: 40.710, maxLat: 40.733, minLng: -73.978, maxLng: -73.972 },
  { name: "Governors Island", minLat: 40.687, maxLat: 40.695, minLng: -74.022, maxLng: -74.012 },
  { name: "Randall's Island", minLat: 40.787, maxLat: 40.804, minLng: -73.929, maxLng: -73.914 },
  { name: "The High Line", minLat: 40.739, maxLat: 40.754, minLng: -74.008, maxLng: -74.004 },
  { name: "Battery Park / Battery Park City", minLat: 40.700, maxLat: 40.718, minLng: -74.020, maxLng: -74.008 },
  { name: "Washington Square Park", minLat: 40.729, maxLat: 40.733, minLng: -73.999, maxLng: -73.995 },
  { name: "Union Square Park", minLat: 40.734, maxLat: 40.738, minLng: -73.992, maxLng: -73.988 },
  { name: "McCarren Park", minLat: 40.719, maxLat: 40.724, minLng: -73.953, maxLng: -73.947 },
  { name: "Marine Park", minLat: 40.594, maxLat: 40.613, minLng: -73.930, maxLng: -73.910 },
] as const;

export const MAJOR_PARK_CENTROIDS = [
  { name: "Central Park", lat: 40.7829, lng: -73.9654 },
  { name: "Prospect Park", lat: 40.6602, lng: -73.9690 },
  { name: "Flushing Meadows", lat: 40.7400, lng: -73.8408 },
  { name: "Van Cortlandt Park", lat: 40.8972, lng: -73.8862 },
  { name: "Riverside Park", lat: 40.8015, lng: -73.9714 },
  { name: "Inwood Hill Park", lat: 40.8677, lng: -73.9212 },
  { name: "Randall's Island", lat: 40.7934, lng: -73.9213 },
  { name: "Hudson River Greenway", lat: 40.7580, lng: -74.0100 },
] as const;

export const PACE_MIN_PER_MILE: Record<string, number> = {
  easy: 12,
  moderate: 9.5,
  hard: 7.5,
  beginner: 12,
  intermediate: 9.5,
  advanced: 7.5,
};

export const MAX_MAPBOX_WAYPOINTS = 12;
export const API_TIMEOUT_MS = 8000;
export const MAX_RETRIES = 2;
export const DISTANCE_TOLERANCE = 0.35;
export const MAX_CALIBRATION_ITERATIONS = 4;
export const PARK_CENTROID_THRESHOLD_DEG = 0.005;

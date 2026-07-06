import { neighborhoods } from "@/lib/neighborhoodData";

// Nearest-UHF42-neighborhood lookup. Two fixes over the old inline version:
// 1. Longitude is scaled by cos(latitude) — unscaled degrees overweight
//    east-west distance by ~30% at NYC's latitude.
// 2. Big or oddly-shaped neighborhoods get MULTIPLE anchor points. With a
//    single centroid, Hunters Point (waterfront LIC) resolved to Greenpoint
//    across the East River because the "Long Island City - Astoria" centroid
//    sits up in Astoria. Anchors pin the lookup to the right side of the water.

const PRIMARY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "kingsbridge-riverdale": { lat: 40.884, lng: -73.907 },
  "northeast-bronx": { lat: 40.868, lng: -73.847 },
  "fordham-bronx-park": { lat: 40.861, lng: -73.882 },
  "pelham-throgs-neck": { lat: 40.828, lng: -73.824 },
  "crotona-tremont": { lat: 40.844, lng: -73.893 },
  "high-bridge-morrisania": { lat: 40.831, lng: -73.914 },
  "hunts-point-mott-haven": { lat: 40.815, lng: -73.905 },
  "greenpoint": { lat: 40.727, lng: -73.951 },
  "downtown-heights-slope": { lat: 40.687, lng: -73.978 },
  "bedford-stuyvesant-crown-heights": { lat: 40.681, lng: -73.939 },
  "east-new-york": { lat: 40.664, lng: -73.879 },
  "sunset-park": { lat: 40.65, lng: -74.002 },
  "borough-park": { lat: 40.635, lng: -73.992 },
  "east-flatbush-flatbush": { lat: 40.649, lng: -73.956 },
  "canarsie-flatlands": { lat: 40.639, lng: -73.901 },
  "bensonhurst-bay-ridge": { lat: 40.623, lng: -74.008 },
  "coney-island-sheepshead-bay": { lat: 40.583, lng: -73.953 },
  "williamsburg-bushwick": { lat: 40.703, lng: -73.926 },
  "washington-heights-inwood": { lat: 40.852, lng: -73.931 },
  "central-harlem-morningside-heights": { lat: 40.81, lng: -73.954 },
  "east-harlem": { lat: 40.794, lng: -73.943 },
  // NB: the old inline map used stale slugs ("chelsea-clinton",
  // "upper-east-side-gramercy") that matched nothing in neighborhoodData —
  // those areas silently fell through to whatever centroid was next-nearest.
  "upper-west-side": { lat: 40.787, lng: -73.973 },
  "upper-east-side": { lat: 40.773, lng: -73.956 },
  "gramercy-park-murray-hill": { lat: 40.7455, lng: -73.9785 },
  "chelsea-village": { lat: 40.746, lng: -74.0 },
  "greenwich-village-soho": { lat: 40.728, lng: -74.001 },
  "union-square-lower-east-side": { lat: 40.72, lng: -73.987 },
  "lower-manhattan": { lat: 40.71, lng: -74.01 },
  "long-island-city-astoria": { lat: 40.756, lng: -73.924 },
  "west-queens": { lat: 40.739, lng: -73.881 },
  "flushing-clearview": { lat: 40.765, lng: -73.812 },
  "bayside-meadows": { lat: 40.762, lng: -73.77 },
  "ridgewood-forest-hills": { lat: 40.712, lng: -73.86 },
  "fresh-meadows": { lat: 40.736, lng: -73.783 },
  "southwest-queens": { lat: 40.681, lng: -73.835 },
  "jamaica": { lat: 40.703, lng: -73.79 },
  "southeast-queens": { lat: 40.67, lng: -73.76 },
  "rockaways": { lat: 40.593, lng: -73.782 },
  "port-richmond": { lat: 40.633, lng: -74.137 },
  "stapleton-st-george": { lat: 40.629, lng: -74.077 },
  "willowbrook": { lat: 40.592, lng: -74.138 },
  "south-beach-tottenville": { lat: 40.553, lng: -74.142 },
};

// Extra anchors for neighborhoods whose centroid misrepresents part of their
// area. Each anchor maps a point to the slug that truly contains it.
// `label` is the NTA-level display name for the badge: UHF areas are health-
// data units ("Long Island City - Astoria"), not what a person calls where
// they're standing — 47-10 Vernon Blvd is Hunters Point, and "ASTORIA" in the
// banner there reads wrong (July 5 audit). Links keep the UHF slug.
const EXTRA_ANCHORS: { slug: string; lat: number; lng: number; label?: string }[] = [
  // Midtown/Times Square sits between the Chelsea and Murray Hill centroids
  { slug: "chelsea-village", lat: 40.759, lng: -73.989, label: "Midtown / Times Square" },
  // Hunters Point / LIC waterfront (Vernon Blvd corridor) — the wedge's launch area
  { slug: "long-island-city-astoria", lat: 40.7425, lng: -73.954, label: "Hunters Point / Long Island City" },
  // Court Square / Jackson Ave LIC
  { slug: "long-island-city-astoria", lat: 40.747, lng: -73.943, label: "Long Island City" },
  // Astoria proper (keeps the north end anchored too)
  { slug: "long-island-city-astoria", lat: 40.772, lng: -73.93, label: "Astoria" },
  // Roosevelt Island belongs with LIC-Astoria's UHF, not the UES
  { slug: "long-island-city-astoria", lat: 40.762, lng: -73.949, label: "Roosevelt Island" },
  // Red Hook is far from the downtown-heights-slope centroid
  { slug: "downtown-heights-slope", lat: 40.6755, lng: -74.012, label: "Red Hook" },
  // Lower East Side waterfront vs. the Union Square-anchored centroid
  { slug: "union-square-lower-east-side", lat: 40.715, lng: -73.984, label: "Lower East Side" },
];

// The LIC-Astoria UHF centroid sits in Astoria — when IT wins, say so
const PRIMARY_LABELS: Record<string, string> = {
  "long-island-city-astoria": "Astoria",
};

interface Anchor {
  slug: string;
  lat: number;
  lng: number;
  label?: string;
}

const ALL_ANCHORS: Anchor[] = [
  ...Object.entries(PRIMARY_CENTROIDS).map(([slug, c]) => ({
    slug,
    ...c,
    label: PRIMARY_LABELS[slug],
  })),
  ...EXTRA_ANCHORS,
];

const COS_NYC_LAT = Math.cos((40.7 * Math.PI) / 180);

function nearestAnchor(lat: number, lng: number): Anchor {
  let best = ALL_ANCHORS[0];
  let bestDist = Infinity;
  for (const a of ALL_ANCHORS) {
    const dLat = lat - a.lat;
    const dLng = (lng - a.lng) * COS_NYC_LAT;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

export function findNearestNeighborhood(lat: number, lng: number) {
  const a = nearestAnchor(lat, lng);
  return neighborhoods.find((n) => n.slug === a.slug) ?? neighborhoods[0];
}

/** UHF neighborhood (slug/borough for health-data links) + the NTA-level
 *  display label for badges. Label falls back to the UHF name. */
export function findNearestNeighborhoodDetail(lat: number, lng: number) {
  const a = nearestAnchor(lat, lng);
  const hood = neighborhoods.find((n) => n.slug === a.slug) ?? neighborhoods[0];
  return { ...hood, displayLabel: a.label ?? hood.name };
}

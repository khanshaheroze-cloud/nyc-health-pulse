import seed from "../data/nyc-restaurants-seed.json";

export interface BundledRestaurant {
  id: string;
  name: string;
  chainSlug?: string;
  cuisineSlug: string;
  cuisine: string;
  grade: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getBundledNearby(
  userLat: number,
  userLng: number,
  radiusMeters = 2500,
  limit = 50,
): BundledRestaurant[] {
  const withDist: BundledRestaurant[] = (seed as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    chainSlug: r.chainSlug ?? undefined,
    cuisineSlug: r.cuisineSlug,
    cuisine: r.cuisine,
    grade: r.grade ?? "A",
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    distance: haversineMeters(userLat, userLng, r.lat, r.lng),
  }));

  const nearby = withDist
    .filter((r) => r.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);

  return diversifyByCuisine(nearby, limit);
}

function diversifyByCuisine(
  restaurants: BundledRestaurant[],
  limit: number,
): BundledRestaurant[] {
  const buckets = new Map<string, BundledRestaurant[]>();
  for (const r of restaurants) {
    const cat = r.cuisineSlug;
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(r);
  }
  const result: BundledRestaurant[] = [];
  const cats = Array.from(buckets.keys());
  let i = 0;
  while (
    result.length < limit &&
    cats.some((c) => (buckets.get(c)?.length ?? 0) > 0)
  ) {
    const cat = cats[i % cats.length];
    const r = buckets.get(cat)!.shift();
    if (r) result.push(r);
    i++;
  }
  return result;
}

export function getBundledCount(): number {
  return (seed as any[]).length;
}

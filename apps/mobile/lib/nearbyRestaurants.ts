import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "pulse-nearby-restaurants";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export interface DOHMHRestaurant {
  camis: string;
  dba: string;
  cuisine: string;
  grade: string | null;
  lat: number;
  lng: number;
  address: string;
  boro: string;
  distance: number;
}

interface CacheEntry {
  restaurants: DOHMHRestaurant[];
  ts: number;
  latKey: string;
  lngKey: string;
}

function roundCoord(v: number): string {
  return v.toFixed(3);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PRIORITY_CUISINES = new Set([
  "American", "Mexican", "Italian", "Japanese", "Chinese",
  "Mediterranean", "Indian", "Thai", "Korean", "Pizza",
  "Cafe/Coffee/Tea", "Salads", "Sandwiches/Salads/Mixed Buffet",
  "Bagels/Pretzels", "Juice, Smoothies, Fruit Salads", "Vegetarian",
]);

function diversifyByCuisine(restaurants: DOHMHRestaurant[], limit: number): DOHMHRestaurant[] {
  const byCuisine = new Map<string, DOHMHRestaurant[]>();
  for (const r of restaurants) {
    const arr = byCuisine.get(r.cuisine) ?? [];
    arr.push(r);
    byCuisine.set(r.cuisine, arr);
  }

  const result: DOHMHRestaurant[] = [];
  const used = new Set<string>();

  // First pass: one from each priority cuisine
  for (const cuisine of PRIORITY_CUISINES) {
    const pool = byCuisine.get(cuisine);
    if (!pool) continue;
    const pick = pool.find((r) => !used.has(r.camis));
    if (pick) { result.push(pick); used.add(pick.camis); }
    if (result.length >= limit) return result;
  }

  // Second pass: fill remaining slots round-robin by distance
  const sorted = restaurants.filter((r) => !used.has(r.camis)).sort((a, b) => a.distance - b.distance);
  for (const r of sorted) {
    if (used.has(r.camis)) continue;
    const cuisineCount = result.filter((x) => x.cuisine === r.cuisine).length;
    if (cuisineCount >= 3) continue;
    result.push(r);
    used.add(r.camis);
    if (result.length >= limit) break;
  }

  return result;
}

export async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  radiusMeters = 1200,
): Promise<DOHMHRestaurant[]> {
  const latKey = roundCoord(lat);
  const lngKey = roundCoord(lng);

  // Check cache
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CacheEntry = JSON.parse(raw);
      if (
        cached.latKey === latKey &&
        cached.lngKey === lngKey &&
        Date.now() - cached.ts < CACHE_TTL
      ) {
        return cached.restaurants;
      }
    }
  } catch {}

  // Fetch from DOHMH
  try {
    const query = `$where=within_circle(latitude, longitude, ${lat}, ${lng}, ${radiusMeters})&$select=camis,dba,cuisine_description,grade,latitude,longitude,building,street,boro&$group=camis,dba,cuisine_description,grade,latitude,longitude,building,street,boro&$limit=200`;
    const url = `https://data.cityofnewyork.us/resource/43nn-pn8j.json?${query}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any[] = await res.json();

    const seen = new Set<string>();
    const restaurants: DOHMHRestaurant[] = [];

    for (const row of data) {
      if (!row.camis || !row.latitude || !row.longitude) continue;
      if (seen.has(row.camis)) continue;
      seen.add(row.camis);

      const rLat = parseFloat(row.latitude);
      const rLng = parseFloat(row.longitude);
      if (isNaN(rLat) || isNaN(rLng)) continue;

      restaurants.push({
        camis: row.camis,
        dba: row.dba || "Unknown",
        cuisine: row.cuisine_description || "Other",
        grade: row.grade || null,
        lat: rLat,
        lng: rLng,
        address: `${row.building || ""} ${row.street || ""}`.trim(),
        boro: row.boro || "",
        distance: haversineMeters(lat, lng, rLat, rLng),
      });
    }

    restaurants.sort((a, b) => a.distance - b.distance);
    const diversified = diversifyByCuisine(restaurants, 35);

    // Cache
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        restaurants: diversified,
        ts: Date.now(),
        latKey,
        lngKey,
      }));
    } catch {}

    return diversified;
  } catch {
    return [];
  }
}

// Well-known chain slugs mapping from restaurant name patterns
const CHAIN_PATTERNS: [RegExp, string][] = [
  [/chipotle/i, "chipotle"],
  [/cava/i, "cava"],
  [/sweetgreen/i, "sweetgreen"],
  [/just salad/i, "just-salad"],
  [/chick-fil-a/i, "chick-fil-a"],
  [/mcdonald/i, "mcdonalds"],
  [/shake shack/i, "shake-shack"],
  [/starbucks/i, "starbucks"],
  [/dunkin/i, "dunkin"],
  [/subway/i, "subway"],
  [/panera/i, "panera"],
  [/pret a manger|pret/i, "pret"],
  [/jersey mike/i, "jersey-mikes"],
  [/halal guys/i, "halal-guys"],
  [/domino/i, "dominos"],
  [/bonchon/i, "bonchon"],
];

export function detectChainSlug(name: string): string | null {
  for (const [pattern, slug] of CHAIN_PATTERNS) {
    if (pattern.test(name)) return slug;
  }
  return null;
}

// All chains for the Chains tab
export const ALL_CHAIN_ENTRIES: {
  name: string;
  slug: string;
  cuisine: string;
  icon: string;
}[] = [
  { name: "Chipotle", slug: "chipotle", cuisine: "Mexican", icon: "🌯" },
  { name: "Cava", slug: "cava", cuisine: "Mediterranean", icon: "🥙" },
  { name: "Sweetgreen", slug: "sweetgreen", cuisine: "Salad", icon: "🥗" },
  { name: "Just Salad", slug: "just-salad", cuisine: "Salad", icon: "🥗" },
  { name: "Chick-fil-A", slug: "chick-fil-a", cuisine: "American", icon: "🐔" },
  { name: "McDonald's", slug: "mcdonalds", cuisine: "Fast Food", icon: "🍟" },
  { name: "Shake Shack", slug: "shake-shack", cuisine: "Burgers", icon: "🍔" },
  { name: "Starbucks", slug: "starbucks", cuisine: "Coffee", icon: "☕" },
  { name: "Dunkin'", slug: "dunkin", cuisine: "Coffee", icon: "🍩" },
  { name: "Subway", slug: "subway", cuisine: "Sandwiches", icon: "🥖" },
  { name: "Panera Bread", slug: "panera", cuisine: "Bakery/Cafe", icon: "🥐" },
  { name: "Pret A Manger", slug: "pret", cuisine: "Sandwiches", icon: "🥪" },
  { name: "Jersey Mike's", slug: "jersey-mikes", cuisine: "Sandwiches", icon: "🥪" },
  { name: "Halal Guys", slug: "halal-guys", cuisine: "Halal", icon: "🧆" },
  { name: "Domino's", slug: "dominos", cuisine: "Pizza", icon: "🍕" },
  { name: "Bonchon", slug: "bonchon", cuisine: "Korean", icon: "🍗" },
  { name: "Dig", slug: "dig", cuisine: "American", icon: "🍽" },
  { name: "Dos Toros", slug: "dos-toros", cuisine: "Mexican", icon: "🌮" },
  { name: "Chopt", slug: "chopt", cuisine: "Salad", icon: "🥬" },
  { name: "Wingstop", slug: "wingstop", cuisine: "Wings", icon: "🍗" },
  { name: "Five Guys", slug: "five-guys", cuisine: "Burgers", icon: "🍔" },
  { name: "Panda Express", slug: "panda-express", cuisine: "Chinese", icon: "🥡" },
  { name: "Popeyes", slug: "popeyes", cuisine: "Chicken", icon: "🍗" },
  { name: "Naya", slug: "naya", cuisine: "Mediterranean", icon: "🥙" },
];

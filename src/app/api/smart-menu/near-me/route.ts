import { NextRequest, NextResponse } from "next/server";
import { CHAINS, type MenuItem as ChainMenuItem } from "@/lib/restaurantData";

export const dynamic = "force-dynamic";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pulseScore(item: ChainMenuItem): number {
  let score = 0;
  const ratio = item.protein > 0 ? item.cal / item.protein : Infinity;
  if (ratio <= 7) score += 55;
  else if (ratio <= 10) score += 50;
  else if (ratio <= 14) score += 43;
  else if (ratio <= 18) score += 32;
  else if (ratio <= 25) score += 20;
  else if (ratio <= 35) score += 12;

  if (item.protein >= 40) score += 15;
  else if (item.protein >= 30) score += 12;
  else if (item.protein >= 20) score += 6;
  else if (item.protein >= 10) score += 3;

  if (item.fiber != null && item.cal > 0) {
    const fiberPer100 = (item.fiber / item.cal) * 100;
    if (fiberPer100 >= 2.5) score += 18;
    else if (fiberPer100 >= 1.5) score += 14;
    else if (fiberPer100 >= 0.8) score += 10;
    else if (fiberPer100 >= 0.4) score += 4;
  }

  if (item.cal <= 300) score += 15;
  else if (item.cal <= 450) score += 12;
  else if (item.cal <= 600) score += 8;
  else if (item.cal <= 800) score += 4;

  if (item.sodium > 1800) score -= 6;
  else if (item.sodium > 1500) score -= 3;
  else if (item.sodium > 1200) score -= 1;

  const addedSugar = item.sugar ?? 0;
  if (addedSugar > 20) score -= 6;
  else if (addedSugar > 12) score -= 3;
  else if (addedSugar > 6) score -= 1;

  return Math.max(0, Math.min(100, score));
}

const CHAIN_PATTERNS: { patterns: string[]; slug: string }[] = CHAINS.map((c) => {
  const n = c.name.toUpperCase();
  const patterns: string[] = [n];
  const VARIATIONS: Record<string, string[]> = {
    "MCDONALD'S": ["MCDONALDS", "MC DONALDS"],
    "DUNKIN'": ["DUNKIN", "DUNKIN DONUTS"],
    "CHICK-FIL-A": ["CHICK FIL A", "CHICKFILA"],
    "CHIPOTLE": ["CHIPOTLE MEXICAN", "CHIPOTLE MEXICAN GRILL"],
    "SWEETGREEN": ["SWEET GREEN"],
    "SUBWAY": ["SUBWAY RESTAURANT", "SUBWAY SANDWICHES"],
    "STARBUCKS": ["STARBUCKS COFFEE"],
    "SHAKE SHACK": ["SHAKESHACK"],
    "PANERA": ["PANERA BREAD"],
    "CAVA": ["CAVA GRILL", "CAVA MEZZE"],
    "WENDY'S": ["WENDYS"],
    "BURGER KING": ["BURGER KING CORP"],
    "TACO BELL": ["TACO BELL CORP"],
    "POPEYES": ["POPEYE'S", "POPEYES LOUISIANA"],
    "FIVE GUYS": ["FIVE GUYS BURGERS", "5 GUYS"],
    "JUST SALAD": ["JUST SALAD INC"],
    "PRET A MANGER": ["PRET-A-MANGER"],
    "DIG": ["DIG INN", "DIG FOOD"],
    "KFC": ["KENTUCKY FRIED CHICKEN"],
    "JERSEY MIKE'S": ["JERSEY MIKES"],
  };
  const extra = VARIATIONS[n];
  if (extra) patterns.push(...extra);
  return { patterns, slug: c.slug };
});

function matchChain(dba: string): string | null {
  const upper = dba.toUpperCase().trim();
  for (const { patterns, slug } of CHAIN_PATTERNS) {
    for (const p of patterns) {
      if (upper === p || upper.startsWith(p + " ") || upper.startsWith(p + "#")) return slug;
      if (p.length >= 5 && upper.includes(p)) return slug;
    }
  }
  return null;
}

const MEAL_FILTER: Record<string, (item: ChainMenuItem) => boolean> = {
  breakfast: (i) => !!(i.tags?.some((t) => t === "breakfast") || i.cal <= 500),
  lunch: () => true,
  dinner: () => true,
  snack: (i) => i.cal <= 400,
};

interface DOHMHRow {
  dba?: string;
  cuisine_description?: string;
  grade?: string;
  building?: string;
  street?: string;
  boro?: string;
  latitude?: string;
  longitude?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const meal = searchParams.get("meal") || "lunch";

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng required", restaurants: [] }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const where = `within_circle(location, ${latNum}, ${lngNum}, 800) AND grade IN('A','B')`;
    const url = `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$where=${encodeURIComponent(where)}&$select=dba,cuisine_description,grade,building,street,boro,latitude,longitude&$limit=500&$order=grade ASC`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const rows: DOHMHRow[] = res.ok ? await res.json() : [];

    const chainMap = new Map<string, { slug: string; lat: number; lng: number; dba: string; cuisine: string; address: string }>();

    for (const r of rows) {
      const slug = matchChain(r.dba || "");
      if (!slug) continue;
      const rLat = parseFloat(r.latitude || "0");
      const rLng = parseFloat(r.longitude || "0");
      if (rLat === 0) continue;

      const key = `${slug}-${r.building}-${r.street}`;
      if (chainMap.has(key)) continue;

      chainMap.set(key, {
        slug,
        lat: rLat,
        lng: rLng,
        dba: r.dba || "",
        cuisine: r.cuisine_description || "",
        address: [r.building, r.street, r.boro].filter(Boolean).join(" "),
      });
    }

    const mealFilter = MEAL_FILTER[meal] || MEAL_FILTER.lunch;

    const restaurants = [...chainMap.values()]
      .map((loc) => {
        const chain = CHAINS.find((c) => c.slug === loc.slug);
        if (!chain) return null;

        const distMeters = haversine(latNum, lngNum, loc.lat, loc.lng);
        const walkMinutes = Math.round(distMeters / 80);

        const scored = chain.items
          .filter(mealFilter)
          .map((item) => ({
            id: `${loc.slug}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
            name: item.name,
            calories: item.cal,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            fiber: item.fiber ?? 0,
            pulseScore: pulseScore(item),
          }))
          .sort((a, b) => b.pulseScore - a.pulseScore)
          .slice(0, 3);

        if (scored.length === 0) return null;

        return {
          restaurantId: `${loc.slug}-${loc.lat.toFixed(4)}`,
          restaurantName: chain.name,
          cuisine: chain.category,
          distance: Math.round(distMeters),
          walkMinutes,
          topPicks: scored,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    return NextResponse.json({ restaurants });
  } catch (err) {
    console.error("smart-menu/near-me error:", err);
    return NextResponse.json({ restaurants: [] });
  }
}

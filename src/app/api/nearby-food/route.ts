import { NextRequest, NextResponse } from "next/server";
import { CHAINS } from "@/lib/restaurantData";

export const dynamic = "force-dynamic";

/**
 * Nearby Food API — searches NYC DOHMH Restaurant Inspections for all restaurants
 * near a given lat/lng. Uses paginated Socrata queries to get comprehensive results.
 *
 * Key improvements over v1:
 * - Fetches up to 1000 results (paginated 500+500)
 * - Better chain matching with strict word boundaries
 * - More healthy cuisine categories
 * - Smarter deduplication keeping best grade per restaurant
 */

/* ── Chain matching patterns ──────────────────────────────────── */

const CHAIN_PATTERNS: { patterns: string[]; slug: string; name: string }[] = CHAINS.map((c) => {
  const n = c.name.toUpperCase();
  const patterns: string[] = [n];

  // Add DBA variations that appear in DOHMH data
  const VARIATIONS: Record<string, string[]> = {
    "MCDONALD'S": ["MCDONALDS", "MC DONALDS", "MC DONALD'S", "MCDONALD'S CORP"],
    "DUNKIN'": ["DUNKIN", "DUNKIN DONUTS", "DUNKIN'", "DUNKIN' DONUTS"],
    "CHICK-FIL-A": ["CHICK FIL A", "CHICKFILA", "CHICK-FIL-A INC"],
    "POPEYES": ["POPEYE'S", "POPEYES LOUISIANA", "POPEYE'S LOUISIANA"],
    "PANDA EXPRESS": ["PANDA EXPRESS INC"],
    "DOMINO'S": ["DOMINOS", "DOMINO'S PIZZA", "DOMINOS PIZZA"],
    "PAPA JOHN'S": ["PAPA JOHNS", "PAPA JOHN'S PIZZA", "PAPA JOHNS PIZZA"],
    "PIZZA HUT": ["PIZZA HUT INC", "PIZZA HUT EXPRESS"],
    "BURGER KING": ["BURGER KING CORP", "BURGER KING #"],
    "WENDY'S": ["WENDYS", "WENDY'S OLD FASHIONED", "WENDY'S #"],
    "TACO BELL": ["TACO BELL CORP", "TACO BELL #"],
    "SUBWAY": ["SUBWAY RESTAURANT", "SUBWAY SANDWICHES", "SUBWAY #"],
    "STARBUCKS": ["STARBUCKS COFFEE", "STARBUCKS CORP"],
    "THE HALAL GUYS": ["HALAL GUYS", "THE HALAL GUYS INC"],
    "JERSEY MIKE'S": ["JERSEY MIKES", "JERSEY MIKE'S SUBS"],
    "PRET A MANGER": ["PRET-A-MANGER", "PRET A MANGER US"],
    "FIVE GUYS": ["FIVE GUYS BURGERS", "FIVE GUYS ENTERPRISES", "5 GUYS"],
    "JOE'S PIZZA": ["JOE'S", "JOES PIZZA", "FAMOUS JOE'S"],
    "2 BROS PIZZA": ["2 BROS", "TWO BROS", "2BROS", "2 BROS. PIZZA"],
    "WINGSTOP": ["WING STOP"],
    "BUFFALO WILD WINGS": ["B-DUBS", "BWW", "B DUBS"],
    "RAISING CANE'S": ["RAISING CANES", "RAISING CANE"],
    "KUNG FU TEA": ["KUNGFU TEA"],
    "TIGER SUGAR": ["TIGER SUGAR NYC"],
    "GREGORY'S COFFEE": ["GREGORYS COFFEE", "GREGORY'S"],
    "LUKE'S LOBSTER": ["LUKES LOBSTER"],
    "SMASHBURGER": ["SMASH BURGER"],
    "SHAKE SHACK": ["SHAKESHACK", "SHAKE SHACK #"],
    "CHIPOTLE": ["CHIPOTLE MEXICAN", "CHIPOTLE MEXICAN GRILL"],
    "SWEETGREEN": ["SWEET GREEN"],
    "JUST SALAD": ["JUST SALAD INC"],
    "PANERA": ["PANERA BREAD", "PANERA BREAD CO"],
    "CAVA": ["CAVA GRILL", "CAVA MEZZE"],
    "DIG": ["DIG INN", "DIG FOOD"],
    "APPLEBEE'S": ["APPLEBEES", "APPLEBEE'S GRILL"],
    "CHILI'S": ["CHILIS", "CHILI'S GRILL"],
    "TGI FRIDAY'S": ["TGI FRIDAYS", "T.G.I. FRIDAY'S", "TGIF"],
    "OLIVE GARDEN": ["OLIVE GARDEN ITALIAN"],
    "DENNY'S": ["DENNYS"],
    "IHOP": ["INTERNATIONAL HOUSE OF PANCAKES", "IHOP #"],
    "KFC": ["KENTUCKY FRIED CHICKEN", "KFC #", "KFC/"],
    "CHEESECAKE FACTORY": ["THE CHEESECAKE FACTORY"],
    "BON CHON": ["BONCHON", "BON CHON CHICKEN"],
    "JAMBA JUICE": ["JAMBA", "JAMBA JUICE #"],
    "JUICE PRESS": ["JUICEPRESS"],
    "DOS TOROS": ["DOS TOROS TAQUERIA"],
    "TENDER GREENS": ["TENDERGREENS"],
    "HONEYGROW": ["HONEY GROW"],
    "NAYA": ["NAYA EXPRESS", "NAYA MEZZE"],
    "PLAYA BOWLS": ["PLAYA BOWL"],
    "POKEWORKS": ["POKÉWORKS", "POKE WORKS"],
    "SWEETCATCH POKE": ["SWEET CATCH", "SWEETCATCH"],
    "HALE & HEARTY": ["HALE AND HEARTY", "HALE & HEARTY SOUPS"],
    "WOK TO WALK": ["WOKTOWALK"],
  };

  const extra = VARIATIONS[n];
  if (extra) patterns.push(...extra);

  return { patterns, slug: c.slug, name: c.name };
});

const HEALTHY_CUISINES = [
  "salad", "vegan", "vegetarian", "health food",
  "juice, smoothies, fruit salads", "vegetarian/vegan",
  "mediterranean", "japanese", "thai", "korean",
  "indian", "peruvian", "greek", "turkish",
  "seafood", "tapas", "fruits/vegetables",
  "soups", "soups & sandwiches",
];

/* ── Helpers ───────────────────────────────────────────────── */

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

function matchChain(dba: string): string | null {
  const upper = dba.toUpperCase().trim();

  for (const { patterns, slug } of CHAIN_PATTERNS) {
    for (const pattern of patterns) {
      // Exact match or DBA starts with pattern
      if (upper === pattern || upper.startsWith(pattern + " ") || upper.startsWith(pattern + "#")) {
        return slug;
      }
      // DBA contains pattern as a standalone segment
      if (upper.includes(" " + pattern) || upper.includes(pattern + " ") || upper.includes(pattern)) {
        // Avoid false positives: require the pattern to be a significant portion
        if (pattern.length >= 5 || upper === pattern) {
          return slug;
        }
      }
    }
  }
  return null;
}

/* ── Fetch from DOHMH with pagination ─────────────────────── */

interface DOHMHRow {
  dba?: string;
  cuisine_description?: string;
  grade?: string;
  score?: string;
  building?: string;
  street?: string;
  boro?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
}

async function fetchDOHMH(where: string, offset: number, limit: number): Promise<DOHMHRow[]> {
  const select = "dba,cuisine_description,grade,score,building,street,boro,zipcode,latitude,longitude";
  const url = new URL("https://data.cityofnewyork.us/resource/43nn-pn8j.json");
  url.searchParams.set("$where", where);
  url.searchParams.set("$select", select);
  url.searchParams.set("$limit", String(limit));
  url.searchParams.set("$offset", String(offset));
  url.searchParams.set("$order", "grade ASC, score ASC");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  return res.json();
}

/* ── Main handler ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") || "1600"; // ~1 mile
    const gradeA = searchParams.get("gradeA") === "true";

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng are required", results: [] }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(radiusNum)) {
      return NextResponse.json({ error: "Invalid numeric parameters", results: [] }, { status: 400 });
    }

    let where = `within_circle(location, ${latNum}, ${lngNum}, ${radiusNum})`;
    if (gradeA) {
      where += ` AND grade='A'`;
    }

    // Fetch two pages in parallel (500 + 500 = up to 1000 results)
    const [page1, page2] = await Promise.all([
      fetchDOHMH(where, 0, 500),
      fetchDOHMH(where, 500, 500),
    ]);

    const allData = [...page1, ...page2];

    // Deduplicate: keep best grade per DBA+address
    const dedupMap = new Map<string, DOHMHRow>();
    const gradeOrder: Record<string, number> = { A: 0, B: 1, C: 2 };

    for (const r of allData) {
      const key = `${(r.dba || "").toUpperCase().trim()}-${(r.building || "").trim()}-${(r.street || "").trim().toUpperCase()}`;
      const existing = dedupMap.get(key);
      if (!existing) {
        dedupMap.set(key, r);
      } else {
        // Keep the one with the better (more recent) grade
        const existGrade = gradeOrder[existing.grade || ""] ?? 9;
        const newGrade = gradeOrder[r.grade || ""] ?? 9;
        if (newGrade < existGrade) {
          dedupMap.set(key, r);
        }
      }
    }

    const deduped = Array.from(dedupMap.values());

    const results = deduped
      .map((r) => {
        const rLat = parseFloat(r.latitude || "0");
        const rLng = parseFloat(r.longitude || "0");
        if (rLat === 0 || rLng === 0) return null;
        const cuisine = r.cuisine_description || "";

        return {
          name: r.dba || "Unknown",
          cuisine,
          grade: r.grade || null,
          score: r.score ? Number(r.score) : null,
          address: [r.building, r.street, r.boro, r.zipcode].filter(Boolean).join(" "),
          lat: rLat,
          lng: rLng,
          distance: Math.round(haversine(latNum, lngNum, rLat, rLng)),
          chainSlug: matchChain(r.dba || ""),
          isHealthy: HEALTHY_CUISINES.includes(cuisine.toLowerCase()),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    // Sort: chains first, then healthy, then by distance
    results.sort((a, b) => {
      // Tier 1: chains with nutrition data
      if (a.chainSlug && !b.chainSlug) return -1;
      if (!a.chainSlug && b.chainSlug) return 1;
      // Tier 2: healthy cuisines
      if (a.isHealthy && !b.isHealthy) return -1;
      if (!a.isHealthy && b.isHealthy) return 1;
      // Tier 3: by distance
      return a.distance - b.distance;
    });

    return NextResponse.json({
      results,
      meta: {
        totalRaw: allData.length,
        totalDeduped: deduped.length,
        totalResults: results.length,
        radiusMeters: radiusNum,
      },
    });
  } catch (err) {
    console.error("nearby-food error:", err);
    return NextResponse.json({ results: [] });
  }
}

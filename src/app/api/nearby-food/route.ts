import { NextRequest, NextResponse } from "next/server";
import { canonicalBrand, normalizeVenueName } from "@/lib/venue-normalize";
import { snapCoords, snapPadMeters, GRID_COARSE } from "@/lib/geoSnap";

export const dynamic = "force-dynamic";
// Cap the function so a slow Socrata cold path can never hold a request for
// 15s+ like the June 2026 live audit observed — clients time out at 12s.
export const maxDuration = 15;

const SOURCE_TIMEOUT_MS = 8000;

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

/* Chain matching lives in src/lib/venue-normalize.ts (canonicalBrand) —
 * one alias map shared by every surface. */

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
  return canonicalBrand(dba)?.slug ?? null;
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

// null = upstream failure (distinct from a genuine empty result set)
async function fetchDOHMH(where: string, offset: number, limit: number): Promise<DOHMHRow[] | null> {
  const select = "dba,cuisine_description,grade,score,building,street,boro,zipcode,latitude,longitude";
  const url = new URL("https://data.cityofnewyork.us/resource/43nn-pn8j.json");
  url.searchParams.set("$where", where);
  url.searchParams.set("$select", select);
  url.searchParams.set("$limit", String(limit));
  url.searchParams.set("$offset", String(offset));
  url.searchParams.set("$order", "grade ASC, score ASC");

  const token = process.env.NYC_OPEN_DATA_APP_TOKEN;
  const started = Date.now();
  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      headers: token ? { "X-App-Token": token } : undefined,
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
    const ms = Date.now() - started;
    // <100ms means the Next fetch cache answered; slower means a live Socrata hit
    console.log(`nearby-food upstream offset=${offset} ${ms}ms ${ms < 100 ? "cache-HIT" : "cache-MISS"}`);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error(`nearby-food upstream offset=${offset} failed after ${Date.now() - started}ms:`, err);
    return null;
  }
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

    // Snap the upstream query center to a ~1km grid so nearby users share one
    // cached DOHMH response (fixes the 15s cold start on the flagship surface).
    // Radius is padded by the worst-case snap displacement; results are
    // re-filtered by TRUE distance below, so output is unchanged.
    const snapped = snapCoords(latNum, lngNum, GRID_COARSE);
    const paddedRadius = radiusNum + snapPadMeters(GRID_COARSE);
    let where = `within_circle(location, ${snapped.lat}, ${snapped.lng}, ${paddedRadius})`;
    if (gradeA) {
      where += ` AND grade='A'`;
    }

    // Fetch two pages in parallel (500 + 500 = up to 1000 results)
    const [page1, page2] = await Promise.all([
      fetchDOHMH(where, 0, 500),
      fetchDOHMH(where, 500, 500),
    ]);

    // Both pages failing means Socrata is down/slow, not an empty area —
    // surface a 502 so the client shows its error + retry state instead of
    // rendering "no restaurants nearby".
    if (page1 === null && page2 === null) {
      return NextResponse.json(
        { error: "Restaurant data source unavailable", results: [] },
        { status: 502 },
      );
    }

    const allData = [...(page1 ?? []), ...(page2 ?? [])];

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
          // Normalized for display: raw DOHMH dba is ALL-CAPS with store numbers
          name: normalizeVenueName(r.dba || "Unknown"),
          rawName: r.dba || "Unknown",
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
      .filter((r): r is NonNullable<typeof r> => r !== null)
      // True-distance filter: drops the snap padding so users only see venues
      // within the radius they actually asked for
      .filter((r) => r.distance <= radiusNum);

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

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://data.ny.gov/resource/9a8c-vfzj.json";
// County names are UPPERCASE in the dataset
const NYC_COUNTIES = ["NEW YORK", "KINGS", "QUEENS", "BRONX", "RICHMOND"];
const MILES_TO_METERS = 1609.344;
const DEFAULT_RADIUS = 0.75;
const SOCRATA_LIMIT = 200; // fetch more, trim after sorting by distance
const RETURN_LIMIT = 40;

/* ------------------------------------------------------------------ */
/*  estab_type code → simplified category                             */
/*  A = "Food Store" (large grocery/supermarket)                      */
/*  B = "Food Store" (medium)                                         */
/*  C = "Food Store" (small/convenience)                              */
/*  D = "Food Store" (specialty/bakery/seafood)                       */
/* ------------------------------------------------------------------ */
function simplifyType(code: string | undefined, sqft: number | null, name: string): string {
  const n = name.toUpperCase();

  // Known chains → Supermarket
  if (/TRADER JOE|WHOLE FOODS|KEY FOOD|STOP & SHOP|ALDI|TARGET|COSTCO|BJ'S|FOOD BAZAAR|FAIRWAY|WEGMANS|FOOD EMPORIUM|C-?TOWN|ASSOCIATED|WESTERN BEEF|LIDL|SHOPRITE|FOOD DYNASTY|GRISTEDES|MORTON WILLIAMS|FRESH DIRECT|AMAZON FRESH/.test(n)) {
    return "Supermarket";
  }

  // Size-based classification
  if (sqft && sqft >= 10000) return "Supermarket";
  if (sqft && sqft >= 3000) return "Grocery";
  if (sqft && sqft < 1500) return "Bodega";

  // Type-code based
  const t = (code ?? "").toUpperCase();
  if (t === "A") return "Grocery";
  if (t === "B") return "Grocery";
  if (t === "C") return "Convenience";
  if (t === "D") return "Specialty";
  return "Grocery";
}

/* ------------------------------------------------------------------ */
/*  Haversine distance (miles)                                        */
/* ------------------------------------------------------------------ */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ------------------------------------------------------------------ */
/*  Socrata row shape (actual column names from the dataset)          */
/* ------------------------------------------------------------------ */
interface SocrataRow {
  entity_name?: string;
  dba_name?: string;
  estab_type?: string;
  operation_type?: string;
  street_number?: string;
  street_name?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  square_footage?: string;
  georeference?: { type: string; coordinates: [number, number] };
}

/* ------------------------------------------------------------------ */
/*  GET handler                                                       */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseFloat(searchParams.get("radius") ?? "") || DEFAULT_RADIUS;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params are required" },
      { status: 400 },
    );
  }

  const radiusMeters = radius * MILES_TO_METERS;
  const countyFilter = NYC_COUNTIES.map((c) => `county='${c}'`).join(" OR ");

  const params = new URLSearchParams({
    "$where": `within_circle(georeference,${lat},${lng},${radiusMeters}) AND (${countyFilter}) AND operation_type='Store'`,
    "$select": "entity_name,dba_name,estab_type,street_number,street_name,city,state,zip_code,county,square_footage,georeference",
    "$limit": String(SOCRATA_LIMIT),
  });

  try {
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) {
      throw new Error(`Socrata API responded ${res.status}: ${res.statusText}`);
    }

    const rows: SocrataRow[] = await res.json();

    const stores = rows
      .filter((r) => r.georeference?.coordinates)
      .map((r) => {
        const [storeLng, storeLat] = r.georeference!.coordinates;
        const sqft = r.square_footage ? parseInt(r.square_footage, 10) : null;
        const name = r.dba_name || r.entity_name || "Unknown";
        const parts = [
          r.street_number,
          r.street_name,
          r.city,
          r.state,
          r.zip_code,
        ].filter(Boolean);

        return {
          name: titleCase(name),
          type: simplifyType(r.estab_type, sqft, name),
          address: parts.join(" "),
          lat: storeLat,
          lng: storeLng,
          distance: Math.round(haversine(lat, lng, storeLat, storeLng) * 100) / 100,
          sqft,
          zip: r.zip_code ?? "",
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, RETURN_LIMIT);

    return NextResponse.json({ stores, count: stores.length });
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to fetch grocery stores: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }
}

/** Convert "TRADER JOES #579" → "Trader Joes #579" */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(?:^|\s|[-/])\S/g, (c) => c.toUpperCase());
}

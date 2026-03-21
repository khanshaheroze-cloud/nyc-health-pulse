import { NextRequest, NextResponse } from "next/server";

// NYC Farmers Markets — NYC Open Data 8vwk-6iz2
// Columns: marketname, borough, streetaddress, latitude, longitude,
//          daysoperation, hoursoperations, accepts_ebt, open_year_round
export const revalidate = 86400; // 1 day

const DATASET_URL =
  "https://data.cityofnewyork.us/resource/8vwk-6iz2.json";

const SELECT_FIELDS = [
  "marketname",
  "borough",
  "streetaddress",
  "latitude",
  "longitude",
  "daysoperation",
  "hoursoperations",
  "accepts_ebt",
  "open_year_round",
].join(",");

// Haversine distance in miles
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RawMarket {
  marketname?: string;
  borough?: string;
  streetaddress?: string;
  latitude?: string;
  longitude?: string;
  daysoperation?: string;
  hoursoperations?: string;
  accepts_ebt?: string;
  open_year_round?: string;
}

interface Market {
  name: string;
  address: string;
  borough: string;
  lat: number;
  lng: number;
  distance: number;
  daysHours: string;
  acceptsEBT: boolean;
  season: string;
}

function formatDaysHours(days?: string, hours?: string): string {
  const d = days?.trim() ?? "";
  const h = hours?.trim() ?? "";
  if (d && h) return `${d} ${h}`;
  return d || h || "Hours not listed";
}

function formatSeason(yearRound?: string): string {
  if (!yearRound) return "Seasonal";
  return yearRound.toLowerCase() === "yes" ? "Year-round" : "Seasonal (Jun–Nov)";
}

function parseMarket(raw: RawMarket, userLat?: number, userLng?: number): Market | null {
  const lat = parseFloat(raw.latitude ?? "");
  const lng = parseFloat(raw.longitude ?? "");
  if (isNaN(lat) || isNaN(lng)) return null;

  const distance =
    userLat !== undefined && userLng !== undefined
      ? Math.round(haversine(userLat, userLng, lat, lng) * 100) / 100
      : 0;

  return {
    name: raw.marketname ?? "Unknown Market",
    address: raw.streetaddress ?? "",
    borough: raw.borough ?? "Unknown",
    lat,
    lng,
    distance,
    daysHours: formatDaysHours(raw.daysoperation, raw.hoursoperations),
    acceptsEBT: (raw.accepts_ebt ?? "").toLowerCase() === "yes",
    season: formatSeason(raw.open_year_round),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const hasLocation = latParam !== null && lngParam !== null;
  const userLat = hasLocation ? parseFloat(latParam) : undefined;
  const userLng = hasLocation ? parseFloat(lngParam) : undefined;

  if (hasLocation && (isNaN(userLat!) || isNaN(userLng!))) {
    return NextResponse.json(
      { error: "Invalid lat/lng values" },
      { status: 400 },
    );
  }

  try {
    const url = `${DATASET_URL}?$limit=200&$select=${SELECT_FIELDS}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) {
      throw new Error(`NYC Open Data responded ${res.status}`);
    }

    const raw: RawMarket[] = await res.json();

    const markets = raw
      .map((r) => parseMarket(r, userLat, userLng))
      .filter((m): m is Market => m !== null);

    // If user provided location, sort by proximity and return nearest 15
    if (hasLocation) {
      markets.sort((a, b) => a.distance - b.distance);
      const nearest = markets.slice(0, 15);
      return NextResponse.json({
        markets: nearest,
        count: nearest.length,
      });
    }

    // Otherwise group by borough
    const grouped: Record<string, Market[]> = {};
    for (const m of markets) {
      const key = m.borough || "Other";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    }

    // Sort within each borough alphabetically
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      boroughs: grouped,
      count: markets.length,
    });
  } catch (e) {
    console.error("Farmers Markets API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch farmers markets data", markets: [], count: 0 },
      { status: 502 },
    );
  }
}

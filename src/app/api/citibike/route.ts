import { NextRequest, NextResponse } from "next/server";

// Citi Bike live station availability (GBFS feed — free, no key needed)
export const dynamic = "force-dynamic";

const STATION_INFO_URL = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json";
const STATION_STATUS_URL = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json";

interface StationInfo {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
}

interface StationStatus {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
  is_renting: number;
  is_returning: number;
}

// Simple haversine distance in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseFloat(searchParams.get("radius") ?? "0.5"); // miles

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  try {
    const [infoRes, statusRes] = await Promise.all([
      fetch(STATION_INFO_URL),
      fetch(STATION_STATUS_URL),
    ]);

    if (!infoRes.ok || !statusRes.ok) {
      throw new Error("Citi Bike GBFS feed unavailable");
    }

    const infoData = await infoRes.json();
    const statusData = await statusRes.json();

    const stations: StationInfo[] = infoData.data.stations;
    const statuses: StationStatus[] = statusData.data.stations;

    const statusMap = new Map(statuses.map(s => [s.station_id, s]));

    // Find nearby stations
    const nearby = stations
      .map(s => {
        const dist = haversine(lat, lng, s.lat, s.lon);
        const status = statusMap.get(s.station_id);
        return {
          id: s.station_id,
          name: s.name,
          lat: s.lat,
          lng: s.lon,
          capacity: s.capacity,
          bikes: status?.num_bikes_available ?? 0,
          docks: status?.num_docks_available ?? 0,
          active: (status?.is_renting ?? 0) === 1,
          distance: Math.round(dist * 100) / 100,
        };
      })
      .filter(s => s.distance <= radius && s.active)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 15);

    // Summary stats
    const totalBikes = nearby.reduce((s, st) => s + st.bikes, 0);
    const totalDocks = nearby.reduce((s, st) => s + st.docks, 0);

    return NextResponse.json({
      stations: nearby,
      summary: {
        count: nearby.length,
        totalBikes,
        totalDocks,
        radius,
      },
    });
  } catch (e) {
    console.error("Citi Bike API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

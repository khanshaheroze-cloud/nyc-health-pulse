import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Route Amenities API — finds water fountains, restrooms, subway stations,
 * and Citi Bike docks near a route.
 *
 * Query params: lat, lng, radius (meters, default 500)
 */

interface Amenity {
  type: "water" | "restroom" | "subway" | "citibike";
  name: string;
  lat: number;
  lng: number;
  note?: string;
}

// Current month check for seasonal fountain warning
function isFountainSeason(): boolean {
  const month = new Date().getMonth(); // 0-indexed
  return month >= 3 && month <= 10; // Apr–Oct
}

async function fetchWaterFountains(lat: number, lng: number, radius: number): Promise<Amenity[]> {
  try {
    // NYC Parks Drinking Fountains — dataset beij-nrfg
    const url = `https://data.cityofnewyork.us/resource/beij-nrfg.json?$where=within_circle(the_geom,${lat},${lng},${radius})&$limit=20`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();

    const inSeason = isFountainSeason();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((d: any) => ({
      type: "water" as const,
      name: d.location || d.park_name || "Water Fountain",
      lat: parseFloat(d.latitude || d.the_geom?.coordinates?.[1] || "0"),
      lng: parseFloat(d.longitude || d.the_geom?.coordinates?.[0] || "0"),
      note: inSeason ? undefined : "Seasonal — may be off (Nov–Mar)",
    })).filter((a: Amenity) => a.lat !== 0);
  } catch {
    return [];
  }
}

async function fetchRestrooms(lat: number, lng: number, radius: number): Promise<Amenity[]> {
  try {
    // NYC Parks Public Restrooms — dataset hjae-yuav
    const url = `https://data.cityofnewyork.us/resource/hjae-yuav.json?$where=within_circle(the_geom,${lat},${lng},${radius})&$limit=20`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((d: any) => ({
      type: "restroom" as const,
      name: d.location || d.name || "Public Restroom",
      lat: d.the_geom?.coordinates?.[1] ?? parseFloat(d.latitude ?? "0"),
      lng: d.the_geom?.coordinates?.[0] ?? parseFloat(d.longitude ?? "0"),
      note: d.status === "Not Operational" ? "Currently closed" : undefined,
    })).filter((a: Amenity) => a.lat !== 0);
  } catch {
    return [];
  }
}

async function fetchSubwayStations(lat: number, lng: number, radius: number): Promise<Amenity[]> {
  try {
    // MTA Subway Stations — dataset kk4q-3rt2
    const url = `https://data.cityofnewyork.us/resource/kk4q-3rt2.json?$where=within_circle(the_geom,${lat},${lng},${radius})&$limit=10`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((d: any) => ({
      type: "subway" as const,
      name: `${d.name || "Station"} (${d.line || ""})`,
      lat: d.the_geom?.coordinates?.[1] ?? parseFloat(d.the_geom_latitude ?? "0"),
      lng: d.the_geom?.coordinates?.[0] ?? parseFloat(d.the_geom_longitude ?? "0"),
    })).filter((a: Amenity) => a.lat !== 0);
  } catch {
    return [];
  }
}

async function fetchCitiBike(lat: number, lng: number, radius: number): Promise<Amenity[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/citibike?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!res.ok) {
      // Direct GBFS call as fallback
      const infoRes = await fetch("https://gbfs.citibikenyc.com/gbfs/en/station_information.json");
      if (!infoRes.ok) return [];
      const info = await infoRes.json();
      const stations = info.data?.stations ?? [];

      // Haversine filter
      const results: Amenity[] = [];
      for (const s of stations) {
        const dLat = (s.lat - lat) * 111320;
        const dLng = (s.lon - lng) * 111320 * Math.cos(lat * Math.PI / 180);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist <= radius) {
          results.push({
            type: "citibike",
            name: s.name,
            lat: s.lat,
            lng: s.lon,
          });
        }
        if (results.length >= 10) break;
      }
      return results;
    }
    const data = await res.json();
    return ((data.stations ?? []) as { name: string; lat: number; lng: number }[])
      .slice(0, 10)
      .map((s) => ({
        type: "citibike" as const,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
      }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseInt(searchParams.get("radius") ?? "500", 10);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  // Fetch all amenity types in parallel
  const [water, restrooms, subway, citibike] = await Promise.all([
    fetchWaterFountains(lat, lng, radius),
    fetchRestrooms(lat, lng, radius),
    fetchSubwayStations(lat, lng, radius),
    fetchCitiBike(lat, lng, radius),
  ]);

  return NextResponse.json({
    amenities: [...water, ...restrooms, ...subway, ...citibike],
    counts: {
      water: water.length,
      restrooms: restrooms.length,
      subway: subway.length,
      citibike: citibike.length,
    },
    fountainSeason: isFountainSeason(),
  });
}

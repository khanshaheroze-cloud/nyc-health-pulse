import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { neighborhoods, neighborhoodScores } from "@/lib/neighborhoodData";

export const dynamic = "force-dynamic";

let cachedGeo: GeoJSON | null = null;

interface GeoJSONFeature {
  type: "Feature";
  properties: { GEOCODE: number; GEONAME: string; BOROUGH: string };
  geometry: { type: string; coordinates: number[][][][] | number[][][] };
}

interface GeoJSON {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

function loadGeoJSON(): GeoJSON {
  if (cachedGeo) return cachedGeo;
  const raw = readFileSync(join(process.cwd(), "public", "uhf42.json"), "utf-8");
  cachedGeo = JSON.parse(raw);
  return cachedGeo!;
}

function pointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function findNeighborhood(lat: number, lng: number): GeoJSONFeature | null {
  const geo = loadGeoJSON();
  for (const f of geo.features) {
    const { type, coordinates } = f.geometry;
    if (type === "Polygon") {
      const rings = coordinates as number[][][];
      if (pointInRing(lat, lng, rings[0])) return f;
    } else if (type === "MultiPolygon") {
      const polys = coordinates as number[][][][];
      for (const poly of polys) {
        if (pointInRing(lat, lng, poly[0])) return f;
      }
    }
  }
  return null;
}

function aqiLabel(aqi: number | null): string {
  if (aqi == null) return "Unavailable";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  return "Unhealthy";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
    }

    const feature = findNeighborhood(lat, lng);
    if (!feature) {
      return NextResponse.json({ error: "Location not within NYC UHF42 boundaries" }, { status: 404 });
    }

    const geocode = feature.properties.GEOCODE;
    const n = neighborhoods.find((nb) => nb.geocode === geocode);
    if (!n) {
      return NextResponse.json({ error: "Neighborhood data not found" }, { status: 404 });
    }

    const hs = neighborhoodScores.get(n.slug);

    let aqi: number | null = null;
    try {
      const aqiRes = await fetch(`${req.nextUrl.origin}/api/airnow`, { next: { revalidate: 3600 } });
      if (aqiRes.ok) {
        const aqiData = await aqiRes.json();
        if (aqiData.observations?.length > 0) {
          aqi = Math.max(...aqiData.observations.map((o: { AQI: number }) => o.AQI));
        }
      }
    } catch {}

    let crashes12mo = 0;
    try {
      const crashRes = await fetch(`${req.nextUrl.origin}/api/crashes`, { next: { revalidate: 86400 } });
      if (crashRes.ok) {
        const crashData = await crashRes.json();
        const boroughRow = crashData.byBorough?.find(
          (b: { borough: string }) => b.borough?.toUpperCase() === n.borough.toUpperCase(),
        );
        if (boroughRow) {
          crashes12mo = Number(boroughRow.crashes) || 0;
        }
      }
    } catch {}

    return NextResponse.json({
      name: n.name,
      borough: n.borough,
      healthScore: hs?.score ?? 0,
      healthGrade: hs?.grade ?? "?",
      aqi,
      aqiLabel: aqiLabel(aqi),
      lifeExpectancy: n.metrics.lifeExp,
      crashes12mo,
    });
  } catch (err) {
    console.error("neighborhood-health error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

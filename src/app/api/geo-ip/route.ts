import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const lat = req.headers.get("x-vercel-ip-latitude");
  const lng = req.headers.get("x-vercel-ip-longitude");
  const city = req.headers.get("x-vercel-ip-city");

  if (lat && lng) {
    return NextResponse.json({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      city: city ? decodeURIComponent(city) : null,
      source: "vercel-ip",
    });
  }

  return NextResponse.json({
    lat: 40.7128,
    lng: -74.006,
    city: "New York",
    source: "default",
  });
}

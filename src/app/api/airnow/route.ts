import { NextResponse } from "next/server";

// Hourly revalidation — AirNow updates observations every hour
export const revalidate = 3600;

const NYC_ZIPS = ["10001", "10451", "11201"]; // Manhattan, Bronx, Brooklyn
const BASE = "https://www.airnowapi.org/aq/observation/zipCode/current/";

export async function GET() {
  const key = process.env.AIRNOW_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "AIRNOW_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const requests = NYC_ZIPS.map((zip) =>
      fetch(
        `${BASE}?format=application/json&zipCode=${zip}&distance=5&API_KEY=${key}`,
        { next: { revalidate: 3600 } }
      ).then((r) => (r.ok ? r.json() : []))
    );

    const results = await Promise.all(requests);
    const observations: object[] = results.flat();

    return NextResponse.json({
      observations,
      timestamp: new Date().toISOString(),
      zips: NYC_ZIPS,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch AirNow data", detail: String(err) },
      { status: 502 }
    );
  }
}

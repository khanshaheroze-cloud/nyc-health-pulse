import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/curatedRoutes";
import { scoreAllRoutes, cityRunScore, type RunConditions } from "@/lib/runScoring";
import { fetchAirNowAQI, fetchWeatherUV, fetchPollenForecast } from "@/lib/liveData";

export const revalidate = 300; // 5 min cache

export async function GET() {
  const [airNow, weather, pollen] = await Promise.all([
    fetchAirNowAQI(),
    fetchWeatherUV(),
    fetchPollenForecast(),
  ]);

  const now = new Date();
  const nycHour = parseInt(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(now), 10);

  const conditions: RunConditions = {
    aqi: airNow?.aqi ?? null,
    aqiCategory: airNow?.category ?? "Unknown",
    uvIndex: weather?.uvIndex ?? null,
    tempF: weather?.tempF ?? null,
    feelsLikeF: weather?.feelsLikeF ?? null,
    humidity: weather?.humidity ?? null,
    windMph: weather?.windMph ?? null,
    weatherLabel: weather?.weatherLabel ?? null,
    hour: nycHour,
  };

  const city = cityRunScore(conditions);
  const scored = scoreAllRoutes(ROUTES, conditions);

  return NextResponse.json({
    conditions,
    city,
    routes: scored,
    pollen: pollen ? { level: pollen.level, topAllergens: pollen.topAllergens } : null,
    updatedAt: now.toISOString(),
  });
}

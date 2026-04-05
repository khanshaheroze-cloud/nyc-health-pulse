import { DailyHealthCheck } from "@/components/DailyHealthCheck";
import { HeroBanner } from "@/components/overview/HeroBanner";
import { WorkoutWidget } from "@/components/overview/WorkoutWidget";
import { NutritionWidget } from "@/components/overview/NutritionWidget";
import { EatSmartNearby } from "@/components/overview/EatSmartNearby";
import { NeighborhoodBar } from "@/components/overview/NeighborhoodBar";
import { HealthStatusChips } from "@/components/overview/HealthStatusChips";
import { OverviewBoroughCharts } from "@/components/overview/OverviewBoroughCharts";
import { AlertBanner } from "@/components/AlertBanner";
import { chronicOutcomes as staticOutcomes } from "@/lib/data";
import {
  fetchCovidByBorough,
  fetchRodentByBorough,
  fetchCriticalViolationsCount,
  fetchWaterQuality,
  fetchCitywideAirQuality,
  fetchAirNowAQI,
  fetchPollenForecast,
  fetchWeatherUV,
  fetchCdcPlacesByBorough,
} from "@/lib/liveData";

export default async function OverviewPage() {
  const [covidBorough, rodentData, critViolations, waterQuality, citywideAir, airNow, pollen, weather, cdcPlaces] = await Promise.all([
    fetchCovidByBorough(),
    fetchRodentByBorough(),
    fetchCriticalViolationsCount(),
    fetchWaterQuality(),
    fetchCitywideAirQuality(),
    fetchAirNowAQI(),
    fetchPollenForecast(),
    fetchWeatherUV(),
    fetchCdcPlacesByBorough(),
  ]);

  const totalHosp = covidBorough?.reduce((s, d) => s + d.hosp, 0) || 1763;

  let activeRate = 170;
  if (rodentData && rodentData.length > 0) {
    const rodentActive = rodentData.reduce((s, d) => s + d.active, 0);
    const rodentTotal  = rodentData.reduce((s, d) => s + d.total, 0);
    if (rodentTotal > 0) activeRate = Math.round((rodentActive / rodentTotal) * 1000);
  }

  // Derived labels
  const airLabel = airNow ? airNow.category : citywideAir ? (citywideAir.pm25 < 9 ? "Good" : citywideAir.pm25 < 12 ? "Moderate" : "Unhealthy") : "Good";
  const covidLabel = totalHosp < 2000 ? "Low" : totalHosp < 3000 ? "Moderate" : "Elevated";
  const waterSafePct = waterQuality
    ? ((1 - waterQuality.coliformDetected / waterQuality.totalSamples) * 100).toFixed(1)
    : "99.9";

  // Build chart data — prefer live CDC PLACES, fall back to static
  const chronicOutcomes = cdcPlaces
    ? [
        { measure: "Obesity", ...Object.fromEntries(cdcPlaces.map(b => [b.borough, b.obesity ?? 0])) },
        { measure: "Diabetes", ...Object.fromEntries(cdcPlaces.map(b => [b.borough, b.diabetes ?? 0])) },
        { measure: "Depression", ...Object.fromEntries(cdcPlaces.map(b => [b.borough, b.depression ?? 0])) },
        { measure: "High BP", ...Object.fromEntries(cdcPlaces.map(b => [b.borough, b.highBP ?? 0])) },
      ]
    : staticOutcomes;

  const inactivityData = cdcPlaces
    ? cdcPlaces.map(b => ({ borough: b.borough, pct: b.inactivity ?? 0 }))
    : [
        { borough: "Bronx", pct: 34.7 },
        { borough: "Brooklyn", pct: 28.9 },
        { borough: "Manhattan", pct: 22.1 },
        { borough: "Queens", pct: 28.6 },
        { borough: "Staten Is.", pct: 29.4 },
      ];

  return (
    <div className="space-y-0">
      {/* 1. TODAY IN NYC ticker — keep as-is */}
      <DailyHealthCheck
        airLabel={airLabel}
        airAqi={airNow?.aqi ?? null}
        covidLabel={covidLabel}
        totalHosp={totalHosp}
        iliRate={3.84}
        waterSafePct={waterSafePct}
      />

      {/* 2. Simplified hero — greeting + AQI mini-ring + weather */}
      <div className="mt-5">
        <HeroBanner
          aqi={airNow?.aqi ?? null}
          aqiCategory={airNow?.category ?? airLabel}
          tempF={weather?.tempF ?? null}
          weatherLabel={weather?.weatherLabel ?? null}
        />
      </div>

      {/* Emergency alert banner */}
      <AlertBanner aqi={airNow?.aqi ?? null} />

      {/* 3. Workout + Nutrition — side by side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <WorkoutWidget />
        <NutritionWidget />
      </div>

      {/* 4. Eat Smart — mini map + top picks */}
      <div className="mt-5">
        <EatSmartNearby />
      </div>

      {/* 5. Borough health charts — chronic disease + inactivity */}
      <div className="mt-5">
        <OverviewBoroughCharts chronicOutcomes={chronicOutcomes} inactivityData={inactivityData} />
      </div>

      {/* 6. Neighborhood stat bar */}
      <div className="mt-5">
        <NeighborhoodBar />
      </div>

      {/* 7. Health Status chips */}
      <div className="mt-5">
        <HealthStatusChips
          airLabel={airLabel}
          airAqi={airNow?.aqi ?? null}
          covidLabel={covidLabel}
          totalHosp={totalHosp}
          iliRate={3.84}
          waterSafePct={waterSafePct}
          pollenLevel={pollen?.level ?? null}
          rodentActive={activeRate}
        />
      </div>
    </div>
  );
}

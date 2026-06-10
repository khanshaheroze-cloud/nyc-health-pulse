import type { Metadata } from "next";
import { Suspense } from "react";
import { WedgeSection } from "@/components/wedge/WedgeSection";
import { EnvironmentBackdrop } from "@/components/wedge/EnvironmentBackdrop";
import { BentoGrid } from "@/components/wedge/BentoGrid";
import { WeeklyChanges } from "@/components/WeeklyChanges";
import { OverviewBoroughCharts } from "@/components/overview/OverviewBoroughCharts";
import { AlertBanner } from "@/components/AlertBanner";
import { NeighborhoodBar } from "@/components/overview/NeighborhoodBar";
import { HealthStatusChips } from "@/components/overview/HealthStatusChips";
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

export const metadata: Metadata = {
  title: "PulseNYC — Healthy food near you, right now",
  description:
    "Find the best healthy spots open near you in NYC right now, with what to order. Plus live air quality, run routes, neighborhood health, and building safety — all in one place.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PulseNYC — Healthy food near you, right now",
    description:
      "Find the best healthy spots open near you in NYC right now, with what to order. Plus live air quality, run routes, neighborhood health, and building safety — all in one place.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "PulseNYC — Healthy food near you, right now",
    description:
      "Find the best healthy spots open near you in NYC right now, with what to order. Plus live air quality, run routes, neighborhood health, and building safety — all in one place.",
  },
};

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

  // ── Canonical weather/AQI source — single truth for all homepage components ──
  // Fallback chain MUST mirror /air-quality's AirQualityHero (AirNow, else
  // NYCCAS pm2.5 * 4.2, else the static seed) — the homepage previously fell
  // back to a hardcoded 42 while /air-quality estimated ~26 from NYCCAS,
  // which was the recurring May–June AQI drift between the two surfaces.
  const canonicalAqi = airNow?.aqi ?? Math.round((citywideAir?.pm25 ?? 6.66) * 4.2);
  const canonicalAqiCategory = airNow?.category ?? (citywideAir ? (citywideAir.pm25 < 9 ? "Good" : citywideAir.pm25 < 12 ? "Moderate" : "Unhealthy") : "Good");
  const canonicalTempF = weather?.tempF ?? null;
  const canonicalUV = weather?.uvIndex ?? null;
  const canonicalPollenLevel = pollen?.level ?? null;

  const totalHosp = covidBorough?.reduce((s, d) => s + d.hosp, 0) || 1763;

  let activeRate = 170;
  if (rodentData && rodentData.length > 0) {
    const rodentActive = rodentData.reduce((s, d) => s + d.active, 0);
    const rodentTotal  = rodentData.reduce((s, d) => s + d.total, 0);
    if (rodentTotal > 0) activeRate = Math.round((rodentActive / rodentTotal) * 1000);
  }

  const airLabel = canonicalAqiCategory;
  const covidLabel = totalHosp < 2000 ? "Low" : totalHosp < 3000 ? "Moderate" : "Elevated";
  const waterSafePct = waterQuality
    ? ((1 - waterQuality.coliformDetected / waterQuality.totalSamples) * 100).toFixed(1)
    : "99.9";

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
    <div className="relative space-y-0">
      <EnvironmentBackdrop weatherLabel={weather?.weatherLabel ?? null} />
      <div className="relative z-[1]">
      {/* Emergency alert banner */}
      <AlertBanner aqi={canonicalAqi} />

      {/* ── WEDGE: Hero + Search + Chips + Results + Waitlist ── */}
      <Suspense>
        <WedgeSection />
      </Suspense>

      {/* ── BENTO GRID: The rest of PulseNYC ── */}
      <BentoGrid
        aqi={canonicalAqi}
        aqiCategory={canonicalAqiCategory}
        tempF={canonicalTempF}
        uvIndex={canonicalUV}
        pollenLevel={canonicalPollenLevel}
      />

      {/* ── What's Happening (demoted below bento, not deleted) ── */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-16">
        <WeeklyChanges
          totalHosp={totalHosp}
          iliRate={3.84}
          rodentActive={activeRate}
          airAqi={canonicalAqi}
          airLabel={airLabel}
          critViolations={critViolations}
          pollenLevel={canonicalPollenLevel}
          lastUpdated={new Date().toISOString()}
        />
      </div>

      {/* ── Health data zone ── */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-8">
        <OverviewBoroughCharts chronicOutcomes={chronicOutcomes} inactivityData={inactivityData} />
      </div>

      {/* ── Stay informed ── */}
      {/* Digest signup demoted: the app waitlist (in WedgeSection, with a
          digest add-on at confirmation) is the single primary email capture */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-8 space-y-4">
        <NeighborhoodBar />
      </div>

      {/* Health Status chips */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-8 mb-4">
        <HealthStatusChips
          airLabel={airLabel}
          airAqi={canonicalAqi}
          covidLabel={covidLabel}
          totalHosp={totalHosp}
          iliRate={3.84}
          waterSafePct={waterSafePct}
          pollenLevel={canonicalPollenLevel}
          rodentActive={activeRate}
        />
      </div>
      </div>
    </div>
  );
}

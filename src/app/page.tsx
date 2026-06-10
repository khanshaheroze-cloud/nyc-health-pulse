import type { Metadata } from "next";
import { Suspense } from "react";
import { WedgeSection } from "@/components/wedge/WedgeSection";
import { EnvironmentBackdrop } from "@/components/wedge/EnvironmentBackdrop";
import { BentoGrid } from "@/components/wedge/BentoGrid";
import { WeeklyChanges } from "@/components/WeeklyChanges";
import { AlertBanner } from "@/components/AlertBanner";
import { NeighborhoodBar } from "@/components/overview/NeighborhoodBar";
import { HealthStatusChips } from "@/components/overview/HealthStatusChips";
import {
  fetchCovidByBorough,
  fetchRodentByBorough,
  fetchCriticalViolationsCount,
  fetchWaterQuality,
  fetchCitywideAirQuality,
  fetchAirNowAQI,
  fetchPollenForecast,
  fetchWeatherUV,
} from "@/lib/liveData";

const WEDGE_TITLE = "PulseNYC — Healthy food under $15 near you, right now";
const WEDGE_DESCRIPTION =
  "The 5 best macro-friendly meals under $15, within a 10-minute walk — with exactly what to order. Live DOHMH grades, real macros, and subway-stop-aware search across NYC.";

export const metadata: Metadata = {
  title: WEDGE_TITLE,
  description: WEDGE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: WEDGE_TITLE, description: WEDGE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: WEDGE_TITLE, description: WEDGE_DESCRIPTION },
};

export default async function OverviewPage() {
  const [covidBorough, rodentData, critViolations, waterQuality, citywideAir, airNow, pollen, weather] = await Promise.all([
    fetchCovidByBorough(),
    fetchRodentByBorough(),
    fetchCriticalViolationsCount(),
    fetchWaterQuality(),
    fetchCitywideAirQuality(),
    fetchAirNowAQI(),
    fetchPollenForecast(),
    fetchWeatherUV(),
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

      {/* Borough chronic-disease/inactivity charts removed from the homepage —
          they dilute the food story; they live on /health-data and
          /chronic-disease */}

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

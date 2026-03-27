import { HealthNewsFeed } from "@/components/HealthNewsFeed";
import { EmailSignup } from "@/components/EmailSignup";
import { WeeklyChanges } from "@/components/WeeklyChanges";
import { DailyHealthCheck } from "@/components/DailyHealthCheck";
import { AlertBanner } from "@/components/AlertBanner";
import { OutdoorHero } from "@/components/OutdoorHero";
import { MyNeighborhood } from "@/components/MyNeighborhood";
import { ExploreGrid } from "@/components/ExploreGrid";
import { FeaturedInsights } from "@/components/FeaturedInsights";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ROUTES } from "@/lib/routes";
import {
  fetchCovidByBorough,
  fetchRodentByBorough,
  fetchCriticalViolationsCount,
  fetchWaterQuality,
  fetchCitywideAirQuality,
  fetchAirNowAQI,
  fetchBeachWater,
  fetchPollenForecast,
  fetchWeatherUV,
} from "@/lib/liveData";

export default async function OverviewPage() {
  const [covidBorough, rodentData, critViolations, waterQuality, citywideAir, airNow, beachWater, pollen, weather] = await Promise.all([
    fetchCovidByBorough(),
    fetchRodentByBorough(),
    fetchCriticalViolationsCount(),
    fetchWaterQuality(),
    fetchCitywideAirQuality(),
    fetchAirNowAQI(),
    fetchBeachWater(),
    fetchPollenForecast(),
    fetchWeatherUV(),
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

  // Suggested route
  const suggestedRoute = ROUTES.find(r => r.carFree && r.difficulty === "Easy") ?? ROUTES[0];

  return (
    <div className="stagger-children">
      {/* 1. TODAY IN NYC ticker */}
      <DailyHealthCheck
        airLabel={airLabel}
        airAqi={airNow?.aqi ?? null}
        covidLabel={covidLabel}
        totalHosp={totalHosp}
        iliRate={3.84}
        waterSafePct={waterSafePct}
      />

      {/* 2. Neighborhood banner (search + personalization) */}
      <MyNeighborhood />

      {/* 3. HERO — outdoor conditions + inline food logger */}
      <OutdoorHero
        aqi={airNow?.aqi ?? null}
        aqiCategory={airNow?.category ?? airLabel}
        pollen={pollen ? { level: pollen.level, topAllergens: pollen.topAllergens } : null}
        uvIndex={weather?.uvIndex ?? null}
        tempF={weather?.tempF ?? null}
        feelsLikeF={weather?.feelsLikeF ?? null}
        weatherLabel={weather?.weatherLabel ?? null}
        humidity={weather?.humidity ?? null}
        windMph={weather?.windMph ?? null}
        suggestedRoute={suggestedRoute}
      />

      {/* Emergency alert banner */}
      <AlertBanner aqi={airNow?.aqi ?? null} />

      {/* 4. Explore Pulse NYC grid */}
      <ScrollReveal>
        <div className="mb-6">
          <ExploreGrid />
        </div>
      </ScrollReveal>

      {/* 5. What's Happening — compact list */}
      <ScrollReveal>
        <div className="mb-6">
          <WeeklyChanges />
        </div>
      </ScrollReveal>

      {/* 6. NYC Health News + Featured Insights */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">NYC Health News</h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <FeaturedInsights />
        <div className="mt-4 mb-8">
          <HealthNewsFeed />
        </div>
      </ScrollReveal>

      {/* 7. Stay Connected — single newsletter CTA */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Stay Connected</h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <EmailSignup />
      </ScrollReveal>
    </div>
  );
}

import { SavedNeighborhoodsPanel } from "@/components/SavedNeighborhoodsPanel";
import { HealthNewsFeed } from "@/components/HealthNewsFeed";
import { EmailSignup } from "@/components/EmailSignup";
import { ShareableInsights } from "@/components/ShareableInsights";
import { WeeklyChanges } from "@/components/WeeklyChanges";
import { DailyHealthCheck } from "@/components/DailyHealthCheck";
import { ReturnVisitorBanner } from "@/components/ReturnVisitorBanner";
import { AlertBanner } from "@/components/AlertBanner";
import { OutdoorHero } from "@/components/OutdoorHero";
import { MyNeighborhood } from "@/components/MyNeighborhood";
import { FoodPriceTracker } from "@/components/FoodPriceTracker";
import { EatSmartTeaser } from "@/components/EatSmartTeaser";
import NutritionSummaryCard from "@/components/nutrition-tracker/NutritionSummaryCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ROUTES } from "@/lib/routes";
import { fmtPM25 } from "@/lib/format";
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
      {/* Today in NYC — compact status strip (top of page) */}
      <DailyHealthCheck
        airLabel={airLabel}
        airAqi={airNow?.aqi ?? null}
        covidLabel={covidLabel}
        totalHosp={totalHosp}
        iliRate={3.84}
        waterSafePct={waterSafePct}
      />

      {/* HERO — unified search + outdoor conditions */}
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

      {/* My Neighborhood — elevated CTA banner */}
      <MyNeighborhood />

      {/* Saved neighborhoods */}
      <SavedNeighborhoodsPanel />

      {/* ── What's Happening ── */}
      <ScrollReveal>
        <div className="mt-6 mb-4">
          <WeeklyChanges />
        </div>

        {/* Grocery prices + eat smart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <FoodPriceTracker />
          <EatSmartTeaser />
        </div>

        {/* Nutrition Tracker */}
        <div className="mt-4">
          <NutritionSummaryCard />
        </div>
      </ScrollReveal>

      {/* Smart Run Routes featured card — full width */}
      <ScrollReveal>
        <a
          href="/run-routes"
          className="card-hover flex items-center gap-5 px-5 py-5 mb-4 rounded-2xl bg-surface border border-border hover:border-hp-green/30 hover:shadow-md transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-hp-green/10 border border-hp-green/20 flex items-center justify-center text-2xl shrink-0">
            🏃‍♂️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[15px] font-bold text-text group-hover:text-hp-green transition-colors">
                Smart Run Routes
              </p>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-hp-green/10 border border-hp-green/20 text-hp-green font-bold uppercase tracking-wide">New</span>
            </div>
            <p className="text-[12px] text-dim">
              Generate optimized running routes using real-time air quality, street safety, and park data. Or explore 14 curated routes scored 0-100.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
              <span className="text-[10px] font-semibold tracking-widest text-hp-green">LIVE</span>
            </div>
            <span className="text-[10px] text-muted">4 data sources</span>
          </div>
        </a>
      </ScrollReveal>

      {/* Return visitor email signup */}
      <ReturnVisitorBanner />

      {/* ── NYC Health Insights ── */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mt-2 mb-3">
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">NYC Health Insights</h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="mb-6">
          <ShareableInsights />
        </div>
      </ScrollReveal>

      {/* ── News ── */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">NYC Health News</h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="mb-8">
          <HealthNewsFeed />
        </div>
      </ScrollReveal>

      {/* ── Stay Connected ── */}
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

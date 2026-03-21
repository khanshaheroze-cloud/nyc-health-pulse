import { KPICard } from "@/components/KPICard";
import {
  CovidTrendChart,
  AirTrendChart,
  IliChart,
  ChronicChart,
} from "@/components/OverviewCharts";
import { NeighborhoodLookup } from "@/components/NeighborhoodLookup";
import { SavedNeighborhoodsPanel } from "@/components/SavedNeighborhoodsPanel";
import { HealthNewsFeed } from "@/components/HealthNewsFeed";
import { EmailSignup } from "@/components/EmailSignup";
import { ShareableInsights } from "@/components/ShareableInsights";
import { WeeklyChanges } from "@/components/WeeklyChanges";
import { DailyHealthCheck } from "@/components/DailyHealthCheck";
import { SeasonalHealthGuide } from "@/components/SeasonalHealthGuide";
import { ReturnVisitorBanner } from "@/components/ReturnVisitorBanner";
import { AlertBanner } from "@/components/AlertBanner";
import { LiveCounterStrip } from "@/components/LiveCounterStrip";
import { DidYouKnow } from "@/components/DidYouKnow";
import { BoroughHeroMap } from "@/components/BoroughHeroMap";
import {
  fetchCovidByBorough,
  fetchRodentByBorough,
  fetchCriticalViolationsCount,
  fetchWaterQuality,
  fetchCitywideAirQuality,
  fetchAirNowAQI,
  fetchBeachWater,
  fetchPollenForecast,
} from "@/lib/liveData";

export default async function OverviewPage() {
  const [covidBorough, rodentData, critViolations, waterQuality, citywideAir, airNow, beachWater, pollen] = await Promise.all([
    fetchCovidByBorough(),
    fetchRodentByBorough(),
    fetchCriticalViolationsCount(),
    fetchWaterQuality(),
    fetchCitywideAirQuality(),
    fetchAirNowAQI(),
    fetchBeachWater(),
    fetchPollenForecast(),
  ]);

  const totalHosp    = covidBorough?.reduce((s, d) => s + d.hosp, 0) || 1763;
  const totalCases   = covidBorough?.reduce((s, d) => s + d.cases, 0) || 18004;

  let activeRate = 170;
  if (rodentData && rodentData.length > 0) {
    const rodentActive = rodentData.reduce((s, d) => s + d.active, 0);
    const rodentTotal  = rodentData.reduce((s, d) => s + d.total, 0);
    if (rodentTotal > 0) activeRate = Math.round((rodentActive / rodentTotal) * 1000);
  }

  // Counter strip values
  const ratSightings = (rodentData && rodentData.reduce((s, d) => s + d.total, 0)) || 5400;
  const restaurantInspections = (critViolations && critViolations * 14) || 14000; // ~14x critical = total inspections
  const calls311 = 8200; // avg daily from NYC 311 annual reports
  const covidTests = (totalCases * 5) || 90020; // ~5x case-to-test ratio

  // Beach water — seasonal (May–September)
  const currentMonth = new Date().getMonth(); // 0-indexed: 4=May, 8=Sep
  const isBeachSeason = currentMonth >= 4 && currentMonth <= 8;
  const beachTotal = beachWater?.length ?? 0;
  const beachSafe = beachWater?.filter((b) => b.safe).length ?? 0;
  const beachAllSafe = beachTotal > 0 && beachSafe === beachTotal;
  const beachColor = beachAllSafe ? "green" : beachSafe > 0 ? "orange" : "red";

  // Build hero summary — plain language "pulse check"
  const airLabel = airNow ? airNow.category : citywideAir ? (citywideAir.pm25 < 9 ? "Good" : citywideAir.pm25 < 12 ? "Moderate" : "Unhealthy") : "Good";
  const covidLabel = totalHosp < 2000 ? "Low" : totalHosp < 3000 ? "Moderate" : "Elevated";
  const heroText = `Air quality: ${airLabel}. COVID activity: ${covidLabel}. Flu: Declining from winter peak. Tap any ? icon for details.`;
  const waterSafePct = waterQuality
    ? ((1 - waterQuality.coliformDetected / waterQuality.totalSamples) * 100).toFixed(1)
    : "99.9";

  return (
    <>
      {/* Hero — neighborhood-first entry point with borough map */}
      <div className="bg-surface border border-hp-green/20 rounded-xl p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 items-center">
          <div>
            <h2 className="text-[16px] font-bold mb-1">What&apos;s the health pulse of your neighborhood?</h2>
            <p className="text-[12px] text-dim mb-3">
              Search any of NYC&apos;s 42 health districts for asthma, air quality, life expectancy, and more.
            </p>
            <NeighborhoodLookup embedded />
          </div>
          <div className="hidden md:block">
            <BoroughHeroMap />
          </div>
        </div>
      </div>

      {/* Did You Know — random health fact */}
      <div className="mb-4">
        <DidYouKnow />
      </div>

      {/* Emergency alert banner (AQI + NWS weather) */}
      <AlertBanner aqi={airNow?.aqi ?? null} />

      {/* Today in NYC — daily health status bar */}
      <DailyHealthCheck
        airLabel={airLabel}
        airAqi={airNow?.aqi ?? null}
        covidLabel={covidLabel}
        totalHosp={totalHosp}
        iliRate={3.84}
        waterSafePct={waterSafePct}
      />

      {/* Right Now in NYC — animated counter strip */}
      <LiveCounterStrip
        calls311={calls311}
        ratSightings={ratSightings}
        inspections={restaurantInspections}
        covidTests={covidTests}
      />

      {/* Seasonal health tips — rotates by month */}
      <SeasonalHealthGuide />


      {/* Saved neighborhoods (localStorage, client-only) */}
      <SavedNeighborhoodsPanel />

      {/* What's Changed This Week */}
      <WeeklyChanges />

      {/* ── Key Indicators (plain language) ── */}
      <div className="flex items-center gap-3 mt-4 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Key Indicators</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-3 mb-10">
        <KPICard
          index={0}
          label="Air Quality"
          value={airNow ? `AQI ${airNow.aqi}` : airLabel}
          sub={airNow
            ? `${airNow.category} · ${citywideAir ? `Annual avg: ${citywideAir.pm25.toFixed(1)} μg/m³` : "EPA AirNow"}`
            : citywideAir ? `PM2.5 at ${citywideAir.pm25.toFixed(1)} μg/m³ · annual avg · real-time AQI unavailable` : "PM2.5 at 6.7 μg/m³ · annual avg"
          }
          badge={{ text: airNow ? airNow.category : airLabel, type: (airNow ? airNow.aqi : 0) <= 50 || (!airNow && citywideAir && citywideAir.pm25 < 9) ? "good" : (airNow ? airNow.aqi : 0) <= 100 ? "warn" : "bad" }}
          color="green"
          tag={airNow ? "LIVE" : citywideAir ? "LIVE" : "2023"}
          trend={{ direction: "stable", label: airNow ? "Now" : "Stable" }}
          tooltip={airNow
            ? `Real-time AQI from EPA AirNow. ${airNow.aqi <= 50 ? "Good day for a run in the park." : airNow.aqi <= 100 ? "Moderate — sensitive groups should limit prolonged outdoor exertion." : "Unhealthy — limit outdoor activity."} Annual NYC avg: ${citywideAir?.pm25.toFixed(1) ?? "6.7"} μg/m³.`
            : "PM2.5 is fine particulate matter. NYC's average is well below the EPA limit. If you have asthma, check your neighborhood's level on your profile page."
          }
        />
        {pollen && (
          <KPICard
            label="Pollen"
            value={pollen.level}
            sub={pollen.topAllergens ?? pollen.note.split(".")[0]}
            color={pollen.level === "High" || pollen.level === "Very High" ? "orange" : pollen.level === "Moderate" ? "yellow" : "green"}
            tag={pollen.source === "tomorrow.io" ? "LIVE" : "Mar 2026"}
            trend={{
              direction: pollen.level === "High" || pollen.level === "Very High" ? "up" : "stable",
              label: pollen.level === "None" ? "Off season" : pollen.level === "Low" ? "Low" : pollen.level === "Moderate" ? "Moderate" : "Active"
            }}
            tooltip={`${pollen.note} Breakdown: Tree ${pollen.tree}, Grass ${pollen.grass}, Weed ${pollen.weed}.${pollen.topAllergens ? ` Top allergens: ${pollen.topAllergens}.` : ""} See the Air Quality page for the full pollen forecast.`}
          />
        )}
        <KPICard
          index={2}
          label="COVID Activity"
          value={covidLabel}
          sub={`${totalHosp.toLocaleString()} hospitalizations in 90 days`}
          color="blue"
          tag="LIVE"
          trend={{ direction: "down", label: "Declining" }}
          tooltip="COVID hospitalizations across all 5 boroughs in the past 90 days. Currently declining. Immunocompromised individuals and seniors should still consider masking indoors during spikes."
        />
        <KPICard
          index={3}
          label="Flu Season"
          value="Low"
          sub="3.84% of ER visits are flu-like · declining"
          color="orange"
          tag="Jan 2026"
          trend={{ direction: "down", label: "Past peak" }}
          tooltip="Flu-like illness rate in NYC ERs. 3–5% is normal winter baseline. Season is winding down — still a good idea to get your flu shot if you haven't."
        />
        <KPICard
          index={4}
          label="Restaurant Safety"
          value={(critViolations ?? 990).toLocaleString()}
          sub="Critical violations flagged this month"
          color="purple"
          tag="LIVE"
          trend={{ direction: "stable", label: "Stable" }}
          tooltip="Critical violations mean conditions that can directly cause food poisoning — wrong temps, pests, bare-hand contact. Check a restaurant's letter grade before eating out on the Food Safety page."
        />
        <KPICard
          index={5}
          label="Tap Water"
          value={waterQuality ? `${((1 - waterQuality.coliformDetected / waterQuality.totalSamples) * 100).toFixed(1)}% Safe` : "99.9% Safe"}
          sub={waterQuality ? `${waterQuality.totalSamples.toLocaleString()} DEP samples tested · safe to drink` : "Safe to drink without a filter"}
          color="cyan"
          tag={waterQuality ? "LIVE" : "2024"}
          trend={{ direction: "stable", label: "Safe" }}
          tooltip="NYC tap water is among the safest in the US — sourced from a protected Catskills watershed. Above 99% coliform-free means safe to drink without a filter."
        />
        {isBeachSeason && (
          <KPICard
            label="Beach Water"
            value={beachTotal > 0 ? `${beachSafe} of ${beachTotal} Safe` : "Testing underway"}
            sub="DOHMH weekly testing · Memorial Day – Labor Day"
            color={beachColor as "green" | "orange" | "red"}
            tag="LIVE"
            trend={{ direction: beachAllSafe ? "stable" : "down", label: beachAllSafe ? "All clear" : "Advisory" }}
            tooltip={`NYC beaches are tested weekly for enterococci bacteria. The EPA safe limit is 104 MPN/100ml. ${beachAllSafe ? "All monitored beaches are currently passing." : `${beachTotal - beachSafe} beach${beachTotal - beachSafe !== 1 ? "es" : ""} above advisory level — check the Environment page for details.`} Season runs Memorial Day through Labor Day.`}
          />
        )}
        <KPICard
          index={7}
          label="Rat Activity"
          value={activeRate > 200 ? "High" : activeRate > 150 ? "Elevated" : "Moderate"}
          sub={`${activeRate} active per 1K inspections · See rats? Call 311`}
          color="red"
          tag="LIVE"
          trend={{ direction: "up", label: "Elevated" }}
          tooltip="How many inspections find active rats per 1,000 checks in the last 30 days. See rats near you? Report to 311 — it triggers an inspection. The Environment page shows which boroughs are worst."
        />
        <KPICard
          index={8}
          label="Overdose Deaths"
          value="2,235"
          sub="Down 28% from 2023 peak · ~80% fentanyl"
          color="yellow"
          tag="2024"
          trend={{ direction: "down", label: "Improving" }}
          tooltip="Annual drug overdose deaths in NYC. Free naloxone (Narcan) is available at any NYC pharmacy without a prescription. If you or someone you know is struggling, call 988."
        />
      </div>

      {/* Return visitor email signup banner */}
      <ReturnVisitorBanner />

      {/* ── Trends ── */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Trends</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CovidTrendChart />
          <AirTrendChart />
          <IliChart />
          <ChronicChart />
        </div>
        <HealthNewsFeed className="hidden xl:flex" />
      </div>

      {/* ── Insights ── */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">NYC Health Insights</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="mb-10">
        <ShareableInsights />
      </div>

      {/* ── Stay Connected (single CTA) ── */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">Stay Connected</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <EmailSignup />
    </>
  );
}

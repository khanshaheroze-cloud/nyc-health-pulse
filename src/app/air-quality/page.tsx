import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Air Quality Today — PM2.5 by Borough",
  description: "Is the air safe in NYC today? Real-time PM2.5, NO2, and ozone levels for all five boroughs. Updated daily from NYCCAS and EPA AirNow.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { AirQualityHero } from "@/components/AirQualityHero";
import { AirNowWidget } from "@/components/AirNowWidget";
import { AqiNotificationButton } from "@/components/AqiNotificationButton";
import { Pm25NeighborhoodChart, PollutantsByBoroughChart, Pm25TrendChart } from "@/components/AirQualityCharts";
import { BoroughMap } from "@/components/BoroughMap";
import {
  fetchAirQualityNeighborhoods,
  fetchAirQualityByBorough,
  fetchCitywideAirQuality,
  fetchAirNowAQI,
  fetchPollenForecast,
} from "@/lib/liveData";
import { PollenCard } from "@/components/PollenCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import Link from "next/link";

export default async function AirQualityPage() {
  const [neighborhoods, byBorough, citywide, airNow, pollen] = await Promise.all([
    fetchAirQualityNeighborhoods(),
    fetchAirQualityByBorough(),
    fetchCitywideAirQuality(),
    fetchAirNowAQI(),
    fetchPollenForecast(),
  ]);

  const pm25 = citywide?.pm25 ?? 6.66;
  const period = citywide?.period ?? "Annual 2023";

  // Worst/best neighborhood from live or fallback
  const sortedNbhd = neighborhoods ?? [];
  const worst = sortedNbhd.length > 0 ? sortedNbhd[sortedNbhd.length - 1] : { name: "Chelsea-Clinton", value: 8.08 };
  const best  = sortedNbhd.length > 0 ? sortedNbhd[0] : { name: "S Beach-Tottenville", value: 6.12 };

  // Highest NO2 from borough data
  const topNo2 = byBorough ? [...byBorough].sort((a, b) => b.no2 - a.no2)[0] : null;
  const avgNo2 = byBorough ? byBorough.reduce((s, b) => s + b.no2, 0) / byBorough.length : null;
  const avgO3 = byBorough ? byBorough.reduce((s, b) => s + b.o3, 0) / byBorough.length : null;
  const liveTag = neighborhoods ? "LIVE" : "2023";

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Air Quality — PM2.5, NO2, and Ozone by Neighborhood and Borough",
      description: "Fine particulate matter (PM2.5), nitrogen dioxide (NO2), and ozone levels across NYC neighborhoods and boroughs from the NYC Community Air Survey (NYCCAS).",
      pagePath: "/air-quality",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2009/..",
      distribution: [
        { name: "NYCCAS Air Quality Data", contentUrl: "https://data.cityofnewyork.us/resource/c3uy-2p5r.json" },
        { name: "EPA AirNow Current AQI", contentUrl: "https://www.airnowapi.org/aq/observation/zipCode/current/" },
      ],
      variableMeasured: ["PM2.5 (μg/m³)", "NO2 (ppb)", "Ozone (ppb)", "Air Quality Index (AQI)"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🌬️"
      title="Air Quality"
      description="PM2.5, NO₂, and Ozone across NYC neighborhoods · EPA AirNow + NYC Community Air Survey (NYCCAS)"
      accentColor="rgba(45,212,160,.12)"
    >
      {/* ── AQI Hero with pollutant breakdown & recommendations ── */}
      <AirQualityHero
        aqi={airNow?.aqi ?? null}
        category={airNow?.category ?? null}
        pm25={pm25}
        no2={avgNo2}
        o3={avgO3}
        period={period}
      />

      {/* ── KPI Cards ── */}
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          label="Citywide PM2.5"
          value={pm25.toFixed(1)}
          unit="μg/m³"
          sub={period}
          color="green"
          tag={liveTag}
        />
        <KPICard
          label="Worst Area"
          value={worst.name.split("/")[0].trim()}
          sub={`${Number(worst.value).toFixed(1)} μg/m³`}
          color="orange"
          tag={liveTag}
        />
        <KPICard
          label="Best Area"
          value={best.name.split("/")[0].trim()}
          sub={`${Number(best.value).toFixed(1)} μg/m³`}
          color="green"
          tag={liveTag}
        />
        <KPICard
          label="NO₂ (Highest)"
          value={topNo2 ? topNo2.no2.toFixed(1) : "19.5"}
          unit="ppb"
          sub={topNo2 ? topNo2.borough : "Manhattan"}
          color="blue"
          tag={liveTag}
        />
      </div>
      </ScrollReveal>

      {/* Pollen & Allergy Forecast */}
      {pollen && (
        <ScrollReveal delay={100}>
        <div className="mb-6">
          <PollenCard data={pollen} />
        </div>
        </ScrollReveal>
      )}

      {/* Live AQI widget + notification opt-in */}
      <AirNowWidget />
      <AqiNotificationButton />

      {/* Charts grid */}
      <ScrollReveal delay={100}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <PollutantsByBoroughChart data={byBorough ?? undefined} />
        <Pm25TrendChart />
      </div>
      </ScrollReveal>

      <ScrollReveal delay={150}>
      <div className="mb-4">
        <Pm25NeighborhoodChart data={neighborhoods ?? undefined} />
      </div>
      </ScrollReveal>

      {/* Borough map */}
      <ScrollReveal delay={200}>
      <div className="bg-surface border border-border-light rounded-3xl p-6">
        <h3 className="text-[13px] font-bold mb-0.5">Health Metrics by Borough — Map View</h3>
        <p className="text-[11px] text-dim mb-3">Select a metric to update the map · green = lower risk / better outcome</p>
        <BoroughMap height={400} />
      </div>
      </ScrollReveal>

      {neighborhoods && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
          <p className="text-[10px] text-hp-green font-semibold">Air quality data live from NYC Community Air Survey · updates daily</p>
        </div>
      )}

      {/* Cross-links */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Link href="/active" className="flex items-center gap-3 flex-1 min-w-[240px] px-5 py-4 rounded-2xl bg-surface border border-border-light hover:border-hp-green/30 hover:shadow-sm transition-all group">
          <span className="text-lg">🏃</span>
          <div>
            <p className="text-[13px] font-semibold text-text group-hover:text-hp-green transition-colors">Best routes for good air days</p>
            <p className="text-[11px] text-muted">14 running &amp; cycling routes across all 5 boroughs</p>
          </div>
        </Link>
        <Link href="/neighborhood" className="flex items-center gap-3 flex-1 min-w-[240px] px-5 py-4 rounded-2xl bg-surface border border-border-light hover:border-hp-green/30 hover:shadow-sm transition-all group">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-[13px] font-semibold text-text group-hover:text-hp-green transition-colors">Air quality in your neighborhood</p>
            <p className="text-[11px] text-muted">Check PM2.5 levels for all 42 neighborhoods</p>
          </div>
        </Link>
      </div>
    </SectionShell>
    </>
  );
}

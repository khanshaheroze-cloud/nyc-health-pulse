import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Air Quality Today — PM2.5 by Borough",
  description: "Is the air safe in NYC today? Real-time PM2.5, NO2, and ozone levels for all five boroughs. Updated daily from NYCCAS and EPA AirNow.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { AirNowWidget } from "@/components/AirNowWidget";
import { AqiNotificationButton } from "@/components/AqiNotificationButton";
import { Pm25NeighborhoodChart, PollutantsByBoroughChart, Pm25TrendChart } from "@/components/AirQualityCharts";
import { BoroughMap } from "@/components/BoroughMap";
import {
  fetchAirQualityNeighborhoods,
  fetchAirQualityByBorough,
  fetchCitywideAirQuality,
  fetchPollenForecast,
} from "@/lib/liveData";
import { PollenCard } from "@/components/PollenCard";

export default async function AirQualityPage() {
  const [neighborhoods, byBorough, citywide, pollen] = await Promise.all([
    fetchAirQualityNeighborhoods(),
    fetchAirQualityByBorough(),
    fetchCitywideAirQuality(),
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

      {/* Pollen & Allergy Forecast */}
      {pollen && (
        <div className="mb-6">
          <PollenCard data={pollen} />
        </div>
      )}

      {/* Live AQI widget + notification opt-in */}
      <AirNowWidget />
      <AqiNotificationButton />

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <PollutantsByBoroughChart data={byBorough ?? undefined} />
        <Pm25TrendChart />
      </div>

      <div className="mb-4">
        <Pm25NeighborhoodChart data={neighborhoods ?? undefined} />
      </div>

      {/* Borough map */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h3 className="text-[13px] font-bold mb-0.5">Health Metrics by Borough — Map View</h3>
        <p className="text-[11px] text-dim mb-3">Select a metric to update the map · green = lower risk / better outcome</p>
        <BoroughMap height={400} />
      </div>

      {neighborhoods && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
          <p className="text-[10px] text-hp-green font-semibold">Air quality data live from NYC Community Air Survey · updates daily</p>
        </div>
      )}
    </SectionShell>
    </>
  );
}

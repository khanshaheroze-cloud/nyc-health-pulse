import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Environment — Rats, Water Quality, Noise & Food Deserts",
  description: "Environmental health data for NYC. Rodent inspections, tap water quality, 311 noise complaints, dog bites, EMS response times, and USDA food desert mapping.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  RodentByBoroughChart, RodentHotspotsChart,
  NoiseByBoroughChart, NoiseByTypeChart, FoodDesertChart,
} from "@/components/EnvironmentCharts";
import { DogBiteChart, EmsResponseChart, BeachWaterChart } from "@/components/EnvironmentExtraCharts";
import { HeatColdSafety } from "@/components/HeatColdSafety";
import { CitiBikeNearby } from "@/components/CitiBikeNearby";
import { fetchRodentByBorough, fetchNoiseByBorough, fetchNoiseByType, fetchWaterQuality, fetchDogBitesByBorough, fetchEmsResponseByBorough, fetchBeachWater } from "@/lib/liveData";
import { ScrollReveal } from "@/components/ScrollReveal";
import { rodentByBorough, noiseByBorough, noiseByType } from "@/lib/data";

export default async function EnvironmentPage() {
  const [rodentData, noiseBorough, noiseType, waterQuality, dogBites, emsResponse, beachWater] = await Promise.all([
    fetchRodentByBorough(),
    fetchNoiseByBorough(),
    fetchNoiseByType(),
    fetchWaterQuality(),
    fetchDogBitesByBorough(),
    fetchEmsResponseByBorough(),
    fetchBeachWater(),
  ]);

  const rodent        = rodentData ?? rodentByBorough;
  const noiseTotal    = (noiseBorough ?? noiseByBorough).reduce((s, d) => s + d.complaints, 0);
  const rodentActive  = rodent.reduce((s, d) => s + d.active, 0);
  const rodentTotal   = rodent.reduce((s, d) => s + d.total, 0);
  const activeRate    = rodentTotal > 0 ? Math.round((rodentActive / rodentTotal) * 1000) : 170;

  // Water quality display values
  const wq = waterQuality;
  const chlorineDisplay = wq ? `${wq.avgChlorine.toFixed(3)} mg/L` : "0.645 mg/L";
  const turbidityDisplay = wq ? `${wq.avgTurbidity.toFixed(2)} NTU` : "< 0.3 NTU";
  const fluorideDisplay  = wq ? `${wq.avgFluoride.toFixed(2)} mg/L` : "0.66 mg/L";
  const coliformPct = wq
    ? `${wq.coliformDetected} of ${wq.totalSamples.toLocaleString()} (${((wq.coliformDetected / wq.totalSamples) * 100).toFixed(1)}%)`
    : "< 0.1%";
  const waterTag = wq ? "LIVE" : "2024";

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Rodent Inspection Activity by Borough",
      description: "Rat inspection results and active rodent activity rates across NYC boroughs from 311 service requests.",
      pagePath: "/environment",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2010-01-01/..",
      distribution: [
        { name: "NYC 311 Rodent Complaints", contentUrl: "https://data.cityofnewyork.us/resource/p937-wjvj.json" },
      ],
      variableMeasured: ["Active Rat Signs per 1K Inspections", "Rodent Complaints by Borough"],
    },
    {
      name: "NYC Drinking Water Quality — DEP Testing Results",
      description: "NYC DEP tap water testing results including chlorine, turbidity, fluoride, and coliform bacteria detection rates.",
      pagePath: "/environment",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2015-01-01/..",
      distribution: [
        { name: "NYC DEP Water Quality Data", contentUrl: "https://data.cityofnewyork.us/resource/bkwf-xfky.json" },
      ],
      variableMeasured: ["Free Chlorine (mg/L)", "Turbidity (NTU)", "Fluoride (mg/L)", "Coliform Detection Rate (%)"],
    },
    {
      name: "NYC 311 Noise Complaints by Borough and Type",
      description: "311 noise complaint volume by borough and complaint type, updated hourly from NYC Open Data.",
      pagePath: "/environment",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2010-01-01/..",
      distribution: [
        { name: "NYC 311 Noise Complaints", contentUrl: "https://data.cityofnewyork.us/resource/p5f6-bkga.json" },
      ],
      variableMeasured: ["Noise Complaints (7-day total)", "Complaints by Type"],
    },
    {
      name: "NYC Dog Bite Reports and EMS Response Times by Borough",
      description: "Dog bite incident reports by borough and breed, plus FDNY EMS average response times by borough.",
      pagePath: "/environment",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2015-01-01/..",
      distribution: [
        { name: "NYC DOHMH Dog Bite Data", contentUrl: "https://data.cityofnewyork.us/resource/rsgh-akpg.json" },
        { name: "FDNY EMS Response Times", contentUrl: "https://data.cityofnewyork.us/resource/76xm-jjuj.json" },
      ],
      variableMeasured: ["Dog Bite Reports (12-month)", "EMS Average Response Time (seconds)"],
    },
    {
      name: "NYC Beach Water Quality — Enterococci Testing",
      description: "NYC DOHMH beach water quality testing results for enterococci bacteria at public beaches, compared to EPA advisory threshold.",
      pagePath: "/environment",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2010-01-01/..",
      distribution: [
        { name: "NYC DOHMH Beach Water Quality", contentUrl: "https://data.cityofnewyork.us/resource/2xir-kwzz.json" },
      ],
      variableMeasured: ["Enterococci (MPN/100ml)", "EPA Threshold Exceedance"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🐀"
      title="Environmental Health"
      description="Rodent activity, drinking water quality, 311 noise complaints, and food desert mapping"
      accentColor="rgba(34,211,238,.12)"
    >
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Rat Activity"       value={activeRate.toString()} sub="Active per 1K inspections · 30d" color="red" tag="LIVE" />
        <KPICard label="Water Safety"       value={wq ? `${((1 - wq.coliformDetected / wq.totalSamples) * 100).toFixed(1)}%` : "99.9%"} sub="Tests negative for coliform · DEP" color="cyan" tag={waterTag} />
        <KPICard label="Noise Complaints"   value={noiseTotal.toLocaleString()} sub="Last 7 days · 311" color="blue" tag="LIVE" />
        <KPICard label="Bronx Food Deserts" value="28.3%" sub="Low-access census tracts" color="orange" tag="2019" />
        {dogBites && dogBites.length > 0 && (
          <KPICard label="Dog Bite Reports" value={dogBites.reduce((s, d) => s + d.count, 0).toLocaleString()} sub={`12 months · Most in ${dogBites[0].borough}`} color="yellow" tag="LIVE" />
        )}
        {emsResponse && emsResponse.length > 0 && (
          <KPICard
            label="EMS Avg Response"
            value={`${Math.floor(emsResponse.reduce((s, d) => s + d.avgResponseSec, 0) / emsResponse.length / 60)}m ${Math.round(emsResponse.reduce((s, d) => s + d.avgResponseSec, 0) / emsResponse.length % 60)}s`}
            sub={`Slowest: ${emsResponse[0].borough}`}
            color="red"
            tag="LIVE"
          />
        )}
      </div>
      </ScrollReveal>

      {/* Water quality table */}
      <ScrollReveal delay={100}>
      <div className="bg-surface border border-border-light rounded-3xl p-6 mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Drinking Water Quality</h3>
          {wq && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
              <span className="text-[10px] text-hp-green font-semibold">
                Live · NYC DEP · {wq.totalSamples.toLocaleString()} samples last 30d
              </span>
            </div>
          )}
        </div>
        <table className="w-full text-xs border-collapse">
          <tbody>
            {[
              ["Avg Free Chlorine", chlorineDisplay, "Normal"],
              ["Avg Turbidity",     turbidityDisplay, null],
              ["Avg Fluoride",      fluorideDisplay,  null],
              ["Coliform Detected", coliformPct,      null],
              ["EPA Chlorine Standard", "0.2 – 4.0 mg/L", "Compliant"],
            ].map(([label, value, badge]) => (
              <tr key={label as string} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 text-dim">{label}</td>
                <td className="py-2 font-semibold">
                  {value}{" "}
                  {badge && (
                    <span className="text-hp-green bg-hp-green/10 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </ScrollReveal>

      <ScrollReveal delay={150}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <RodentByBoroughChart data={rodentData ?? rodentByBorough} />
        <NoiseByBoroughChart  data={noiseBorough ?? noiseByBorough} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <RodentHotspotsChart />
        <div className="flex flex-col gap-3">
          <NoiseByTypeChart data={noiseType ?? noiseByType} />
          <FoodDesertChart />
        </div>
      </div>
      </ScrollReveal>

      {/* Beach water quality */}
      {beachWater && beachWater.length > 0 && (
        <ScrollReveal delay={200}>
          <h3 className="text-sm font-bold mb-2 mt-5">Beach Water Quality</h3>
          <p className="text-[12px] text-dim mb-3">
            NYC DOHMH tests beach water for enterococci bacteria (an indicator of sewage contamination).
            EPA advisory threshold is 104 MPN/100ml — above that, swimming is not recommended.
            <strong className="text-text"> Red bars = above EPA limit.</strong>
          </p>
          <div className="mb-3">
            <BeachWaterChart data={beachWater} />
          </div>
        </ScrollReveal>
      )}

      {/* Dog bites & EMS response */}
      {(dogBites || emsResponse) && (
        <ScrollReveal delay={250}>
          <h3 className="text-sm font-bold mb-2 mt-5">Public Safety & Animal Reports</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            {dogBites && dogBites.length > 0 && <DogBiteChart data={dogBites} />}
            {emsResponse && emsResponse.length > 0 && <EmsResponseChart data={emsResponse} />}
          </div>
        </ScrollReveal>
      )}

      {/* Heat/cold safety — seasonal */}
      <HeatColdSafety />

      {/* Active transportation */}
      <h3 className="text-sm font-bold mb-2 mt-5">Active Transportation</h3>
      <CitiBikeNearby />

      <div className="flex items-center gap-1.5 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
        <p className="text-[10px] text-hp-green font-semibold">
          Rodent &amp; noise: hourly · Water quality: daily · Dog bites &amp; EMS: daily · live from NYC Open Data &amp; NYC DEP
        </p>
      </div>
    </SectionShell>
    </>
  );
}

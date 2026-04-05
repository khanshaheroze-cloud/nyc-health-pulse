import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC COVID-19 Tracker — Hospitalizations & Cases",
  description: "Is COVID spreading in NYC right now? Live hospitalizations, cases by borough, and wastewater surveillance. Updated daily from NYC DOHMH.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { CovidMonthlyChart, CovidBoroughChart } from "@/components/CovidCharts";
import { WastewaterTrendChart } from "@/components/WastewaterChart";
import { fetchCovidMonthly, fetchCovidByBorough, fetchWastewaterCitywide } from "@/lib/liveData";
import { ScrollReveal } from "@/components/ScrollReveal";
import { covidMonthly, covidByBorough } from "@/lib/data";

export default async function CovidPage() {
  const [monthly, byBorough, wastewater] = await Promise.all([
    fetchCovidMonthly(),
    fetchCovidByBorough(),
    fetchWastewaterCitywide(),
  ]);

  const covidTag    = byBorough ? "LIVE" : "2025";
  const boroughData = byBorough ?? covidByBorough;
  const totalCases  = boroughData.reduce((s, d) => s + d.cases, 0);
  const totalHosp   = boroughData.reduce((s, d) => s + d.hosp,  0);
  const topBorough  = [...boroughData].sort((a, b) => b.cases - a.cases)[0];
  const monthlyData = monthly ?? covidMonthly;
  const totalDeaths = monthlyData.slice(-3).reduce((s, d) => s + (d.deaths ?? 0), 0);

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC COVID-19 Surveillance — Cases, Hospitalizations & Deaths by Borough",
      description: "Daily COVID-19 confirmed and probable cases, hospitalizations, and deaths across NYC boroughs from NYC DOHMH surveillance.",
      pagePath: "/covid",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2020-03-01/..",
      distribution: [
        { name: "NYC DOHMH COVID Daily Counts", contentUrl: "https://data.cityofnewyork.us/resource/rc75-m7u3.json" },
      ],
      variableMeasured: ["COVID-19 Cases", "COVID-19 Hospitalizations", "COVID-19 Deaths"],
    },
    {
      name: "NYC Wastewater SARS-CoV-2 Surveillance",
      description: "SARS-CoV-2 viral load measured in NYC wastewater from 14 sewersheds, providing early-warning COVID trend detection.",
      pagePath: "/covid",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2023-04-01/..",
      distribution: [
        { name: "NYC DEP Wastewater Data", contentUrl: "https://data.cityofnewyork.us/resource/f7dc-2q9f.json" },
      ],
      variableMeasured: ["SARS-CoV-2 copies/L"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🦠"
      title="COVID-19"
      description="Borough-level cases, hospitalizations, and deaths · NYC DOHMH · Live"
      accentColor="rgba(91,156,245,.12)"
    >
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Cases (90d)"      value={totalCases.toLocaleString("en-US")} sub="All boroughs" color="blue" tag={covidTag} />
        <KPICard label="Hospitalizations" value={totalHosp.toLocaleString("en-US")}  sub={`${totalCases > 0 ? ((totalHosp/totalCases)*100).toFixed(1) : "9.8"}% of cases`} color="orange" tag={covidTag} />
        <KPICard label="Deaths (3mo)"     value={totalDeaths.toLocaleString("en-US")} sub="Recent 3 months" color="red" tag={covidTag} />
        <KPICard label="Highest Borough"  value={topBorough?.borough ?? "Queens"} sub={`${topBorough?.cases.toLocaleString("en-US") ?? "—"} cases`} color="purple" tag={covidTag} />
      </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <div className="mb-3">
        <CovidMonthlyChart data={monthly ?? undefined} />
      </div>
      </ScrollReveal>

      {wastewater && wastewater.length > 0 && (
        <div className="mb-3">
          <WastewaterTrendChart data={wastewater} />
        </div>
      )}

      <ScrollReveal delay={200}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <CovidBoroughChart data={byBorough ?? undefined} />
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold mb-2">Data Sources</h3>
          <p className="text-xs text-dim leading-relaxed">
            NYC DOHMH daily COVID surveillance — confirmed + probable cases, COVID-confirmed
            hospital admissions, and death certificates. Borough breakdown uses DOHMH borough-prefixed
            columns (bx/bk/mn/qn/si).
          </p>
          {wastewater && (
            <p className="text-xs text-dim leading-relaxed mt-2">
              NYC DEP wastewater surveillance — SARS-CoV-2 viral load from 14 sewersheds
              covering all 5 boroughs. An early warning indicator that detects COVID trends
              ~1 week before clinical case counts.
            </p>
          )}
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
            <p className="text-[10px] text-hp-green font-semibold">Live — updates daily from NYC DOHMH + DEP</p>
          </div>
          <p className="text-[10px] text-muted mt-1">rc75-m7u3.json · f7dc-2q9f.json</p>
        </div>
      </div>
      </ScrollReveal>
    </SectionShell>
    </>
  );
}

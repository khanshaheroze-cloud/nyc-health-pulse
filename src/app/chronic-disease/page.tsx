import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Chronic Disease — Obesity, Diabetes, Asthma by Borough",
  description: "CDC PLACES health data for NYC. Obesity, diabetes, asthma, depression, and smoking rates by borough and census tract. Compare neighborhoods.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE, CDC_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  HealthOutcomesChart,
  HealthBehaviorsChart,
  ErCausesChart,
  AsthmaByBoroughChart,
  LifeExpectancyChart,
  PreTermBirthChart,
  ChildhoodObesityChart,
  MentalHealthEdTrendChart,
  LeadingCausesChart,
  HivByBoroughChart,
  CdcPlacesOutcomesChart,
  CdcPlacesBehaviorsChart,
} from "@/components/ChronicDiseaseCharts";
import { BoroughMap } from "@/components/BoroughMap";
import { ScrollReveal } from "@/components/ScrollReveal";
import { fetchLeadingCauses, fetchHivByBorough, fetchCdcPlacesByBorough } from "@/lib/liveData";

export default async function ChronicDiseasePage() {
  const [leadingCauses, hivData, cdcPlaces] = await Promise.all([
    fetchLeadingCauses(),
    fetchHivByBorough(),
    fetchCdcPlacesByBorough(),
  ]);

  const topHivBorough = hivData ? [...hivData].sort((a, b) => b.rate - a.rate)[0] : null;
  const totalHivDx    = hivData?.reduce((s, d) => s + d.diagnoses, 0) ?? null;

  // Live CDC PLACES KPI values (fall back to static if unavailable)
  const bronx       = cdcPlaces?.find(d => d.borough === "Bronx");
  const obesityVal  = bronx?.obesity    != null ? `${bronx.obesity}%`    : "32.1%";
  const diabetesVal = bronx?.diabetes   != null ? `${bronx.diabetes}%`   : "15.8%";
  const cdcTag      = cdcPlaces ? "LIVE" : "2023";

  const highestDepression = cdcPlaces
    ? [...cdcPlaces].sort((a, b) => (b.depression ?? 0) - (a.depression ?? 0))[0]
    : null;
  const depressionVal = highestDepression?.depression != null
    ? `${highestDepression.depression}%` : "22.1%";
  const depressionSub = highestDepression
    ? `${highestDepression.borough} — highest borough` : "Highest borough";

  const jsonLd = datasetJsonLdString([
    {
      name: "CDC PLACES Health Estimates for NYC — Obesity, Diabetes, Asthma, Depression & Smoking",
      description: "Model-based estimates of chronic disease prevalence for NYC boroughs from CDC PLACES (BRFSS), including obesity, diabetes, asthma, high blood pressure, depression, and smoking rates.",
      pagePath: "/chronic-disease",
      license: CDC_DATA_LICENSE,
      temporalCoverage: "2020/2023",
      distribution: [
        { name: "CDC PLACES County Data", contentUrl: "https://data.cdc.gov/resource/swc5-untb.json" },
      ],
      variableMeasured: ["Obesity (%)", "Diabetes (%)", "Current Asthma (%)", "High Blood Pressure (%)", "Depression (%)", "Current Smoking (%)"],
    },
    {
      name: "NYC Leading Causes of Death",
      description: "Leading causes of death in NYC from DOHMH Vital Statistics, with age-adjusted death rates.",
      pagePath: "/chronic-disease",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2007/..",
      distribution: [
        { name: "NYC DOHMH Leading Causes of Death", contentUrl: "https://data.cityofnewyork.us/resource/jb7j-dtam.json" },
      ],
      variableMeasured: ["Deaths by Cause", "Age-Adjusted Death Rate"],
    },
    {
      name: "NYC HIV Surveillance by Borough",
      description: "HIV/AIDS diagnosis rates and new diagnoses by NYC borough from NYC DOHMH HIV surveillance data.",
      pagePath: "/chronic-disease",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2016/..",
      distribution: [
        { name: "NYC DOHMH HIV Surveillance", contentUrl: "https://data.cityofnewyork.us/resource/ykvb-493p.json" },
      ],
      variableMeasured: ["HIV Diagnosis Rate (per 100K)", "New HIV Diagnoses"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🏥"
      title="Chronic Disease & Health Behaviors"
      description="CDC PLACES county estimates · BRFSS model-based · SPARCS · NYC DOHMH Vital Statistics"
      accentColor="rgba(240,112,112,.12)"
    >
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Obesity (Bronx)"   value={obesityVal}  sub="Highest borough" color="red"    tag={cdcTag} />
        <KPICard label="Diabetes (Bronx)"  value={diabetesVal} sub="Highest borough" color="orange" tag={cdcTag} />
        <KPICard label="Depression"        value={depressionVal} sub={depressionSub}  color="purple" tag={cdcTag} />
        {topHivBorough && (
          <KPICard
            label="HIV Rate (Highest)"
            value={topHivBorough.borough}
            sub={`${topHivBorough.rate} per 100K`}
            color="pink"
            tag="LIVE"
          />
        )}
        {totalHivDx && (
          <KPICard
            label="HIV Diagnoses NYC"
            value={totalHivDx.toLocaleString("en-US")}
            sub="Annual · all boroughs"
            color="pink"
            tag="LIVE"
          />
        )}
        <KPICard
          label="Preterm Birth Rate"
          value="8.8%"
          sub="births <37 weeks · highest: NE Bronx 14.0%"
          color="pink"
          tag="2020"
        />
      </div>
      </ScrollReveal>

      <div className="bg-surface border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-3xl p-6 mb-4">
        <h3 className="text-sm font-bold mb-1">CDC PLACES Note</h3>
        <p className="text-xs text-dim leading-relaxed">
          These are <strong className="text-text">statistical model estimates</strong>, not direct measurements.
          CDC PLACES uses BRFSS survey data modeled to county level.
          {cdcPlaces
            ? <span className="text-hp-green font-semibold"> Live data from CDC PLACES 2025 release (swc5-untb).</span>
            : <> Endpoint: <code className="text-hp-cyan text-[11px]">data.cdc.gov/resource/swc5-untb.json</code></>}
        </p>
      </div>

      {/* Live CDC PLACES charts (replace static when available) */}
      <ScrollReveal delay={100}>
      {cdcPlaces ? (
        <>
          <div className="mb-3">
            <CdcPlacesOutcomesChart data={cdcPlaces} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <CdcPlacesBehaviorsChart data={cdcPlaces} />
            <AsthmaByBoroughChart />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <HealthOutcomesChart />
            <HealthBehaviorsChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <AsthmaByBoroughChart />
            <LifeExpectancyChart />
          </div>
        </>
      )}

      {cdcPlaces && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <LifeExpectancyChart />
          <PreTermBirthChart />
        </div>
      )}

      {!cdcPlaces && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <PreTermBirthChart />
          <ChildhoodObesityChart />
        </div>
      )}
      {cdcPlaces && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <ChildhoodObesityChart />
          <MentalHealthEdTrendChart />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {!cdcPlaces && <MentalHealthEdTrendChart />}
        <ErCausesChart />
      </div>
      </ScrollReveal>

      {/* Live leading causes */}
      {leadingCauses && (
        <div className="mb-4">
          <LeadingCausesChart data={leadingCauses} />
        </div>
      )}

      {/* Live HIV data */}
      {hivData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <HivByBoroughChart data={hivData} />
          <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col justify-center gap-2">
            <h3 className="text-[13px] font-bold">HIV in NYC</h3>
            <p className="text-[11px] text-dim leading-relaxed">
              NYC has the largest HIV epidemic of any US city, with significant disparities by
              borough and race/ethnicity. The Bronx consistently has the highest diagnosis rate,
              driven by concentrated poverty, housing instability, and limited preventive care access.
            </p>
            <p className="text-[11px] text-dim leading-relaxed">
              PrEP (pre-exposure prophylaxis) uptake has increased citywide, contributing to
              declining new diagnoses over the past decade.
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
              <p className="text-[10px] text-hp-green font-semibold">Live · NYC DOHMH HIV Surveillance</p>
            </div>
            <p className="text-[10px] text-muted">data.cityofnewyork.us/resource/ykvb-493p.json</p>
          </div>
        </div>
      )}

      {/* Mental health resources */}
      <ScrollReveal delay={200}>
      <div className="bg-surface border border-hp-cyan/30 border-l-4 border-l-hp-cyan rounded-3xl p-6 mb-4">
        <h3 className="text-sm font-bold mb-2">Mental Health Resources</h3>
        <p className="text-xs text-dim leading-relaxed mb-3">
          Mental health is consistently the #1 or #2 health concern in NYC polling. If you or someone you know is struggling:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-bg rounded-lg p-3">
            <p className="text-xs font-bold mb-1">988 Suicide & Crisis Lifeline</p>
            <p className="text-[11px] text-dim">Call or text <strong className="text-text">988</strong> — 24/7, free, confidential</p>
          </div>
          <div className="bg-bg rounded-lg p-3">
            <p className="text-xs font-bold mb-1">NYC Well</p>
            <p className="text-[11px] text-dim">Call <strong className="text-text">1-888-NYC-WELL</strong> or text <strong className="text-text">&quot;WELL&quot; to 65173</strong></p>
          </div>
          <div className="bg-bg rounded-lg p-3">
            <p className="text-xs font-bold mb-1">Crisis Text Line</p>
            <p className="text-[11px] text-dim">Text <strong className="text-text">HOME to 741741</strong> — trained crisis counselors</p>
          </div>
        </div>
      </div>

      </ScrollReveal>

      {/* Borough map */}
      <ScrollReveal delay={250}>
      <div className="bg-surface border border-border-light rounded-3xl p-6">
        <h3 className="text-[13px] font-bold mb-0.5">Health Metrics by Borough — Map View</h3>
        <p className="text-[11px] text-dim mb-3">
          Select a metric to update the map · red = higher risk / lower life expectancy
        </p>
        <BoroughMap height={400} />
      </div>
      </ScrollReveal>
    </SectionShell>
    </>
  );
}

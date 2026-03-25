import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Overdose Deaths & Child Lead Levels",
  description: "Drug overdose mortality trends and childhood blood lead screening data for NYC by borough and neighborhood. ~80% of deaths involve fentanyl.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  OverdoseTrendChart,
  OverdoseBoroughChart,
  LeadTrendChart,
  LeadBoroughChart,
} from "@/components/OverdoseCharts";

export default function OverdosePage() {
  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Drug Overdose Deaths — Mortality Trends by Borough",
      description: "Drug poisoning mortality trends in NYC by borough, with fentanyl involvement rates. Sourced from NYC DOHMH Vital Statistics reports.",
      pagePath: "/overdose",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2010/2024",
      distribution: [
        { name: "NYC DOHMH Vital Statistics (published reports)", contentUrl: "https://www.nyc.gov/site/doh/data/data-sets/drug-related-mortality-data.page" },
      ],
      variableMeasured: ["Overdose Deaths (annual)", "Fentanyl Involvement (%)", "Deaths by Borough"],
    },
    {
      name: "NYC Childhood Blood Lead Levels by Borough",
      description: "Childhood blood lead screening results for children under 6 in NYC, showing elevated blood lead level (BLL) rates by borough.",
      pagePath: "/overdose",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2005/2023",
      distribution: [
        { name: "NYC DOHMH Child Blood Lead Data", contentUrl: "https://data.cityofnewyork.us/resource/9kzi-2guh.json" },
      ],
      variableMeasured: ["Elevated BLL Rate (%)", "Children Tested", "BLL by Borough"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="💊"
      title="Overdose Deaths & Lead Exposure"
      description="Drug poisoning mortality trends · Child blood lead levels by borough · NYC DOHMH"
      accentColor="rgba(245,197,66,.12)"
    >
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="2024 OD Deaths"  value="2235" sub="↓28% from 2023 peak"     color="green"  tag="2024" />
        <KPICard label="Peak Year"        value="3104" sub="2023 · All-time high"     color="red"    tag="2023" />
        <KPICard label="Child Lead 2023"  value="1.8%"  sub="Elevated BLL · historic low" color="green" tag="2023" />
        <KPICard label="Lead Highest"     value="Bronx" sub="2.8% elevated"            color="orange" tag="2023" />
      </div>
      </ScrollReveal>

      {/* Data gap notice */}
      <div className="bg-surface border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-3xl p-6 mb-4">
        <h3 className="text-sm font-bold mb-1 text-hp-yellow">Seed Data — No Live API Available</h3>
        <p className="text-xs text-dim leading-relaxed">
          NYC-specific overdose mortality data is not available via a public REST API. Dataset{" "}
          <code className="text-hp-cyan text-[10px]">uh9u-2b4k</code> on NYC Open Data returns 404.
          Figures shown are sourced from published NYC DOHMH Vital Statistics reports and updated
          annually when new data is released.
        </p>
      </div>

      <ScrollReveal delay={100}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <OverdoseTrendChart />
        <OverdoseBoroughChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <LeadTrendChart />
        <LeadBoroughChart />
      </div>
      </ScrollReveal>

      <ScrollReveal delay={200}>
      <div className="bg-surface border border-border-light rounded-3xl p-6 mt-3">
        <h3 className="text-[13px] font-bold mb-2">Data Sources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-dim">
          <div>
            <p className="font-semibold text-text mb-1">Overdose Deaths</p>
            <p>NYC DOHMH Vital Statistics — drug poisoning mortality. 2024 figure is preliminary estimate. Fentanyl involved in ~80% of cases.</p>
          </div>
          <div>
            <p className="font-semibold text-text mb-1">Child Blood Lead</p>
            <p>NYC DOHMH childhood lead surveillance — children tested before age 6. Elevated BLL = ≥3.5 μg/dL (CDC reference value).</p>
            <p className="mt-1 text-[10px] text-muted">API: data.cityofnewyork.us/resource/9kzi-2guh.json</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-3xl p-6 mt-4">
        <h3 className="text-sm font-bold mb-2">Harm Reduction Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-bg rounded-lg p-3">
            <p className="text-xs font-bold mb-1">Free Naloxone (Narcan)</p>
            <p className="text-[11px] text-dim">Available at any NYC pharmacy without a prescription. Reverses opioid overdose.</p>
          </div>
          <div className="bg-bg rounded-lg p-3">
            <p className="text-xs font-bold mb-1">988 Suicide & Crisis Lifeline</p>
            <p className="text-[11px] text-dim">Call or text <strong className="text-text">988</strong> — 24/7, free, confidential. Also covers substance use crises.</p>
          </div>
        </div>
      </div>
      </ScrollReveal>
    </SectionShell>
    </>
  );
}

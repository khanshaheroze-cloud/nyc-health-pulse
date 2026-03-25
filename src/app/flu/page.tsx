import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Flu Tracker — Is Flu Going Around?",
  description: "Is the flu going around in NYC? Weekly ER visit rates for flu-like illness, tracked by 53 sentinel hospitals. NYC DOHMH surveillance data.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE, CDC_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { IliFullChart, FluVaccinationChart } from "@/components/FluCharts";
import { FluWastewaterChart } from "@/components/FluWastewaterChart";
import { ScrollReveal } from "@/components/ScrollReveal";
import { fetchFluWastewater } from "@/lib/liveData";

export const revalidate = 604800;

export default async function FluPage() {
  const fluWw = await fetchFluWastewater();

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Influenza-Like Illness (ILI) Surveillance",
      description: "Weekly ER visit rates for influenza-like illness by borough from 53 NYC sentinel hospitals. Includes vaccination coverage data.",
      pagePath: "/flu",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2025-10-01/2026-01-31",
      distribution: [
        { name: "NYC DOHMH EpiQuery ILI Data", contentUrl: "https://a816-health.nyc.gov/hdi/epiquery/" },
      ],
      variableMeasured: ["ILI Rate (% of ER visits)", "Flu Vaccination Rate", "Season Peak ILI Rate"],
    },
    {
      name: "NYC Influenza A Wastewater Surveillance",
      description: "Influenza A viral load detected in NYC wastewater from the CDC National Wastewater Surveillance System (NWSS).",
      pagePath: "/flu",
      license: CDC_DATA_LICENSE,
      temporalCoverage: "2023-01-01/..",
      distribution: [
        { name: "CDC NWSS Influenza A Data", contentUrl: "https://data.cdc.gov/resource/ymmh-divb.json" },
      ],
      variableMeasured: ["Influenza A viral copies/L"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🤒"
      title="Influenza-Like Illness"
      description="ER visit proportion by borough · NYC DOHMH EpiQuery · Wk42 2025 – Wk3 2026"
      accentColor="rgba(245,158,66,.12)"
    >
      <ScrollReveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Current Rate" value="3.84%" sub="Wk3 · ↓ Declining" color="orange" tag="Jan 2026" />
        <KPICard label="Season Peak" value="11.03%" sub="Wk51 — winter surge" color="red" tag="Jan 2026" />
        <KPICard label="Highest Borough" value="Bronx" sub="Consistently elevated" color="red" tag="Jan 2026" />
      </div>
      </ScrollReveal>

      {/* ILI data gap notice */}
      <div className="bg-surface border border-hp-yellow/30 border-l-4 border-l-hp-yellow rounded-3xl p-6 mb-4">
        <h3 className="text-sm font-bold mb-1 text-hp-yellow">Seed Data — No Live API Available</h3>
        <p className="text-xs text-dim leading-relaxed">
          ILI surveillance data is sourced from NYC DOHMH EpiQuery — no public REST endpoint is available
          for syndromic surveillance. This is a civic data gap. Charts show manually seeded Wk42 2025 – Wk3 2026 figures.
          NYC DOHMH updates EpiQuery weekly; data here is refreshed each flu season.
        </p>
      </div>

      <ScrollReveal delay={100}>
      <div className="mb-3">
        <IliFullChart />
      </div>
      </ScrollReveal>

      {fluWw && fluWw.length > 0 && (
        <div className="mb-3">
          <FluWastewaterChart data={fluWw} />
        </div>
      )}

      <ScrollReveal delay={200}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <FluVaccinationChart />
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col justify-center">
          <h3 className="text-[13px] font-bold mb-2">About ILI Surveillance</h3>
          <p className="text-xs text-dim leading-relaxed">
            ILI (Influenza-Like Illness) is defined as fever ≥100°F plus cough or sore throat.
            Rate = % of all ER visits with ILI diagnosis. NYC DOHMH pulls from 53 sentinel hospitals.
          </p>
          <p className="text-xs text-dim leading-relaxed mt-2">
            Vaccination data: NYC DOHMH 2023–24 season survey of adults 18+.
            The Bronx has the lowest vaccination rate and highest ILI burden — a consistent pattern.
          </p>
          {fluWw && (
            <p className="text-xs text-dim leading-relaxed mt-2">
              Wastewater signal: CDC National Wastewater Surveillance System (NWSS) — Influenza A
              viral load from NYC sewersheds. An early-warning indicator that can detect flu
              trends before clinical surveillance.
            </p>
          )}
        </div>
      </div>
      </ScrollReveal>
    </SectionShell>
    </>
  );
}

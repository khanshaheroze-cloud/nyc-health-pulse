import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Maternal Health — Pregnancy Mortality & Birth Outcomes",
  description: "Pregnancy-related mortality, C-section rates, and infant mortality by race and borough in NYC. Data from NYC DOHMH and NY State DOH.",
};
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import {
  MaternalMortalityCauseChart,
  MaternalMortalityRaceChart,
  CSectionChart,
  InfantMortalityChart,
} from "@/components/MaternalHealthCharts";
import { fetchMaternalMortality, fetchCSectionRates, fetchInfantMortality } from "@/lib/liveData";

export default async function MaternalHealthPage() {
  const [mortality, csection, infantMort] = await Promise.all([
    fetchMaternalMortality(),
    fetchCSectionRates(),
    fetchInfantMortality(),
  ]);

  const totalDeaths = mortality?.reduce((s, d) => s + d.deaths, 0) ?? 0;
  const topCause = mortality
    ? [...new Map<string, number>(mortality.map(r => [r.cause, 0])).keys()]
        .filter(c => c !== "All" && c !== "Total" && c !== "")
        .map(cause => ({
          cause,
          deaths: mortality.filter(r => r.cause === cause).reduce((s, r) => s + r.deaths, 0),
        }))
        .sort((a, b) => b.deaths - a.deaths)[0]?.cause ?? "—"
    : "Cardiovascular";
  const avgCsection = csection
    ? Math.round(csection.reduce((s, d) => s + d.csectionPct, 0) / csection.length * 10) / 10
    : 34;
  const highestCsection = csection
    ? [...csection].sort((a, b) => b.csectionPct - a.csectionPct)[0]
    : null;

  const jsonLd = datasetJsonLdString([
    {
      name: "NYC Pregnancy-Related Mortality by Cause and Race",
      description: "Pregnancy-related deaths in NYC by cause of death and race/ethnicity, from NYC DOHMH Maternal Mortality Review.",
      pagePath: "/maternal-health",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2016/2017",
      distribution: [
        { name: "NYC DOHMH Maternal Mortality Data", contentUrl: "https://data.cityofnewyork.us/resource/27x4-cbi6.json" },
      ],
      variableMeasured: ["Pregnancy-Related Deaths", "Deaths by Cause", "Deaths by Race/Ethnicity"],
    },
    {
      name: "NYC C-Section Rates by Borough",
      description: "Cesarean section delivery rates by NYC borough from NY State Department of Health Vital Statistics.",
      pagePath: "/maternal-health",
      license: "https://health.data.ny.gov/about",
      temporalCoverage: "2016/..",
      distribution: [
        { name: "NY State DOH C-Section Data", contentUrl: "https://health.data.ny.gov/resource/ms2r-yf4h.json" },
      ],
      variableMeasured: ["C-Section Rate (%)", "C-Section Rate by Borough"],
    },
    {
      name: "NYC Infant Mortality by Race/Ethnicity",
      description: "Infant mortality rates in NYC by race and ethnicity from NYC DOHMH vital statistics.",
      pagePath: "/maternal-health",
      license: NYC_OPEN_DATA_LICENSE,
      temporalCoverage: "2007/..",
      distribution: [
        { name: "NYC DOHMH Infant Mortality Data", contentUrl: "https://data.cityofnewyork.us/resource/fcau-jc6k.json" },
      ],
      variableMeasured: ["Infant Mortality Rate (per 1K live births)", "Infant Deaths by Race/Ethnicity"],
    },
  ]);

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <SectionShell
      icon="🤰"
      title="Maternal Health"
      description="Pregnancy-related mortality, C-section rates, and birth outcome disparities across NYC"
      accentColor="rgba(244,114,182,.12)"
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          label="Pregnancy Deaths"
          value={totalDeaths > 0 ? totalDeaths.toString() : "57"}
          sub="Pregnancy-related, 2016–2017"
          color="red"
          tag={mortality ? "LIVE" : "2017"}
        />
        <KPICard
          label="Leading Cause"
          value={topCause}
          sub="Of pregnancy-related deaths"
          color="purple"
          tag={mortality ? "LIVE" : "2017"}
        />
        <KPICard
          label="Avg C-Section Rate"
          value={`${avgCsection}%`}
          sub="Across all boroughs"
          color="pink"
          tag={csection ? "LIVE" : "2022"}
        />
        {highestCsection && (
          <KPICard
            label="Highest C-Section"
            value={highestCsection.borough}
            sub={`${highestCsection.csectionPct}% of births`}
            color="orange"
            tag="LIVE"
          />
        )}
      </div>

      {mortality && mortality.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <MaternalMortalityCauseChart data={mortality} />
          <MaternalMortalityRaceChart data={mortality} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {csection && csection.length > 0 && (
          <CSectionChart data={csection} />
        )}
        {infantMort && infantMort.length > 0 && (
          <InfantMortalityChart data={infantMort} />
        )}
      </div>

      {/* Context cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="text-[13px] font-bold mb-2">Racial Disparities in Maternal Mortality</h3>
          <p className="text-xs text-dim leading-relaxed">
            Non-Hispanic Black women in NYC die from pregnancy-related causes at rates
            8–12x higher than white and Asian women. Structural racism, unequal access to
            quality prenatal care, and implicit bias in healthcare contribute to this gap.
            NYC launched the Maternal Mortality Review Board and the By My Side Birth
            Support Program to address these disparities.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="text-[13px] font-bold mb-2">Data Sources</h3>
          <p className="text-xs text-dim leading-relaxed">
            Pregnancy-associated mortality from NYC DOHMH (dataset 27x4-cbi6, 2016–2017).
            C-section rates from NY State DOH Vital Statistics (dataset ms2r-yf4h), filtered
            to NYC counties. Preterm birth data available on neighborhood profile pages.
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
            <p className="text-[10px] text-hp-green font-semibold">Live — queried from NYC Open Data + NY State</p>
          </div>
        </div>
      </div>
    </SectionShell>
    </>
  );
}

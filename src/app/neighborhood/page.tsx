import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "NYC Neighborhood Health Profiles — All 42 Districts",
  description: "Look up health data for your NYC neighborhood — asthma, obesity, poverty, life expectancy, air quality, and more. Compare any two neighborhoods side by side.",
};
import Link from "next/link";
import { neighborhoods, BOROUGH_ORDER, cityAvg, neighborhoodScores } from "@/lib/neighborhoodData";
import { datasetJsonLdString, NYC_OPEN_DATA_LICENSE, CDC_DATA_LICENSE } from "@/lib/jsonLd";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { NeighborhoodMapPanel } from "@/components/NeighborhoodMapPanel";
import { NeighborhoodSearch } from "@/components/NeighborhoodSearch";
import { CensusTractMapPanel } from "@/components/CensusTractMapPanel";
import { NeighborhoodCompare } from "@/components/NeighborhoodCompare";
import { SubwayBullet, BOROUGH_LINE } from "@/components/SubwayBullet";
import { SaveNeighborhoodButton } from "@/components/SaveNeighborhoodButton";
import { SavedNeighborhoodsPanel } from "@/components/SavedNeighborhoodsPanel";

function getRiskLevel(n: typeof neighborhoods[0]): "high" | "moderate" | "low" {
  const score = (n.metrics.asthmaED / 163.8) * 0.35
              + (n.metrics.obesity   / 36.1)  * 0.25
              + (n.metrics.diabetes  / 18.4)  * 0.25
              + (n.metrics.poverty   / 42.1)  * 0.15;
  if (score > 0.65) return "high";
  if (score > 0.40) return "moderate";
  return "low";
}

const RISK_STYLE = {
  high:     "text-hp-red bg-hp-red/10 border-hp-red/20",
  moderate: "text-hp-yellow bg-hp-yellow/10 border-hp-yellow/20",
  low:      "text-hp-green bg-hp-green/10 border-hp-green/20",
};

const BOROUGH_COLORS: Record<string, string> = {
  Bronx:          "#f07070",
  Brooklyn:       "#5b9cf5",
  Manhattan:      "#a78bfa",
  Queens:         "#2dd4a0",
  "Staten Island":"#f59e42",
};

const GRADE_COLORS: Record<string, string> = { A: "#2dd4a0", B: "#22d3ee", C: "#f5c542", D: "#f59e42", F: "#f07070" };

const neighborhoodJsonLd = datasetJsonLdString([
  {
    name: "NYC Neighborhood Health Profiles — 42 UHF Districts",
    description: "Health metrics for all 42 NYC UHF42 neighborhoods including asthma ER rates, obesity, diabetes, poverty, life expectancy, PM2.5 air quality, and CDC PLACES census tract estimates.",
    pagePath: "/neighborhood",
    license: NYC_OPEN_DATA_LICENSE,
    temporalCoverage: "2019/2023",
    distribution: [
      { name: "NYC DOHMH Neighborhood Health Data", contentUrl: "https://www.nyc.gov/site/doh/data/data-tools/neighborhood-health-atlas.page" },
      { name: "CDC PLACES Census Tract Estimates", contentUrl: "https://data.cdc.gov/resource/swc5-untb.json" },
    ],
    variableMeasured: ["Asthma ED Rate (per 10K)", "Obesity (%)", "Diabetes (%)", "Poverty (%)", "Life Expectancy (years)", "PM2.5 (μg/m³)"],
  },
]);

export default function NeighborhoodIndexPage() {
  const topAsthma = [...neighborhoods].sort((a, b) => b.metrics.asthmaED - a.metrics.asthmaED)[0];
  const topPoverty = [...neighborhoods].sort((a, b) => b.metrics.poverty - a.metrics.poverty)[0];
  const topLifeExp = [...neighborhoods].sort((a, b) => b.metrics.lifeExp - a.metrics.lifeExp)[0];
  const worstLifeExp = [...neighborhoods].sort((a, b) => a.metrics.lifeExp - b.metrics.lifeExp)[0];

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: neighborhoodJsonLd }} />
    <SectionShell
      icon="🗺"
      title="Neighborhood Health Profiles"
      description="Health metrics for all 42 UHF neighborhoods · asthma/life exp 2019 · CDC PLACES 2023 · ACS 2022 · NYCCAS 2023"
      accentColor="rgba(91,156,245,.12)"
    >
      {/* ── Prominent search bar ── */}
      <div className="mb-8">
        <NeighborhoodSearch placeholder="Search 42 NYC neighborhoods..." />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Neighborhoods" value="42" sub="UHF42 public health geography" color="blue" />
        <KPICard
          label="Highest Asthma ED"
          value={topAsthma.name.split("/")[0].trim()}
          sub={`${topAsthma.metrics.asthmaED} per 10K · ${topAsthma.borough}`}
          color="red"
          tag="2019"
        />
        <KPICard
          label="Longest Life Expectancy"
          value={`${topLifeExp.metrics.lifeExp}y`}
          sub={topLifeExp.name}
          color="green"
          tag="2019"
        />
        <KPICard
          label="Shortest Life Expectancy"
          value={`${worstLifeExp.metrics.lifeExp}y`}
          sub={`${(topLifeExp.metrics.lifeExp - worstLifeExp.metrics.lifeExp).toFixed(1)}y gap · ${worstLifeExp.name}`}
          color="orange"
          tag="2019"
        />
      </div>

      {/* Saved neighborhoods panel (client, localStorage) */}
      <SavedNeighborhoodsPanel />

      {/* Health Rankings */}
      <div className="bg-surface border border-border-light rounded-3xl p-7 mb-6">
        <h3 className="text-[13px] font-bold tracking-[1.5px] uppercase text-muted mb-1 pb-2 border-b border-border-light">Health Rankings</h3>
        <p className="text-[11px] text-dim mb-4 mt-3">All 42 neighborhoods ranked by composite health score (A-F). Higher score = better overall health outcomes.</p>
        <div className="data-table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th className="w-6">Grade</th>
                <th>Neighborhood</th>
                <th>Borough</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {[...neighborhoodScores.entries()]
                .map(([slug, hs]) => ({ slug, ...hs, n: neighborhoods.find(x => x.slug === slug)! }))
                .sort((a, b) => b.score - a.score)
                .map((row, i) => (
                  <tr key={row.slug}>
                    <td className="font-semibold text-dim">{i + 1}</td>
                    <td>
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-bold"
                        style={{ background: GRADE_COLORS[row.grade] ?? "#8ba89c" }}
                      >
                        {row.grade}
                      </span>
                    </td>
                    <td>
                      <Link href={`/neighborhood/${row.slug}`} className="hover:text-hp-blue transition-colors font-medium">
                        {row.n.name}
                      </Link>
                    </td>
                    <td className="text-dim">{row.n.borough}</td>
                    <td className="text-right font-display font-semibold">{row.score}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-muted mt-4 italic">
          This is a Pulse NYC composite score for informational purposes only, not an official NYC DOHMH classification.
        </p>
      </div>

      {/* Interactive map */}
      <NeighborhoodMapPanel />

      {/* Census tract detail map */}
      <CensusTractMapPanel />

      {/* Borough sections */}
      {BOROUGH_ORDER.map(borough => {
        const boroughNeighborhoods = neighborhoods
          .filter(n => n.borough === borough)
          .sort((a, b) => b.metrics.asthmaED - a.metrics.asthmaED);
        const boroughColor = BOROUGH_COLORS[borough] ?? "#8ba89c";

        return (
          <div key={borough} className="mb-8">
            <div className="flex items-center gap-2.5 mb-4">
              <SubwayBullet line={BOROUGH_LINE[borough] ?? "S"} size={22} />
              <h3 className="text-[16px] font-bold">{borough}</h3>
              <span className="text-[12px] text-dim">{boroughNeighborhoods.length} neighborhoods</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {boroughNeighborhoods.map(n => {
                const risk = getRiskLevel(n);
                const lifeGap = (n.metrics.lifeExp - cityAvg.lifeExp).toFixed(1);
                const lifeGapStr = Number(lifeGap) >= 0 ? `+${lifeGap}y` : `${lifeGap}y`;
                const hs = neighborhoodScores.get(n.slug);
                const gradeColor = hs ? GRADE_COLORS[hs.grade] ?? "#8ba89c" : "#8ba89c";

                return (
                  <Link key={n.slug} href={`/neighborhood/${n.slug}`}>
                    <div className="neighborhood-card bg-surface border border-border-light rounded-3xl p-5 transition-all duration-200 group cursor-pointer relative overflow-hidden">
                      {/* Borough accent top bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: boroughColor }} />

                      <div className="flex items-start justify-between mb-3 mt-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0"
                            style={{ background: gradeColor }}
                          >
                            {hs?.grade ?? "–"}
                          </span>
                          <p className="text-[16px] font-bold leading-tight group-hover:text-hp-blue transition-colors">
                            {n.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span
                            className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: boroughColor + "18", color: boroughColor }}
                          >
                            {n.borough}
                          </span>
                          <SaveNeighborhoodButton slug={n.slug} size="sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                        <Stat label="Asthma ED" value={`${n.metrics.asthmaED}`} unit="/10K" warn={n.metrics.asthmaED > cityAvg.asthmaED} />
                        <Stat label="Obesity" value={`${n.metrics.obesity}%`} warn={n.metrics.obesity > cityAvg.obesity} />
                        <Stat label="Life Exp." value={lifeGapStr} warn={Number(lifeGap) < -1} good={Number(lifeGap) > 1} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Neighborhood comparison widget */}
      <NeighborhoodCompare />

      {/* Source note */}
      <div className="bg-surface border border-border-light rounded-3xl p-7 text-[12px] text-dim mt-6">
        <p className="font-semibold text-text mb-1">About UHF42 Neighborhoods</p>
        <p className="leading-relaxed">
          NYC uses 42 United Hospital Fund (UHF42) neighborhoods as the standard geographic unit for public
          health surveillance. These boundaries were designed to align with ZIP code clusters for hospital
          discharge data analysis. Metrics shown are age-adjusted where applicable.
          <span className="text-muted"> Risk level (high/moderate/low) is a composite of asthma ED rate,
          obesity, diabetes, and poverty — not an official NYC DOHMH classification.</span>
        </p>
      </div>
    </SectionShell>
    </>
  );
}

function Stat({
  label, value, unit, warn, good,
}: {
  label: string; value: string; unit?: string; warn?: boolean; good?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-[12px] font-semibold tabular-nums ${warn ? "text-hp-red" : good ? "text-hp-green" : "text-text"}`}>
        {value}{unit && <span className="text-muted font-normal text-[10px]"> {unit}</span>}
      </p>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getNeighborhood, neighborhoods, cityAvg, neighborhoodScores, neighborhoodMoveScores } from "@/lib/neighborhoodData";
import { KPICard } from "@/components/KPICard";
import { SaveNeighborhoodButton } from "@/components/SaveNeighborhoodButton";
import { ShareNeighborhood } from "@/components/ShareNeighborhood";
import { fetchRodentByBorough, fetchNoiseByBorough, fetchNeighborhoodPm25, fetchHivByNeighborhood, fetchLeadByNeighborhood, fetchHeatVulnerabilityByNeighborhood } from "@/lib/liveData";

export const revalidate = 3600;

export async function generateStaticParams() {
  return neighborhoods.map(n => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = getNeighborhood(slug);
  if (!n) return {};
  return {
    title: `${n.name} Health Profile`,
    description: `Health metrics for ${n.name}, ${n.borough}: asthma ED rate ${n.metrics.asthmaED}/10K, life expectancy ${n.metrics.lifeExp}y, poverty ${n.metrics.poverty}%, obesity ${n.metrics.obesity}%. NYC DOHMH data.`,
  };
}

const BOROUGH_COLORS: Record<string, string> = {
  Bronx:          "#f07070",
  Brooklyn:       "#5b9cf5",
  Manhattan:      "#a78bfa",
  Queens:         "#2dd4a0",
  "Staten Island":"#f59e42",
};

type Props = { params: Promise<{ slug: string }> };

export default async function NeighborhoodPage({ params }: Props) {
  const { slug } = await params;
  const n = getNeighborhood(slug);
  if (!n) notFound();

  const boroughKey = n.borough === "Staten Island" ? "Staten Is." : n.borough;
  const [rodentData, noiseData, livePm25, hivData, leadData, heatData] = await Promise.all([
    fetchRodentByBorough(),
    fetchNoiseByBorough(),
    fetchNeighborhoodPm25(n.geocode),
    fetchHivByNeighborhood(),
    fetchLeadByNeighborhood(),
    fetchHeatVulnerabilityByNeighborhood(),
  ]);
  const boroughRodent = rodentData?.find(r => r.borough === boroughKey) ?? null;
  const boroughNoise  = noiseData?.find(r => r.borough === boroughKey) ?? null;
  const hivRow    = hivData?.find(r => r.geocode === n.geocode)  ?? null;
  const leadRow   = leadData?.find(r => r.geocode === n.geocode) ?? null;
  const heatRow   = heatData?.find(r => r.geocode === n.geocode) ?? null;

  const m = n.metrics;
  const boroughNeighborhoods = neighborhoods
    .filter(nb => nb.borough === n.borough && nb.slug !== n.slug)
    .sort((a, b) => a.name.localeCompare(b.name));

  const color = BOROUGH_COLORS[n.borough];

  function delta(val: number, avg: number, invert = false) {
    const d = val - avg;
    const pct = Math.abs((d / avg) * 100).toFixed(0);
    const worse = invert ? d < 0 : d > 0;
    return { d, pct, worse, better: invert ? d > 0 : d < 0 };
  }

  const pm25Live  = livePm25?.pm25 ?? m.pm25;
  const pm25Color = pm25Live > 7.5 ? "orange" as const : pm25Live > 7.0 ? "yellow" as const : "green" as const;
  const pm25Tag   = livePm25 ? (livePm25.period.match(/\d{4}/)?.[0] ?? "2023") : "2023";

  const metrics: { label: string; value: string; sub: string; color: "red" | "green" | "blue" | "orange" | "cyan" | "purple" | "yellow"; tag?: string }[] = [
    {
      label: "Asthma ED Rate",
      value: `${m.asthmaED}`,
      sub: `per 10K · city avg ${cityAvg.asthmaED} · ${delta(m.asthmaED, cityAvg.asthmaED).worse ? "▲ above" : "▼ below"} avg`,
      color: delta(m.asthmaED, cityAvg.asthmaED).worse ? "red" : "green",
      tag: "2019",
    },
    {
      label: "Obesity Rate",
      value: `${m.obesity}%`,
      sub: `adults · city avg ${cityAvg.obesity}% · ${delta(m.obesity, cityAvg.obesity).pct}% ${delta(m.obesity, cityAvg.obesity).worse ? "above" : "below"}`,
      color: delta(m.obesity, cityAvg.obesity).worse ? "red" : "green",
      tag: "2023",
    },
    {
      label: "Diabetes Rate",
      value: `${m.diabetes}%`,
      sub: `adults · city avg ${cityAvg.diabetes}%`,
      color: delta(m.diabetes, cityAvg.diabetes).worse ? "red" : "green",
      tag: "2023",
    },
    {
      label: "Poverty Rate",
      value: `${m.poverty}%`,
      sub: `below poverty line · city avg ${cityAvg.poverty}%`,
      color: delta(m.poverty, cityAvg.poverty).worse ? "orange" : "blue",
      tag: "2022",
    },
    {
      label: "PM2.5",
      value: `${Number(pm25Live).toFixed(1)} μg/m³`,
      sub: `annual avg · city avg ${Number(cityAvg.pm25).toFixed(1)} · NYCCAS`,
      color: pm25Color,
      tag: pm25Tag,
    },
    {
      label: "Life Expectancy",
      value: `${m.lifeExp}y`,
      sub: `city avg ${cityAvg.lifeExp}y · ${delta(m.lifeExp, cityAvg.lifeExp, true).better ? `▲ +${delta(m.lifeExp, cityAvg.lifeExp, true).pct}%` : `▼ −${delta(m.lifeExp, cityAvg.lifeExp, true).pct}%`} from avg`,
      color: delta(m.lifeExp, cityAvg.lifeExp, true).worse ? "red" : "green",
      tag: "2019",
    },
  ];

  metrics.push({
    label: "Overdose Death Rate",
    value: `${m.overdoseRate}`,
    sub: `per 100K · city avg ${cityAvg.overdoseRate} · ${delta(m.overdoseRate, cityAvg.overdoseRate).worse ? "▲ above" : "▼ below"} avg`,
    color: delta(m.overdoseRate, cityAvg.overdoseRate).worse ? "red" : "green",
    tag: "2023",
  });
  metrics.push({
    label: "Preterm Births",
    value: `${m.pretermBirth}%`,
    sub: `births <37 wks · city avg ${cityAvg.pretermBirth}%`,
    color: delta(m.pretermBirth, cityAvg.pretermBirth).worse ? "red" : "green",
    tag: "2020",
  });
  if (m.smokers) {
    metrics.push({
      label: "Smoking Rate",
      value: `${m.smokers}%`,
      sub: `adults · NYC CHS`,
      color: (m.smokers > 15) ? "red" : "blue",
      tag: "2022",
    });
  }
  if (m.uninsured) {
    metrics.push({
      label: "Uninsured Rate",
      value: `${m.uninsured}%`,
      sub: `adults without insurance · NYC CHS`,
      color: (m.uninsured > 12) ? "orange" : "blue",
      tag: "2022",
    });
  }
  if (hivRow) {
    metrics.push({
      label: "HIV New Diagnoses",
      value: `${hivRow.rate.toFixed(1)}`,
      sub: `per 100K · ${hivRow.diagnoses} new diagnoses · NYC DOHMH`,
      color: hivRow.rate > 30 ? "red" : hivRow.rate > 15 ? "orange" : "blue",
      tag: "LIVE",
    });
  }
  if (leadRow) {
    metrics.push({
      label: "Childhood Lead",
      value: `${leadRow.pct.toFixed(1)}%`,
      sub: `children <6 with elevated BLL (≥5 μg/dL) · DOHMH`,
      color: leadRow.pct > 3 ? "red" : leadRow.pct > 1.5 ? "orange" : "green",
      tag: "LIVE",
    });
  }
  if (heatRow) {
    metrics.push({
      label: "Heat Vulnerability",
      value: `${heatRow.score}/5`,
      sub: `NYC Heat Vulnerability Index · 1=low, 5=very high`,
      color: heatRow.score >= 4 ? "red" : heatRow.score >= 3 ? "orange" : "green",
      tag: "LIVE",
    });
  }

  // Health score
  const healthScore = neighborhoodScores.get(slug) ?? { score: 0, grade: "F" };
  const GRADE_COLORS: Record<string, string> = { A: "#2dd4a0", B: "#22d3ee", C: "#f5c542", D: "#f59e42", F: "#f07070" };
  const gradeColor = GRADE_COLORS[healthScore.grade] ?? "#8ba89c";

  // rank in city and borough
  const cityRankAsthma  = [...neighborhoods].sort((a, b) => b.metrics.asthmaED - a.metrics.asthmaED).findIndex(x => x.slug === slug) + 1;
  const cityRankLifeExp = [...neighborhoods].sort((a, b) => b.metrics.lifeExp - a.metrics.lifeExp).findIndex(x => x.slug === slug) + 1;
  const sortedByScore = [...neighborhoodScores.entries()].sort((a, b) => b[1].score - a[1].score);
  const healthRank = sortedByScore.findIndex(([s]) => s === slug) + 1;

  // Move Score
  const moveScore = neighborhoodMoveScores.get(slug) ?? { score: 0, grade: "F" };
  const moveGradeColor = GRADE_COLORS[moveScore.grade] ?? "#8ba89c";
  const sortedByMove = [...neighborhoodMoveScores.entries()].sort((a, b) => b[1].score - a[1].score);
  const moveRank = sortedByMove.findIndex(([s]) => s === slug) + 1;

  return (
    <div>
      {/* Back nav */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/neighborhood" className="text-[11px] text-dim hover:text-text transition-colors">
          ← All Neighborhoods
        </Link>
        <span className="text-muted text-[11px]">/</span>
        <span className="text-[11px] text-dim">{n.borough}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
          style={{ background: color + "22" }}
        >
          📍
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <h2 className="font-display font-bold text-[22px] leading-tight">{n.name}</h2>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ShareNeighborhood
                name={n.name}
                slug={n.slug}
                borough={n.borough}
                metrics={{ asthmaED: m.asthmaED, lifeExp: m.lifeExp, poverty: m.poverty, obesity: m.obesity }}
              />
              <SaveNeighborhoodButton slug={n.slug} size="md" />
            </div>
          </div>
          <p className="text-[12px] text-dim mt-0.5">
            <span className="font-semibold" style={{ color }}>{n.borough}</span>
            {" · "}Population {n.population.toLocaleString()}
            {" · "}UHF42 public health district
          </p>
        </div>
      </div>

      {/* Score Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {/* Health Score */}
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-[26px] leading-none"
              style={{ background: gradeColor }}
            >
              {healthScore.grade}
            </div>
            <span className="text-[11px] font-semibold text-dim mt-1">{healthScore.score}/100</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-text">
              Health Score: {healthScore.grade}
              <span className="text-dim font-normal ml-1.5">#{healthRank} of 42</span>
            </p>
            <p className="text-[11px] text-dim mt-0.5 leading-relaxed">
              Clinical outcomes: life expectancy, asthma, obesity, poverty, overdose, diabetes.
            </p>
            <details className="mt-2">
              <summary className="text-[10px] text-hp-blue cursor-pointer hover:underline">How is this calculated?</summary>
              <div className="mt-2 text-[10px] text-dim leading-relaxed space-y-1.5">
                <p>Each metric normalized 0-100 across all 42 neighborhoods (100 = best). Weighted average:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Life Expectancy: 20%</li>
                  <li>Asthma ED Rate: 15%</li>
                  <li>Obesity: 15%</li>
                  <li>Poverty: 15%</li>
                  <li>PM2.5: 10%</li>
                  <li>Overdose Rate: 10%</li>
                  <li>Diabetes: 10%</li>
                  <li>Preterm Births: 5%</li>
                </ul>
                <p>Grades: A (90+), B (80-89), C (70-79), D (60-69), F (&lt;60).</p>
              </div>
            </details>
          </div>
        </div>

        {/* Move Score */}
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-bold text-[26px] leading-none"
              style={{ background: moveGradeColor }}
            >
              {moveScore.grade}
            </div>
            <span className="text-[11px] font-semibold text-dim mt-1">{moveScore.score}/100</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-text">
              Move Score: {moveScore.grade}
              <span className="text-dim font-normal ml-1.5">#{moveRank} of 42</span>
            </p>
            <p className="text-[11px] text-dim mt-0.5 leading-relaxed">
              Daily livability: air quality, safety, neighborhood investment, food access, environment.
            </p>
            <details className="mt-2">
              <summary className="text-[10px] text-hp-blue cursor-pointer hover:underline">How is this calculated?</summary>
              <div className="mt-2 text-[10px] text-dim leading-relaxed space-y-1.5">
                <p>Emphasizes factors that affect day-to-day quality of life. Weighted average:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Air Quality (PM2.5): 25%</li>
                  <li>Overdose Rate (safety): 20%</li>
                  <li>Poverty Rate (investment): 20%</li>
                  <li>Obesity (walkability proxy): 15%</li>
                  <li>Life Expectancy: 10%</li>
                  <li>Asthma ER Rate (environment): 10%</li>
                </ul>
                <p>Grades: A (90+), B (80-89), C (70-79), D (60-69), F (&lt;60).</p>
                <p className="text-muted italic">Pulse NYC composite. Not an official DOHMH or DOT metric.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* City rank callout */}
      <div className="bg-surface border border-border rounded-xl p-3 mb-5 flex flex-wrap gap-4 text-[11px]">
        <div>
          <span className="text-dim">Asthma ED rank: </span>
          <span className="font-bold">#{cityRankAsthma}</span>
          <span className="text-muted"> of 42 neighborhoods</span>
          <span className="text-dim ml-1">(#1 = highest burden)</span>
        </div>
        <div>
          <span className="text-dim">Life expectancy rank: </span>
          <span className="font-bold">#{cityRankLifeExp}</span>
          <span className="text-muted"> of 42 neighborhoods</span>
          <span className="text-dim ml-1">(#1 = longest)</span>
        </div>
      </div>

      {/* KPI metrics grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        {metrics.map(({ label, value, sub, color: c, tag }) => (
          <KPICard key={label} label={label} value={value} sub={sub} color={c} tag={tag} />
        ))}
      </div>

      {/* Health risk context paragraph */}
      <HealthRiskContext n={n} cityAvg={cityAvg} />

      {/* Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
        {/* Health snapshot */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="text-[13px] font-bold mb-3">Health Snapshot vs. City Average</h3>
          <div className="space-y-2.5">
            {[
              { label: "Asthma ED Rate", val: m.asthmaED, avg: cityAvg.asthmaED, unit: "/10K", invert: true },
              { label: "Obesity",        val: m.obesity,  avg: cityAvg.obesity,  unit: "%",   invert: true },
              { label: "Diabetes",       val: m.diabetes, avg: cityAvg.diabetes, unit: "%",   invert: true },
              { label: "Poverty",        val: m.poverty,  avg: cityAvg.poverty,  unit: "%",   invert: true },
              { label: "Overdose Rate", val: m.overdoseRate, avg: cityAvg.overdoseRate, unit: "/100K", invert: true },
              { label: "Preterm Birth", val: m.pretermBirth, avg: cityAvg.pretermBirth, unit: "%",     invert: true },
              { label: "Life Expectancy",val: m.lifeExp,  avg: cityAvg.lifeExp,  unit: "y",   invert: false },
            ].map(({ label, val, avg, unit, invert }) => {
              const pct = Math.min(100, (val / (avg * 2.2)) * 100);
              const avgPct = Math.min(100, (avg / (avg * 2.2)) * 100);
              const worse = invert ? val > avg : val < avg;
              return (
                <div key={label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-dim">{label}</span>
                    <span className={`font-semibold ${worse ? "text-hp-red" : "text-hp-green"}`}>
                      {val}{unit} <span className="text-muted font-normal">vs {avg}{unit}</span>
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: worse ? "#f07070" : "#2dd4a0",
                      }}
                    />
                    {/* city avg marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-dim/60"
                      style={{ left: `${avgPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-muted mt-3">Vertical line = NYC citywide average. Red = worse than avg, green = better.</p>
        </div>

        {/* Air quality + notes */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-[13px] font-bold">Air Quality</h3>
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="font-display text-[28px] font-bold" style={{ color: pm25Live > 7.5 ? "#f59e42" : pm25Live > 7.0 ? "#f5c542" : "#2dd4a0" }}>
                {Number(pm25Live).toFixed(1)}
              </span>
              <span className="text-dim text-[12px] mb-1.5">μg/m³ annual PM2.5</span>
              {livePm25 && (
                <span className="text-[9px] font-bold text-hp-green mb-1.5">{pm25Tag} NYCCAS</span>
              )}
            </div>
            <div className="flex gap-3 text-[10px] text-dim">
              <span>WHO target: <strong className="text-text">5.0</strong></span>
              <span>NYC avg: <strong className="text-text">{Number(cityAvg.pm25).toFixed(1)}</strong></span>
              <span className={pm25Live <= 9 ? "text-hp-green" : "text-hp-red"}>
                EPA standard: <strong>9.0 ✓</strong>
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-text mb-1">Data Sources</p>
            <ul className="text-[10px] text-dim space-y-0.5">
              <li>• Asthma ED: NYC DOHMH EHDP · 2019</li>
              <li>• Obesity / Diabetes: CDC PLACES · 2023</li>
              <li>• Poverty: U.S. Census ACS 2022</li>
              <li>• PM2.5: NYCCAS · {pm25Tag}</li>
              <li>• Life expectancy: NYC DOHMH Vital Stats · 2019</li>
              <li>• Overdose deaths: NYC DOHMH Epi Data Brief · 2023</li>
              <li>• Preterm births: NYC DOHMH EHDP · 2020</li>
              {hivRow   && <li>• HIV diagnoses: NYC DOHMH HIV Surveillance · live</li>}
              {leadRow  && <li>• Blood lead: NYC DOHMH Children Tested · live</li>}
              {heatRow  && <li>• Heat vulnerability: NYC DOHMH HVI · live</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Live Borough Activity */}
      {(boroughRodent || boroughNoise) && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse flex-shrink-0" />
            <h3 className="text-[13px] font-bold">Live Borough Activity</h3>
            <span className="text-[10px] text-dim">· {n.borough} · updates hourly</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {boroughRodent && (
              <div>
                <p className="text-[10px] text-dim mb-0.5">Rodent Inspections (30d)</p>
                <p className="text-[18px] font-display font-bold text-text">{boroughRodent.total.toLocaleString()}</p>
                <p className="text-[10px] text-hp-red">{boroughRodent.active.toLocaleString()} active signs</p>
              </div>
            )}
            {boroughNoise && (
              <div>
                <p className="text-[10px] text-dim mb-0.5">Noise Complaints (7d)</p>
                <p className="text-[18px] font-display font-bold text-text">{boroughNoise.complaints.toLocaleString()}</p>
                <p className="text-[10px] text-dim">311 service requests</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other neighborhoods in same borough */}
      {boroughNeighborhoods.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold mb-2">Other {n.borough} Neighborhoods</h3>
          <div className="flex flex-wrap gap-1.5">
            {boroughNeighborhoods.map(nb => (
              <Link key={nb.slug} href={`/neighborhood/${nb.slug}`}>
                <span className="text-[11px] px-2.5 py-1 bg-surface border border-border hover:border-hp-blue/40 hover:text-hp-blue rounded-lg transition-all">
                  {nb.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HealthRiskContext({
  n,
  cityAvg,
}: {
  n: { name: string; metrics: { asthmaED: number; obesity: number; diabetes: number; poverty: number; lifeExp: number; overdoseRate: number; pretermBirth: number } };
  cityAvg: { asthmaED: number; obesity: number; diabetes: number; poverty: number; lifeExp: number; overdoseRate: number; pretermBirth: number };
}) {
  const m = n.metrics;

  // Identify concerns (worse than city avg by >10%)
  type Concern = { label: string; pct: number; dir: "above" | "below" };
  const concerns: Concern[] = [];

  const asthmaRatio = m.asthmaED / cityAvg.asthmaED;
  if (asthmaRatio > 1.1) concerns.push({ label: "asthma ED rates", pct: Math.round((asthmaRatio - 1) * 100), dir: "above" });

  const obesityRatio = m.obesity / cityAvg.obesity;
  if (obesityRatio > 1.1) concerns.push({ label: "obesity rates", pct: Math.round((obesityRatio - 1) * 100), dir: "above" });

  const overdoseRatio = m.overdoseRate / cityAvg.overdoseRate;
  if (overdoseRatio > 1.1) concerns.push({ label: `overdose death rate (${m.overdoseRate}/100K)`, pct: Math.round((overdoseRatio - 1) * 100), dir: "above" });

  const povertyRatio = m.poverty / cityAvg.poverty;
  if (povertyRatio > 1.1) concerns.push({ label: `poverty rate (${m.poverty}%)`, pct: Math.round((povertyRatio - 1) * 100), dir: "above" });

  const lifeExpGap = cityAvg.lifeExp - m.lifeExp;
  if (lifeExpGap > 1) concerns.push({ label: `life expectancy (${m.lifeExp}y vs. ${cityAvg.lifeExp}y citywide)`, pct: Math.round(Math.abs(lifeExpGap / cityAvg.lifeExp) * 100), dir: "below" });

  // Strengths
  const strengths: string[] = [];
  if (m.asthmaED < cityAvg.asthmaED * 0.9) strengths.push("asthma ED burden below city average");
  if (m.lifeExp > cityAvg.lifeExp + 1) strengths.push(`above-average life expectancy (${m.lifeExp}y vs. ${cityAvg.lifeExp}y)`);
  if (m.poverty < cityAvg.poverty * 0.9) strengths.push("lower-than-average poverty");

  let sentence = "";
  if (concerns.length === 0 && strengths.length > 0) {
    sentence = `${n.name} compares favorably to citywide averages. Notable strengths: ${strengths.join("; ")}.`;
  } else if (concerns.length === 0) {
    sentence = `${n.name} shows health metrics broadly in line with NYC averages across all tracked indicators.`;
  } else {
    const top = concerns.slice(0, 2);
    const burden = concerns.length >= 2 ? "significantly above-average health burdens" : "above-average health burden";
    const topDesc = top.map(c => `${c.label} are ${c.pct}% ${c.dir} the city average`).join(", and ");
    sentence = `${n.name} faces ${burden}. ${topDesc}.`;
    if (strengths.length > 0) sentence += ` Relative strengths include ${strengths.join(" and ")}.`;
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6 text-[13px] text-dim leading-relaxed">
      {sentence}
    </div>
  );
}

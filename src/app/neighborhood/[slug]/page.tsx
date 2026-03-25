import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getNeighborhood, neighborhoods, cityAvg, neighborhoodScores, neighborhoodMoveScores } from "@/lib/neighborhoodData";
import { KPICard } from "@/components/KPICard";
import { SaveNeighborhoodButton } from "@/components/SaveNeighborhoodButton";
import { ShareNeighborhood } from "@/components/ShareNeighborhood";
import { fetchRodentByBorough, fetchNoiseByBorough, fetchNeighborhoodPm25, fetchHivByNeighborhood, fetchLeadByNeighborhood, fetchHeatVulnerabilityByNeighborhood } from "@/lib/liveData";
import { CHAINS } from "@/lib/eatSmartData";
import { SubwayBullet, BOROUGH_LINE } from "@/components/SubwayBullet";

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
    <div className="max-w-[1200px] mx-auto">
      {/* ── Hero with borough accent ── */}
      <div className="relative overflow-hidden rounded-3xl mb-6 animate-fade-in-up" style={{ background: color + "10" }}>
        {/* Borough color accent bar — 4px */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />

        <div className="px-6 py-8 sm:px-8 sm:py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 mb-4 text-[12px]">
            <Link href="/" className="text-hp-green hover:underline">Overview</Link>
            <span className="text-muted">/</span>
            <Link href="/neighborhood" className="text-hp-green hover:underline">Neighborhoods</Link>
            <span className="text-muted">/</span>
            <span className="text-dim">{n.borough}</span>
          </nav>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-[24px] sm:text-[32px] text-text leading-snug">{n.name}</h1>
              <p className="text-[14px] text-dim mt-2 flex items-center gap-1.5 flex-wrap">
                <SubwayBullet line={BOROUGH_LINE[n.borough] ?? "S"} size={18} />
                <span className="font-semibold" style={{ color }}>{n.borough}</span>
                <span>· Population {n.population.toLocaleString()}</span>
                <span>· UHF42 public health district</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShareNeighborhood
                name={n.name}
                slug={n.slug}
                borough={n.borough}
                metrics={{ asthmaED: m.asthmaED, lifeExp: m.lifeExp, poverty: m.poverty, obesity: m.obesity }}
              />
              <SaveNeighborhoodButton slug={n.slug} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 animate-fade-in-up stagger-1">
        {/* Health Score */}
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex items-center gap-5">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-display font-bold text-[30px] leading-none shadow-lg"
              style={{ background: gradeColor, boxShadow: `0 0 18px ${gradeColor}44` }}
            >
              {healthScore.grade}
            </div>
            <span className="text-[11px] font-semibold text-dim mt-1.5">{healthScore.score}/100</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-text">
              Health Score: {healthScore.grade}
              <span className="text-dim font-normal ml-1.5">#{healthRank} of 42</span>
            </p>
            <p className="text-[12px] text-dim mt-1 leading-relaxed">
              Clinical outcomes: life expectancy, asthma, obesity, poverty, overdose, diabetes.
            </p>
            <details className="mt-2">
              <summary className="text-[11px] text-hp-blue cursor-pointer hover:underline">How is this calculated?</summary>
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
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex items-center gap-5">
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-display font-bold text-[30px] leading-none shadow-lg"
              style={{ background: moveGradeColor, boxShadow: `0 0 18px ${moveGradeColor}44` }}
            >
              {moveScore.grade}
            </div>
            <span className="text-[11px] font-semibold text-dim mt-1.5">{moveScore.score}/100</span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-text">
              Move Score: {moveScore.grade}
              <span className="text-dim font-normal ml-1.5">#{moveRank} of 42</span>
            </p>
            <p className="text-[12px] text-dim mt-1 leading-relaxed">
              Daily livability: air quality, safety, neighborhood investment, food access, environment.
            </p>
            <details className="mt-2">
              <summary className="text-[11px] text-hp-blue cursor-pointer hover:underline">How is this calculated?</summary>
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
      <div className="bg-surface border border-border-light rounded-3xl p-5 mb-6 flex flex-wrap gap-5 text-[12px] animate-fade-in-up stagger-2">
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6 animate-fade-in-up stagger-3">
        {metrics.map(({ label, value, sub, color: c, tag }) => (
          <KPICard key={label} label={label} value={value} sub={sub} color={c} tag={tag} />
        ))}
      </div>

      {/* Health risk context paragraph */}
      <HealthRiskContext n={n} cityAvg={cityAvg} />

      {/* Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 animate-fade-in-up stagger-5">
        {/* Health snapshot vs city avg */}
        <div className="bg-surface border border-border-light rounded-3xl p-6">
          <h3 className="text-[13px] font-bold tracking-[1.5px] uppercase text-muted mb-4 pb-2 border-b border-border-light">Health Snapshot vs. City Average</h3>
          <div className="space-y-3">
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
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-dim">{label}</span>
                    <span className={`font-semibold ${worse ? "text-hp-red" : "text-hp-green"}`}>
                      {val}{unit} <span className="text-muted font-normal">vs {avg}{unit}</span>
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-border-light rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: worse ? "#f07070" : color,
                      }}
                    />
                    {/* city avg marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5"
                      style={{ left: `${avgPct}%`, background: "var(--color-muted)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted mt-4">Vertical line = NYC citywide average. Red = worse than avg, colored = better.</p>
        </div>

        {/* Air quality + notes */}
        <div className="bg-surface border border-border-light rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="text-[13px] font-bold tracking-[1.5px] uppercase text-muted pb-2 border-b border-border-light">Air Quality</h3>
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="font-display text-[28px] font-bold" style={{ color: pm25Live > 7.5 ? "#f59e42" : pm25Live > 7.0 ? "#f5c542" : color }}>
                {Number(pm25Live).toFixed(1)}
              </span>
              <span className="text-dim text-[13px] mb-1.5">μg/m³ annual PM2.5</span>
              {livePm25 && (
                <span className="text-[10px] font-bold text-hp-green mb-1.5">{pm25Tag} NYCCAS</span>
              )}
            </div>
            <div className="flex gap-3 text-[11px] text-dim">
              <span>WHO target: <strong className="text-text">5.0</strong></span>
              <span>NYC avg: <strong className="text-text">{Number(cityAvg.pm25).toFixed(1)}</strong></span>
              <span className={pm25Live <= 9 ? "text-hp-green" : "text-hp-red"}>
                EPA standard: <strong>9.0 ✓</strong>
              </span>
            </div>
          </div>

          <div className="border-t border-border-light pt-4">
            <p className="text-[12px] font-semibold text-text mb-2">Data Sources</p>
            <ul className="text-[11px] text-dim space-y-1">
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
        <div className="bg-surface border border-border-light rounded-3xl p-6 mb-6 animate-fade-in-up stagger-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse flex-shrink-0" />
            <h3 className="text-[13px] font-bold tracking-[1.5px] uppercase text-muted">Live Borough Activity</h3>
            <span className="text-[11px] text-dim">· {n.borough} · updates hourly</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {boroughRodent && (
              <div>
                <p className="text-[11px] text-dim mb-1">Rodent Inspections (30d)</p>
                <p className="text-[22px] font-display font-bold text-text">{boroughRodent.total.toLocaleString()}</p>
                <p className="text-[11px] text-hp-red">{boroughRodent.active.toLocaleString()} active signs</p>
              </div>
            )}
            {boroughNoise && (
              <div>
                <p className="text-[11px] text-dim mb-1">Noise Complaints (7d)</p>
                <p className="text-[22px] font-display font-bold text-text">{boroughNoise.complaints.toLocaleString()}</p>
                <p className="text-[11px] text-dim">311 service requests</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Eat Smart cross-link */}
      <Link
        href="/eat-smart"
        className="flex items-center gap-3 rounded-3xl px-6 py-4 bg-hp-green/5 border border-hp-green/20 hover:bg-hp-green/10 transition-all group card-hover animate-fade-in-up stagger-6 mb-6"
      >
        <span className="text-xl">🥗</span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-hp-green group-hover:underline">
            Eat Smart in {n.name}
          </p>
          <p className="text-[11px] text-dim">
            {n.metrics.obesity}% obesity rate in this area. Find healthy food options at {CHAINS.length} chains near you.
          </p>
        </div>
        <span className="text-dim text-[11px] ml-auto flex-shrink-0">View →</span>
      </Link>

      {/* Other neighborhoods in same borough */}
      {boroughNeighborhoods.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-bold tracking-[1.5px] uppercase text-muted mb-3 pb-2 border-b border-border-light">Other {n.borough} Neighborhoods</h3>
          <div className="flex flex-wrap gap-2">
            {boroughNeighborhoods.map(nb => (
              <Link key={nb.slug} href={`/neighborhood/${nb.slug}`}>
                <span className="text-[12px] px-3 py-1.5 bg-surface border border-border-light hover:border-hp-blue/40 hover:text-hp-blue rounded-full transition-all card-hover">
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
    <div className="bg-surface-sage rounded-3xl p-6 mb-6 text-[14px] text-dim leading-relaxed animate-fade-in-up stagger-4">
      {sentence}
    </div>
  );
}

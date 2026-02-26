import { notFound } from "next/navigation";
import Link from "next/link";
import { getNeighborhood, neighborhoods, cityAvg } from "@/lib/neighborhoodData";
import { KPICard } from "@/components/KPICard";

export async function generateStaticParams() {
  return neighborhoods.map(n => ({ slug: n.slug }));
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

  const metrics: { label: string; value: string; sub: string; color: "red" | "green" | "blue" | "orange" | "cyan" | "purple" | "yellow"; note?: string }[] = [
    {
      label: "Asthma ED Rate",
      value: `${m.asthmaED}`,
      sub: `per 10K · city avg ${cityAvg.asthmaED} · ${delta(m.asthmaED, cityAvg.asthmaED).worse ? "▲ above" : "▼ below"} avg`,
      color: delta(m.asthmaED, cityAvg.asthmaED).worse ? "red" : "green",
    },
    {
      label: "Obesity Rate",
      value: `${m.obesity}%`,
      sub: `adults · city avg ${cityAvg.obesity}% · ${delta(m.obesity, cityAvg.obesity).pct}% ${delta(m.obesity, cityAvg.obesity).worse ? "above" : "below"}`,
      color: delta(m.obesity, cityAvg.obesity).worse ? "red" : "green",
    },
    {
      label: "Diabetes Rate",
      value: `${m.diabetes}%`,
      sub: `adults · city avg ${cityAvg.diabetes}% · CDC PLACES 2023`,
      color: delta(m.diabetes, cityAvg.diabetes).worse ? "red" : "green",
    },
    {
      label: "Poverty Rate",
      value: `${m.poverty}%`,
      sub: `below poverty line · city avg ${cityAvg.poverty}% · ACS 2022`,
      color: delta(m.poverty, cityAvg.poverty).worse ? "orange" : "blue",
    },
    {
      label: "PM2.5",
      value: `${m.pm25} μg/m³`,
      sub: `annual avg · city avg ${cityAvg.pm25} · NYCCAS 2023`,
      color: m.pm25 > 7.5 ? "orange" : m.pm25 > 7.0 ? "yellow" : "green",
    },
    {
      label: "Life Expectancy",
      value: `${m.lifeExp}y`,
      sub: `city avg ${cityAvg.lifeExp}y · ${delta(m.lifeExp, cityAvg.lifeExp, false).better ? `▲ +${delta(m.lifeExp, cityAvg.lifeExp).pct}%` : `▼ −${delta(m.lifeExp, cityAvg.lifeExp).pct}%`} from avg`,
      color: delta(m.lifeExp, cityAvg.lifeExp, true).worse ? "red" : "green",
    },
  ];

  if (m.smokers) {
    metrics.push({
      label: "Smoking Rate",
      value: `${m.smokers}%`,
      sub: `adults · NYC CHS 2022`,
      color: (m.smokers > 15) ? "red" : "blue",
    });
  }
  if (m.uninsured) {
    metrics.push({
      label: "Uninsured Rate",
      value: `${m.uninsured}%`,
      sub: `adults without insurance · NYC CHS 2022`,
      color: (m.uninsured > 12) ? "orange" : "blue",
    });
  }

  // rank in city and borough
  const cityRankAsthma  = [...neighborhoods].sort((a, b) => b.metrics.asthmaED - a.metrics.asthmaED).findIndex(x => x.slug === slug) + 1;
  const cityRankLifeExp = [...neighborhoods].sort((a, b) => b.metrics.lifeExp - a.metrics.lifeExp).findIndex(x => x.slug === slug) + 1;

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
        <div>
          <h2 className="font-display font-bold text-[22px] leading-tight">{n.name}</h2>
          <p className="text-[12px] text-dim mt-0.5">
            <span className="font-semibold" style={{ color }}>{n.borough}</span>
            {" · "}Population {n.population.toLocaleString()}
            {" · "}UHF42 public health district
          </p>
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
        {metrics.map(({ label, value, sub, color: c }) => (
          <KPICard key={label} label={label} value={value} sub={sub} color={c} />
        ))}
      </div>

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
              <span className="font-display text-[28px] font-bold" style={{ color: m.pm25 > 7.5 ? "#f59e42" : m.pm25 > 7.0 ? "#f5c542" : "#2dd4a0" }}>
                {m.pm25}
              </span>
              <span className="text-dim text-[12px] mb-1.5">μg/m³ annual PM2.5</span>
            </div>
            <div className="flex gap-3 text-[10px] text-dim">
              <span>WHO target: <strong className="text-text">5.0</strong></span>
              <span>NYC avg: <strong className="text-text">{cityAvg.pm25}</strong></span>
              <span className={m.pm25 <= 9 ? "text-hp-green" : "text-hp-red"}>
                EPA standard: <strong>9.0 ✓</strong>
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-text mb-1">Data Sources</p>
            <ul className="text-[10px] text-dim space-y-0.5">
              <li>• Asthma ED: NYC DOHMH Environment & Health Data Portal</li>
              <li>• Obesity / Diabetes: CDC PLACES 2023 (model-based)</li>
              <li>• Poverty: U.S. Census ACS 5-year 2022</li>
              <li>• PM2.5: NYC Community Air Survey (NYCCAS) 2023</li>
              <li>• Life expectancy: NYC DOHMH Vital Statistics 2019</li>
            </ul>
          </div>
        </div>
      </div>

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

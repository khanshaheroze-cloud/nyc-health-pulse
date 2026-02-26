import Link from "next/link";
import { neighborhoods, BOROUGH_ORDER, cityAvg } from "@/lib/neighborhoodData";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";

const BOROUGH_COLORS: Record<string, string> = {
  Bronx:          "#f07070",
  Brooklyn:       "#5b9cf5",
  Manhattan:      "#a78bfa",
  Queens:         "#2dd4a0",
  "Staten Island":"#f59e42",
};

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

export default function NeighborhoodIndexPage() {
  const topAsthma = [...neighborhoods].sort((a, b) => b.metrics.asthmaED - a.metrics.asthmaED)[0];
  const topPoverty = [...neighborhoods].sort((a, b) => b.metrics.poverty - a.metrics.poverty)[0];
  const topLifeExp = [...neighborhoods].sort((a, b) => b.metrics.lifeExp - a.metrics.lifeExp)[0];
  const worstLifeExp = [...neighborhoods].sort((a, b) => a.metrics.lifeExp - b.metrics.lifeExp)[0];

  return (
    <SectionShell
      icon="🗺"
      title="Neighborhood Health Profiles"
      description="Health metrics for all 42 UHF neighborhoods · NYC DOHMH · CDC PLACES · ACS 2022"
      accentColor="rgba(91,156,245,.12)"
    >
      {/* KPI row */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard label="Neighborhoods" value="42" sub="UHF42 public health geography" color="blue" />
        <KPICard
          label="Highest Asthma ED"
          value={topAsthma.name.split("/")[0].trim()}
          sub={`${topAsthma.metrics.asthmaED} per 10K · ${topAsthma.borough}`}
          color="red"
        />
        <KPICard
          label="Longest Life Expectancy"
          value={`${topLifeExp.metrics.lifeExp}y`}
          sub={topLifeExp.name}
          color="green"
        />
        <KPICard
          label="Shortest Life Expectancy"
          value={`${worstLifeExp.metrics.lifeExp}y`}
          sub={`${topLifeExp.metrics.lifeExp - worstLifeExp.metrics.lifeExp}y gap · ${worstLifeExp.name}`}
          color="orange"
        />
      </div>

      {/* Borough sections */}
      {BOROUGH_ORDER.map(borough => {
        const boroughNeighborhoods = neighborhoods
          .filter(n => n.borough === borough)
          .sort((a, b) => b.metrics.asthmaED - a.metrics.asthmaED);
        const color = BOROUGH_COLORS[borough];

        return (
          <div key={borough} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 rounded-full" style={{ background: color }} />
              <h3 className="text-[14px] font-bold">{borough}</h3>
              <span className="text-[11px] text-dim">{boroughNeighborhoods.length} neighborhoods</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {boroughNeighborhoods.map(n => {
                const risk = getRiskLevel(n);
                const lifeGap = (n.metrics.lifeExp - cityAvg.lifeExp).toFixed(1);
                const lifeGapStr = Number(lifeGap) >= 0 ? `+${lifeGap}y` : `${lifeGap}y`;

                return (
                  <Link key={n.slug} href={`/neighborhood/${n.slug}`}>
                    <div className="bg-surface border border-border hover:border-hp-blue/40 rounded-xl p-3.5 transition-all duration-150 group cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[12px] font-semibold leading-tight group-hover:text-hp-blue transition-colors">
                          {n.name}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ml-2 ${RISK_STYLE[risk]}`}>
                          {risk}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                        <Stat label="Asthma ED" value={`${n.metrics.asthmaED}`} unit="/10K" warn={n.metrics.asthmaED > cityAvg.asthmaED} />
                        <Stat label="Obesity" value={`${n.metrics.obesity}%`} warn={n.metrics.obesity > cityAvg.obesity} />
                        <Stat label="Poverty" value={`${n.metrics.poverty}%`} warn={n.metrics.poverty > cityAvg.poverty} />
                        <Stat label="PM2.5" value={`${n.metrics.pm25}`} unit="μg/m³" warn={n.metrics.pm25 > 7.5} />
                        <Stat label="Diabetes" value={`${n.metrics.diabetes}%`} warn={n.metrics.diabetes > cityAvg.diabetes} />
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

      {/* Source note */}
      <div className="bg-surface border border-border rounded-xl p-4 text-[11px] text-dim">
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
  );
}

function Stat({
  label, value, unit, warn, good,
}: {
  label: string; value: string; unit?: string; warn?: boolean; good?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-[11px] font-semibold tabular-nums ${warn ? "text-hp-red" : good ? "text-hp-green" : "text-text"}`}>
        {value}{unit && <span className="text-muted font-normal text-[9px]"> {unit}</span>}
      </p>
    </div>
  );
}

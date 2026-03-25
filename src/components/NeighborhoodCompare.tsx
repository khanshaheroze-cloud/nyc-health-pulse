"use client";

import { useState } from "react";
import { NeighborhoodSearch } from "./NeighborhoodSearch";
import { neighborhoods, cityAvg, type Neighborhood } from "@/lib/neighborhoodData";
import { SubwayBullet, BOROUGH_LINE } from "./SubwayBullet";

type CompareMetric = {
  label: string;
  key: keyof Neighborhood["metrics"];
  unit: string;
  lowerBetter: boolean;
};

const METRICS: CompareMetric[] = [
  { label: "Asthma ED Rate",    key: "asthmaED",      unit: "/10K",  lowerBetter: true },
  { label: "Obesity %",         key: "obesity",        unit: "%",     lowerBetter: true },
  { label: "Poverty %",         key: "poverty",        unit: "%",     lowerBetter: true },
  { label: "Overdose Deaths",   key: "overdoseRate",   unit: "/100K", lowerBetter: true },
  { label: "Life Expectancy",   key: "lifeExp",        unit: "y",     lowerBetter: false },
  { label: "PM2.5",             key: "pm25",           unit: "μg/m³", lowerBetter: true },
  { label: "Diabetes %",        key: "diabetes",       unit: "%",     lowerBetter: true },
  { label: "Preterm Births",    key: "pretermBirth",   unit: "%",     lowerBetter: true },
];

const CITY_AVG: Record<string, number> = {
  asthmaED:     cityAvg.asthmaED,
  obesity:      cityAvg.obesity,
  poverty:      cityAvg.poverty,
  lifeExp:      cityAvg.lifeExp,
  pm25:         cityAvg.pm25,
  diabetes:     cityAvg.diabetes,
  overdoseRate: cityAvg.overdoseRate,
  pretermBirth: cityAvg.pretermBirth,
};

export function NeighborhoodCompare() {
  const [neighA, setNeighA] = useState<Neighborhood | null>(null);
  const [neighB, setNeighB] = useState<Neighborhood | null>(null);

  const bothSelected = neighA && neighB;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold">Compare Neighborhoods</h3>
        {(neighA || neighB) && (
          <button
            onClick={() => { setNeighA(null); setNeighB(null); }}
            className="text-[11px] text-dim hover:text-text transition-colors border border-border rounded-lg px-2.5 py-1"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div>
          <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-1.5">Neighborhood A</p>
          {neighA ? (
            <div className="flex items-center justify-between bg-hp-blue/10 border border-hp-blue/20 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <SubwayBullet line={BOROUGH_LINE[neighA.borough] ?? "S"} size={16} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-hp-blue truncate">{neighA.name}</p>
                  <p className="text-[9px] text-dim">{neighA.borough}</p>
                </div>
              </div>
              <button onClick={() => setNeighA(null)} className="text-muted hover:text-dim text-[10px] ml-2 flex-shrink-0">✕</button>
            </div>
          ) : (
            <NeighborhoodSearch
              placeholder="Search neighborhood A…"
              onSelectNeighborhood={(n) => setNeighA(n)}
            />
          )}
        </div>
        <div>
          <p className="text-[10px] text-dim font-semibold uppercase tracking-widest mb-1.5">Neighborhood B</p>
          {neighB ? (
            <div className="flex items-center justify-between bg-hp-purple/10 border border-hp-purple/20 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <SubwayBullet line={BOROUGH_LINE[neighB.borough] ?? "S"} size={16} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-hp-purple truncate">{neighB.name}</p>
                  <p className="text-[9px] text-dim">{neighB.borough}</p>
                </div>
              </div>
              <button onClick={() => setNeighB(null)} className="text-muted hover:text-dim text-[10px] ml-2 flex-shrink-0">✕</button>
            </div>
          ) : (
            <NeighborhoodSearch
              placeholder="Search neighborhood B…"
              onSelectNeighborhood={(n) => setNeighB(n)}
            />
          )}
        </div>
      </div>

      {!bothSelected && (
        <p className="text-[12px] text-muted text-center py-4">
          Select two neighborhoods above to compare health metrics side by side.
        </p>
      )}

      {bothSelected && (
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-[180px_1fr_80px_1fr] gap-2 mb-3 items-center">
            <div />
            <div className="text-[11px] font-bold text-hp-blue text-right truncate">{neighA.name}</div>
            <div className="text-[9px] text-muted text-center uppercase tracking-wide">City Avg</div>
            <div className="text-[11px] font-bold text-hp-purple text-left truncate">{neighB.name}</div>
          </div>

          <div className="flex flex-col gap-3">
            {METRICS.map(({ label, key, unit, lowerBetter }) => {
              const aVal = neighA.metrics[key] as number | undefined;
              const bVal = neighB.metrics[key] as number | undefined;
              const avg  = CITY_AVG[key] ?? 0;

              if (aVal == null || bVal == null) return null;

              const maxVal = Math.max(aVal, bVal, avg) * 1.1;
              const aWidth = (aVal / maxVal) * 100;
              const bWidth = (bVal / maxVal) * 100;
              const avgWidth = (avg / maxVal) * 100;

              // better = lower for most metrics, higher for lifeExp
              const aBetter = lowerBetter ? aVal <= avg : aVal >= avg;
              const bBetter = lowerBetter ? bVal <= avg : bVal >= avg;

              return (
                <div key={String(key)} className="grid grid-cols-[180px_1fr_80px_1fr] gap-2 items-center">
                  {/* Label */}
                  <div className="text-[11px] text-dim">{label}</div>

                  {/* A bar (right-aligned) */}
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <span className={`text-[11px] font-semibold tabular-nums flex-shrink-0 ${aBetter ? "text-hp-green" : "text-hp-red"}`}>
                      {Number(aVal).toFixed(unit === "μg/m³" ? 1 : aVal % 1 !== 0 ? 1 : 0)}{unit}
                    </span>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden flex justify-end">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${aWidth}%`,
                          background: aBetter ? "#2dd4a0" : "#f07070",
                        }}
                      />
                    </div>
                  </div>

                  {/* City avg */}
                  <div className="text-[10px] text-muted text-center tabular-nums">
                    {Number(avg).toFixed(unit === "μg/m³" ? 1 : avg % 1 !== 0 ? 1 : 0)}{unit}
                  </div>

                  {/* B bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${bWidth}%`,
                          background: bBetter ? "#2dd4a0" : "#f07070",
                        }}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold tabular-nums flex-shrink-0 ${bBetter ? "text-hp-green" : "text-hp-red"}`}>
                      {Number(bVal).toFixed(unit === "μg/m³" ? 1 : bVal % 1 !== 0 ? 1 : 0)}{unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[9px] text-muted mt-4">
            Green = at or better than NYC citywide avg · Red = worse than citywide avg
          </p>
        </div>
      )}
    </div>
  );
}

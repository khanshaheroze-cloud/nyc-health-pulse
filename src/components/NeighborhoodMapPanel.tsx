"use client";

import { useState } from "react";
import { NeighborhoodMap, type MapMetric } from "./NeighborhoodMap";

const METRICS: { key: MapMetric; label: string }[] = [
  { key: "asthmaED", label: "Asthma ED" },
  { key: "obesity",  label: "Obesity"   },
  { key: "poverty",  label: "Poverty"   },
  { key: "pm25",     label: "PM2.5"     },
  { key: "lifeExp",  label: "Life Exp." },
];

export function NeighborhoodMapPanel() {
  const [metric, setMetric] = useState<MapMetric>("asthmaED");

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-[13px] font-bold">Health Map — All 42 Neighborhoods</h3>
          <p className="text-[10px] text-dim">Click any neighborhood to view its profile</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={[
                "text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all",
                metric === m.key
                  ? "text-hp-green bg-hp-green/10 border-hp-green/20"
                  : "text-dim border-transparent hover:text-text hover:bg-border",
              ].join(" ")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <NeighborhoodMap metric={metric} height={420} />

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-dim px-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded" style={{ background: "#2dd4a0" }} />
          Better than average
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded" style={{ background: "#f5c542" }} />
          Near average
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded" style={{ background: "#f07070" }} />
          Worse than average
        </span>
        <span className="text-muted">Green = good, red = bad</span>
      </div>
    </div>
  );
}

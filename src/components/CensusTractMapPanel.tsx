"use client";

import { useState } from "react";
import { CensusTractMap, TRACT_METRIC_CONFIG, type TractMetric } from "./CensusTractMap";

const METRICS = Object.entries(TRACT_METRIC_CONFIG).map(([key, cfg]) => ({
  key: key as TractMetric,
  label: cfg.label,
}));

export function CensusTractMapPanel() {
  const [metric, setMetric] = useState<TractMetric>("OBESITY");

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-[13px] font-bold">Census Tract Detail View</h3>
          <p className="text-[10px] text-dim">
            ~2,300 tracts · CDC PLACES 2023 · model-based estimates
          </p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={[
                "text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all",
                metric === m.key
                  ? "text-hp-purple bg-hp-purple/10 border-hp-purple/20"
                  : "text-dim border-transparent hover:text-text hover:bg-border",
              ].join(" ")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <CensusTractMap metric={metric} height={480} />

      <div className="flex items-center justify-between mt-2 text-[10px] text-dim px-1 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded" style={{ background: "#2dd4a0" }} />
            Better
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded" style={{ background: "#f5c542" }} />
            Average
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded" style={{ background: "#f07070" }} />
            Worse
          </span>
        </div>
        <span className="text-muted">Gray = no data (parks, airports, water)</span>
      </div>
    </div>
  );
}

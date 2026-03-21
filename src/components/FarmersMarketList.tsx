"use client";

import { useState, useMemo } from "react";
import type { FarmersMarket } from "@/lib/liveData";

const BOROUGHS = ["All", "Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Is."];

export function FarmersMarketList({ markets }: { markets: FarmersMarket[] }) {
  const [borough, setBorough] = useState("All");

  const filtered = useMemo(
    () => borough === "All" ? markets : markets.filter(m => m.borough === borough),
    [markets, borough],
  );

  const snapCount = filtered.filter(m => m.acceptsSnap || m.acceptsEbt).length;

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-dim tracking-wider uppercase">
            {filtered.length} market{filtered.length !== 1 ? "s" : ""}
          </span>
          {snapCount > 0 && (
            <span className="text-[10px] text-hp-green font-semibold">
              {snapCount} accept SNAP/EBT
            </span>
          )}
        </div>

        {/* Borough filter */}
        <select
          value={borough}
          onChange={e => setBorough(e.target.value)}
          className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-text focus:outline-none focus:ring-1 focus:ring-hp-green"
        >
          {BOROUGHS.map(b => (
            <option key={b} value={b}>{b === "All" ? "All boroughs" : b}</option>
          ))}
        </select>
      </div>

      {/* Market cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((m, i) => (
          <div
            key={`${m.name}-${i}`}
            className="bg-surface border border-border rounded-lg p-3 flex flex-col gap-1"
          >
            <div className="font-semibold text-xs text-text leading-snug line-clamp-2">
              {m.name}
            </div>
            {m.address && (
              <div className="text-[11px] text-muted leading-snug">{m.address}</div>
            )}
            {(m.days || m.hours) && (
              <div className="text-[11px] text-dim">
                {m.days}{m.days && m.hours ? " · " : ""}{m.hours}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-hp-blue/10 text-hp-blue border border-hp-blue/20">
                {m.borough}
              </span>
              {(m.acceptsSnap || m.acceptsEbt) && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-hp-green/10 text-hp-green border border-hp-green/20">
                  SNAP/EBT
                </span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted py-6">
            No farmers markets found for this borough.
          </div>
        )}
      </div>
    </div>
  );
}

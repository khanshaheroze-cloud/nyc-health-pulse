"use client";

import Link from "next/link";
import { NeighborhoodSearch } from "./NeighborhoodSearch";

export function NeighborhoodLookup() {
  return (
    <div className="bg-surface border border-hp-blue/20 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-hp-blue/10 flex items-center justify-center text-base flex-shrink-0">
          📍
        </div>
        <div>
          <h2 className="text-[14px] font-bold leading-tight">Find Your Neighborhood</h2>
          <p className="text-[11px] text-dim mt-0.5">
            Search any of NYC&apos;s 42 public health neighborhoods to see asthma rates, life expectancy, obesity, air quality, and more.
          </p>
        </div>
      </div>

      <NeighborhoodSearch placeholder="Try 'Bushwick', 'Upper East Side', 'Jamaica'…" />

      <div className="flex flex-wrap gap-1.5 mt-3">
        {[
          { name: "Hunts Point", slug: "hunts-point-mott-haven" },
          { name: "East Harlem",  slug: "east-harlem" },
          { name: "Astoria",      slug: "long-island-city-astoria" },
          { name: "Bed-Stuy",     slug: "bedford-stuyvesant-crown-heights" },
          { name: "Flushing",     slug: "flushing-clearview" },
          { name: "Bay Ridge",    slug: "bensonhurst-bay-ridge" },
        ].map(({ name, slug }) => (
          <Link
            key={slug}
            href={`/neighborhood/${slug}`}
            className="text-[10px] font-semibold px-2 py-1 bg-border/50 hover:bg-hp-blue/10 hover:text-hp-blue border border-transparent hover:border-hp-blue/20 rounded-lg transition-all"
          >
            {name}
          </Link>
        ))}
        <Link
          href="/neighborhood"
          className="text-[10px] font-semibold px-2 py-1 text-dim hover:text-text transition-colors rounded-lg"
        >
          View all 42 →
        </Link>
      </div>
    </div>
  );
}

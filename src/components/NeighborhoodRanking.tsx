"use client";

import { useState } from "react";
import Link from "next/link";

export interface RankedNeighborhood {
  slug: string;
  name: string;
  borough: string;
  score: number;
  grade: string;
  rank: number;
}

interface Props {
  currentSlug: string;
  currentName: string;
  rankings: RankedNeighborhood[];
}

const BOROUGHS = ["All", "Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"] as const;

const GRADE_COLORS: Record<string, string> = { A: "#2dd4a0", B: "#22d3ee", C: "#f5c542", D: "#f59e42", F: "#f07070" };

export function NeighborhoodRanking({ currentSlug, currentName, rankings }: Props) {
  const [filter, setFilter] = useState<string>("All");
  const [showAll, setShowAll] = useState(false);

  const filtered = filter === "All" ? rankings : rankings.filter(r => r.borough === filter);
  const displayed = showAll ? filtered : filtered.slice(0, 10);

  // Find current rank in the filtered view
  const currentInFiltered = filtered.findIndex(r => r.slug === currentSlug);

  return (
    <div className="animate-fade-in-up stagger-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">
          How {currentName} Compares
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Borough filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {BOROUGHS.map((b) => (
          <button
            key={b}
            onClick={() => { setFilter(b); setShowAll(false); }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
              filter === b
                ? "bg-accent text-white"
                : "bg-surface border border-border-light text-dim hover:border-accent/30"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Current neighborhood callout if not in top 10 */}
      {!showAll && currentInFiltered >= 10 && (
        <div className="bg-accent/6 border border-accent/20 rounded-xl px-4 py-2.5 mb-2 flex items-center justify-between text-[12px]">
          <span className="text-accent font-semibold">
            {currentName} is #{currentInFiltered + 1}{filter !== "All" ? ` in ${filter}` : ""}
          </span>
          <button onClick={() => setShowAll(true)} className="text-accent hover:underline text-[11px]">
            Show full list
          </button>
        </div>
      )}

      {/* Ranking list */}
      <div className="space-y-1.5">
        {displayed.map((n) => {
          const isCurrent = n.slug === currentSlug;
          const gColor = GRADE_COLORS[n.grade] ?? "#8ba89c";
          return (
            <Link
              key={n.slug}
              href={`/neighborhood/${n.slug}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isCurrent
                  ? "bg-accent/8 border border-accent/25 shadow-sm"
                  : "bg-surface border border-border-light hover:border-accent/20 hover:shadow-sm"
              }`}
            >
              <span className={`text-[12px] font-bold w-7 text-center flex-shrink-0 ${isCurrent ? "text-accent" : "text-muted"}`}>
                #{n.rank}
              </span>

              {/* Grade dot */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                style={{ background: gColor }}
              >
                {n.grade}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-semibold truncate ${isCurrent ? "text-accent" : "text-text"}`}>
                  {n.name}
                  {isCurrent && <span className="ml-1 text-[10px] text-accent/70">(You)</span>}
                </p>
                <p className="text-[10px] text-muted">{n.borough}</p>
              </div>

              <span className="text-[13px] font-display font-bold text-text flex-shrink-0">{n.score}</span>
            </Link>
          );
        })}
      </div>

      {/* Show more */}
      {!showAll && filtered.length > 10 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-2 py-2.5 text-[12px] font-semibold text-accent hover:bg-accent/5 rounded-xl transition-colors"
        >
          Show all {filtered.length} neighborhoods →
        </button>
      )}

      {showAll && filtered.length > 10 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full mt-2 py-2.5 text-[12px] font-semibold text-muted hover:bg-surface-sage/30 rounded-xl transition-colors"
        >
          Show top 10 only
        </button>
      )}
    </div>
  );
}

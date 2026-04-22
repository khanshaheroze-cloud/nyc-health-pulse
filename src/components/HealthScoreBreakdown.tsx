"use client";

import { useState } from "react";
import type { HealthSubScore } from "@/lib/neighborhoodData";

interface Props {
  grade: string;
  score: number;
  rank: number;
  gradeColor: string;
  subScores: HealthSubScore[];
}

function barColor(score: number): string {
  if (score >= 75) return "var(--color-good)";
  if (score >= 50) return "var(--color-caution)";
  return "var(--color-alert)";
}

export function HealthScoreBreakdown({ grade, score, rank, gradeColor, subScores }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Sort by weight descending for display
  const sorted = [...subScores].sort((a, b) => b.weight - a.weight);
  const best = [...subScores].sort((a, b) => b.score - a.score)[0];
  const worst = [...subScores].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="bg-surface border border-border-light rounded-3xl overflow-hidden transition-all duration-300">
      {/* Existing score display — now clickable */}
      <button
        className="w-full p-6 flex items-center gap-5 text-left cursor-pointer hover:bg-surface-sage/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-display font-bold text-[30px] leading-none shadow-lg"
            style={{ background: gradeColor, boxShadow: `0 0 18px ${gradeColor}44` }}
          >
            {grade}
          </div>
          <span className="text-[11px] font-semibold text-dim mt-1.5">{score}/100</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-text">
            Health Score: {grade}
            <span className="text-dim font-normal ml-1.5">#{rank} of 42</span>
          </p>
          <p className="text-[12px] text-dim mt-1 leading-relaxed">
            Tap to see what goes into this score
          </p>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-180" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted" />
          </svg>
        </div>
      </button>

      {/* Expandable sub-scores */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6 pt-2 border-t border-border-light space-y-3">
          <p className="text-[11px] text-muted mb-1">Each metric normalized 0-100 across all 42 neighborhoods (100 = best):</p>

          {sorted.map((sub) => (
            <div key={sub.key} className="flex items-center gap-3">
              <span className="text-base w-6 text-center flex-shrink-0">{sub.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-semibold text-text">{sub.label}</span>
                  <span className="text-[11px] text-dim">
                    {sub.score}/100
                    <span className="text-muted ml-1">({Math.round(sub.weight * 100)}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sub.score}%`, backgroundColor: barColor(sub.score) }}
                  />
                </div>
                <p className="text-[10px] text-muted mt-0.5">
                  {sub.key === "pm25" ? `${Number(sub.rawValue).toFixed(1)}${sub.unit} (scoring baseline)` : `${sub.rawValue}${sub.unit}`}
                </p>
              </div>
            </div>
          ))}

          {/* Best / worst summary */}
          {best && worst && (
            <div className="flex gap-3 pt-2 border-t border-border-light text-[10px]">
              <span className="text-good">Best: {best.label} ({best.score})</span>
              <span className="text-alert">Needs work: {worst.label} ({worst.score})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

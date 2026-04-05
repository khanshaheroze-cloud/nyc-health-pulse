"use client";

import { useState } from "react";
import type { ChainData } from "@/lib/eatSmartData";
import { getChainTopPicks, calculatePulseScore, getBadges } from "@/lib/eatSmartData";

function scoreBadge(score: number) {
  if (score >= 70) return { bg: "rgba(74,124,89,.12)", text: "#4A7C59", ring: "ring-hp-green/20" };
  if (score >= 50) return { bg: "rgba(245,158,66,.12)", text: "#d97706", ring: "ring-hp-orange/20" };
  if (score >= 30) return { bg: "rgba(91,156,245,.12)", text: "#5b9cf5", ring: "ring-hp-blue/20" };
  return { bg: "rgba(240,112,112,.08)", text: "#f07070", ring: "ring-hp-red/20" };
}

function proteinRatio(cal: number, protein?: number): string {
  if (!protein || protein === 0) return "—";
  return (cal / protein).toFixed(1) + ":1";
}

export function EatSmartChainCard({ chain, featured }: { chain: ChainData; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const topPicks = getChainTopPicks(chain, 3);
  const bestPick = topPicks[0];
  const bestScore = bestPick?.pulseScore ?? 0;
  const badge = scoreBadge(bestScore);

  return (
    <div className={`bg-surface border border-border-light rounded-2xl overflow-hidden card-hover transition-all ${featured ? "ring-1 ring-hp-orange/15" : ""}`}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 text-left hover:bg-bg/50 btn-press transition-colors ${featured ? "px-4 py-3.5" : "px-4 py-3"}`}
      >
        <span className={`flex-shrink-0 ${featured ? "text-3xl" : "text-2xl"}`}>{chain.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold text-text truncate ${featured ? "text-[15px]" : "text-[13px]"}`}>{chain.name}</p>
          <p className="text-[10px] text-muted">~{chain.locations} NYC locations</p>
          {featured && bestPick && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {bestPick.badges.map((b, i) => (
                <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green">{b}</span>
              ))}
              <span className="text-[11px] text-hp-green font-semibold truncate">
                {bestPick.name} — {bestPick.calories} cal, {bestPick.protein ?? 0}g protein
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-center">
            <span
              className={`font-bold rounded-full block ${featured ? "text-[13px] px-2.5 py-1" : "text-[11px] px-2 py-0.5"}`}
              style={{ background: badge.bg, color: badge.text }}
            >
              {bestScore}
            </span>
            <span className="text-[8px] text-muted block mt-0.5">Score</span>
          </div>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            className={`text-dim transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M3 5 L6 8 L9 5" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 border-t border-border-light">
          {/* Top scored items */}
          <div className="mt-3 space-y-2">
            {chain.items
              .map(item => ({ ...item, pulseScore: calculatePulseScore(item), badges: getBadges(item) }))
              .sort((a, b) => b.pulseScore - a.pulseScore)
              .map((item, i) => {
                const s = scoreBadge(item.pulseScore);
                const ratio = proteinRatio(item.calories, item.protein);
                return (
                  <div
                    key={i}
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: s.bg }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.badges.map((b, j) => (
                            <span key={j} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: s.bg, color: s.text, border: `1px solid ${s.text}22` }}>{b}</span>
                          ))}
                        </div>
                        <p className="text-[12px] font-semibold text-text mt-0.5">{item.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="text-[10px] text-dim">{item.calories} cal</span>
                          {item.protein != null && (
                            <span className="text-[10px] text-dim">{item.protein}g protein</span>
                          )}
                          {item.protein != null && item.protein > 0 && (
                            <span className="text-[10px] text-dim">Ratio: {ratio}</span>
                          )}
                          {item.fiber != null && (
                            <span className="text-[10px] text-dim">{item.fiber}g fiber</span>
                          )}
                          {item.sodium != null && (
                            <span className="text-[10px] text-dim">{item.sodium}mg sodium</span>
                          )}
                        </div>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <span className="text-[14px] font-bold block" style={{ color: s.text }}>{item.pulseScore}</span>
                        <span className="text-[8px] text-muted">Score</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Smart Swaps */}
          {chain.swaps && chain.swaps.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-bold text-hp-blue uppercase tracking-widest">💡 Smart Swaps</p>
              {chain.swaps.map((swap, i) => (
                <div key={i} className="rounded-lg bg-hp-blue/5 border border-hp-blue/10 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-dim line-through">{swap.from}</span>
                    <span className="text-muted">→</span>
                    <span className="text-text font-semibold">{swap.to}</span>
                  </div>
                  {swap.tip && (
                    <p className="text-[10px] text-hp-blue font-medium mt-0.5">{swap.tip}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hack tip */}
          <div className="mt-3 rounded-xl bg-hp-orange/5 border border-hp-orange/12 px-3 py-2.5">
            <p className="text-[10px] font-bold text-hp-orange uppercase tracking-widest mb-0.5">
              Ordering Hack
            </p>
            <p className="text-[11px] text-dim leading-relaxed">{chain.hack}</p>
          </div>
        </div>
      )}
    </div>
  );
}

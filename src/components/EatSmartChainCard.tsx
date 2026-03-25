"use client";

import { useState } from "react";
import type { ChainData } from "@/lib/eatSmartData";

function calBadge(cal: number) {
  if (cal <= 400) return { bg: "rgba(74,124,89,.12)", text: "#4A7C59", label: "Great" };
  if (cal <= 600) return { bg: "rgba(245,158,66,.12)", text: "#d97706", label: "OK" };
  return { bg: "rgba(240,112,112,.12)", text: "#f07070", label: "Heavy" };
}

export function EatSmartChainCard({ chain, featured }: { chain: ChainData; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const lowestCal = Math.min(...chain.items.map((i) => i.calories));
  const bestItem = chain.items.find((i) => i.calories === lowestCal);

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
          <p className="text-[10px] text-muted">
            ~{chain.locations} NYC locations
          </p>
          {featured && bestItem && (
            <p className="text-[11px] text-hp-green font-semibold mt-0.5">
              Best: {bestItem.name} — {lowestCal} cal
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`font-bold rounded-full ${featured ? "text-[11px] px-2.5 py-1" : "text-[10px] px-2 py-0.5"}`}
            style={{ background: calBadge(lowestCal).bg, color: calBadge(lowestCal).text }}
          >
            {lowestCal} cal
          </span>
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
          {/* Menu items */}
          <div className="mt-3 space-y-2">
            {chain.items.map((item, i) => {
              const badge = calBadge(item.calories);
              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
                  style={{ background: badge.bg }}
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-text">{item.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {item.protein != null && (
                        <span className="text-[10px] text-dim">{item.protein}g protein</span>
                      )}
                      {item.sodium != null && (
                        <span className="text-[10px] text-dim">{item.sodium}mg sodium</span>
                      )}
                      {item.note && (
                        <span className="text-[10px] font-semibold text-hp-blue">{item.note}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[12px] font-bold flex-shrink-0 mt-0.5"
                    style={{ color: badge.text }}
                  >
                    {item.calories} cal
                  </span>
                </div>
              );
            })}
          </div>

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

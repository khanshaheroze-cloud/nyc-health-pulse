"use client";

import { useEffect, useState } from "react";

interface Change {
  icon: string;
  label: string;
  detail: string;
  direction: "up" | "down" | "new" | "steady";
}

const STATIC_CHANGES: Change[] = [
  { icon: "🦠", label: "COVID Hospitalizations", detail: "Trending down across all boroughs vs. last month", direction: "down" },
  { icon: "🤒", label: "Flu Season", detail: "ILI rate declining from Wk51 peak of 11.03%", direction: "down" },
  { icon: "🐀", label: "Rat Activity", detail: "311 complaints remain elevated in Brooklyn & Bronx", direction: "up" },
  { icon: "🍽️", label: "Food Safety", detail: "Critical violations stable — inspections ongoing", direction: "steady" },
  { icon: "🤰", label: "Maternal Health", detail: "New section — pregnancy-related mortality & C-section data", direction: "new" },
  { icon: "💧", label: "Wastewater Surveillance", detail: "COVID + flu wastewater signals now tracked", direction: "new" },
];

const DIRECTION_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  up:     { bg: "bg-hp-red/10", text: "text-hp-red", label: "↑ Rising" },
  down:   { bg: "bg-hp-green/10", text: "text-hp-green", label: "↓ Declining" },
  new:    { bg: "bg-hp-blue/10", text: "text-hp-blue", label: "✦ New" },
  steady: { bg: "bg-hp-yellow/10", text: "text-hp-yellow", label: "— Stable" },
};

export function WeeklyChanges() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Auto-detect screen size: expanded by default on desktop
  useEffect(() => {
    setVisible(true);
    setExpanded(window.innerWidth >= 768);
  }, []);

  if (!visible) return null;

  // Inline summary for collapsed state
  const summary = STATIC_CHANGES.map((c) => {
    const d = DIRECTION_STYLE[c.direction];
    return (
      <span key={c.label} className="inline-flex items-center gap-1 whitespace-nowrap">
        <span className="text-xs">{c.icon}</span>
        <span className="text-[11px] font-medium">{c.label}</span>
        <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${d.bg} ${d.text}`}>{d.label}</span>
      </span>
    );
  });

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <span className="text-base">📋</span>
        <h3 className="text-sm font-bold">What&apos;s Changed This Week</h3>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-dim hidden sm:inline">Updated Mar 15, 2026</span>
          <span className="text-[10px] text-muted">{expanded ? "▲" : "▼"}</span>
        </span>
      </button>

      {!expanded && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
          {summary}
        </div>
      )}

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
          {STATIC_CHANGES.map((c) => {
            const d = DIRECTION_STYLE[c.direction];
            return (
              <div key={c.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-bg/50">
                <span className="text-base mt-0.5 shrink-0">{c.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold truncate">{c.label}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${d.bg} ${d.text}`}>
                      {d.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-dim leading-snug">{c.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

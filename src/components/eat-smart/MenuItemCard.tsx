"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/eat-smart/types";
import { getFoodScoreBreakdown, getDrinkScoreBreakdown } from "@/lib/eat-smart/pulse-score";

interface MenuItemCardProps {
  item: MenuItem;
  rank: number;
  onLog: (item: MenuItem) => void;
  isLogged?: boolean;
}

const AVAILABILITY_BADGES: Record<string, { label: string; className: string }> = {
  seasonal:     { label: "🍂 Seasonal", className: "text-hp-orange bg-hp-orange/10 border-hp-orange/20" },
  "limited-time": { label: "⏱️ Limited time", className: "text-hp-yellow bg-hp-yellow/10 border-hp-yellow/20" },
};

export function MenuItemCard({ item, rank, onLog, isLogged }: MenuItemCardProps) {
  const [pressed, setPressed] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  const displayScore = item.isDrink ? (item.drinkScore ?? item.pulseScore) : item.pulseScore;
  const scoreLabel = item.isDrink ? "⚡" : "🥗";

  const scoreColor =
    displayScore >= 85 ? "text-good" :
    displayScore >= 70 ? "text-accent" :
    displayScore >= 55 ? "text-caution" :
    "text-dim";

  const scoreBg =
    displayScore >= 85 ? "bg-good/10" :
    displayScore >= 70 ? "bg-accent/10" :
    displayScore >= 55 ? "bg-caution/10" :
    "bg-surface-warm";

  const availBadge = item.availabilityStatus ? AVAILABILITY_BADGES[item.availabilityStatus] : null;

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all ${
        item.isBestPick
          ? "border-hp-green/30 bg-accent-bg/30"
          : item.isRealisticTreat
          ? "border-hp-purple/20 bg-hp-purple/5"
          : "border-border-light bg-surface"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {item.isBestPick && (
              <span className="text-[11px]">⭐</span>
            )}
            {item.isRealisticTreat && (
              <span className="text-[11px]">🎯</span>
            )}
            <span className="text-[11px] text-muted font-medium">
              {rank}.
            </span>
            <h4 className="text-[14px] font-bold text-text truncate">
              {item.name}
            </h4>
            {/* Source info button */}
            {item.source && (
              <button
                onClick={() => setShowSource(!showSource)}
                className="w-4 h-4 rounded-full bg-surface-warm text-[9px] text-muted hover:text-text transition-colors flex-shrink-0 flex items-center justify-center"
                aria-label="View data source"
                title="View data source"
              >
                i
              </button>
            )}
          </div>
          {/* Source info popover */}
          {showSource && item.source && (
            <div className="mt-1 mb-2 px-3 py-2 rounded-lg bg-surface-warm border border-border-light text-[10px] text-dim leading-relaxed">
              <p className="font-semibold text-text">{item.officialName ?? item.name}</p>
              <p>Source: {item.source.provider === "menustat" ? "NYC DOHMH MenuStat" :
                          item.source.provider === "nutritionix" ? "Nutritionix" :
                          item.source.provider === "usda" ? "USDA FoodData Central" :
                          item.source.provider === "usda-composed" ? "USDA (composed)" :
                          item.source.provider === "brand-published" ? "Brand nutrition page" :
                          "PulseNYC curated"}
                {item.source.lastVerified && <> (verified {new Date(item.source.lastVerified).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})</>}
              </p>
              {item.source.externalId && <p className="text-muted">ID: {item.source.externalId}</p>}
            </div>
          )}
          {item.description && (
            <p className="text-[11px] text-dim leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Score badge — tap to see breakdown */}
        <button
          onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
          className={`flex-shrink-0 px-2.5 py-1 rounded-xl ${scoreBg} cursor-pointer hover:opacity-80 transition-opacity`}
          aria-label="Why this score?"
        >
          <span className="text-[10px]">{scoreLabel}</span>
          <span className={`font-display text-[18px] font-bold ${scoreColor}`}>
            {displayScore}
          </span>
        </button>
      </div>

      {/* Score breakdown tooltip */}
      {showScoreBreakdown && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-surface-warm border border-border-light text-[10px] leading-relaxed">
          <p className="font-semibold text-text mb-1">{scoreLabel} {item.isDrink ? "DrinkScore" : "PulseScore"} {displayScore}</p>
          <div className="border-t border-border-light my-1" />
          {(item.isDrink ? getDrinkScoreBreakdown(item) : getFoodScoreBreakdown(item)).map((c, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-dim">{c.points > 0 ? "+" : ""}{c.points} {c.label}</span>
            </div>
          ))}
          <div className="border-t border-border-light my-1" />
          <p className="text-muted">Total: {displayScore} / 100</p>
        </div>
      )}

      {/* Availability badge */}
      {availBadge && (
        <div className="mb-2">
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${availBadge.className}`}>
            {availBadge.label}
          </span>
        </div>
      )}

      {/* Macros row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-dim mb-2">
        <span>{item.calories} cal</span>
        <span>{item.protein}g P</span>
        {item.carbs != null && <span>{item.carbs}g C</span>}
        {item.fat != null && <span>{item.fat}g F</span>}
        {item.fiber != null && item.fiber > 0 && <span>{item.fiber}g fiber</span>}
        {item.sodium != null && <span>{item.sodium}mg Na</span>}
        {item.saturatedFat != null && item.saturatedFat > 0 && <span>{item.saturatedFat}g sat fat</span>}
        {item.sugar != null && item.sugar > 0 && <span>{item.sugar}g sugar</span>}
        {item.caffeine != null && item.isDrink && <span>☕ {item.caffeine}mg</span>}
      </div>

      {/* Badges */}
      {item.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.badges.map((b) => (
            <span
              key={b}
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-warm text-dim"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Modifier hint */}
      {item.modifierHint && (
        <p className="text-[11px] text-accent italic mb-3">
          💡 {item.modifierHint}
        </p>
      )}

      {/* Log button */}
      <button
        onClick={() => {
          if (isLogged) return;
          setPressed(true);
          onLog(item);
          setTimeout(() => setPressed(false), 600);
        }}
        disabled={isLogged}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
          isLogged
            ? "bg-good/10 text-good cursor-default"
            : pressed
            ? "bg-hp-green text-white scale-95"
            : "bg-hp-green/10 text-hp-green hover:bg-hp-green hover:text-white active:scale-95"
        }`}
      >
        {isLogged ? (
          <>✓ Logged</>
        ) : (
          <>+ I ate this</>
        )}
      </button>
    </div>
  );
}

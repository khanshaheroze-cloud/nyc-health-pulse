"use client";

import { useState } from "react";
import type { FoodEntry } from "./DailySummary";

/* ── Meal icons ───────────────────────────────────────────── */

function SunIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function UtensilsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
    </svg>
  );
}

function MoonIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function CookieIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
      <circle cx="14" cy="8" r="1" fill="currentColor" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <circle cx="12" cy="11" r="0.75" fill="currentColor" />
    </svg>
  );
}

const MEAL_CONFIG = {
  breakfast: { label: "Breakfast", Icon: SunIcon },
  lunch: { label: "Lunch", Icon: UtensilsIcon },
  dinner: { label: "Dinner", Icon: MoonIcon },
  snacks: { label: "Snacks", Icon: CookieIcon },
} as const;

/* ── Entry Row ────────────────────────────────────────────── */

function EntryRow({
  entry,
  index,
  onRemove,
}: {
  entry: FoodEntry;
  index: number;
  onRemove: (i: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cals = Math.round(entry.calories * entry.servings);
  const prot = Math.round(entry.protein * entry.servings);

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-1 group border-b border-border-light last:border-b-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Food info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-text truncate">{entry.name}</span>
          {(entry.source === "nyc" || entry.nycBadge) && (
            <span className="shrink-0 text-xs" title="NYC restaurant">
              🗽
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">
          {entry.servings !== 1
            ? `${entry.servings} servings`
            : entry.servingSize || "1 serving"}
        </p>
      </div>

      {/* Calories + protein */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-text tabular-nums">{cals} cal</p>
        <p className="text-xs text-muted tabular-nums">{prot}g protein</p>
      </div>

      {/* Delete button — visible on hover (desktop) or always on mobile */}
      <button
        onClick={() => onRemove(index)}
        className={`shrink-0 p-1 rounded-md text-muted hover:text-hp-red hover:bg-red-50 transition-all ${
          hovered ? "opacity-100" : "opacity-0 md:opacity-0"
        } max-md:opacity-100`}
        aria-label={`Remove ${entry.name}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

interface MealSectionProps {
  meal: "breakfast" | "lunch" | "dinner" | "snacks";
  entries: FoodEntry[];
  onAddFood: () => void;
  onRemoveEntry: (index: number) => void;
}

export default function MealSection({
  meal,
  entries,
  onAddFood,
  onRemoveEntry,
}: MealSectionProps) {
  const { label, Icon } = MEAL_CONFIG[meal];
  const totalCals = entries.reduce((s, e) => s + e.calories * e.servings, 0);

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-bg flex items-center justify-center text-accent">
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">{label}</h3>
            {entries.length > 0 && (
              <p className="text-xs text-muted tabular-nums">
                {Math.round(totalCals)} cal
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onAddFood}
          className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-light transition-colors"
          aria-label={`Add food to ${label}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Entries */}
      <div className="px-4">
        {entries.length === 0 ? (
          <button
            onClick={onAddFood}
            className="w-full py-6 flex flex-col items-center gap-2 text-muted hover:text-accent transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-sm">No foods logged &mdash; tap to add</span>
          </button>
        ) : (
          entries.map((entry, i) => (
            <EntryRow
              key={entry.id + "-" + i}
              entry={entry}
              index={i}
              onRemove={onRemoveEntry}
            />
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { RestaurantChain, MenuItem } from "@/lib/restaurantData";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SortKey = "cal-asc" | "cal-desc" | "protein-desc" | "name-asc";

interface MealItem {
  item: MenuItem;
  qty: number;
}

interface SavedMeal {
  chainSlug: string;
  items: { name: string; qty: number }[];
}

const DAILY = { cal: 2000, protein: 50, fat: 65, carbs: 300, sodium: 2300 };
const LS_KEY = "pulse-meal-builder";

const QUICK_FILTERS = [
  { label: "High Protein (25g+)", key: "highProtein" },
  { label: "Under 400 Cal", key: "under400" },
  { label: "Low Carb", key: "lowCarb" },
  { label: "Vegan", key: "vegan" },
  { label: "Vegetarian", key: "vegetarian" },
] as const;
type FilterKey = (typeof QUICK_FILTERS)[number]["key"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function calColor(cal: number) {
  if (cal <= 400) return "bg-hp-green/10 text-hp-green";
  if (cal <= 600) return "bg-hp-yellow/10 text-hp-yellow";
  return "bg-hp-red/10 text-hp-red";
}

function pct(value: number, max: number) {
  return Math.min(100, Math.round((value / max) * 100));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ChainMenu({ chain }: { chain: RestaurantChain }) {
  /* --- state --- */
  const [sort, setSort] = useState<SortKey>("cal-asc");
  const [maxCal, setMaxCal] = useState(2000);
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [meal, setMeal] = useState<MealItem[]>([]);
  const [mealOpen, setMealOpen] = useState(false);

  /* --- restore from localStorage --- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved: SavedMeal = JSON.parse(raw);
      if (saved.chainSlug !== chain.slug) return;
      const restored: MealItem[] = [];
      for (const s of saved.items) {
        const found = chain.items.find(i => i.name === s.name);
        if (found) restored.push({ item: found, qty: s.qty });
      }
      if (restored.length) {
        setMeal(restored);
        setMealOpen(true);
      }
    } catch { /* ignore */ }
  }, [chain.slug, chain.items]);

  /* --- persist to localStorage --- */
  useEffect(() => {
    if (meal.length === 0) {
      localStorage.removeItem(LS_KEY);
      return;
    }
    const saved: SavedMeal = {
      chainSlug: chain.slug,
      items: meal.map(m => ({ name: m.item.name, qty: m.qty })),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  }, [meal, chain.slug]);

  /* --- filter + sort --- */
  const filtered = useMemo(() => {
    let list = chain.items.filter(i => i.cal <= maxCal);

    for (const f of activeFilters) {
      switch (f) {
        case "highProtein":
          list = list.filter(i => i.protein >= 25);
          break;
        case "under400":
          list = list.filter(i => i.cal <= 400);
          break;
        case "lowCarb":
          list = list.filter(i => i.carbs <= 20);
          break;
        case "vegan":
          list = list.filter(i => i.tags?.includes("vegan"));
          break;
        case "vegetarian":
          list = list.filter(i => i.tags?.includes("vegetarian") || i.tags?.includes("vegan"));
          break;
      }
    }

    const sorted = [...list];
    switch (sort) {
      case "cal-asc":
        sorted.sort((a, b) => a.cal - b.cal);
        break;
      case "cal-desc":
        sorted.sort((a, b) => b.cal - a.cal);
        break;
      case "protein-desc":
        sorted.sort((a, b) => b.protein - a.protein);
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [chain.items, maxCal, activeFilters, sort]);

  /* --- meal helpers --- */
  const addToMeal = useCallback((item: MenuItem) => {
    setMeal(prev => {
      const idx = prev.findIndex(m => m.item.name === item.name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1 }];
    });
    setMealOpen(true);
  }, []);

  const changeQty = useCallback((name: string, delta: number) => {
    setMeal(prev => {
      return prev
        .map(m => (m.item.name === name ? { ...m, qty: m.qty + delta } : m))
        .filter(m => m.qty > 0);
    });
  }, []);

  const clearMeal = useCallback(() => {
    setMeal([]);
    setMealOpen(false);
  }, []);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* --- meal totals --- */
  const totals = useMemo(() => {
    const t = { cal: 0, protein: 0, fat: 0, carbs: 0, sodium: 0 };
    for (const m of meal) {
      t.cal += m.item.cal * m.qty;
      t.protein += m.item.protein * m.qty;
      t.fat += m.item.fat * m.qty;
      t.carbs += m.item.carbs * m.qty;
      t.sodium += m.item.sodium * m.qty;
    }
    return t;
  }, [meal]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="lg:flex lg:gap-5">
      {/* Main column */}
      <div className={`flex-1 min-w-0 ${meal.length > 0 ? "lg:pr-0" : ""}`}>
        {/* Sort & Filter Bar */}
        <div className="bg-surface border border-border rounded-xl p-3 mb-4 space-y-3 animate-fade-in-up">
          {/* Top row: sort + max cal */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-dim font-medium">Sort by</label>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="text-[12px] bg-bg border border-border rounded-lg px-2 py-1 focus-ring"
              >
                <option value="cal-asc">Calories (low→high)</option>
                <option value="cal-desc">Calories (high→low)</option>
                <option value="protein-desc">Protein (high→low)</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
            </div>

            {/* Max calories */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[11px] text-dim font-medium whitespace-nowrap">Max calories:</label>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={maxCal}
                onChange={e => setMaxCal(Number(e.target.value))}
                className="flex-1 accent-hp-green h-1.5"
              />
              <span className="text-[12px] font-semibold text-text w-10 text-right">{maxCal}</span>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all btn-press ${
                  activeFilters.has(f.key)
                    ? "bg-hp-green/15 border-hp-green/30 text-hp-green font-semibold"
                    : "bg-bg border-border text-dim hover:border-hp-green/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Counter */}
          <p className="text-[11px] text-muted">
            Showing {filtered.length} of {chain.items.length} items
          </p>
        </div>

        {/* Menu items */}
        <div className="space-y-1.5">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-dim text-[13px]">
              No items match your filters. Try adjusting the calorie limit or removing filters.
            </div>
          )}

          {filtered.map((item, i) => (
            <div
              key={item.name}
              className="bg-surface border border-border rounded-xl p-3 card-hover animate-fade-in-up flex flex-col sm:flex-row sm:items-center gap-2"
              style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}
            >
              {/* Name + tags */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text leading-snug">{item.name}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-hp-purple/10 text-hp-purple font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Macros */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Calorie badge */}
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-lg ${calColor(item.cal)}`}>
                  {item.cal} cal
                </span>

                {/* Macro pills */}
                <div className="flex items-center gap-1.5 text-[10px] font-medium">
                  <span className="text-hp-blue">{item.protein}g P</span>
                  <span className="text-hp-orange">{item.fat}g F</span>
                  <span className="text-hp-purple">{item.carbs}g C</span>
                  <span className="text-dim">{item.sodium}mg Na</span>
                </div>

                {/* Add button */}
                <button
                  onClick={() => addToMeal(item)}
                  className="text-[11px] font-semibold text-hp-green bg-hp-green/10 hover:bg-hp-green/20 rounded-lg px-2.5 py-1 transition-colors btn-press flex-shrink-0"
                  aria-label={`Add ${item.name} to meal`}
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Builder — Desktop sidebar */}
      {meal.length > 0 && (
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-4">
            <MealPanel
              meal={meal}
              totals={totals}
              onChangeQty={changeQty}
              onClear={clearMeal}
            />
          </div>
        </div>
      )}

      {/* Meal Builder — Mobile bottom sheet */}
      {meal.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-50">
          {/* Collapsed bar */}
          {!mealOpen && (
            <button
              onClick={() => setMealOpen(true)}
              className="w-full bg-hp-green text-white px-4 py-3 flex items-center justify-between text-[13px] font-semibold shadow-lg btn-press"
            >
              <span>🍽 Meal Builder · {meal.reduce((s, m) => s + m.qty, 0)} items</span>
              <span>{totals.cal} cal</span>
            </button>
          )}

          {/* Expanded panel */}
          {mealOpen && (
            <div
              className="bg-surface border-t border-border shadow-2xl rounded-t-2xl max-h-[70vh] overflow-y-auto animate-fade-in-up"
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h3 className="text-[14px] font-bold text-text">Meal Builder</h3>
                <button
                  onClick={() => setMealOpen(false)}
                  className="text-dim text-[18px] hover:text-text"
                  aria-label="Minimize meal builder"
                >
                  ▾
                </button>
              </div>
              <div className="px-4 pb-4">
                <MealPanel
                  meal={meal}
                  totals={totals}
                  onChangeQty={changeQty}
                  onClear={clearMeal}
                  compact
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Meal Panel (shared between desktop sidebar & mobile bottom sheet)  */
/* ------------------------------------------------------------------ */

function MealPanel({
  meal,
  totals,
  onChangeQty,
  onClear,
  compact,
}: {
  meal: MealItem[];
  totals: { cal: number; protein: number; fat: number; carbs: number; sodium: number };
  onChangeQty: (name: string, delta: number) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`bg-surface border border-border rounded-xl ${compact ? "" : "p-4"} space-y-3`}>
      {!compact && (
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-text">🍽 Meal Builder</h3>
          <button
            onClick={onClear}
            className="text-[11px] text-hp-red hover:text-hp-red/80 font-medium btn-press"
          >
            Clear All
          </button>
        </div>
      )}

      {compact && (
        <div className="flex justify-end">
          <button
            onClick={onClear}
            className="text-[11px] text-hp-red hover:text-hp-red/80 font-medium btn-press"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {meal.map(m => (
          <div key={m.item.name} className="flex items-center gap-2 text-[12px]">
            <div className="flex-1 min-w-0 truncate text-text">{m.item.name}</div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onChangeQty(m.item.name, -1)}
                className="w-5 h-5 rounded bg-bg border border-border text-dim hover:text-text flex items-center justify-center text-[11px] btn-press"
                aria-label={`Decrease ${m.item.name} quantity`}
              >
                −
              </button>
              <span className="w-5 text-center font-semibold">{m.qty}</span>
              <button
                onClick={() => onChangeQty(m.item.name, 1)}
                className="w-5 h-5 rounded bg-bg border border-border text-dim hover:text-text flex items-center justify-center text-[11px] btn-press"
                aria-label={`Increase ${m.item.name} quantity`}
              >
                +
              </button>
            </div>
            <span className="text-dim text-[11px] w-14 text-right flex-shrink-0">
              {m.item.cal * m.qty} cal
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Totals with progress bars */}
      <div className="space-y-2">
        <ProgressRow label="Calories" value={totals.cal} max={DAILY.cal} unit="cal" color="bg-hp-green" />
        <ProgressRow label="Protein" value={totals.protein} max={DAILY.protein} unit="g" color="bg-hp-blue" />
        <ProgressRow label="Fat" value={totals.fat} max={DAILY.fat} unit="g" color="bg-hp-orange" />
        <ProgressRow label="Carbs" value={totals.carbs} max={DAILY.carbs} unit="g" color="bg-hp-purple" />
        <ProgressRow label="Sodium" value={totals.sodium} max={DAILY.sodium} unit="mg" color="bg-gray-400" />
      </div>

      {/* Stacked calorie comparison (2+ items) */}
      {meal.length >= 2 && (
        <div>
          <p className="text-[10px] text-dim font-medium mb-1.5">Calorie breakdown</p>
          <div className="flex h-5 rounded-lg overflow-hidden border border-border">
            {meal.map((m, i) => {
              const itemCal = m.item.cal * m.qty;
              const widthPct = totals.cal > 0 ? (itemCal / totals.cal) * 100 : 0;
              const colors = [
                "bg-hp-green",
                "bg-hp-blue",
                "bg-hp-orange",
                "bg-hp-purple",
                "bg-hp-pink",
                "bg-hp-cyan",
                "bg-hp-yellow",
                "bg-hp-red",
              ];
              return (
                <div
                  key={m.item.name}
                  className={`${colors[i % colors.length]} relative group`}
                  style={{ width: `${widthPct}%` }}
                  title={`${m.item.name}: ${itemCal} cal (${Math.round(widthPct)}%)`}
                >
                  {widthPct > 15 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold truncate px-0.5">
                      {Math.round(widthPct)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {meal.map((m, i) => {
              const colors = [
                "bg-hp-green",
                "bg-hp-blue",
                "bg-hp-orange",
                "bg-hp-purple",
                "bg-hp-pink",
                "bg-hp-cyan",
                "bg-hp-yellow",
                "bg-hp-red",
              ];
              return (
                <div key={m.item.name} className="flex items-center gap-1 text-[9px] text-dim">
                  <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                  <span className="truncate max-w-[100px]">{m.item.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress bar row                                                   */
/* ------------------------------------------------------------------ */

function ProgressRow({
  label,
  value,
  max,
  unit,
  color,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}) {
  const p = pct(value, max);
  const over = value > max;

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-0.5">
        <span className="text-dim font-medium">{label}</span>
        <span className={`font-semibold ${over ? "text-hp-red" : "text-text"}`}>
          {Math.round(value)}{unit} <span className="text-muted font-normal">/ {max}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${over ? "bg-hp-red" : color}`}
          style={{ width: `${Math.min(p, 100)}%` }}
        />
      </div>
    </div>
  );
}

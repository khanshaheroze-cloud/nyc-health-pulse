"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────────────────── */

interface FoodResult {
  id: string | number;
  name: string;
  brand: string;
  servingSize: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  sodium: number | null;
  fiber: number | null;
  sugar: number | null;
  source?: "usda" | "off" | "curated" | "popular";
  chainSlug?: string;
}

interface MealItem extends FoodResult {
  qty: number;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function calColor(cal: number | null) {
  if (cal == null) return { ring: "border-border", text: "text-muted", bg: "" };
  if (cal <= 500) return { ring: "border-hp-green/40", text: "text-hp-green", bg: "bg-hp-green/5" };
  if (cal <= 700) return { ring: "border-hp-orange/40", text: "text-hp-orange", bg: "bg-hp-orange/5" };
  return { ring: "border-hp-red/40", text: "text-hp-red", bg: "bg-hp-red/5" };
}

const COMPARISONS: [string, number][] = [
  ["a NYC cheese slice", 280],
  ["an Egg McMuffin", 300],
  ["a banana", 105],
  ["a Chipotle chicken bowl", 415],
  ["a can of Coke", 140],
  ["a Shake Shack burger", 530],
];

function calorieComparison(cal: number): string | null {
  let best = COMPARISONS[0];
  let bestDiff = Math.abs(cal - best[1]);
  for (const c of COMPARISONS) {
    const diff = Math.abs(cal - c[1]);
    if (diff < bestDiff) { best = c; bestDiff = diff; }
  }
  if (bestDiff < 30) return null;
  const ratio = cal / best[1];
  if (ratio >= 1.4) return `${ratio.toFixed(1)}x the calories of ${best[0]}`;
  if (ratio <= 0.7) return `${Math.round((1 - ratio) * 100)}% fewer calories than ${best[0]}`;
  return `About the same as ${best[0]} (${best[1]} cal)`;
}

function macroPct(protein: number, carbs: number, fat: number) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (total === 0) return { p: 33, c: 33, f: 34 };
  return {
    p: Math.round((protein * 4 / total) * 100),
    c: Math.round((carbs * 4 / total) * 100),
    f: Math.round((fat * 9 / total) * 100),
  };
}

const POPULAR = [
  "Chipotle chicken bowl", "halal chicken over rice", "bacon egg and cheese",
  "Big Mac", "açaí bowl", "chopped cheese", "oat milk latte", "Sweetgreen",
];

/* ── Component ───────────────────────────────────────────────────────── */

export function NutritionSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [meal, setMeal] = useState<MealItem[]>([]);
  const [mealOpen, setMealOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/nutrition-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const selectFood = (f: FoodResult) => {
    setSelected(f);
    setSelectedQty(1);
    setResults([]);
    setSearched(false);
  };

  const addToMeal = () => {
    if (!selected) return;
    setMeal((prev) => [...prev, { ...selected, qty: selectedQty }]);
    setSelected(null);
    setQuery("");
  };

  const removeFromMeal = (idx: number) => {
    setMeal((prev) => prev.filter((_, i) => i !== idx));
  };

  const mealTotals = meal.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories ?? 0) * item.qty,
      protein: acc.protein + (item.protein ?? 0) * item.qty,
      fat: acc.fat + (item.fat ?? 0) * item.qty,
      carbs: acc.carbs + (item.carbs ?? 0) * item.qty,
      sodium: acc.sodium + (item.sodium ?? 0) * item.qty,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, sodium: 0 }
  );

  const mealColor = calColor(mealTotals.calories || null);

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim text-base pointer-events-none">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={compact ? "Search any food..." : "Search any food — Big Mac, banana, Chipotle bowl, açaí bowl..."}
          className={`w-full bg-surface border border-border rounded-xl pl-10 pr-4 text-[13px] text-text placeholder:text-muted focus-ring ${compact ? "py-2.5" : "py-3.5 text-[14px]"}`}
        />
        {loading && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <span className="w-4 h-4 border-2 border-hp-blue/30 border-t-hp-blue rounded-full animate-spin inline-block" />
          </span>
        )}
      </div>

      {/* Popular searches */}
      {!compact && !searched && !selected && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {POPULAR.map((p) => (
            <button
              key={p}
              onClick={() => { setQuery(p); search(p); }}
              className="text-[10px] px-2.5 py-1 rounded-full border border-border text-dim hover:text-text hover:border-hp-blue/30 hover:bg-hp-blue/5 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Search results dropdown */}
      {searched && !loading && results.length === 0 && !selected && (
        <p className="text-[12px] text-muted text-center py-4">
          No results found. Try a specific item or brand name.
        </p>
      )}

      {results.length > 0 && !selected && (
        <div className="mt-2 bg-surface border border-border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto shadow-lg">
          {results.map((f) => {
            const cc = calColor(f.calories);
            return (
              <button
                key={f.id}
                onClick={() => selectFood(f)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-bg/60 transition-colors border-b border-border/50 last:border-b-0`}
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-text truncate">{f.name}</p>
                  <p className="text-[10px] text-muted truncate flex items-center gap-1">
                    {f.brand}{f.servingSize ? ` · ${f.servingSize}` : ""}
                    {(f.source === "curated" || f.source === "popular") && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green font-bold">
                        {f.source === "curated" ? "✓ Verified" : "NYC Popular"}
                      </span>
                    )}
                    {f.source === "off" && <span className="text-[8px] px-1 py-0.5 rounded bg-hp-orange/10 text-hp-orange">OFF</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {f.calories != null && (
                    <span className={`text-[13px] font-bold ${cc.text}`}>
                      {f.calories} cal
                    </span>
                  )}
                  {f.protein != null && (
                    <span className="text-[10px] text-dim hidden sm:inline">
                      {f.protein}g P
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          <div className="px-4 py-1.5 bg-bg/50">
            <p className="text-[9px] text-muted">55 NYC chains + NYC popular foods + USDA + Open Food Facts · 500K+ items</p>
          </div>
        </div>
      )}

      {/* Selected food detail card */}
      {selected && (
        <div className={`mt-3 border rounded-xl overflow-hidden ${calColor(selected.calories ? selected.calories * selectedQty : null).ring} ${calColor(selected.calories ? selected.calories * selectedQty : null).bg}`}>
          {/* Header */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-text leading-tight">{selected.name}</p>
                <p className="text-[11px] text-muted mt-0.5">
                  {selected.brand}{selected.servingSize ? ` · ${selected.servingSize}` : ""}
                  {(selected.source === "curated" || selected.source === "popular") && (
                    <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-hp-green/10 text-hp-green font-bold">
                      {selected.source === "curated" ? "✓ Verified Macros" : "NYC Estimate"}
                    </span>
                  )}
                </p>
                {selected.chainSlug && (
                  <Link
                    href={`/restaurants/${selected.chainSlug}`}
                    className="inline-flex items-center gap-1 text-[10px] text-hp-blue hover:underline mt-1"
                  >
                    View full {selected.brand} menu →
                  </Link>
                )}
              </div>
              <button
                onClick={() => { setSelected(null); setQuery(""); }}
                className="text-dim hover:text-text text-lg leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>

            {/* Quantity adjuster */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] text-dim uppercase tracking-widest font-bold">Servings</span>
              <div className="flex items-center gap-1">
                {[0.5, 1, 1.5, 2].map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQty(q)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${selectedQty === q ? "bg-hp-blue/10 border-hp-blue/30 text-hp-blue" : "border-border text-dim hover:text-text"}`}
                  >
                    {q}x
                  </button>
                ))}
              </div>
            </div>

            {/* Big calorie number */}
            {selected.calories != null && (
              <div className="mt-3 text-center">
                <p className={`text-[36px] font-display font-bold leading-none ${calColor(selected.calories * selectedQty).text}`}>
                  {Math.round(selected.calories * selectedQty)}
                </p>
                <p className="text-[11px] text-dim mt-0.5">calories</p>
              </div>
            )}

            {/* Macro donut (simplified bar) */}
            {selected.protein != null && selected.carbs != null && selected.fat != null && (
              <>
                <div className="flex rounded-full overflow-hidden h-2.5 mt-3">
                  {(() => {
                    const pct = macroPct(selected.protein!, selected.carbs!, selected.fat!);
                    return (
                      <>
                        <div style={{ width: `${pct.p}%` }} className="bg-hp-blue" title={`Protein ${pct.p}%`} />
                        <div style={{ width: `${pct.c}%` }} className="bg-hp-green" title={`Carbs ${pct.c}%`} />
                        <div style={{ width: `${pct.f}%` }} className="bg-hp-orange" title={`Fat ${pct.f}%`} />
                      </>
                    );
                  })()}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px]">
                    <span className="inline-block w-2 h-2 rounded-full bg-hp-blue mr-1 align-middle" />
                    <strong className="text-text">{Math.round(selected.protein! * selectedQty)}g</strong>
                    <span className="text-dim ml-0.5">protein</span>
                  </span>
                  <span className="text-[10px]">
                    <span className="inline-block w-2 h-2 rounded-full bg-hp-green mr-1 align-middle" />
                    <strong className="text-text">{Math.round(selected.carbs! * selectedQty)}g</strong>
                    <span className="text-dim ml-0.5">carbs</span>
                  </span>
                  <span className="text-[10px]">
                    <span className="inline-block w-2 h-2 rounded-full bg-hp-orange mr-1 align-middle" />
                    <strong className="text-text">{Math.round(selected.fat! * selectedQty)}g</strong>
                    <span className="text-dim ml-0.5">fat</span>
                  </span>
                </div>
              </>
            )}

            {/* Secondary nutrients */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-2 border-t border-border/50">
              {selected.sodium != null && (
                <span className="text-[10px] text-dim">
                  Sodium: <strong className="text-text">{Math.round(selected.sodium * selectedQty)}mg</strong>
                </span>
              )}
              {selected.sugar != null && (
                <span className="text-[10px] text-dim">
                  Sugar: <strong className="text-text">{Math.round(selected.sugar * selectedQty)}g</strong>
                </span>
              )}
              {selected.fiber != null && (
                <span className="text-[10px] text-dim">
                  Fiber: <strong className="text-text">{Math.round(selected.fiber * selectedQty)}g</strong>
                </span>
              )}
            </div>

            {/* Comparison */}
            {selected.calories != null && (() => {
              const comp = calorieComparison(Math.round(selected.calories * selectedQty));
              return comp ? <p className="text-[10px] text-dim mt-2 italic">{comp}</p> : null;
            })()}
          </div>

          {/* Add to meal button */}
          <button
            onClick={addToMeal}
            className="w-full py-2.5 bg-hp-blue/10 border-t border-hp-blue/20 text-[12px] font-bold text-hp-blue hover:bg-hp-blue/15 transition-colors"
          >
            + Add to My Meal
          </button>
        </div>
      )}

      {/* Meal tracker bar */}
      {meal.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setMealOpen(!mealOpen)}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${mealColor.ring} ${mealColor.bg}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🍽️</span>
              <span className="text-[12px] font-bold text-text">
                Your meal: {meal.length} item{meal.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[14px] font-bold ${mealColor.text}`}>
                {Math.round(mealTotals.calories)} cal
              </span>
              <span className="text-[10px] text-dim hidden sm:inline">
                {Math.round(mealTotals.protein)}g protein
              </span>
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className={`text-dim transition-transform ${mealOpen ? "rotate-180" : ""}`}
              >
                <path d="M3 5 L6 8 L9 5" />
              </svg>
            </div>
          </button>

          {mealOpen && (
            <div className="mt-2 border border-border rounded-xl overflow-hidden">
              {meal.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2 border-b border-border/50 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-text truncate">
                      {item.qty !== 1 ? `${item.qty}x ` : ""}{item.name}
                    </p>
                    <p className="text-[9px] text-muted">{item.brand}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold text-dim">
                      {Math.round((item.calories ?? 0) * item.qty)} cal
                    </span>
                    <button
                      onClick={() => removeFromMeal(i)}
                      className="text-dim hover:text-hp-red text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Meal totals */}
              <div className="px-4 py-2.5 bg-bg/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-text">Total</span>
                  <span className={`text-[14px] font-bold ${mealColor.text}`}>
                    {Math.round(mealTotals.calories)} cal
                  </span>
                </div>
                <div className="flex gap-4 text-[10px] text-dim">
                  <span>Protein: <strong className="text-text">{Math.round(mealTotals.protein)}g</strong></span>
                  <span>Fat: <strong className="text-text">{Math.round(mealTotals.fat)}g</strong></span>
                  <span>Carbs: <strong className="text-text">{Math.round(mealTotals.carbs)}g</strong></span>
                  <span>Sodium: <strong className="text-text">{Math.round(mealTotals.sodium)}mg</strong></span>
                </div>
                {mealTotals.calories > 600 && (
                  <p className="text-[10px] text-hp-orange mt-1.5">
                    This meal is over the DOHMH 600-cal guideline. Consider swapping one item.
                  </p>
                )}
              </div>

              <button
                onClick={() => { setMeal([]); setMealOpen(false); }}
                className="w-full py-2 text-[11px] font-semibold text-dim hover:text-hp-red border-t border-border transition-colors"
              >
                Clear meal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

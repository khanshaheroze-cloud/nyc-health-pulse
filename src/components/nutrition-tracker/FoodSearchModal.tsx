"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FoodEntry } from "./DailySummary";
import FoodDetailCard from "./FoodDetailCard";

/* ── Types ────────────────────────────────────────────────── */

type Tab = "search" | "recent" | "nyc" | "myfoods";

interface SearchResult {
  id: string;
  name: string;
  category?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  source: "nyc" | "usda" | "openfoodfacts" | "custom";
  nycBadge?: boolean;
  description?: string;
  variants?: { name: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }[];
  tip?: string;
  tags?: string[];
  micronutrients?: Record<string, number>;
}

const TAB_LABELS: Record<Tab, string> = {
  search: "Search",
  recent: "Recent",
  nyc: "NYC Favorites",
  myfoods: "My Foods",
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

/* ── Time-of-day tags for NYC Favorites ───────────────────── */

function getTimeOfDayTags(): { tags: string[]; label: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) {
    return { tags: ["breakfast", "coffee", "morning", "bagel"], label: "Good Morning" };
  }
  if (hour >= 10 && hour < 14) {
    return { tags: ["lunch", "salad", "sandwich", "halal", "pizza"], label: "Lunchtime Picks" };
  }
  if (hour >= 14 && hour < 17) {
    return { tags: ["coffee", "boba", "snack", "afternoon"], label: "Afternoon Boost" };
  }
  if (hour >= 17 && hour < 21) {
    return { tags: ["dinner", "ramen", "pizza", "burger", "bowl"], label: "Dinner Ideas" };
  }
  return { tags: ["late-night", "halal", "pizza", "slice"], label: "Late Night Cravings" };
}

/* ── LocalStorage helpers ─────────────────────────────────── */

function getRecentFoods(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pulsenyc_food_history");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FoodEntry[];
    // deduplicate by id, keep most recent, limit 10
    const seen = new Set<string>();
    const unique: FoodEntry[] = [];
    for (const item of parsed) {
      if (!seen.has(item.id) && unique.length < 10) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  } catch {
    return [];
  }
}

function getSavedFoods(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pulsenyc_saved_foods");
    if (!raw) return [];
    return JSON.parse(raw) as FoodEntry[];
  } catch {
    return [];
  }
}

/* ── Source badge ──────────────────────────────────────────── */

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1.5 ${
      source === "common" ? "bg-hp-green/10 text-hp-green" :
      source === "nyc" ? "bg-hp-orange/10 text-hp-orange" :
      source === "usda" ? "bg-hp-blue/10 text-hp-blue" :
      source === "openfoodfacts" ? "bg-border text-muted" :
      source === "custom" ? "bg-border text-muted" :
      "bg-border text-muted"
    }`}>
      {source === "common" ? "Common" :
       source === "nyc" ? "NYC" :
       source === "usda" ? "USDA" :
       source === "openfoodfacts" ? "Packaged" :
       source === "custom" ? "Custom" :
       source === "quick" ? "Quick" : source}
    </span>
  );
}

/* ── Quick Add Form ───────────────────────────────────────── */

function QuickAddForm({
  meal,
  onAdd,
  onCancel,
}: {
  meal: string;
  onAdd: (entry: FoodEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");

  const handleSubmit = () => {
    const cal = parseInt(calories, 10);
    if (!cal || cal <= 0) return;
    const entry: FoodEntry = {
      id: `quick-${Date.now()}`,
      name: name.trim() || "Quick Add",
      source: "quick",
      servings: 1,
      servingSize: "1 serving",
      calories: cal,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      timestamp: Date.now(),
    };
    onAdd(entry);
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-bold text-text">Quick Add Calories</h3>
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      <input
        type="number"
        placeholder="Calories"
        value={calories}
        onChange={(e) => setCalories(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        min={1}
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-sm font-medium text-dim bg-bg rounded-lg hover:bg-border transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!calories || parseInt(calories, 10) <= 0}
          className="flex-1 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add to {MEAL_LABELS[meal]}
        </button>
      </div>
    </div>
  );
}

/* ── Custom Food Form ─────────────────────────────────────── */

function CustomFoodForm({
  meal,
  onAdd,
  onCancel,
}: {
  meal: string;
  onAdd: (entry: FoodEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");

  const handleSubmit = () => {
    const cal = parseInt(calories, 10);
    if (!name.trim() || !cal || cal <= 0) return;
    const entry: FoodEntry = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      source: "custom",
      servings: 1,
      servingSize: "1 serving",
      calories: cal,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
      timestamp: Date.now(),
    };
    onAdd(entry);
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-bold text-text">Create Custom Food</h3>
      <input
        type="text"
        placeholder="Food name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Calories *"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          min={1}
        />
        <input
          type="number"
          placeholder="Protein (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          min={0}
          step={0.1}
        />
        <input
          type="number"
          placeholder="Carbs (g)"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          min={0}
          step={0.1}
        />
        <input
          type="number"
          placeholder="Fat (g)"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          min={0}
          step={0.1}
        />
      </div>
      <input
        type="number"
        placeholder="Fiber (g)"
        value={fiber}
        onChange={(e) => setFiber(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        min={0}
        step={0.1}
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-sm font-medium text-dim bg-bg rounded-lg hover:bg-border transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !calories || parseInt(calories, 10) <= 0}
          className="flex-1 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add to {MEAL_LABELS[meal]}
        </button>
      </div>
    </div>
  );
}

/* ── Search Result Row ────────────────────────────────────── */

function SearchResultRow({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-bg rounded-lg transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-text truncate">{result.name}</span>
          <SourceBadge source={result.source} />
        </div>
        {result.category && (
          <p className="text-xs text-muted mt-0.5 truncate">{result.category}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-text tabular-nums">{Math.round(result.calories)}</p>
        <p className="text-[10px] text-muted">cal</p>
      </div>
      <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ── Main Modal ───────────────────────────────────────────── */

interface FoodSearchModalProps {
  open: boolean;
  onClose: () => void;
  meal: "breakfast" | "lunch" | "dinner" | "snacks";
  onAddFood: (entry: FoodEntry) => void;
}

export default function FoodSearchModal({
  open,
  onClose,
  meal,
  onAddFood,
}: FoodSearchModalProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
  const [servingsOverride, setServingsOverride] = useState<number | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [recentFoods, setRecentFoods] = useState<FoodEntry[]>([]);
  const [savedFoods, setSavedFoods] = useState<FoodEntry[]>([]);
  const [nycFavorites, setNycFavorites] = useState<SearchResult[]>([]);
  const [nycLabel, setNycLabel] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load data when modal opens
  useEffect(() => {
    if (!open) return;
    setRecentFoods(getRecentFoods());
    setSavedFoods(getSavedFoods());
    setSelectedFood(null);
    setServingsOverride(null);
    setShowQuickAdd(false);
    setShowCustom(false);
    setQuery("");
    setResults([]);
    setNoResults(false);

    // Focus search input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Load NYC Favorites
  useEffect(() => {
    if (!open || tab !== "nyc") return;
    const { tags, label } = getTimeOfDayTags();
    setNycLabel(label);

    async function loadNyc() {
      setLoading(true);
      try {
        const tagQuery = tags.join(",");
        const res = await fetch(`/api/nutrition-tracker/search?tags=${encodeURIComponent(tagQuery)}&source=nyc&limit=15`);
        if (res.ok) {
          const data = await res.json();
          setNycFavorites(data.results || []);
        } else {
          setNycFavorites([]);
        }
      } catch {
        setNycFavorites([]);
      } finally {
        setLoading(false);
      }
    }
    loadNyc();
  }, [open, tab]);

  // Debounced search
  useEffect(() => {
    if (tab !== "search" || !query.trim()) {
      setResults([]);
      setNoResults(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setNoResults(false);
      try {
        const res = await fetch(`/api/nutrition-tracker/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.results || [];
          setResults(items);
          setNoResults(items.length === 0);
          // Auto-apply parsed quantity from query (e.g. "8oz chicken" → oz=8)
          if (data.parsedQuantity) {
            const pq = data.parsedQuantity;
            if (pq.quantity) setServingsOverride(pq.quantity);
          }
        } else {
          setResults([]);
          setNoResults(true);
        }
      } catch {
        setResults([]);
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tab]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleAddFood = useCallback(
    (entry: FoodEntry) => {
      onAddFood(entry);
      // Save to history
      if (typeof window !== "undefined") {
        try {
          const existing = JSON.parse(localStorage.getItem("pulsenyc_food_history") || "[]") as FoodEntry[];
          const filtered = existing.filter((e) => e.id !== entry.id);
          const updated = [entry, ...filtered].slice(0, 50);
          localStorage.setItem("pulsenyc_food_history", JSON.stringify(updated));
        } catch {
          /* ignore */
        }
      }
      setSelectedFood(null);
      setShowQuickAdd(false);
      setShowCustom(false);
      onClose();
    },
    [onAddFood, onClose]
  );

  const handleSelectResult = useCallback((result: SearchResult) => {
    setSelectedFood(result);
  }, []);

  const handleSelectRecent = useCallback((entry: FoodEntry) => {
    setSelectedFood({
      id: entry.id,
      name: entry.name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
      servingSize: entry.servingSize,
      source: entry.source === "quick" ? "custom" : entry.source,
      nycBadge: entry.nycBadge,
      micronutrients: entry.micronutrients,
    });
  }, []);

  if (!open) return null;

  // If a food is selected, show detail view
  if (selectedFood) {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg max-h-[90vh] bg-surface rounded-t-2xl md:rounded-2xl overflow-y-auto">
          <FoodDetailCard
            food={selectedFood}
            meal={meal}
            onAdd={handleAddFood}
            onBack={() => setSelectedFood(null)}
            initialQuantity={servingsOverride ?? undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] md:max-h-[80vh] bg-surface rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold text-text font-display">
            Add to {MEAL_LABELS[meal]}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg transition-colors text-dim"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pb-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search foods, restaurants, brands..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (tab !== "search") setTab("search");
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted hover:text-dim"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 border-b border-border">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                tab === t
                  ? "text-accent border-b-2 border-accent bg-accent-bg/50"
                  : "text-muted hover:text-dim"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[200px]">
          {/* Quick add / custom forms */}
          {showQuickAdd && (
            <QuickAddForm
              meal={meal}
              onAdd={handleAddFood}
              onCancel={() => setShowQuickAdd(false)}
            />
          )}
          {showCustom && (
            <CustomFoodForm
              meal={meal}
              onAdd={handleAddFood}
              onCancel={() => setShowCustom(false)}
            />
          )}

          {!showQuickAdd && !showCustom && (
            <>
              {/* Search tab */}
              {tab === "search" && (
                <div>
                  {loading && (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!loading && noResults && (
                    <div className="text-center py-10">
                      <p className="text-sm text-muted">No results found for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs text-muted mt-1">Try a different search term or add a custom food</p>
                    </div>
                  )}
                  {!loading && !noResults && results.length === 0 && !query && (
                    <div className="text-center py-10">
                      <svg className="w-10 h-10 mx-auto text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm text-muted">Search for any food, restaurant, or brand</p>
                      <p className="text-xs text-muted mt-1">Try &ldquo;chicken breast&rdquo;, &ldquo;Sweetgreen&rdquo;, or &ldquo;bagel&rdquo;</p>
                    </div>
                  )}
                  {!loading && results.length > 0 && (
                    <div className="space-y-0.5">
                      {results.map((r) => (
                        <SearchResultRow
                          key={r.id}
                          result={r}
                          onClick={() => handleSelectResult(r)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recent tab */}
              {tab === "recent" && (
                <div>
                  {recentFoods.length === 0 ? (
                    <div className="text-center py-10">
                      <svg className="w-10 h-10 mx-auto text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-muted">No recent foods yet</p>
                      <p className="text-xs text-muted mt-1">Foods you log will appear here for quick access</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {recentFoods.map((entry) => (
                        <SearchResultRow
                          key={entry.id}
                          result={{
                            id: entry.id,
                            name: entry.name,
                            calories: entry.calories,
                            protein: entry.protein,
                            carbs: entry.carbs,
                            fat: entry.fat,
                            fiber: entry.fiber,
                            servingSize: entry.servingSize,
                            source: entry.source === "quick" ? "custom" : entry.source,
                            nycBadge: entry.nycBadge,
                          }}
                          onClick={() => handleSelectRecent(entry)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* NYC Favorites tab */}
              {tab === "nyc" && (
                <div>
                  {nycLabel && (
                    <p className="text-xs font-medium text-accent mb-2 flex items-center gap-1">
                      🗽 {nycLabel}
                    </p>
                  )}
                  {loading && (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!loading && nycFavorites.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-sm text-muted">No NYC favorites available right now</p>
                      <p className="text-xs text-muted mt-1">Check back later for curated NYC food picks</p>
                    </div>
                  )}
                  {!loading && nycFavorites.length > 0 && (
                    <div className="space-y-0.5">
                      {nycFavorites.map((r) => (
                        <SearchResultRow
                          key={r.id}
                          result={r}
                          onClick={() => handleSelectResult(r)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Foods tab */}
              {tab === "myfoods" && (
                <div>
                  {savedFoods.length === 0 ? (
                    <div className="text-center py-10">
                      <svg className="w-10 h-10 mx-auto text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <p className="text-sm text-muted">No saved foods yet</p>
                      <p className="text-xs text-muted mt-1">Save foods from search results for quick access</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {savedFoods.map((entry) => (
                        <SearchResultRow
                          key={entry.id}
                          result={{
                            id: entry.id,
                            name: entry.name,
                            calories: entry.calories,
                            protein: entry.protein,
                            carbs: entry.carbs,
                            fat: entry.fat,
                            fiber: entry.fiber,
                            servingSize: entry.servingSize,
                            source: entry.source === "quick" ? "custom" : entry.source,
                            nycBadge: entry.nycBadge,
                          }}
                          onClick={() => handleSelectRecent(entry)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer buttons */}
        {!showQuickAdd && !showCustom && (
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <button
              onClick={() => {
                setShowQuickAdd(true);
                setShowCustom(false);
              }}
              className="flex-1 py-2.5 text-sm font-medium text-accent bg-accent-bg rounded-xl hover:bg-accent-bg/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Add
            </button>
            <button
              onClick={() => {
                setShowCustom(true);
                setShowQuickAdd(false);
              }}
              className="flex-1 py-2.5 text-sm font-medium text-dim bg-bg rounded-xl hover:bg-border transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Custom
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

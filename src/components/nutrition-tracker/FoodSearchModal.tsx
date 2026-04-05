"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { FoodEntry } from "./DailySummary";
import FoodDetailCard from "./FoodDetailCard";
import MealBuilder from "./MealBuilder";
import { detectRestaurantTrigger, parseBuilderHints, getRestaurantBuilder, RESTAURANT_LIST } from "@/lib/restaurantBuilderData";
import { NYC_FOOD_DATABASE, type NycFoodItem } from "@/lib/nycFoodDatabase";

/* ── Types ────────────────────────────────────────────────── */

type Tab = "search" | "recent" | "nyc" | "myfoods";
type FoodCategory = "all" | "grocery" | "prepared" | "restaurant" | "fastfood";

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
  source: "nyc" | "usda" | "openfoodfacts" | "custom" | "common";
  nycBadge?: boolean;
  description?: string;
  variants?: { name: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }[];
  tip?: string;
  tags?: string[];
  micronutrients?: Record<string, number>;
  score?: number;
}

const TAB_LABELS: Record<Tab, string> = {
  search: "Search",
  recent: "Recent",
  nyc: "NYC Favorites",
  myfoods: "My Foods",
};

const CATEGORY_TABS: { key: FoodCategory; emoji: string; label: string }[] = [
  { key: "all", emoji: "", label: "All" },
  { key: "grocery", emoji: "🛒", label: "Grocery" },
  { key: "prepared", emoji: "🥡", label: "Prepared" },
  { key: "restaurant", emoji: "🍽", label: "Restaurant" },
  { key: "fastfood", emoji: "🍔", label: "Fast Food" },
];

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

/* ── Category badge helpers ──────────────────────────────── */

function CategoryBadge({ source }: { source: string }) {
  const config: Record<string, { emoji: string; label: string; cls: string }> = {
    common: { emoji: "🛒", label: "Common", cls: "bg-hp-green/10 text-hp-green" },
    nyc: { emoji: "🥡", label: "NYC", cls: "bg-hp-orange/10 text-hp-orange" },
    usda: { emoji: "🏛", label: "USDA", cls: "bg-hp-blue/10 text-hp-blue" },
    openfoodfacts: { emoji: "📦", label: "Packaged", cls: "bg-border text-muted" },
    custom: { emoji: "✏️", label: "Custom", cls: "bg-border text-muted" },
    quick: { emoji: "⚡", label: "Quick", cls: "bg-border text-muted" },
  };
  const c = config[source] || config.custom;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1.5 inline-flex items-center gap-0.5 ${c.cls}`}>
      <span className="text-[8px]">{c.emoji}</span> {c.label}
    </span>
  );
}

/* ── 24h Result Cache (LRU, max 200 entries) ─────────────── */

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
  ttl: number;
}

const CACHE_TTL = 86400000; // 24 hours
const CACHE_MAX = 200;

function getCacheKey(source: string, query: string): string {
  return `pulse-nutrition-cache-${source}-${query.trim().toLowerCase()}`;
}

function getFromCache(source: string, query: string): SearchResult[] | null {
  try {
    const key = getCacheKey(source, query);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.results;
  } catch {
    return null;
  }
}

function setCache(source: string, query: string, results: SearchResult[]) {
  try {
    const key = getCacheKey(source, query);
    const entry: CacheEntry = { results, timestamp: Date.now(), ttl: CACHE_TTL };
    localStorage.setItem(key, JSON.stringify(entry));
    // LRU eviction: count cache entries and remove oldest if > CACHE_MAX
    evictCacheIfNeeded();
  } catch { /* storage full or unavailable */ }
}

function evictCacheIfNeeded() {
  try {
    const prefix = "pulse-nutrition-cache-";
    const entries: { key: string; ts: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            entries.push({ key, ts: parsed.timestamp || 0 });
          }
        } catch { /* skip */ }
      }
    }
    if (entries.length > CACHE_MAX) {
      entries.sort((a, b) => a.ts - b.ts);
      const toRemove = entries.length - CACHE_MAX;
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
      }
    }
  } catch { /* ignore */ }
}

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

/* ── NYC Favorites browsable categories ─────────────────────── */

const NYC_BROWSE_CATEGORIES: { key: string; emoji: string; label: string; filter: (item: NycFoodItem) => boolean }[] = [
  { key: "breakfast", emoji: "🌅", label: "Breakfast", filter: (i) => i.tags.includes("breakfast") || i.tags.includes("morning") || i.tags.includes("bagel") || i.category === "Bagels & Bakery" || i.category === "Coffee & Drinks" && i.tags.includes("coffee") },
  { key: "street", emoji: "🥙", label: "Street Food & Carts", filter: (i) => i.category === "Street Food & Carts" },
  { key: "bodega", emoji: "🥪", label: "Delis & Bodegas", filter: (i) => i.category === "Bodega" || i.category === "Sandwich & Deli" },
  { key: "pizza", emoji: "🍕", label: "Pizza", filter: (i) => i.category === "Pizza" || i.tags.includes("pizza") },
  { key: "caribbean", emoji: "🍗", label: "Caribbean & Soul", filter: (i) => i.tags.includes("caribbean") || i.tags.includes("jamaican") || i.tags.includes("trinidadian") },
  { key: "noodles", emoji: "🍜", label: "Noodles & Asian", filter: (i) => i.category === "Chinese & Noodles" || i.category === "Japanese & Sushi" || i.category === "Korean" },
  { key: "indian", emoji: "🍛", label: "Indian & South Asian", filter: (i) => i.category === "Indian & South Asian" },
  { key: "mexican", emoji: "🌮", label: "Mexican & Tacos", filter: (i) => i.category === "Mexican & Tacos" },
  { key: "mideast", emoji: "🧆", label: "Middle Eastern", filter: (i) => i.category === "Middle Eastern" },
  { key: "coffee", emoji: "☕", label: "Coffee & Drinks", filter: (i) => i.category === "Coffee & Drinks" || i.category === "Boba & Juice" },
  { key: "salads", emoji: "🥗", label: "Salads & Bowls", filter: (i) => i.category === "Salads & Bowls" || i.category === "Fast Casual" },
  { key: "dessert", emoji: "🍪", label: "Dessert & Snacks", filter: (i) => i.category === "Dessert & Snacks" },
  { key: "iconic", emoji: "🗽", label: "Iconic NYC Spots", filter: (i) => i.category === "Iconic NYC Spots" || i.tags.includes("classic-nyc") },
];

function nycItemToSearchResult(item: NycFoodItem): SearchResult {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    servingSize: item.servingSize,
    source: "nyc",
    nycBadge: true,
    description: item.description,
    variants: item.variants,
    tip: item.tip,
    tags: item.tags,
  };
}

/* ── LocalStorage helpers ─────────────────────────────────── */

function getRecentFoods(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pulsenyc_food_history");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FoodEntry[];
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

function loadLastCategory(): FoodCategory {
  try {
    const val = localStorage.getItem("pulse-nutrition-last-tab");
    if (val && ["all", "grocery", "prepared", "restaurant", "fastfood"].includes(val)) {
      return val as FoodCategory;
    }
  } catch { /* ignore */ }
  return "all";
}

function saveLastCategory(cat: FoodCategory) {
  try {
    localStorage.setItem("pulse-nutrition-last-tab", cat);
  } catch { /* ignore */ }
}

/* ── Shimmer Row ────────────────────────────────────────── */

function ShimmerRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 bg-border rounded w-3/4" />
        <div className="h-2.5 bg-border/60 rounded w-1/2" />
      </div>
      <div className="w-12 space-y-1.5">
        <div className="h-3.5 bg-border rounded w-full" />
        <div className="h-2 bg-border/60 rounded w-2/3 ml-auto" />
      </div>
    </div>
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

/* ── Log by Weight Form ───────────────────────────────────── */

type WeightUnit = "g" | "oz" | "lb";

const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = { g: "grams", oz: "ounces", lb: "pounds" };
const WEIGHT_TO_GRAMS: Record<WeightUnit, number> = { g: 1, oz: 28.3495, lb: 453.592 };

function LogByWeightForm({
  meal,
  onAdd,
  onCancel,
}: {
  meal: string;
  onAdd: (entry: FoodEntry) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<WeightUnit>("g");
  const [calPer100g, setCalPer100g] = useState("");
  const [protPer100g, setProtPer100g] = useState("");
  const [carbPer100g, setCarbPer100g] = useState("");
  const [fatPer100g, setFatPer100g] = useState("");
  const [fiberPer100g, setFiberPer100g] = useState("");

  const grams = (parseFloat(weight) || 0) * WEIGHT_TO_GRAMS[unit];
  const multiplier = grams / 100;

  const totalCal = Math.round((parseFloat(calPer100g) || 0) * multiplier);
  const totalProt = Math.round(((parseFloat(protPer100g) || 0) * multiplier) * 10) / 10;
  const totalCarb = Math.round(((parseFloat(carbPer100g) || 0) * multiplier) * 10) / 10;
  const totalFat = Math.round(((parseFloat(fatPer100g) || 0) * multiplier) * 10) / 10;
  const totalFiber = Math.round(((parseFloat(fiberPer100g) || 0) * multiplier) * 10) / 10;

  const handleSubmit = () => {
    if (!name.trim() || !weight || parseFloat(weight) <= 0 || totalCal <= 0) return;
    const entry: FoodEntry = {
      id: `weight-${Date.now()}`,
      name: `${name.trim()} (${weight}${unit})`,
      source: "custom",
      servings: 1,
      servingSize: `${weight}${unit}`,
      calories: totalCal,
      protein: totalProt,
      carbs: totalCarb,
      fat: totalFat,
      fiber: totalFiber,
      timestamp: Date.now(),
    };
    onAdd(entry);
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-bold text-text flex items-center gap-2">
        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
        Log by Weight
      </h3>
      <p className="text-[11px] text-muted leading-relaxed">
        Enter nutrition per 100g (check the package label or USDA database) and the weight you ate.
      </p>
      <input
        type="text"
        placeholder="Food name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />

      {/* Weight + unit */}
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Weight *"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          min={0}
          step={unit === "lb" ? 0.25 : 1}
        />
        <div className="flex bg-bg rounded-lg border border-border overflow-hidden">
          {(["g", "oz", "lb"] as WeightUnit[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                unit === u
                  ? "bg-accent text-white"
                  : "text-dim hover:bg-border"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Per 100g nutrition */}
      <div className="pt-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
          Nutrition per 100g
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Calories/100g *" value={calPer100g} onChange={(e) => setCalPer100g(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" min={0} />
          <input type="number" placeholder="Protein/100g" value={protPer100g} onChange={(e) => setProtPer100g(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" min={0} step={0.1} />
          <input type="number" placeholder="Carbs/100g" value={carbPer100g} onChange={(e) => setCarbPer100g(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" min={0} step={0.1} />
          <input type="number" placeholder="Fat/100g" value={fatPer100g} onChange={(e) => setFatPer100g(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" min={0} step={0.1} />
        </div>
        <input type="number" placeholder="Fiber/100g" value={fiberPer100g} onChange={(e) => setFiberPer100g(e.target.value)} className="w-full mt-2 px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" min={0} step={0.1} />
      </div>

      {/* Live preview */}
      {grams > 0 && totalCal > 0 && (
        <div className="flex items-center justify-between p-3 bg-accent-bg rounded-xl">
          <div>
            <p className="text-xs font-medium text-dim">
              {parseFloat(weight)}{unit} = {grams.toFixed(0)}g
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="font-bold text-accent">{totalCal} cal</span>
            <span className="text-dim">P:{totalProt}g</span>
            <span className="text-dim">C:{totalCarb}g</span>
            <span className="text-dim">F:{totalFat}g</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 text-sm font-medium text-dim bg-bg rounded-lg hover:bg-border transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !weight || parseFloat(weight) <= 0 || totalCal <= 0}
          className="flex-1 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add to {MEAL_LABELS[meal]} · {totalCal} cal
        </button>
      </div>
    </div>
  );
}

/* ── NYC Favorites Tab (browsable categories) ──────────────── */

function NycFavoritesTab({
  nycLabel,
  loadingNyc,
  timeFavorites,
  onSelect,
}: {
  nycLabel: string;
  loadingNyc: boolean;
  timeFavorites: SearchResult[];
  onSelect: (r: SearchResult) => void;
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* Time-of-day picks (existing behavior) */}
      {nycLabel && timeFavorites.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedCat(expandedCat === "_time" ? null : "_time")}
            className="w-full flex items-center justify-between py-2 px-1"
          >
            <p className="text-xs font-bold text-accent flex items-center gap-1.5">
              🕐 {nycLabel}
              <span className="text-[10px] font-normal text-muted">({timeFavorites.length})</span>
            </p>
            <span className={`text-muted text-[10px] transition-transform ${expandedCat === "_time" ? "rotate-180" : ""}`}>▼</span>
          </button>
          {expandedCat === "_time" && (
            <div className="space-y-0.5">
              {timeFavorites.map((r) => (
                <SearchResultRow key={r.id} result={r} onClick={() => onSelect(r)} />
              ))}
            </div>
          )}
        </div>
      )}
      {loadingNyc && (
        <div className="space-y-0.5">
          <ShimmerRow />
          <ShimmerRow />
        </div>
      )}

      {/* Browsable categories */}
      <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted px-1 pt-1">
        Browse by Category · {NYC_FOOD_DATABASE.length}+ items
      </p>
      {NYC_BROWSE_CATEGORIES.map(({ key, emoji, label, filter }) => {
        const items = NYC_FOOD_DATABASE.filter(filter);
        if (items.length === 0) return null;
        const isOpen = expandedCat === key;
        return (
          <div key={key}>
            <button
              onClick={() => setExpandedCat(isOpen ? null : key)}
              className="w-full flex items-center justify-between py-2 px-1 hover:bg-bg rounded-lg transition-colors"
            >
              <span className="text-[13px] font-medium text-text flex items-center gap-2">
                <span>{emoji}</span> {label}
                <span className="text-[10px] font-normal text-muted">({items.length})</span>
              </span>
              <span className={`text-muted text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {isOpen && (
              <div className="space-y-0.5 ml-1">
                {items.map((item) => (
                  <SearchResultRow
                    key={item.id}
                    result={nycItemToSearchResult(item)}
                    onClick={() => onSelect(nycItemToSearchResult(item))}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Search Result Row (responsive) ──────────────────────── */

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
      className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-left hover:bg-bg rounded-lg transition-colors"
    >
      {/* Desktop layout */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-text truncate">{result.name}</span>
          <CategoryBadge source={result.source} />
        </div>
        <p className="text-[10px] text-muted mt-0.5">
          P:{Math.round(result.protein)}g · C:{Math.round(result.carbs)}g · F:{Math.round(result.fat)}g
        </p>
      </div>
      {/* Mobile layout */}
      <div className="flex-1 min-w-0 sm:hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-text truncate">{result.name}</span>
          <CategoryBadge source={result.source} />
        </div>
        <p className="text-[10px] text-muted mt-0.5">
          {Math.round(result.calories)} cal · P:{Math.round(result.protein)} C:{Math.round(result.carbs)} F:{Math.round(result.fat)}
        </p>
      </div>
      {/* Calories (desktop only) */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-semibold text-text tabular-nums">{Math.round(result.calories)}</p>
        <p className="text-[10px] text-muted">cal</p>
      </div>
      {/* Add icon */}
      <div className="shrink-0 sm:hidden w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <svg className="w-4 h-4 text-muted shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  editBuilderEntry?: FoodEntry;
}

export default function FoodSearchModal({
  open,
  onClose,
  meal,
  onAddFood,
  editBuilderEntry,
}: FoodSearchModalProps) {
  const [tab, setTab] = useState<Tab>("search");
  const [foodCategory, setFoodCategory] = useState<FoodCategory>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [localResults, setLocalResults] = useState<SearchResult[]>([]);
  const [apiResults, setApiResults] = useState<SearchResult[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
  const [servingsOverride, setServingsOverride] = useState<number | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  const [recentFoods, setRecentFoods] = useState<FoodEntry[]>([]);
  const [savedFoods, setSavedFoods] = useState<FoodEntry[]>([]);
  const [nycFavorites, setNycFavorites] = useState<SearchResult[]>([]);
  const [nycLabel, setNycLabel] = useState("");
  const [loadingNyc, setLoadingNyc] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderRestaurant, setBuilderRestaurant] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Combined results: merge by score, dedup by id
  const results = useMemo(() => {
    const merged = [...localResults];
    for (const a of apiResults) {
      if (!merged.some(l => l.id === a.id)) merged.push(a);
    }
    // Sort by score (highest first), then by source priority as tiebreaker
    const sourcePriority: Record<string, number> = { common: 3, nyc: 2, usda: 1, openfoodfacts: 0, custom: 0 };
    merged.sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (sourcePriority[b.source] ?? 0) - (sourcePriority[a.source] ?? 0);
    });
    return merged;
  }, [localResults, apiResults]);

  // Detect restaurant trigger from search query
  const detectedRestaurant = useMemo(() => detectRestaurantTrigger(query), [query]);
  const detectedBuilder = detectedRestaurant ? getRestaurantBuilder(detectedRestaurant) : null;

  // Load data when modal opens
  useEffect(() => {
    if (!open) return;
    setRecentFoods(getRecentFoods());
    setSavedFoods(getSavedFoods());
    setSelectedFood(null);
    setServingsOverride(null);
    setShowQuickAdd(false);
    setShowCustom(false);
    setShowWeight(false);
    setShowBuilder(false);
    setBuilderRestaurant(null);
    setQuery("");
    setLocalResults([]);
    setApiResults([]);
    setNoResults(false);
    setFoodCategory(loadLastCategory());

    // If editing a builder entry, auto-open the builder
    if (editBuilderEntry?.builderSource) {
      setBuilderRestaurant(editBuilderEntry.builderSource);
      setShowBuilder(true);
    } else {
      // Focus the search input reliably — use preventScroll to avoid page jump,
      // then ensure the input is visible by scrolling within the modal
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 150);
    }
  }, [open, editBuilderEntry]);

  // Load NYC Favorites
  useEffect(() => {
    if (!open || tab !== "nyc") return;
    const { tags, label } = getTimeOfDayTags();
    setNycLabel(label);

    async function loadNyc() {
      setLoadingNyc(true);
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
        setLoadingNyc(false);
      }
    }
    loadNyc();
  }, [open, tab]);

  // Split debounce: local results appear fast (150ms), API results load after 350ms
  const localDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tab !== "search" || !query.trim()) {
      setLocalResults([]);
      setApiResults([]);
      setNoResults(false);
      setLoadingApi(false);
      return;
    }

    // Cancel pending searches
    if (localDebounceRef.current) clearTimeout(localDebounceRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const q = query.trim();
    const catParam = foodCategory !== "all" ? `&category=${foodCategory}` : "";

    // TIER 1: Local search — fires fast (150ms) for instant results
    localDebounceRef.current = setTimeout(() => {
      fetch(`/api/nutrition-tracker/search?q=${encodeURIComponent(q)}&local=1${catParam}`)
        .then(res => res.ok ? res.json() : { results: [] })
        .then(data => {
          setLocalResults(data.results || []);
          if (data.parsedQuantity?.quantity) {
            setServingsOverride(data.parsedQuantity.quantity);
          }
        })
        .catch(() => { /* ignore */ });
    }, 150);

    // Show API loading indicator
    setLoadingApi(true);

    // TIER 2: API search — fires after user stops typing (350ms)
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      const cachedUsda = getFromCache("usda", q);
      const cachedOff = getFromCache("off", q);

      if (cachedUsda && cachedOff) {
        setApiResults(dedup([...cachedUsda, ...cachedOff]));
        setLoadingApi(false);
        return;
      }

      // Apply any cached results immediately
      if (cachedUsda || cachedOff) {
        setApiResults(dedup([...(cachedUsda || []), ...(cachedOff || [])]));
      } else {
        setApiResults([]);
      }

      const fetches: Promise<{ source: string; results: SearchResult[] }>[] = [];

      if (cachedUsda) {
        fetches.push(Promise.resolve({ source: "usda", results: cachedUsda }));
      } else {
        fetches.push(
          fetch(`/api/nutrition-tracker/search?q=${encodeURIComponent(q)}&source=usda${catParam}`, {
            signal: controller.signal,
          })
            .then(r => r.ok ? r.json() : { results: [] })
            .then(data => {
              const res = (data.results || []) as SearchResult[];
              setCache("usda", q, res);
              if (!controller.signal.aborted) setApiResults(prev => dedup([...prev, ...res]));
              return { source: "usda", results: res };
            })
            .catch(() => ({ source: "usda", results: [] as SearchResult[] }))
        );
      }

      if (cachedOff) {
        fetches.push(Promise.resolve({ source: "off", results: cachedOff }));
      } else {
        fetches.push(
          fetch(`/api/nutrition-tracker/search?q=${encodeURIComponent(q)}&source=off${catParam}`, {
            signal: controller.signal,
          })
            .then(r => r.ok ? r.json() : { results: [] })
            .then(data => {
              const res = (data.results || []) as SearchResult[];
              setCache("off", q, res);
              if (!controller.signal.aborted) setApiResults(prev => dedup([...prev, ...res]));
              return { source: "off", results: res };
            })
            .catch(() => ({ source: "off", results: [] as SearchResult[] }))
        );
      }

      Promise.allSettled(fetches).then((settled) => {
        if (controller.signal.aborted) return;
        const allApi: SearchResult[] = [];
        for (const s of settled) {
          if (s.status === "fulfilled") allApi.push(...s.value.results);
        }
        setApiResults(dedup(allApi));
        setLoadingApi(false);
      });
    }, 350);

    return () => {
      if (localDebounceRef.current) clearTimeout(localDebounceRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, tab, foodCategory]);

  // Update noResults state
  useEffect(() => {
    if (tab !== "search" || !query.trim()) {
      setNoResults(false);
      return;
    }
    if (!loadingApi && localResults.length === 0 && apiResults.length === 0) {
      setNoResults(true);
    } else {
      setNoResults(false);
    }
  }, [localResults, apiResults, loadingApi, query, tab]);

  // Escape key closes modal
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when modal is open & handle mobile viewport
  const scrollPosRef = useRef(0);
  useEffect(() => {
    if (open) {
      scrollPosRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollPosRef.current}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      window.scrollTo(0, scrollPosRef.current);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      window.scrollTo(0, scrollPosRef.current);
    };
  }, [open]);

  const handleCategoryChange = useCallback((cat: FoodCategory) => {
    setFoodCategory(cat);
    saveLastCategory(cat);
  }, []);

  const handleAddFood = useCallback(
    (entry: FoodEntry) => {
      onAddFood(entry);
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
      setShowWeight(false);
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

  // If meal builder is active, show builder view
  if (showBuilder && builderRestaurant) {
    const hints = parseBuilderHints(query, builderRestaurant);

    // Load edit details from localStorage if re-editing
    let editDetails: { selections: Record<string, string[]>; sliceCount?: number } | undefined;
    if (editBuilderEntry?.id) {
      try {
        const raw = localStorage.getItem(`pulsenyc_builder_details_${editBuilderEntry.id}`);
        if (raw) editDetails = JSON.parse(raw);
      } catch { /* ignore */ }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-viewport">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-lg h-[100dvh] sm:h-auto sm:max-h-[90dvh] bg-surface sm:rounded-2xl overflow-y-auto modal-scroll-area">
          <MealBuilder
            restaurantId={builderRestaurant}
            meal={meal}
            onAdd={handleAddFood}
            onBack={() => { setShowBuilder(false); setBuilderRestaurant(null); }}
            initialHints={Object.keys(hints).length > 0 ? hints : undefined}
            editDetails={editDetails}
          />
        </div>
      </div>
    );
  }

  // If a food is selected, show detail view
  if (selectedFood) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-viewport">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-lg max-h-[100dvh] sm:max-h-[90dvh] bg-surface rounded-t-2xl sm:rounded-2xl overflow-y-auto modal-scroll-area">
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
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center modal-viewport">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — full-screen on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-lg sm:h-auto sm:max-h-[80dvh] bg-surface sm:rounded-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <h2 className="text-lg font-bold text-text font-display">
            Add to {MEAL_LABELS[meal]}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg transition-colors text-dim min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input — sticky */}
        <div className="px-4 pb-2 shrink-0">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
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
                placeholder={foodCategory === "all"
                  ? "Search foods, restaurants, brands..."
                  : `Search within ${CATEGORY_TABS.find(t => t.key === foodCategory)?.label ?? ""}...`
                }
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (tab !== "search") setTab("search");
                }}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[44px]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-muted hover:text-dim min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`relative p-2 rounded-xl border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                showFilters || foodCategory !== "all"
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-bg border-border text-dim hover:text-text"
              }`}
              aria-label="Toggle category filters"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {foodCategory !== "all" && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface" />
              )}
            </button>
          </div>
        </div>

        {/* Category tabs — horizontally scrollable, hidden by default */}
        {(showFilters || foodCategory !== "all") && (
          <div className="relative shrink-0">
            <div
              ref={categoryScrollRef}
              className="flex px-4 gap-1.5 overflow-x-auto scrollbar-hide pb-2"
            >
              {CATEGORY_TABS.map((ct) => (
                <button
                  key={ct.key}
                  onClick={() => handleCategoryChange(ct.key)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors min-h-[36px] shrink-0 ${
                    foodCategory === ct.key
                      ? "bg-accent text-white"
                      : "bg-bg text-dim hover:bg-border"
                  }`}
                >
                  {ct.emoji && <span className="text-[11px]">{ct.emoji}</span>}
                  {ct.label}
                </button>
              ))}
            </div>
            {/* Fade indicator for scrollable */}
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none sm:hidden" />
          </div>
        )}

        {/* Main tabs */}
        <div className="flex px-4 gap-1 border-b border-border shrink-0">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors min-h-[44px] ${
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
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[200px] modal-scroll-area">
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
          {showWeight && (
            <LogByWeightForm
              meal={meal}
              onAdd={handleAddFood}
              onCancel={() => setShowWeight(false)}
            />
          )}

          {!showQuickAdd && !showCustom && !showWeight && (
            <>
              {/* Search tab */}
              {tab === "search" && (
                <div>
                  {/* Restaurant builder trigger card */}
                  {detectedBuilder && query.trim() && (
                    <button
                      onClick={() => {
                        setBuilderRestaurant(detectedRestaurant);
                        setShowBuilder(true);
                      }}
                      className="w-full mb-3 p-4 rounded-2xl border-2 border-dashed text-left transition-all hover:shadow-md group"
                      style={{
                        borderColor: detectedBuilder.color + "66",
                        background: `linear-gradient(135deg, ${detectedBuilder.color}08 0%, ${detectedBuilder.color}15 100%)`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{detectedBuilder.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text group-hover:text-accent transition-colors">
                            Build Your {detectedBuilder.name} Order
                          </p>
                          <p className="text-[11px] text-dim mt-0.5">
                            Customize with real modifiers — double protein, extra toppings, no rice & more
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-muted group-hover:text-accent transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      {detectedBuilder.presets.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {detectedBuilder.presets.slice(0, 3).map((p) => (
                            <span key={p.name} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-dim border border-border-light">
                              {p.name} · {p.cal} cal
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  )}

                  {/* Show results (local first, then API) */}
                  {results.length > 0 && (
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

                  {/* Shimmer rows while API loads */}
                  {loadingApi && query.trim() && (
                    <div className="space-y-0.5">
                      <ShimmerRow />
                      <ShimmerRow />
                      <ShimmerRow />
                    </div>
                  )}

                  {/* No results */}
                  {noResults && (
                    <div className="text-center py-10">
                      <p className="text-sm text-muted">
                        No {foodCategory !== "all" ? CATEGORY_TABS.find(t => t.key === foodCategory)?.label?.toLowerCase() + " " : ""}results for &ldquo;{query}&rdquo;
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {foodCategory !== "all" ? (
                          <>Try the <button onClick={() => handleCategoryChange("all")} className="text-accent underline">All</button> tab or </>
                        ) : null}
                        <button onClick={() => { setShowCustom(true); }} className="text-accent underline">create a custom food</button>
                      </p>
                    </div>
                  )}

                  {/* Empty state — no query yet: show restaurant builders + search hints */}
                  {!query && results.length === 0 && !loadingApi && (
                    <div className="space-y-5">
                      {/* Restaurant meal builders */}
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                          Build a Meal
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {RESTAURANT_LIST.map((builder) => (
                            <button
                              key={builder.id}
                              onClick={() => {
                                setBuilderRestaurant(builder.id);
                                setShowBuilder(true);
                              }}
                              className="flex items-center gap-2.5 p-3 rounded-xl border border-border-light bg-surface text-left transition-all hover:shadow-md hover:border-border group"
                            >
                              <span className="text-xl shrink-0">{builder.emoji}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text truncate group-hover:text-accent transition-colors">
                                  {builder.name}
                                </p>
                                <p className="text-[10px] text-muted">Customize order</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Search hint */}
                      <div className="text-center pb-4">
                        <svg className="w-8 h-8 mx-auto text-border mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-xs text-muted">
                          Or search for any food, restaurant, or brand
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">
                          Try &ldquo;chicken breast 6oz&rdquo;, &ldquo;bagel with cream cheese&rdquo;, or &ldquo;200g rice&rdquo;
                        </p>
                      </div>
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

              {/* NYC Favorites tab — browsable categories */}
              {tab === "nyc" && (
                <NycFavoritesTab
                  nycLabel={nycLabel}
                  loadingNyc={loadingNyc}
                  timeFavorites={nycFavorites}
                  onSelect={handleSelectResult}
                />
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
        {!showQuickAdd && !showCustom && !showWeight && (
          <div className="px-4 py-3 border-t border-border flex gap-2 shrink-0">
            <button
              onClick={() => {
                setShowQuickAdd(true);
                setShowCustom(false);
                setShowWeight(false);
              }}
              className="flex-1 py-2.5 text-sm font-medium text-accent bg-accent-bg rounded-xl hover:bg-accent-bg/80 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Add
            </button>
            <button
              onClick={() => {
                setShowWeight(true);
                setShowQuickAdd(false);
                setShowCustom(false);
              }}
              className="flex-1 py-2.5 text-sm font-medium text-hp-blue bg-hp-blue/8 rounded-xl hover:bg-hp-blue/15 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              By Weight
            </button>
            <button
              onClick={() => {
                setShowCustom(true);
                setShowQuickAdd(false);
                setShowWeight(false);
              }}
              className="flex-1 py-2.5 text-sm font-medium text-dim bg-bg rounded-xl hover:bg-border transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Custom
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Dedup helper ─────────────────────────────────────────── */

function dedup(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    const key = `${r.name.toLowerCase().replace(/[^a-z0-9]/g, "")}|${r.source}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

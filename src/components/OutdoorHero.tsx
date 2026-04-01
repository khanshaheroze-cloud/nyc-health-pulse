"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Route } from "@/lib/routes";
import { HomepageWorkoutWidget } from "@/components/workout-tracker/HomepageWorkoutWidget";

/* ── Count-up hook ─────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === 0) return;
    const from = prevTarget.current;
    prevTarget.current = target;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + eased * (target - from)));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ── Types ─────────────────────────────────────────────────────────────── */

interface Props {
  aqi: number | null;
  aqiCategory: string | null;
  pollen: { level: string; topAllergens?: string } | null;
  uvIndex: number | null;
  tempF: number | null;
  feelsLikeF: number | null;
  weatherLabel: string | null;
  humidity: number | null;
  windMph: number | null;
  suggestedRoute: Route | null;
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function aqiColor(aqi: number) {
  if (aqi <= 50)  return { ring: "#4A7C59", text: "#4A7C59", label: "Good" };
  if (aqi <= 100) return { ring: "#C4964A", text: "#C4964A", label: "Moderate" };
  if (aqi <= 150) return { ring: "#C45A4A", text: "#C45A4A", label: "USG" };
  return           { ring: "#C45A4A", text: "#C45A4A", label: "Unhealthy" };
}

function uvLabel(uv: number) {
  if (uv <= 2)  return { text: "Low",       color: "#4A7C59" };
  if (uv <= 5)  return { text: "Moderate",   color: "#C4964A" };
  if (uv <= 7)  return { text: "High",       color: "#C4704A" };
  if (uv <= 10) return { text: "Very High",  color: "#C45A4A" };
  return         { text: "Extreme",    color: "#7c3aed" };
}

function pollenColor(level: string) {
  if (level === "None" || level === "Low") return "#4A7C59";
  if (level === "Moderate") return "#C4964A";
  return "#C45A4A";
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function timeGreeting(): string {
  const tod = getTimeOfDay();
  if (tod === "morning") return "Good morning";
  if (tod === "afternoon") return "Good afternoon";
  if (tod === "evening") return "Good evening";
  return "Tonight";
}

function buildAdvice(aqi: number | null, pollen: { level: string } | null, uv: number | null, tempF: number | null): { verdict: string; tips: string[]; good: boolean } {
  const tips: string[] = [];
  let bad = 0;
  const tod = getTimeOfDay();

  if (aqi != null) {
    if (aqi <= 50) {
      tips.push(tod === "morning"
        ? "Air quality is excellent — perfect for a morning run"
        : tod === "evening"
        ? "Air quality is good — great for an evening walk"
        : "Air quality is good — great for outdoor exercise");
    } else if (aqi <= 100) {
      tips.push("Air is moderate — sensitive groups should limit prolonged outdoor exertion");
      bad++;
    } else {
      tips.push("Air quality is unhealthy — consider exercising indoors");
      bad += 2;
    }
  }

  if (pollen) {
    if (pollen.level === "High" || pollen.level === "Very High") {
      tips.push(tod === "morning"
        ? "Pollen is high — early morning is actually peak pollen time, consider waiting"
        : "Pollen is high — allergy sufferers should take medication before going out");
      bad++;
    } else if (pollen.level === "Moderate") {
      tips.push("Moderate pollen — antihistamine recommended if you have allergies");
    }
  }

  if (uv != null && uv > 5) {
    if (tod === "afternoon") {
      tips.push(`UV is ${uv > 7 ? "very " : ""}high — avoid direct sun between 11am-3pm, wear SPF 30+`);
    } else {
      tips.push(`UV is ${uv > 7 ? "very " : ""}high — wear sunscreen and sunglasses`);
    }
    bad++;
  }

  if (tempF != null) {
    if (tempF > 90) {
      tips.push(tod === "morning"
        ? "Heat expected today — exercise now before it gets hotter"
        : "Heat advisory conditions — hydrate extra and avoid direct sun");
      bad++;
    } else if (tempF < 25) {
      tips.push("Extreme cold — dress in layers and cover exposed skin");
      bad++;
    }
  }

  if (tod === "night") {
    if (bad === 0) return { verdict: "Clear night — good for a late walk or early morning planning", tips, good: true };
    return { verdict: "Conditions aren't ideal — plan for tomorrow instead", tips, good: false };
  }

  if (bad === 0) return { verdict: "Great day for outdoor activity", tips, good: true };
  if (bad === 1) return { verdict: "Decent day — check conditions before heading out", tips, good: true };
  return { verdict: "Consider indoor exercise today", tips, good: false };
}

/* ── Food Logger Types & Helpers ──────────────────────────────────────── */

interface FoodEntry {
  id: string;
  name: string;
  source: string;
  servings: number;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  timestamp: number;
}

interface DayLog {
  date: string;
  meals: {
    breakfast: FoodEntry[];
    lunch: FoodEntry[];
    dinner: FoodEntry[];
    snacks: FoodEntry[];
  };
}

type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";

const MEAL_PERIODS: { key: MealKey; label: string; emoji: string }[] = [
  { key: "breakfast", label: "Breakfast", emoji: "\u2600" },
  { key: "lunch",     label: "Lunch",     emoji: "\uD83C\uDF24" },
  { key: "dinner",    label: "Dinner",    emoji: "\uD83C\uDF19" },
  { key: "snacks",    label: "Snack",     emoji: "\uD83C\uDF4E" },
];

const SOURCE_BADGES: Record<string, string> = {
  common: "\uD83D\uDED2 Common",
  nyc:    "\uD83E\uDD61 NYC",
  usda:   "\uD83C\uDFDB USDA",
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function emptyDayLog(date: string): DayLog {
  return { date, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
}

function loadDayLog(date: string): DayLog {
  try {
    const raw = localStorage.getItem(`pulsenyc_nutrition_${date}`);
    if (raw) return JSON.parse(raw) as DayLog;
  } catch { /* ignore */ }
  return emptyDayLog(date);
}

function saveDayLog(log: DayLog) {
  localStorage.setItem(`pulsenyc_nutrition_${log.date}`, JSON.stringify(log));
  window.dispatchEvent(new CustomEvent("pulsenyc-nutrition-change"));
}

function loadCalorieGoal(): number {
  try {
    const goals = localStorage.getItem("pulsenyc_nutrition_goals");
    if (goals) {
      const parsed = JSON.parse(goals);
      if (parsed.dailyCalories) return parsed.dailyCalories;
    }
    const profile = localStorage.getItem("pulse_nutrition_profile");
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.tdee) return parsed.tdee;
    }
  } catch { /* ignore */ }
  return 2000;
}

function mealEmoji(key: MealKey): string {
  return MEAL_PERIODS.find((m) => m.key === key)?.emoji ?? "";
}

/* ── Inline Food Logger ──────────────────────────────────────────────── */

interface SearchResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  source: string;
}

function InlineFoodLogger({ expandRef }: { expandRef?: React.MutableRefObject<(() => void) | null> }) {
  const [expanded, setExpanded] = useState(false);
  const [dayLog, setDayLog] = useState<DayLog>(() => emptyDayLog(todayKey()));
  const [goal, setGoal] = useState(2000);
  const [selectedMeal, setSelectedMeal] = useState<MealKey>(() => {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 15) return "lunch";
    if (h < 20) return "dinner";
    return "snacks";
  });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastLogged, setLastLogged] = useState<{entry: FoodEntry, meal: string} | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setDayLog(loadDayLog(todayKey()));
    setGoal(loadCalorieGoal());
  }, []);

  // Expose expand function to parent via ref
  useEffect(() => {
    if (expandRef) {
      expandRef.current = () => {
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      };
    }
    return () => { if (expandRef) expandRef.current = null; };
  }, [expandRef]);

  // Listen for external changes
  useEffect(() => {
    const handler = () => setDayLog(loadDayLog(todayKey()));
    window.addEventListener("pulsenyc-nutrition-change", handler);
    return () => window.removeEventListener("pulsenyc-nutrition-change", handler);
  }, []);

  // Close results dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Computed totals
  const allEntries = useMemo(() => {
    const m = dayLog.meals;
    return [...m.breakfast, ...m.lunch, ...m.dinner, ...m.snacks];
  }, [dayLog]);

  const totalCal = useMemo(() => allEntries.reduce((s, e) => s + e.calories, 0), [allEntries]);
  const totalP = useMemo(() => allEntries.reduce((s, e) => s + e.protein, 0), [allEntries]);
  const totalC = useMemo(() => allEntries.reduce((s, e) => s + e.carbs, 0), [allEntries]);
  const totalF = useMemo(() => allEntries.reduce((s, e) => s + e.fat, 0), [allEntries]);

  const pct = goal > 0 ? Math.min((totalCal / goal) * 100, 100) : 0;

  // Last 3 logged items across all meals, most recent first
  const recentEntries = useMemo(() => {
    const tagged = allEntries.map((e) => {
      const meal = (Object.entries(dayLog.meals) as [MealKey, FoodEntry[]][]).find(([, arr]) =>
        arr.some((a) => a.id === e.id)
      );
      return { ...e, mealKey: meal?.[0] as MealKey };
    });
    return tagged.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  }, [allEntries, dayLog.meals]);

  // Search with debounce
  const doSearch = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    setShowResults(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Fast local search first (150ms), then USDA fallback if 0 results (350ms)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/nutrition-tracker/search?q=${encodeURIComponent(q)}&local=1`);
        if (res.ok) {
          const data = await res.json();
          const items = (data.results ?? data).slice(0, 5);
          if (items.length > 0) {
            setResults(items);
            setSearching(false);
            return;
          }
        }
        // No local results — fall back to full search (includes USDA)
        if (q.length >= 3) {
          const full = await fetch(`/api/nutrition-tracker/search?q=${encodeURIComponent(q)}`);
          if (full.ok) {
            const fullData = await full.json();
            setResults((fullData.results ?? fullData).slice(0, 5));
          }
        }
      } catch { /* ignore */ }
      setSearching(false);
    }, 150);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    doSearch(v);
  };

  const logFood = (item: SearchResult) => {
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: item.name,
      source: item.source,
      servings: 1,
      servingSize: item.servingSize,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      timestamp: Date.now(),
    };
    const updated = { ...dayLog };
    updated.meals = { ...updated.meals };
    updated.meals[selectedMeal] = [...updated.meals[selectedMeal], entry];
    setDayLog(updated);
    saveDayLog(updated);
    setQuery("");
    setResults([]);
    setShowResults(false);
    // Track for undo
    setLastLogged({ entry, meal: selectedMeal });
    setShowUndo(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setShowUndo(false), 10000);
  };

  const handleUndo = () => {
    if (!lastLogged) return;
    const key = `pulsenyc_nutrition_${todayKey()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw) as DayLog;
    const mealKey = lastLogged.meal as keyof typeof data.meals;
    data.meals[mealKey] = data.meals[mealKey].filter((e: FoodEntry) => e.id !== lastLogged.entry.id);
    localStorage.setItem(key, JSON.stringify(data));
    setDayLog(data);
    setLastLogged(null);
    setShowUndo(false);
    window.dispatchEvent(new CustomEvent("pulsenyc-nutrition-change"));
  };

  const handleSummaryClick = () => {
    setExpanded((p) => !p);
  };

  const handleSearchFocus = () => {
    setExpanded(true);
    if (query.trim()) setShowResults(true);
  };

  const barColor = pct >= 100 ? "#f07070" : pct >= 80 ? "#f5c542" : "#2dd4a0";

  return (
    <div className="border-t border-black/[0.06] mt-4 pt-4">
      {/* Summary row - always visible */}
      <button
        type="button"
        onClick={handleSummaryClick}
        className="w-full flex items-center gap-3 text-left group"
      >
        <span className="text-[11px] font-bold uppercase tracking-[1px] text-dim flex-shrink-0">
          {"🍽"} FOOD LOG
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-text tabular-nums">
              Today: {Math.round(totalCal)} / {goal} cal
            </span>
            <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        </div>
        <span className="text-[11px] text-muted tabular-nums flex-shrink-0">
          P:{Math.round(totalP)}g C:{Math.round(totalC)}g F:{Math.round(totalF)}g
        </span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-dim transition-transform duration-200 flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 5.5l3 3 3-3"/>
        </svg>
      </button>

      {/* Expanded panel */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? "700px" : "0", opacity: expanded ? 1 : 0, overflow: expanded ? "visible" : "hidden" }}
      >
        <div className="pt-3 space-y-3">
          {/* Meal period chips */}
          <div className="flex gap-1.5 flex-wrap">
            {MEAL_PERIODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMeal(m.key)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  selectedMeal === m.key
                    ? "bg-accent text-white shadow-sm"
                    : "bg-white/60 text-dim border border-black/[0.08] hover:border-accent/30"
                }`}
              >
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div ref={wrapperRef} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleSearchFocus}
              placeholder="Quick add: what did you eat?"
              className="w-full h-9 px-3 rounded-lg bg-white/70 border border-black/[0.08] text-[13px] text-text placeholder:text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}

          </div>

          {/* Results list — inline (not absolute) so it grows the container */}
          {showResults && results.length > 0 && (
            <div className="mt-1 bg-white rounded-lg border border-border shadow-lg max-h-[240px] overflow-y-auto">
              {results.slice(0, 5).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => logFood(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hp-green/5 transition-colors border-b border-border/50 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text truncate">{r.name}</p>
                    <p className="text-[11px] text-muted">{r.servingSize}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-text tabular-nums flex-shrink-0">
                    {Math.round(r.calories)} cal
                  </span>
                  <span className="text-[10px] text-muted flex-shrink-0">
                    {SOURCE_BADGES[r.source] ?? r.source}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showResults && query.trim() && results.length === 0 && !searching && (
            <div className="mt-1 bg-white rounded-lg border border-border shadow-lg px-3 py-2">
              <p className="text-[12px] text-muted">No results found</p>
            </div>
          )}

          {/* Recent entries timeline */}
          {recentEntries.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {recentEntries.map((e, i) => (
                <span key={e.id} className="text-[11px] text-dim">
                  {mealEmoji(e.mealKey)} {e.name} <span className="text-muted tabular-nums">{Math.round(e.calories)}cal</span>
                  {i === 0 && showUndo && lastLogged && lastLogged.entry.id === e.id && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="ml-1 text-[10px] text-accent hover:underline font-medium"
                    >
                      [undo]
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Full diary link */}
          <Link
            href="/nutrition-tracker"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
          >
            Full Diary <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Stagger animation wrapper ─────────────────────────────────────────── */

function StaggerTile({ index, children }: { index: number; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
      }}
    >
      {children}
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function OutdoorHero({ aqi, aqiCategory, pollen, uvIndex, tempF, feelsLikeF, weatherLabel, humidity, windMph, suggestedRoute }: Props) {
  // Defer time-dependent advice to useEffect to avoid hydration mismatch
  const [advice, setAdvice] = useState<{ verdict: string; tips: string[]; good: boolean }>({ verdict: "Checking conditions…", tips: [], good: true });
  const aqiStyle = aqi != null ? aqiColor(aqi) : null;
  const uvStyle = uvIndex != null ? uvLabel(uvIndex) : null;
  const aqiAnimated = useCountUp(aqi ?? 0);
  const [greeting, setGreeting] = useState("");
  const foodLogExpandRef = useRef<(() => void) | null>(null);

  const aqiLevel = aqi != null ? (aqi <= 50 ? "good" : aqi <= 100 ? "moderate" : "unhealthy") : undefined;

  // AQI ring animation
  const aqiPct = aqi != null ? Math.min(aqi / 200, 1) : 0;
  const ringCircumference = 2 * Math.PI * 36;
  const ringOffset = ringCircumference * (1 - aqiPct);

  useEffect(() => {
    setGreeting(timeGreeting());
    setAdvice(buildAdvice(aqi, pollen, uvIndex, tempF));
  }, [aqi, pollen, uvIndex, tempF]);

  /* Build condition tiles array for staggered render */
  const tiles: React.ReactNode[] = [];

  const tileStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: "16px",
  };
  const aqiTileStyle: React.CSSProperties = {
    ...tileStyle,
    background: "rgba(255,255,255,0.92)",
    borderColor: "rgba(74,124,89,0.15)",
  };

  // AQI tile (primary)
  if (aqi != null && aqiStyle) {
    tiles.push(
      <Link
        key="aqi"
        href="/air-quality"
        className="outdoor-tile outdoor-tile-aqi flex flex-col items-center justify-center rounded-2xl px-5 py-5 transition-all hover:scale-[1.02] btn-press"
        data-level={aqiLevel}
        style={aqiTileStyle}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-1">Air Quality</p>
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 my-1">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke={`${aqiStyle.ring}20`} strokeWidth="5" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={aqiStyle.ring}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl sm:text-4xl font-extrabold tabular-nums leading-none" style={{ color: aqiStyle.text }}>
              {aqiAnimated}
            </span>
          </div>
        </div>
        <p className="text-[12px] font-bold mt-1" style={{ color: aqiStyle.text }}>{aqiCategory}</p>
      </Link>
    );
  }

  // Pollen tile
  if (pollen) {
    tiles.push(
      <Link key="pollen" href="/air-quality" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5 card-hover" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">Pollen</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold leading-none" style={{ color: pollenColor(pollen.level) }}>{pollen.level}</p>
        {pollen.topAllergens && <p className="text-[12px] text-muted mt-2 truncate max-w-full">{pollen.topAllergens}</p>}
      </Link>
    );
  }

  // UV tile
  if (uvIndex != null && uvStyle) {
    tiles.push(
      <div key="uv" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">UV Index</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold leading-none" style={{ color: uvStyle.color }}>{uvIndex}</p>
        <p className="text-[12px] font-medium mt-2" style={{ color: uvStyle.color }}>{uvStyle.text}</p>
      </div>
    );
  }

  // Wind + Humidity combined tile
  if (windMph != null) {
    tiles.push(
      <div key="wind" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">Wind</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold text-text leading-none">{windMph}<span className="text-lg font-bold text-dim ml-1">mph</span></p>
        {humidity != null && (
          <p className="text-[12px] text-muted mt-2">Humidity {humidity}%</p>
        )}
      </div>
    );
  } else if (humidity != null) {
    // Show standalone humidity tile if no wind data
    tiles.push(
      <div key="humidity" className="outdoor-tile flex flex-col items-center justify-center rounded-2xl px-5 py-5" style={tileStyle}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.8px] text-dim mb-2">Humidity</p>
        <p className="font-display text-3xl sm:text-4xl font-extrabold text-text leading-none">{humidity}<span className="text-lg font-bold text-dim">%</span></p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* ── Immersive hero ───────────────────────────────────── */}
      <div
        className="outdoor-hero relative overflow-hidden rounded-[32px]"
        style={{
          background: "linear-gradient(135deg, #EEF2ED 0%, #EDF3F8 50%, #FDF2ED 100%)",
          marginTop: "0",
        }}
      >
        {/* Gradient background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, var(--color-surface-sage) 0%, var(--color-surface-sky) 50%, var(--color-surface-peach) 100%)",
          }}
        />

        {/* Radial overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 80% 20%, rgba(74,124,89,0.06), transparent 60%)",
          }}
        />

        {/* Content */}
        <div className="relative px-5 py-6 sm:px-10 sm:py-10">
          {/* Header row: greeting + temp */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-2">
            <div>
              <h2 className="font-display text-[22px] sm:text-[28px] leading-snug text-text">
                {greeting ? `${greeting} — ` : ""}Should I go outside?
              </h2>
              <p className="text-[14px] text-dim mt-1">Real-time conditions · Updated hourly</p>
            </div>
            {tempF != null && (
              <div className="sm:text-right flex-shrink-0 flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 sm:ml-4">
                <p className="font-display text-[36px] sm:text-[48px] font-bold text-text leading-none">{tempF}°</p>
                <p className="text-[13px] text-dim sm:mt-1">
                  {feelsLikeF != null && feelsLikeF !== tempF ? `Feels ${feelsLikeF}°` : ""}
                  {feelsLikeF != null && feelsLikeF !== tempF && weatherLabel ? " · " : ""}
                  {weatherLabel ?? ""}
                </p>
              </div>
            )}
          </div>

          {/* Condition tiles — 4-column grid, 2x2 on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {tiles.map((tile, i) => (
              <StaggerTile key={i} index={i}>
                {tile}
              </StaggerTile>
            ))}
          </div>

          {/* Advice bar */}
          <div className="outdoor-advice rounded-xl px-4 py-3.5 flex items-start gap-2.5">
            <span className="text-hp-green text-[16px] mt-0.5 flex-shrink-0">
              {advice.good ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4v5M8 11.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              )}
            </span>
            <div>
              <p className="text-[14px] text-dim">
                <strong className="text-hp-green">{advice.verdict}</strong>
              </p>
              {advice.tips.length > 0 && (
                <ul className="text-[12px] text-dim mt-1 space-y-0.5">
                  {advice.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                </ul>
              )}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              type="button"
              onClick={() => foodLogExpandRef.current?.()}
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-full border-2 border-accent text-accent font-semibold text-[14px] hover:bg-accent hover:text-white transition-all btn-press"
            >
              <span>🍽</span> Log Food
            </button>
            <Link
              href="/run-routes"
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-full bg-accent text-white font-semibold text-[14px] hover:bg-accent/90 transition-all btn-press"
            >
              <span>🏃</span> Plan a Run
            </Link>
          </div>

          {/* Park suggestion */}
          {suggestedRoute && advice.good && (
            <Link href="/run-routes" className="flex items-center gap-2 mt-3 rounded-xl px-4 py-3 bg-hp-blue/8 border border-hp-blue/15 hover:bg-hp-blue/12 btn-press transition-all group">
              <span className="text-sm">{suggestedRoute.icon}</span>
              <p className="text-[13px] font-semibold text-hp-blue group-hover:underline">
                Try: {suggestedRoute.name} ({suggestedRoute.distance})
              </p>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-hp-blue">
                <path d="M5 3l4 4-4 4"/>
              </svg>
            </Link>
          )}

          {/* Inline food logger */}
          <InlineFoodLogger expandRef={foodLogExpandRef} />

          {/* Workout widget */}
          <HomepageWorkoutWidget />
        </div>
      </div>
    </div>
  );
}

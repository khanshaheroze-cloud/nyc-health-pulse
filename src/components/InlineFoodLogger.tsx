"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
  servings?: number;
}

interface MealsMap {
  breakfast: FoodEntry[];
  lunch: FoodEntry[];
  dinner: FoodEntry[];
  snacks: FoodEntry[];
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "\u2600",
  lunch: "\uD83C\uDF24",
  dinner: "\uD83C\uDF19",
  snacks: "\uD83C\uDF7F",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function InlineFoodLogger() {
  const [mounted, setMounted] = useState(false);
  const [todayCals, setTodayCals] = useState(0);
  const [targetCals, setTargetCals] = useState(2000);
  const [todayP, setTodayP] = useState(0);
  const [todayC, setTodayC] = useState(0);
  const [todayF, setTodayF] = useState(0);
  const [recentItems, setRecentItems] = useState<{ name: string; calories: number; emoji: string }[]>([]);

  const loadData = useCallback(() => {
    try {
      // Load goals
      const goalsRaw = localStorage.getItem("pulsenyc_nutrition_goals");
      if (goalsRaw) {
        const goals = JSON.parse(goalsRaw);
        if (goals.calories) setTargetCals(goals.calories);
      } else {
        // Also check body profile for calorie target
        const profileRaw = localStorage.getItem("pulsenyc_nutrition_profile");
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          if (profile.tdee) setTargetCals(Math.round(profile.tdee));
        }
      }

      // Load today's food
      const raw = localStorage.getItem(`pulsenyc_nutrition_${todayStr()}`);
      if (!raw) {
        setTodayCals(0);
        setTodayP(0);
        setTodayC(0);
        setTodayF(0);
        setRecentItems([]);
        return;
      }

      const day = JSON.parse(raw);
      const meals: MealsMap = day.meals || day;
      const mealKeys: (keyof MealsMap)[] = ["breakfast", "lunch", "dinner", "snacks"];

      let cals = 0, p = 0, c = 0, f = 0;
      const allEntries: { name: string; calories: number; emoji: string; timestamp: number }[] = [];

      for (const key of mealKeys) {
        const entries = meals[key] || [];
        for (const e of entries) {
          const s = e.servings || 1;
          cals += (e.calories || 0) * s;
          p += (e.protein || 0) * s;
          c += (e.carbs || 0) * s;
          f += (e.fat || 0) * s;
          allEntries.push({
            name: e.name,
            calories: Math.round((e.calories || 0) * s),
            emoji: MEAL_EMOJI[key] || "",
            timestamp: e.timestamp || 0,
          });
        }
      }

      setTodayCals(Math.round(cals));
      setTodayP(Math.round(p));
      setTodayC(Math.round(c));
      setTodayF(Math.round(f));

      // Last 3 items by timestamp (most recent first)
      allEntries.sort((a, b) => b.timestamp - a.timestamp);
      setRecentItems(allEntries.slice(0, 3));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    // Listen for nutrition changes from other components
    const handler = () => loadData();
    window.addEventListener("pulsenyc-nutrition-change", handler);
    return () => window.removeEventListener("pulsenyc-nutrition-change", handler);
  }, [loadData]);

  if (!mounted) return null;

  const pct = targetCals > 0 ? (todayCals / targetCals) * 100 : 0;
  const clampedPct = Math.min(pct, 100);
  const barColor = pct > 100 ? "bg-hp-red" : pct >= 80 ? "bg-hp-yellow" : "bg-hp-green";

  return (
    <div className="rounded-2xl border border-border-light bg-surface shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🍽</span>
          <h3 className="text-[13px] font-bold text-text">Today&apos;s Nutrition</h3>
        </div>
        <Link
          href="/nutrition-tracker"
          className="text-[10px] text-accent font-semibold hover:underline"
        >
          Full Diary &rarr;
        </Link>
      </div>

      {/* Calorie progress */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[22px] font-extrabold text-text font-display">
          {todayCals.toLocaleString()}
        </span>
        <span className="text-[12px] text-dim">
          / {targetCals.toLocaleString()} cal
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-border-light rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>

      {/* Macro breakdown */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-3 text-[10px]">
          <span className="text-hp-green font-medium">{todayP}g P</span>
          <span className="text-hp-blue font-medium">{todayC}g C</span>
          <span className="text-hp-orange font-medium">{todayF}g F</span>
        </div>
        <span className="text-[10px] text-muted">{Math.round(pct)}%</span>
      </div>

      {/* Recent meals */}
      {recentItems.length > 0 && (
        <div className="mt-3 border-t border-border-light pt-2 space-y-1">
          {recentItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-dim truncate max-w-[75%]">
                {item.emoji} {item.name}
              </span>
              <span className="text-muted font-medium whitespace-nowrap">
                {item.calories} cal
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick-add input (redirects to nutrition tracker) */}
      <Link
        href="/nutrition-tracker"
        className="mt-3 flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-surface-sage border border-border-light text-[12px] text-muted hover:border-accent/30 hover:text-dim transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>Search &amp; log a food...</span>
      </Link>
    </div>
  );
}

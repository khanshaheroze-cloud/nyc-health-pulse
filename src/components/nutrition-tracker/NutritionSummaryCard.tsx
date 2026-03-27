"use client";

import { useState, useEffect, useCallback } from "react";
import { loadProfile, calculateMacroTargets } from "./BodyProfile";
import type { FoodEntry } from "./DailySummary";
import FoodSearchModal from "./FoodSearchModal";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function getMealFromTime(): "breakfast" | "lunch" | "dinner" | "snacks" {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 21) return "dinner";
  return "snacks";
}

export default function NutritionSummaryCard() {
  const [mounted, setMounted] = useState(false);
  const [todayCals, setTodayCals] = useState(0);
  const [todayP, setTodayP] = useState(0);
  const [todayC, setTodayC] = useState(0);
  const [todayF, setTodayF] = useState(0);
  const [targetCals, setTargetCals] = useState(2000);
  const [hasEntries, setHasEntries] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadTodayData = useCallback(() => {
    try {
      const profile = loadProfile();
      if (profile) {
        const targets = calculateMacroTargets(profile);
        setTargetCals(targets.calories);
      }

      const raw = localStorage.getItem(`pulsenyc_nutrition_${todayStr()}`);
      if (raw) {
        const day = JSON.parse(raw);
        const meals = day.meals || day;
        const entries = [
          ...(meals.breakfast || []),
          ...(meals.lunch || []),
          ...(meals.dinner || []),
          ...(meals.snacks || []),
        ];
        if (entries.length > 0) {
          setHasEntries(true);
          let cals = 0, p = 0, c = 0, f = 0;
          for (const e of entries) {
            const s = e.servings || 1;
            cals += (e.calories || 0) * s;
            p += (e.protein || 0) * s;
            c += (e.carbs || 0) * s;
            f += (e.fat || 0) * s;
          }
          setTodayCals(Math.round(cals));
          setTodayP(Math.round(p));
          setTodayC(Math.round(c));
          setTodayF(Math.round(f));
        } else {
          setHasEntries(false);
          setTodayCals(0);
          setTodayP(0);
          setTodayC(0);
          setTodayF(0);
        }
      } else {
        setHasEntries(false);
        setTodayCals(0);
        setTodayP(0);
        setTodayC(0);
        setTodayF(0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadTodayData();
  }, [loadTodayData]);

  const handleAddFood = useCallback((entry: FoodEntry) => {
    // Save to today's nutrition log
    const key = `pulsenyc_nutrition_${todayStr()}`;
    try {
      const raw = localStorage.getItem(key);
      const day = raw ? JSON.parse(raw) : { date: todayStr(), meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
      const meals = day.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] };
      const mealSlot = getMealFromTime();
      if (!meals[mealSlot]) meals[mealSlot] = [];
      meals[mealSlot].push(entry);
      day.meals = meals;
      localStorage.setItem(key, JSON.stringify(day));
    } catch { /* ignore */ }

    // Refresh display
    loadTodayData();
  }, [loadTodayData]);

  if (!mounted) return null;

  const pct = Math.min((todayCals / targetCals) * 100, 100);

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-4 hover:border-hp-green/30 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🍽</span>
            <h3 className="text-[13px] font-bold text-text">Today&apos;s Nutrition</h3>
          </div>
          <a href="/nutrition-tracker" className="text-[10px] text-accent font-semibold hover:underline">
            View Diary →
          </a>
        </div>

        {hasEntries ? (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-extrabold text-text">{todayCals.toLocaleString()}</span>
              <span className="text-[12px] text-dim">/ {targetCals.toLocaleString()} cal</span>
            </div>
            <div className="w-full bg-border rounded-full h-2 mt-2">
              <div className="h-2 rounded-full bg-hp-green transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-3 text-[10px]">
                <span className="text-hp-green font-medium">{todayP}g protein</span>
                <span className="text-hp-blue font-medium">{todayC}g carbs</span>
                <span className="text-hp-orange font-medium">{todayF}g fat</span>
              </div>
              <span className="text-[10px] text-muted">{Math.round(pct)}%</span>
            </div>
            {/* Log Food button */}
            <button
              onClick={(e) => { e.preventDefault(); setModalOpen(true); }}
              className="mt-3 w-full py-2 text-sm font-semibold text-white bg-accent rounded-xl hover:bg-accent-light transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Log Food
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[12px] text-dim mb-3">No meals logged yet today</p>
            <button
              onClick={(e) => { e.preventDefault(); setModalOpen(true); }}
              className="w-full py-2.5 text-sm font-semibold text-white bg-accent rounded-xl hover:bg-accent-light transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Log Your First Meal
            </button>
          </div>
        )}
      </div>

      {/* Food search modal — opens inline from homepage */}
      <FoodSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        meal={getMealFromTime()}
        onAddFood={handleAddFood}
      />
    </>
  );
}

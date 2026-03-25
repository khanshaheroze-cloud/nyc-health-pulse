"use client";

import { useState, useEffect } from "react";
import { loadProfile, calculateMacroTargets } from "./BodyProfile";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function NutritionSummaryCard() {
  const [mounted, setMounted] = useState(false);
  const [todayCals, setTodayCals] = useState(0);
  const [todayP, setTodayP] = useState(0);
  const [todayC, setTodayC] = useState(0);
  const [todayF, setTodayF] = useState(0);
  const [targetCals, setTargetCals] = useState(2000);
  const [hasEntries, setHasEntries] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        }
      }
    } catch { /* ignore */ }
  }, []);

  if (!mounted) return null;

  const pct = Math.min((todayCals / targetCals) * 100, 100);

  return (
    <a href="/nutrition-tracker" className="bg-surface border border-border rounded-2xl p-4 hover:border-hp-green/30 transition-colors block">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🍎</span>
          <h3 className="text-[13px] font-bold text-text">Today&apos;s Nutrition</h3>
        </div>
        <span className="text-[10px] text-accent font-semibold">Log Food →</span>
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
          <div className="flex gap-3 mt-2 text-[10px] text-muted">
            <span>{todayP}g protein</span>
            <span>{todayC}g carbs</span>
            <span>{todayF}g fat</span>
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-dim">Track your meals and hit your macro targets</p>
      )}
    </a>
  );
}

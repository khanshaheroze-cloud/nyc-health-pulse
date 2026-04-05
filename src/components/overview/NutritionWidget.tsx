"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────── */

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

interface Goals {
  dailyCalories: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

/* ── Helpers ─────────────────────────────────────────────── */

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mealEmoji(key: MealKey): string {
  if (key === "breakfast") return "☀";
  if (key === "lunch") return "🌤";
  if (key === "dinner") return "🌙";
  return "🍿";
}

function loadGoals(): Goals {
  try {
    const raw = localStorage.getItem("pulsenyc_nutrition_goals");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        dailyCalories: parsed.dailyCalories || 2000,
        proteinGoal: parsed.proteinGoal || 150,
        carbGoal: parsed.carbGoal || 250,
        fatGoal: parsed.fatGoal || 65,
      };
    }
  } catch {}
  return { dailyCalories: 2000, proteinGoal: 150, carbGoal: 250, fatGoal: 65 };
}

function loadDayLog(): DayLog {
  const date = todayKey();
  try {
    const raw = localStorage.getItem(`pulsenyc_nutrition_${date}`);
    if (raw) return JSON.parse(raw) as DayLog;
  } catch {}
  return { date, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
}

/* ── Calorie Ring ────────────────────────────────────────── */

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 80;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const offset = circ * (1 - pct);
  const color = pct >= 1 ? "#f07070" : pct >= 0.9 ? "#f5c542" : "#4A7C59";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-display font-bold text-text leading-none">{Math.round(consumed).toLocaleString()}</span>
        <span className="text-[9px] text-muted leading-none mt-0.5">/ {goal.toLocaleString()}</span>
        <span className="text-[8px] text-muted leading-none">cal</span>
      </div>
    </div>
  );
}

/* ── Macro Bar ───────────────────────────────────────────── */

function MacroBar({ label, current, goal, unit }: { label: string; current: number; goal: number; unit: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-dim w-4 font-semibold">{label}</span>
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-dim tabular-nums w-16 text-right">
        {Math.round(current)}{unit} <span className="text-muted">/ {goal}</span>
      </span>
    </div>
  );
}

/* ── Component ───────────────────────────────────────────── */

export function NutritionWidget() {
  const [mounted, setMounted] = useState(false);
  const [dayLog, setDayLog] = useState<DayLog>(() => ({
    date: "", meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
  }));
  const [goals, setGoals] = useState<Goals>({ dailyCalories: 2000, proteinGoal: 150, carbGoal: 250, fatGoal: 65 });

  useEffect(() => {
    setMounted(true);
    setDayLog(loadDayLog());
    setGoals(loadGoals());

    // Listen for external nutrition changes
    const handler = () => setDayLog(loadDayLog());
    window.addEventListener("pulsenyc-nutrition-change", handler);
    return () => window.removeEventListener("pulsenyc-nutrition-change", handler);
  }, []);

  const allEntries = useMemo(() => {
    const m = dayLog.meals;
    return [...m.breakfast, ...m.lunch, ...m.dinner, ...m.snacks];
  }, [dayLog]);

  const totalCal = useMemo(() => allEntries.reduce((s, e) => s + e.calories * (e.servings || 1), 0), [allEntries]);
  const totalP = useMemo(() => allEntries.reduce((s, e) => s + e.protein * (e.servings || 1), 0), [allEntries]);
  const totalC = useMemo(() => allEntries.reduce((s, e) => s + e.carbs * (e.servings || 1), 0), [allEntries]);
  const totalF = useMemo(() => allEntries.reduce((s, e) => s + e.fat * (e.servings || 1), 0), [allEntries]);

  // Recent items (last 3, most recent first)
  const recentEntries = useMemo(() => {
    const tagged = allEntries.map((e) => {
      const meal = (Object.entries(dayLog.meals) as [MealKey, FoodEntry[]][]).find(([, arr]) =>
        arr.some((a) => a.id === e.id)
      );
      return { ...e, mealKey: (meal?.[0] ?? "snacks") as MealKey };
    });
    return tagged.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  }, [allEntries, dayLog.meals]);

  if (!mounted) return <div className="rounded-2xl bg-surface border border-border-light p-6 h-[280px]" />;

  const hasEntries = allEntries.length > 0;

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-6">
      <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-3">🍽 Today&apos;s Nutrition</p>

      {/* Ring + Macros */}
      <div className="flex items-center gap-4">
        <CalorieRing consumed={totalCal} goal={goals.dailyCalories} />
        <div className="flex-1 space-y-1.5">
          <MacroBar label="P" current={totalP} goal={goals.proteinGoal} unit="g" />
          <MacroBar label="C" current={totalC} goal={goals.carbGoal} unit="g" />
          <MacroBar label="F" current={totalF} goal={goals.fatGoal} unit="g" />
        </div>
      </div>

      {/* Recent entries */}
      <div className="mt-4">
        {hasEntries ? (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Recent</p>
            {recentEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-[12px]">
                <span className="text-dim truncate">
                  {mealEmoji(e.mealKey)} {e.name}
                </span>
                <span className="text-muted tabular-nums flex-shrink-0 ml-2">
                  {Math.round(e.calories)} cal · {Math.round(e.protein)}g P
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted text-center py-2">
            No meals logged yet — start with breakfast?
          </p>
        )}
      </div>

      {/* Actions */}
      <Link
        href="/nutrition-tracker"
        className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-accent/30 text-[13px] font-bold text-accent hover:bg-accent/5 transition-colors"
      >
        + Log Food
      </Link>
      <div className="text-center mt-2">
        <Link href="/nutrition-tracker" className="text-[11px] text-muted hover:text-dim hover:underline transition-colors">
          View Full Tracker →
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ── Shared interfaces ─────────────────────────────────────── */

export interface FoodEntry {
  id: string;
  name: string;
  source: "nyc" | "usda" | "openfoodfacts" | "custom" | "quick" | "common";
  servings: number;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  micronutrients?: Record<string, number>;
  timestamp: number;
  nycBadge?: boolean;
  builderSource?: string; // e.g. "chipotle", "cava", "pizza" — enables re-editing in MealBuilder
}

export interface UserGoals {
  dailyCalories: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  fiberGoal: number;
  waterGoalOz: number;
}

export interface MealsMap {
  breakfast: FoodEntry[];
  lunch: FoodEntry[];
  dinner: FoodEntry[];
  snacks: FoodEntry[];
}

export const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 2000,
  proteinGoal: 150,
  carbGoal: 250,
  fatGoal: 65,
  fiberGoal: 25,
  waterGoalOz: 64,
};

/* ── Helpers ───────────────────────────────────────────────── */

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function friendlyDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  const todayKey = dateKey(today);
  const yestKey = dateKey(new Date(today.getTime() - 86400000));
  if (iso === todayKey) {
    return `Today, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (iso === yestKey) {
    return `Yesterday, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function shiftDate(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/* ── Animated number ──────────────────────────────────────── */

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(display);
  const startTimeRef = useRef(0);
  const duration = 400;

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(startRef.current + (value - startRef.current) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {fmt(display)}
      {suffix}
    </span>
  );
}

/* ── Circular Progress Ring ───────────────────────────────── */

function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const pct = Math.min(consumed / goal, 1.5);
  const offset = circumference - pct * circumference;
  const isOver = consumed > goal;
  const ringColor = isOver ? "#C4704A" : "#4A7C59";
  const remaining = Math.max(goal - consumed, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="#E8E4DE"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text font-display leading-tight">
            <AnimatedNumber value={consumed} />
          </span>
          <span className="text-xs text-muted">
            / {fmt(goal)} cal
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-dim">
        {isOver ? (
          <span className="text-hp-orange font-medium">
            <AnimatedNumber value={consumed - goal} /> cal over
          </span>
        ) : (
          <span>
            <AnimatedNumber value={remaining} /> cal remaining
          </span>
        )}
      </p>
    </div>
  );
}

/* ── Macro Progress Bar ───────────────────────────────────── */

function MacroBar({
  label,
  current,
  goal,
  unit,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
}) {
  const pct = Math.min((current / goal) * 100, 100);
  const isOver = current > goal;
  const barColor = isOver ? "bg-hp-orange" : "bg-accent";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className={`tabular-nums ${isOver ? "text-hp-orange font-medium" : "text-dim"}`}>
          <AnimatedNumber value={Math.round(current)} suffix={unit} /> / {fmt(goal)}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Copy Yesterday Button ────────────────────────────────── */

function CopyYesterdayButton({
  currentDate,
  onCopy,
}: {
  currentDate: string;
  onCopy: (meals: MealsMap) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (typeof window === "undefined") return;
    const yestKey = shiftDate(currentDate, -1);
    const raw = localStorage.getItem(`pulsenyc_nutrition_${yestKey}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      // Support both { meals: MealsMap } (NutritionDay) and direct MealsMap
      const mealsData = (parsed.meals ?? parsed) as MealsMap;
      onCopy(mealsData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore malformed data */
    }
  }, [currentDate, onCopy]);

  return (
    <button
      onClick={handleCopy}
      className="text-sm text-accent hover:text-accent-light transition-colors flex items-center gap-1"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Copy Yesterday
        </>
      )}
    </button>
  );
}

/* ── Main Component ───────────────────────────────────────── */

interface DailySummaryProps {
  date: string;
  meals: MealsMap;
  goals: UserGoals;
  onDateChange?: (newDate: string) => void;
  onCopyYesterday?: (meals: MealsMap) => void;
}

export default function DailySummary({
  date,
  meals,
  goals,
  onDateChange,
  onCopyYesterday,
}: DailySummaryProps) {
  const allEntries = [
    ...meals.breakfast,
    ...meals.lunch,
    ...meals.dinner,
    ...meals.snacks,
  ];

  const totals = allEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories * e.servings,
      protein: acc.protein + e.protein * e.servings,
      carbs: acc.carbs + e.carbs * e.servings,
      fat: acc.fat + e.fat * e.servings,
      fiber: acc.fiber + e.fiber * e.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const isToday = date === dateKey(new Date());

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-5">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onDateChange?.(shiftDate(date, -1))}
          className="p-2 rounded-lg hover:bg-bg transition-colors text-dim hover:text-text"
          aria-label="Previous day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-bold text-text font-display">{friendlyDate(date)}</h2>
          {!isToday && (
            <button
              onClick={() => onDateChange?.(dateKey(new Date()))}
              className="text-xs text-accent hover:underline"
            >
              Jump to Today
            </button>
          )}
        </div>

        <button
          onClick={() => {
            const next = shiftDate(date, 1);
            if (next <= dateKey(new Date())) {
              onDateChange?.(next);
            }
          }}
          disabled={isToday}
          className="p-2 rounded-lg hover:bg-bg transition-colors text-dim hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calorie ring */}
      <CalorieRing consumed={totals.calories} goal={goals.dailyCalories} />

      {/* Macro bars */}
      <div className="space-y-3">
        <MacroBar label="Protein" current={totals.protein} goal={goals.proteinGoal} unit="g" />
        <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbGoal} unit="g" />
        <MacroBar label="Fat" current={totals.fat} goal={goals.fatGoal} unit="g" />
        <MacroBar label="Fiber" current={totals.fiber} goal={goals.fiberGoal} unit="g" />
      </div>

      {/* Copy yesterday */}
      {onCopyYesterday && (
        <div className="flex justify-center pt-1">
          <CopyYesterdayButton currentDate={date} onCopy={onCopyYesterday} />
        </div>
      )}
    </div>
  );
}

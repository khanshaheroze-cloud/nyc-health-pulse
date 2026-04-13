"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BodyProfile from "@/components/nutrition-tracker/BodyProfile";
import type { MacroTargets } from "@/components/nutrition-tracker/BodyProfile";
import DailySummary from "@/components/nutrition-tracker/DailySummary";
import type { FoodEntry, UserGoals } from "@/components/nutrition-tracker/DailySummary";
import MealSection from "@/components/nutrition-tracker/MealSection";
import FoodSearchModal from "@/components/nutrition-tracker/FoodSearchModal";
import GoalSettings from "@/components/nutrition-tracker/GoalSettings";
import MicronutrientPanel from "@/components/nutrition-tracker/MicronutrientPanel";
import WaterTracker from "@/components/nutrition-tracker/WaterTracker";
import dynamic from "next/dynamic";

const WeeklyTrends = dynamic(
  () => import("@/components/nutrition-tracker/WeeklyTrends"),
  { ssr: false },
);

/* ── Helpers ──────────────────────────────────────────────── */

const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 2000,
  proteinGoal: 150,
  carbGoal: 250,
  fatGoal: 65,
  fiberGoal: 25,
  waterGoalOz: 64,
};

interface NutritionDay {
  date: string;
  meals: {
    breakfast: FoodEntry[];
    lunch: FoodEntry[];
    dinner: FoodEntry[];
    snacks: FoodEntry[];
  };
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadDay(date: string): NutritionDay {
  if (typeof window === "undefined") return { date, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
  try {
    const raw = localStorage.getItem(`pulsenyc_nutrition_${date}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { date, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };
}

function saveDay(day: NutritionDay) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`pulsenyc_nutrition_${day.date}`, JSON.stringify(day));
  window.dispatchEvent(new CustomEvent("pulsenyc-nutrition-change"));
}

function loadGoals(): UserGoals {
  if (typeof window === "undefined") return DEFAULT_GOALS;
  try {
    const raw = localStorage.getItem("pulsenyc_nutrition_goals");
    if (raw) return { ...DEFAULT_GOALS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_GOALS;
}

type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";

/* ── Floating Add Button ─────────────────────────────────── */

const MEAL_OPTIONS: { key: MealKey; emoji: string; label: string }[] = [
  { key: "breakfast", emoji: "☀️", label: "Breakfast" },
  { key: "lunch", emoji: "🌤️", label: "Lunch" },
  { key: "dinner", emoji: "🌙", label: "Dinner" },
  { key: "snacks", emoji: "🍿", label: "Snacks" },
];

function FloatingAddButton({ onSelectMeal }: { onSelectMeal: (meal: MealKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      {/* Meal selector popover */}
      {open && (
        <div className="absolute bottom-16 right-0 bg-surface rounded-2xl border border-border shadow-xl p-2 min-w-[160px] animate-fade-in-up">
          {MEAL_OPTIONS.map((m) => (
            <button
              key={m.key}
              onClick={() => { onSelectMeal(m.key); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-text hover:bg-bg transition-colors"
            >
              <span className="text-base">{m.emoji}</span>
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      )}
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 bg-hp-green text-white rounded-full shadow-lg hover:bg-hp-green/90 transition-all hover:scale-105 flex items-center justify-center ${open ? "rotate-45" : ""}`}
        aria-label="Log food"
      >
        <svg className="w-6 h-6 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

/* ── Main Page Component ─────────────────────────────────── */

export default function NutritionTrackerPage() {
  const [date, setDate] = useState(todayStr);
  const [day, setDay] = useState<NutritionDay>(() => loadDay(todayStr()));
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [profileTargets, setProfileTargets] = useState<MacroTargets | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMeal, setSearchMeal] = useState<MealKey>("breakfast");
  const [editBuilderEntry, setEditBuilderEntry] = useState<{ entry: FoodEntry; meal: MealKey; index: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goalMode, setGoalMode] = useState<"auto" | "manual">("auto");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const g = loadGoals();
    setGoals(g);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((g as any).goalMode === "manual") setGoalMode("manual");
    setDay(loadDay(todayStr()));
  }, []);

  // Reload when date changes
  useEffect(() => {
    if (!mounted) return;
    setDay(loadDay(date));
  }, [date, mounted]);

  // Persist on change
  useEffect(() => {
    if (!mounted) return;
    saveDay(day);
  }, [day, mounted]);

  const handleProfileTargets = useCallback((targets: MacroTargets) => {
    setProfileTargets(targets);
    setGoals({
      dailyCalories: targets.calories,
      proteinGoal: targets.protein,
      carbGoal: targets.carbs,
      fatGoal: targets.fat,
      fiberGoal: targets.fiber,
      waterGoalOz: 64,
    });
  }, []);

  const handleDateChange = useCallback((newDate: string) => {
    setDate(newDate);
  }, []);

  const openAddFood = useCallback((meal: MealKey) => {
    setSearchMeal(meal);
    setSearchOpen(true);
  }, []);

  const addFoodEntry = useCallback((entry: FoodEntry) => {
    setDay((prev) => ({
      ...prev,
      meals: {
        ...prev.meals,
        [searchMeal]: [...prev.meals[searchMeal], entry],
      },
    }));
    setSearchOpen(false);
  }, [searchMeal]);

  const removeEntry = useCallback((meal: MealKey, index: number) => {
    setDay((prev) => {
      const entry = prev.meals[meal][index];
      // Clean up associated MealBuilder details from localStorage
      if (entry) {
        const key = entry.id || String(entry.timestamp);
        try {
          localStorage.removeItem(`pulsenyc_builder_details_${key}`);
        } catch { /* ignore */ }
      }
      return {
        ...prev,
        meals: {
          ...prev.meals,
          [meal]: prev.meals[meal].filter((_, i) => i !== index),
        },
      };
    });
  }, []);

  const handleEditBuilder = useCallback((entry: FoodEntry, index: number, meal: MealKey) => {
    setEditBuilderEntry({ entry, meal, index });
    setSearchMeal(meal);
    setSearchOpen(true);
  }, []);

  const handleGoalsSave = useCallback((newGoals: UserGoals) => {
    setGoals(newGoals);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setGoalMode((newGoals as any).goalMode === "manual" ? "manual" : "auto");
    if (typeof window !== "undefined") {
      localStorage.setItem("pulsenyc_nutrition_goals", JSON.stringify(newGoals));
    }
    setSettingsOpen(false);
  }, []);

  const copyPreviousDay = useCallback((prevMeals: { breakfast: FoodEntry[]; lunch: FoodEntry[]; dinner: FoodEntry[]; snacks: FoodEntry[] }) => {
    setDay((cur) => ({
      ...cur,
      meals: {
        breakfast: [...cur.meals.breakfast, ...prevMeals.breakfast.map((e) => ({ ...e, timestamp: Date.now() }))],
        lunch: [...cur.meals.lunch, ...prevMeals.lunch.map((e) => ({ ...e, timestamp: Date.now() }))],
        dinner: [...cur.meals.dinner, ...prevMeals.dinner.map((e) => ({ ...e, timestamp: Date.now() }))],
        snacks: [...cur.meals.snacks, ...prevMeals.snacks.map((e) => ({ ...e, timestamp: Date.now() }))],
      },
    }));
  }, []);

  if (!mounted) {
    return (
      <div className="py-8 text-center text-muted text-sm">Loading tracker...</div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-[28px] sm:text-[34px] text-text">Nutrition</h1>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-dim hover:text-text hover:bg-bg transition-colors"
            aria-label="Nutrition settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-dim">
          Track meals &middot; 500K+ foods &middot; NYC&apos;s curated database
        </p>
      </div>

      {/* Body Profile / Targets */}
      <div className="mb-4">
        <BodyProfile onTargetsChange={handleProfileTargets} />
      </div>

      {/* Daily summary (calories + macros + date nav) */}
      <DailySummary
        date={date}
        meals={day.meals}
        goals={goals}
        goalMode={goalMode}
        onDateChange={handleDateChange}
        onCopyYesterday={copyPreviousDay}
      />

      {/* Meal sections */}
      <div className="space-y-4 mt-4">
        {(["breakfast", "lunch", "dinner", "snacks"] as const).map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            entries={day.meals[meal]}
            onAddFood={() => openAddFood(meal)}
            onRemoveEntry={(index) => removeEntry(meal, index)}
            onEditBuilder={(entry, index) => handleEditBuilder(entry, index, meal)}
          />
        ))}
      </div>

      {/* Water tracker */}
      <div className="mt-4">
        <WaterTracker date={date} />
      </div>

      {/* Micronutrient panel */}
      <div className="mt-4">
        <MicronutrientPanel meals={day.meals} />
      </div>

      {/* Weekly trends */}
      <div className="mt-4">
        <WeeklyTrends />
      </div>


      {/* Food search modal */}
      <FoodSearchModal
        open={searchOpen}
        onClose={() => { setSearchOpen(false); setEditBuilderEntry(null); }}
        meal={searchMeal}
        onMealChange={setSearchMeal}
        onAddFood={(entry) => {
          if (editBuilderEntry) {
            // Replace existing entry at index
            setDay((prev) => {
              const updated = [...prev.meals[editBuilderEntry.meal]];
              updated[editBuilderEntry.index] = entry;
              return { ...prev, meals: { ...prev.meals, [editBuilderEntry.meal]: updated } };
            });
            setSearchOpen(false);
            setEditBuilderEntry(null);
          } else {
            addFoodEntry(entry);
          }
        }}
        editBuilderEntry={editBuilderEntry?.entry}
      />

      {/* Goal settings panel */}
      {settingsOpen && (
        <GoalSettings
          goals={goals}
          onSave={handleGoalsSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Floating quick-log button with meal selector */}
      <FloatingAddButton onSelectMeal={(meal) => { setSearchMeal(meal); setSearchOpen(true); }} />
    </>
  );
}

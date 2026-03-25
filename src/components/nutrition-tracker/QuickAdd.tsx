"use client";

import { useState } from "react";

interface FoodEntry {
  id: string;
  name: string;
  source: "nyc" | "usda" | "openfoodfacts" | "custom" | "quick";
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
}

interface QuickAddProps {
  meal: "breakfast" | "lunch" | "dinner" | "snacks";
  onAdd: (entry: FoodEntry) => void;
  onClose: () => void;
}

export default function QuickAdd({ meal, onAdd, onClose }: QuickAddProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [showMacros, setShowMacros] = useState(false);

  const mealLabels: Record<string, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snacks: "Snack",
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cal = Number(calories);
    if (!cal || cal <= 0) return;

    const entry: FoodEntry = {
      id: `quick_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim() || "Quick Add",
      source: "quick",
      servings: 1,
      servingSize: "1 serving",
      calories: cal,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      timestamp: Date.now(),
    };

    onAdd(entry);
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text font-semibold text-lg">
          Quick Add &mdash; {mealLabels[meal]}
        </h3>
        <button
          onClick={onClose}
          className="text-muted hover:text-text transition-colors p-1"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-dim text-sm mb-1">
            Name <span className="text-muted">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Quick Add"
            className="w-full rounded-xl border border-border bg-[#FAFAF7] px-3 py-2 text-text text-sm
                       placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30
                       focus:border-[#4A7C59] transition-colors"
          />
        </div>

        {/* Calories */}
        <div>
          <label className="block text-dim text-sm mb-1">
            Calories <span className="text-[#f07070]">*</span>
          </label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="0"
            min="1"
            required
            className="w-full rounded-xl border border-border bg-[#FAFAF7] px-3 py-2 text-text text-sm
                       placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30
                       focus:border-[#4A7C59] transition-colors"
          />
        </div>

        {/* Toggle macros */}
        <button
          type="button"
          onClick={() => setShowMacros(!showMacros)}
          className="flex items-center gap-1.5 text-sm text-[#4A7C59] hover:text-[#3a6347] transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`transition-transform ${showMacros ? "rotate-90" : ""}`}
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {showMacros ? "Hide" : "Add"} macros
        </button>

        {/* Macro inputs */}
        {showMacros && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Protein (g)", value: protein, set: setProtein },
              { label: "Carbs (g)", value: carbs, set: setCarbs },
              { label: "Fat (g)", value: fat, set: setFat },
              { label: "Fiber (g)", value: fiber, set: setFiber },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-dim text-xs mb-1">
                  {field.label}
                </label>
                <input
                  type="number"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="w-full rounded-xl border border-border bg-[#FAFAF7] px-3 py-2 text-text text-sm
                             placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30
                             focus:border-[#4A7C59] transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-[#4A7C59] text-white font-medium rounded-xl py-2.5 px-4
                       hover:bg-[#3a6347] active:scale-[0.98] transition-all text-sm"
          >
            Add
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#FAFAF7] text-dim font-medium rounded-xl py-2.5 px-4
                       border border-border hover:bg-[#f0ede6] transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

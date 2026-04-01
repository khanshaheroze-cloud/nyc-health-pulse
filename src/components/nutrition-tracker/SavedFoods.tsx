"use client";

import { useState, useEffect } from "react";
import type { FoodEntry } from "./DailySummary";

type SavedFood = Omit<FoodEntry, "timestamp" | "nycBadge" | "builderSource">;

interface SavedFoodsProps {
  onSelect: (food: SavedFood) => void;
}

const LS_KEY = "pulsenyc_saved_foods";

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  nyc: { label: "NYC", color: "#4A7C59" },
  usda: { label: "USDA", color: "#5b9cf5" },
  openfoodfacts: { label: "OFF", color: "#f59e42" },
  custom: { label: "Custom", color: "#a78bfa" },
  quick: { label: "Quick", color: "#8A918A" },
};

export default function SavedFoods({ onSelect }: SavedFoodsProps) {
  const [foods, setFoods] = useState<SavedFood[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setFoods(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function persist(updated: SavedFood[]) {
    setFoods(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }

  function handleDelete(id: string) {
    persist(foods.filter((f) => f.id !== id));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !calories) return;

    const newFood: SavedFood = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      source: "custom",
      servings: 1,
      servingSize: servingSize.trim() || "1 serving",
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
    };

    persist([newFood, ...foods]);
    resetForm();
  }

  function resetForm() {
    setShowForm(false);
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setServingSize("");
  }

  if (!mounted) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-5 h-48 animate-pulse" />
    );
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-[#FAFAF7] px-3 py-2 text-text text-sm " +
    "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 " +
    "focus:border-[#4A7C59] transition-colors";

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text font-semibold text-lg">Saved Foods</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-sm text-[#4A7C59] hover:text-[#3a6347]
                     font-medium transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Create Custom
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 p-4 bg-[#FAFAF7] rounded-xl border border-border space-y-3"
        >
          <div>
            <label className="block text-dim text-sm mb-1">
              Name <span className="text-[#f07070]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Homemade Granola"
              required
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-dim text-xs mb-1">
                Calories <span className="text-[#f07070]">*</span>
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                min="1"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-dim text-xs mb-1">
                Serving Size
              </label>
              <input
                type="text"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="1 cup"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Protein", value: protein, set: setProtein },
              { label: "Carbs", value: carbs, set: setCarbs },
              { label: "Fat", value: fat, set: setFat },
              { label: "Fiber", value: fiber, set: setFiber },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-dim text-xs mb-1">
                  {f.label} (g)
                </label>
                <input
                  type="number"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#4A7C59] text-white font-medium rounded-xl py-2 px-4
                         hover:bg-[#3a6347] active:scale-[0.98] transition-all text-sm"
            >
              Save Food
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-dim text-sm hover:text-text transition-colors px-3"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Food list */}
      {foods.length === 0 ? (
        <div className="text-center py-8">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            className="mx-auto mb-2 text-muted"
          >
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M14 20h12M20 14v12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-muted text-sm">No saved foods yet</p>
          <p className="text-muted text-xs mt-1">
            Save foods from search results or create custom entries
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {foods.map((food) => {
            const badge = SOURCE_BADGES[food.source] || SOURCE_BADGES.custom;
            return (
              <li
                key={food.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#FAFAF7] border border-border/50
                           hover:border-[#4A7C59]/30 transition-colors group cursor-pointer"
                onClick={() => onSelect(food)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-text text-sm font-medium truncate">
                      {food.name}
                    </span>
                    <span
                      className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-muted text-xs mt-0.5">
                    {food.calories} cal &middot; {food.servingSize}
                    {food.protein > 0 &&
                      ` · ${food.protein}P / ${food.carbs}C / ${food.fat}F`}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(food.id);
                  }}
                  className="shrink-0 text-muted hover:text-[#f07070] transition-colors p-1
                             opacity-0 group-hover:opacity-100"
                  aria-label={`Delete ${food.name}`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M4 4l8 8M4 12l8-8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

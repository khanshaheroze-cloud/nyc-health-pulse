"use client";

import { useState, useMemo, useCallback } from "react";
import type { FoodEntry } from "./DailySummary";

/* ── Types ────────────────────────────────────────────────── */

interface FoodVariant {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface FoodData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  source: "nyc" | "usda" | "openfoodfacts" | "custom" | "common";
  nycBadge?: boolean;
  variants?: FoodVariant[];
  tip?: string;
  tags?: string[];
  micronutrients?: Record<string, number>;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

/* ── Daily Value reference (FDA 2020) ─────────────────────── */

const DAILY_VALUES: Record<string, { dv: number; unit: string; label: string }> = {
  vitaminA: { dv: 900, unit: "mcg", label: "Vitamin A" },
  vitaminC: { dv: 90, unit: "mg", label: "Vitamin C" },
  vitaminD: { dv: 20, unit: "mcg", label: "Vitamin D" },
  vitaminE: { dv: 15, unit: "mg", label: "Vitamin E" },
  vitaminK: { dv: 120, unit: "mcg", label: "Vitamin K" },
  vitaminB6: { dv: 1.7, unit: "mg", label: "Vitamin B6" },
  vitaminB12: { dv: 2.4, unit: "mcg", label: "Vitamin B12" },
  thiamin: { dv: 1.2, unit: "mg", label: "Thiamin" },
  riboflavin: { dv: 1.3, unit: "mg", label: "Riboflavin" },
  niacin: { dv: 16, unit: "mg", label: "Niacin" },
  folate: { dv: 400, unit: "mcg", label: "Folate" },
  calcium: { dv: 1300, unit: "mg", label: "Calcium" },
  iron: { dv: 18, unit: "mg", label: "Iron" },
  magnesium: { dv: 420, unit: "mg", label: "Magnesium" },
  phosphorus: { dv: 1250, unit: "mg", label: "Phosphorus" },
  potassium: { dv: 4700, unit: "mg", label: "Potassium" },
  sodium: { dv: 2300, unit: "mg", label: "Sodium" },
  zinc: { dv: 11, unit: "mg", label: "Zinc" },
  selenium: { dv: 55, unit: "mcg", label: "Selenium" },
  cholesterol: { dv: 300, unit: "mg", label: "Cholesterol" },
  saturatedFat: { dv: 20, unit: "g", label: "Saturated Fat" },
  transFat: { dv: 0, unit: "g", label: "Trans Fat" },
  sugar: { dv: 50, unit: "g", label: "Total Sugars" },
  addedSugar: { dv: 50, unit: "g", label: "Added Sugars" },
};

/* ── Source badge ──────────────────────────────────────────── */

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { emoji: string; label: string; color: string }> = {
    nyc: { emoji: "🗽", label: "NYC Curated", color: "bg-accent-bg text-accent" },
    usda: { emoji: "🔬", label: "USDA Verified", color: "bg-blue-50 text-sky" },
    openfoodfacts: { emoji: "🌐", label: "Open Food Facts", color: "bg-purple-50 text-hp-purple" },
    custom: { emoji: "✏️", label: "Custom", color: "bg-bg text-dim" },
  };
  const c = config[source] || config.custom;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${c.color}`}>
      {c.emoji} {c.label}
    </span>
  );
}

/* ── Macro circle ─────────────────────────────────────────── */

function MacroCircle({
  label,
  value,
  unit,
  color,
  large,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  large?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex items-center justify-center rounded-full ${large ? "w-16 h-16" : "w-12 h-12"}`}
        style={{ backgroundColor: color + "18", border: `2px solid ${color}` }}
      >
        <span
          className={`font-bold tabular-nums ${large ? "text-lg" : "text-sm"}`}
          style={{ color }}
        >
          {Math.round(value)}
        </span>
      </div>
      <span className="text-[10px] text-muted font-medium">{label}</span>
      {!large && <span className="text-[10px] text-muted -mt-1">{unit}</span>}
      {large && <span className="text-[10px] text-muted -mt-1">{unit}</span>}
    </div>
  );
}

/* ── Weight conversion helpers ────────────────────────────── */

type WeightUnit = "g" | "oz" | "lb";

const WEIGHT_TO_GRAMS: Record<WeightUnit, number> = {
  g: 1,
  oz: 28.3495,
  lb: 453.592,
};

const WEIGHT_LABELS: Record<WeightUnit, string> = {
  g: "grams",
  oz: "ounces",
  lb: "pounds",
};

const QUICK_WEIGHTS: Record<WeightUnit, number[]> = {
  g: [50, 100, 150, 200, 250],
  oz: [2, 4, 6, 8, 12],
  lb: [0.25, 0.5, 0.75, 1, 1.5],
};

/** Parse a serving size string to extract approximate grams for per-serving reference */
function parseServingGrams(servingSize: string): number | null {
  if (!servingSize) return null;
  const match = servingSize.match(/(\d+\.?\d*)\s*(g|grams?|ml)\b/i);
  if (match) return parseFloat(match[1]);
  // per 100g is common from Open Food Facts
  if (/per\s*100\s*g/i.test(servingSize)) return 100;
  return null;
}

/* ── Quantity selector ────────────────────────────────────── */

type QuantityMode = "servings" | "weight";
const QUICK_AMOUNTS = [0.5, 1, 1.5, 2, 3];

function QuantitySelector({
  value,
  onChange,
  mode,
  onModeChange,
  weightValue,
  weightUnit,
  onWeightChange,
  onWeightUnitChange,
  servingGrams,
}: {
  value: number;
  onChange: (v: number) => void;
  mode: QuantityMode;
  onModeChange: (m: QuantityMode) => void;
  weightValue: number;
  weightUnit: WeightUnit;
  onWeightChange: (v: number) => void;
  onWeightUnitChange: (u: WeightUnit) => void;
  servingGrams: number | null;
}) {
  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-dim">Quantity</label>
        <div className="flex bg-bg rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => onModeChange("servings")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              mode === "servings"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-dim"
            }`}
          >
            Servings
          </button>
          <button
            onClick={() => onModeChange("weight")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              mode === "weight"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-dim"
            }`}
          >
            By Weight
          </button>
        </div>
      </div>

      {mode === "servings" ? (
        <div className="flex items-center gap-2">
          {/* Quick buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => onChange(amt)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  value === amt
                    ? "bg-accent text-white"
                    : "bg-bg text-dim hover:bg-border"
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
          {/* +/- stepper */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => onChange(Math.max(0.25, value - 0.25))}
              className="w-8 h-8 rounded-lg bg-bg text-dim hover:bg-border flex items-center justify-center transition-colors"
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-10 text-center text-sm font-bold text-text tabular-nums">
              {value % 1 === 0 ? value : value.toFixed(2).replace(/0$/, "")}
            </span>
            <button
              onClick={() => onChange(Math.min(10, value + 0.25))}
              className="w-8 h-8 rounded-lg bg-bg text-dim hover:bg-border flex items-center justify-center transition-colors"
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Unit selector */}
          <div className="flex gap-1.5">
            {(["g", "oz", "lb"] as WeightUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => onWeightUnitChange(u)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  weightUnit === u
                    ? "bg-accent text-white"
                    : "bg-bg text-dim hover:bg-border"
                }`}
              >
                {WEIGHT_LABELS[u]}
              </button>
            ))}
          </div>
          {/* Quick weight buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_WEIGHTS[weightUnit].map((w) => (
              <button
                key={w}
                onClick={() => onWeightChange(w)}
                className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  weightValue === w
                    ? "bg-hp-blue text-white"
                    : "bg-bg text-dim hover:bg-border"
                }`}
              >
                {w}{weightUnit}
              </button>
            ))}
          </div>
          {/* Manual weight input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={weightValue || ""}
              onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
              placeholder={`Enter ${WEIGHT_LABELS[weightUnit]}`}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[40px]"
              min={0}
              step={weightUnit === "lb" ? 0.25 : 1}
            />
            <span className="text-sm font-medium text-dim w-8">{weightUnit}</span>
          </div>
          {/* Conversion info */}
          {servingGrams && weightValue > 0 && (
            <p className="text-[10px] text-muted">
              {weightValue}{weightUnit} = {(weightValue * WEIGHT_TO_GRAMS[weightUnit]).toFixed(0)}g
              {" "}({((weightValue * WEIGHT_TO_GRAMS[weightUnit]) / servingGrams).toFixed(1)} servings of {servingGrams}g)
            </p>
          )}
          {!servingGrams && weightValue > 0 && (
            <p className="text-[10px] text-muted">
              {weightValue}{weightUnit} = {(weightValue * WEIGHT_TO_GRAMS[weightUnit]).toFixed(0)}g
              {" "}(nutrition scaled from per-serving data)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Micronutrient bar ────────────────────────────────────── */

function NutrientBar({
  label,
  amount,
  unit,
  dvPct,
}: {
  label: string;
  amount: number;
  unit: string;
  dvPct: number;
}) {
  const clamped = Math.min(dvPct, 100);
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs text-dim w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[10px] text-muted tabular-nums w-14 text-right shrink-0">
        {amount.toFixed(1)}{unit}
      </span>
      <span className="text-[10px] font-medium text-dim tabular-nums w-10 text-right shrink-0">
        {Math.round(dvPct)}%
      </span>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

interface FoodDetailCardProps {
  food: FoodData | Record<string, unknown>;
  meal: "breakfast" | "lunch" | "dinner" | "snacks";
  onAdd: (entry: FoodEntry) => void;
  onBack: () => void;
  initialQuantity?: number;
}

export default function FoodDetailCard({
  food: rawFood,
  meal,
  onAdd,
  onBack,
  initialQuantity,
}: FoodDetailCardProps) {
  // Normalize the food data
  const food = rawFood as FoodData;
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [showMicros, setShowMicros] = useState(false);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>("servings");
  const [weightValue, setWeightValue] = useState<number>(100);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("g");

  // Parse serving size to grams for weight conversion
  const servingGrams = useMemo(() => parseServingGrams(food.servingSize), [food.servingSize]);
  const [saved, setSaved] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const existing = JSON.parse(localStorage.getItem("pulsenyc_saved_foods") || "[]") as FoodEntry[];
      return existing.some((e) => e.id === food.id);
    } catch {
      return false;
    }
  });

  // Active macros (variant or base)
  const activeMacros = useMemo(() => {
    if (selectedVariant !== null && food.variants && food.variants[selectedVariant]) {
      const v = food.variants[selectedVariant];
      return {
        calories: v.calories,
        protein: v.protein,
        carbs: v.carbs,
        fat: v.fat,
        fiber: v.fiber,
      };
    }
    return {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      fiber: food.fiber || 0,
    };
  }, [food, selectedVariant]);

  // Effective multiplier: in weight mode, convert to serving-equivalent
  const effectiveMultiplier = useMemo(() => {
    if (quantityMode === "servings") return quantity;
    if (!servingGrams || servingGrams <= 0) {
      // No gram reference — assume serving size is 100g (common for USDA/OFF data)
      const grams = weightValue * WEIGHT_TO_GRAMS[weightUnit];
      return grams / 100;
    }
    const grams = weightValue * WEIGHT_TO_GRAMS[weightUnit];
    return grams / servingGrams;
  }, [quantityMode, quantity, weightValue, weightUnit, servingGrams]);

  // Scaled macros
  const scaled = useMemo(
    () => ({
      calories: activeMacros.calories * effectiveMultiplier,
      protein: activeMacros.protein * effectiveMultiplier,
      carbs: activeMacros.carbs * effectiveMultiplier,
      fat: activeMacros.fat * effectiveMultiplier,
      fiber: activeMacros.fiber * effectiveMultiplier,
    }),
    [activeMacros, effectiveMultiplier]
  );

  // Micronutrients
  const micros = useMemo(() => {
    if (!food.micronutrients) return [];
    return Object.entries(food.micronutrients)
      .filter(([key]) => DAILY_VALUES[key])
      .map(([key, amount]) => {
        const dv = DAILY_VALUES[key];
        const scaledAmount = (amount as number) * effectiveMultiplier;
        const dvPct = dv.dv > 0 ? (scaledAmount / dv.dv) * 100 : 0;
        return {
          key,
          label: dv.label,
          amount: scaledAmount,
          unit: dv.unit,
          dvPct,
        };
      })
      .sort((a, b) => b.dvPct - a.dvPct);
  }, [food.micronutrients, effectiveMultiplier]);

  const handleSave = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const existing = JSON.parse(localStorage.getItem("pulsenyc_saved_foods") || "[]") as FoodEntry[];
      if (saved) {
        const updated = existing.filter((e) => e.id !== food.id);
        localStorage.setItem("pulsenyc_saved_foods", JSON.stringify(updated));
        setSaved(false);
      } else {
        const entry: FoodEntry = {
          id: food.id,
          name: food.name,
          source: food.source || "custom",
          servings: 1,
          servingSize: food.servingSize || "1 serving",
          calories: food.calories || 0,
          protein: food.protein || 0,
          carbs: food.carbs || 0,
          fat: food.fat || 0,
          fiber: food.fiber || 0,
          micronutrients: food.micronutrients,
          timestamp: Date.now(),
          nycBadge: food.nycBadge,
        };
        const updated = [entry, ...existing.filter((e) => e.id !== food.id)];
        localStorage.setItem("pulsenyc_saved_foods", JSON.stringify(updated));
        setSaved(true);
      }
    } catch {
      /* ignore */
    }
  }, [food, saved]);

  const handleAdd = useCallback(() => {
    const variantName =
      selectedVariant !== null && food.variants
        ? ` (${food.variants[selectedVariant].name})`
        : "";
    const weightSuffix = quantityMode === "weight"
      ? ` (${weightValue}${weightUnit})`
      : "";
    const entry: FoodEntry = {
      id: `${food.id}-${Date.now()}`,
      name: food.name + variantName + weightSuffix,
      source: food.source || "custom",
      servings: effectiveMultiplier,
      servingSize: quantityMode === "weight"
        ? `${weightValue}${weightUnit}`
        : (food.servingSize || "1 serving"),
      calories: activeMacros.calories,
      protein: activeMacros.protein,
      carbs: activeMacros.carbs,
      fat: activeMacros.fat,
      fiber: activeMacros.fiber,
      micronutrients: food.micronutrients,
      timestamp: Date.now(),
      nycBadge: food.nycBadge || food.source === "nyc",
    };
    onAdd(entry);
  }, [food, effectiveMultiplier, activeMacros, selectedVariant, onAdd, quantityMode, weightValue, weightUnit]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-bg transition-colors text-dim"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text font-display truncate">{food.name}</h2>
          {food.category && <p className="text-xs text-muted">{food.category}</p>}
        </div>
        {/* Save button */}
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg transition-colors ${
            saved ? "text-hp-red" : "text-muted hover:text-hp-red"
          }`}
          aria-label={saved ? "Remove from saved foods" : "Save to my foods"}
        >
          <svg
            className="w-5 h-5"
            fill={saved ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>

      {/* Source + description */}
      <div className="px-4 pb-3 space-y-2">
        <SourceBadge source={food.source || "custom"} />
        {food.description && (
          <p className="text-sm text-dim leading-relaxed">{food.description}</p>
        )}
      </div>

      {/* Serving size info */}
      <div className="px-4 pb-3">
        <p className="text-xs text-muted">
          Serving size: <span className="font-medium text-dim">{food.servingSize || "1 serving"}</span>
        </p>
      </div>

      {/* Variants */}
      {food.variants && food.variants.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          <label className="text-xs font-medium text-dim">Options</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedVariant(null)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedVariant === null
                  ? "bg-accent text-white"
                  : "bg-bg text-dim hover:bg-border"
              }`}
            >
              Original
            </button>
            {food.variants.map((v, i) => (
              <button
                key={v.name}
                onClick={() => setSelectedVariant(i)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedVariant === i
                    ? "bg-accent text-white"
                    : "bg-bg text-dim hover:bg-border"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="px-4 pb-4">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          mode={quantityMode}
          onModeChange={setQuantityMode}
          weightValue={weightValue}
          weightUnit={weightUnit}
          onWeightChange={setWeightValue}
          onWeightUnitChange={setWeightUnit}
          servingGrams={servingGrams}
        />
      </div>

      {/* Macro display */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center gap-4 py-4 bg-bg rounded-xl">
          <MacroCircle
            label="Calories"
            value={scaled.calories}
            unit="cal"
            color="#4A7C59"
            large
          />
          <MacroCircle label="Protein" value={scaled.protein} unit="g" color="#4A7C59" />
          <MacroCircle label="Carbs" value={scaled.carbs} unit="g" color="#3B7CB8" />
          <MacroCircle label="Fat" value={scaled.fat} unit="g" color="#C4704A" />
          <MacroCircle label="Fiber" value={scaled.fiber} unit="g" color="#4A7C59" />
        </div>
      </div>

      {/* NYC tip */}
      {food.tip && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 p-3 bg-accent-bg rounded-xl">
            <span className="text-accent shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="text-xs text-accent leading-relaxed">{food.tip}</p>
          </div>
        </div>
      )}

      {/* Micronutrients */}
      {micros.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowMicros(!showMicros)}
            className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-light transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showMicros ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Full Nutrition ({micros.length} nutrients)
          </button>
          {showMicros && (
            <div className="mt-3 p-3 bg-bg rounded-xl space-y-0.5">
              <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-border text-[10px] font-medium text-muted">
                <span className="w-24">Nutrient</span>
                <span className="flex-1">% Daily Value</span>
                <span className="w-14 text-right">Amount</span>
                <span className="w-10 text-right">% DV</span>
              </div>
              {micros.map((m) => (
                <NutrientBar
                  key={m.key}
                  label={m.label}
                  amount={m.amount}
                  unit={m.unit}
                  dvPct={m.dvPct}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add button */}
      <div className="px-4 pb-4 mt-auto">
        <button
          onClick={handleAdd}
          className="w-full py-3.5 text-sm font-bold text-white bg-accent rounded-xl hover:bg-accent-light transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add to {MEAL_LABELS[meal]} &middot; {Math.round(scaled.calories)} cal
        </button>
      </div>
    </div>
  );
}

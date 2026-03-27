"use client";

import { useState, useMemo } from "react";

interface FoodEntry {
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
}

interface MicronutrientPanelProps {
  meals: {
    breakfast: FoodEntry[];
    lunch: FoodEntry[];
    dinner: FoodEntry[];
    snacks: FoodEntry[];
  };
}

interface NutrientDV {
  label: string;
  unit: string;
  dv: number;
  key: string;
  warnOver?: boolean;
}

const NUTRIENTS: NutrientDV[] = [
  { key: "vitaminA", label: "Vitamin A", unit: "mcg RAE", dv: 900 },
  { key: "vitaminC", label: "Vitamin C", unit: "mg", dv: 90 },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg", dv: 20 },
  { key: "vitaminK", label: "Vitamin K", unit: "mcg", dv: 120 },
  { key: "vitaminB6", label: "Vitamin B6", unit: "mg", dv: 1.7 },
  { key: "vitaminB12", label: "Vitamin B12", unit: "mcg", dv: 2.4 },
  { key: "folate", label: "Folate", unit: "mcg DFE", dv: 400 },
  { key: "calcium", label: "Calcium", unit: "mg", dv: 1300 },
  { key: "iron", label: "Iron", unit: "mg", dv: 18 },
  { key: "potassium", label: "Potassium", unit: "mg", dv: 2600 },
  { key: "magnesium", label: "Magnesium", unit: "mg", dv: 420 },
  { key: "zinc", label: "Zinc", unit: "mg", dv: 11 },
  {
    key: "sodium",
    label: "Sodium",
    unit: "mg",
    dv: 2300,
    warnOver: true,
  },
  {
    key: "cholesterol",
    label: "Cholesterol",
    unit: "mg",
    dv: 300,
    warnOver: true,
  },
  { key: "phosphorus", label: "Phosphorus", unit: "mg", dv: 1250 },
  { key: "selenium", label: "Selenium", unit: "mcg", dv: 55 },
];

export default function MicronutrientPanel({
  meals,
}: MicronutrientPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const aggregated = useMemo(() => {
    const totals: Record<string, number> = {};
    const allEntries = [
      ...meals.breakfast,
      ...meals.lunch,
      ...meals.dinner,
      ...meals.snacks,
    ];

    for (const entry of allEntries) {
      if (!entry.micronutrients) continue;
      for (const [key, value] of Object.entries(entry.micronutrients)) {
        totals[key] = (totals[key] || 0) + value * entry.servings;
      }
    }
    return totals;
  }, [meals]);

  const hasData = Object.keys(aggregated).length > 0;

  const nutrientsWithValues = NUTRIENTS.map((n) => ({
    ...n,
    value: aggregated[n.key] || 0,
    pct: Math.round(((aggregated[n.key] || 0) / n.dv) * 100),
  }));

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#FAFAF7] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="text-[#4A7C59]"
          >
            <circle
              cx="9"
              cy="9"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M9 6v4M7 8h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-text font-semibold text-sm">
            Micronutrients
          </span>
          {!hasData && (
            <span className="text-muted text-xs">(no data yet)</span>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-muted transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2.5">
          {nutrientsWithValues.map((n) => {
            const isOver = n.pct > 100;
            const isWarn = n.warnOver && isOver;
            const barColor = isWarn ? "#f59e42" : "#4A7C59";
            const barWidth = Math.min(n.pct, 100);

            return (
              <div key={n.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-dim text-xs">{n.label}</span>
                  <span className="text-xs text-muted">
                    {n.value > 0
                      ? `${Number(n.value.toFixed(1))} / ${n.dv} ${n.unit}`
                      : `0 / ${n.dv} ${n.unit}`}
                  </span>
                </div>
                <div className="h-2 bg-[#FAFAF7] rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: barColor,
                      opacity: n.value > 0 ? 1 : 0.2,
                    }}
                  />
                </div>
                <div className="flex justify-end">
                  <span
                    className={`text-xs font-medium ${
                      isWarn
                        ? "text-[#f59e42]"
                        : n.pct >= 100
                          ? "text-[#4A7C59]"
                          : "text-muted"
                    }`}
                  >
                    {n.pct}%{isWarn && " (over limit)"}
                  </span>
                </div>
              </div>
            );
          })}

          <p className="text-muted text-xs pt-2 border-t border-border">
            Micronutrient data available for USDA-sourced foods only
          </p>
        </div>
      )}
    </div>
  );
}

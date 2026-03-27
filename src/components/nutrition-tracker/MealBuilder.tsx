"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { FoodEntry } from "./DailySummary";
import {
  RestaurantBuilder,
  BuilderCategory,
  BuilderIngredient,
  BuilderPreset,
  getRestaurantBuilder,
  calculateMealTotals,
} from "@/lib/restaurantBuilderData";

/* ── Types ────────────────────────────────────────────────── */

interface MealBuilderProps {
  restaurantId: string;
  meal: string;
  onAdd: (entry: FoodEntry) => void;
  onBack: () => void;
  initialHints?: Record<string, string[]>;
  editDetails?: { selections: Record<string, string[]>; sliceCount?: number };
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

/* ── Helpers ──────────────────────────────────────────────── */

/** Count how many times an item id appears in a quantity-type selection array */
function quantityOf(ids: string[] | undefined, itemId: string): number {
  if (!ids) return 0;
  return ids.filter((id) => id === itemId).length;
}

/** Build a human-readable meal name from selections */
function buildMealName(
  builder: RestaurantBuilder,
  selections: Record<string, string[]>,
  sliceCount: number,
): string {
  const lookup = new Map<string, BuilderIngredient>();
  for (const cat of builder.categories) {
    for (const item of cat.items) {
      lookup.set(item.id, item);
    }
  }

  // Find the "vessel" or "base" category (first radio/required, or first category)
  const vesselCat = builder.categories.find(
    (c) => c.type === "radio" && c.required,
  ) ?? builder.categories[0];
  const vesselIds = selections[vesselCat?.id ?? ""] ?? [];
  const vesselName = vesselIds.length > 0 ? lookup.get(vesselIds[0])?.name : undefined;

  // Gather key items (proteins first, then notable toppings), skip vessel/base
  const keyItems: string[] = [];
  for (const cat of builder.categories) {
    if (cat.id === vesselCat?.id) continue;
    const ids = selections[cat.id] ?? [];
    // Deduplicate for display while tracking doubles
    const seen = new Map<string, number>();
    for (const id of ids) {
      seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    for (const [id, count] of seen) {
      const item = lookup.get(id);
      if (!item) continue;
      const prefix = count > 1 ? "Double " : "";
      keyItems.push(`${prefix}${item.name}`);
    }
  }

  // Limit to 3 key items for readability
  const keyStr = keyItems.slice(0, 3).join(", ");

  if (builder.id === "pizza") {
    const sliceLabel = sliceCount === 1 ? "1 slice" : `${sliceCount} slices`;
    const toppings = keyItems.filter((k) => {
      // exclude size/base items
      const lc = k.toLowerCase();
      return !lc.includes("cheese pizza") && !lc.includes("plain");
    });
    const toppingStr = toppings.length > 0 ? ` \u2014 ${toppings.slice(0, 3).join(", ")}` : "";
    return `NYC Pizza (${sliceLabel})${toppingStr}`;
  }

  const parts: string[] = [builder.name];
  if (vesselName) parts.push(vesselName);
  const joined = parts.join(" ");
  return keyStr ? `${joined} \u2014 ${keyStr}` : joined;
}

function buildServingSize(builder: RestaurantBuilder, sliceCount: number): string {
  if (builder.id === "pizza") {
    return sliceCount === 1 ? "1 slice" : `${sliceCount} slices`;
  }
  if (builder.id === "subway") return "1 sub";
  return "1 bowl";
}

/* ── Component ────────────────────────────────────────────── */

export default function MealBuilder({
  restaurantId,
  meal,
  onAdd,
  onBack,
  initialHints,
  editDetails,
}: MealBuilderProps) {
  const builder = useMemo(() => getRestaurantBuilder(restaurantId), [restaurantId]);

  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    if (editDetails?.selections) return editDetails.selections;
    if (initialHints && Object.keys(initialHints).length > 0) return initialHints;
    // Initialize required radio categories with first item
    const init: Record<string, string[]> = {};
    if (builder) {
      for (const cat of builder.categories) {
        if (cat.type === "radio" && cat.required && cat.items.length > 0) {
          init[cat.id] = [cat.items[0].id];
        }
      }
    }
    return init;
  });

  const [sliceCount, setSliceCount] = useState<number>(
    editDetails?.sliceCount ?? 1,
  );

  // Apply initial hints on mount if provided and not editing
  useEffect(() => {
    if (initialHints && Object.keys(initialHints).length > 0 && !editDetails) {
      setSelections((prev) => {
        const merged = { ...prev };
        for (const [catId, items] of Object.entries(initialHints)) {
          if (items.length > 0) {
            merged[catId] = items;
          }
        }
        return merged;
      });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    if (!builder) return { cal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
    const raw = calculateMealTotals(builder, selections);
    if (builder.id === "pizza") {
      return {
        cal: raw.cal * sliceCount,
        protein: raw.protein * sliceCount,
        fat: raw.fat * sliceCount,
        carbs: raw.carbs * sliceCount,
        fiber: raw.fiber * sliceCount,
      };
    }
    return raw;
  }, [builder, selections, sliceCount]);

  /* ── Selection handlers ─────────────────────────────────── */

  const handleRadio = useCallback(
    (catId: string, itemId: string, required?: boolean) => {
      setSelections((prev) => {
        const current = prev[catId] ?? [];
        // If already selected and not required, deselect
        if (current.includes(itemId) && !required) {
          const next = { ...prev };
          delete next[catId];
          return next;
        }
        return { ...prev, [catId]: [itemId] };
      });
    },
    [],
  );

  const handleCheck = useCallback(
    (catId: string, itemId: string, max?: number) => {
      setSelections((prev) => {
        const current = prev[catId] ?? [];
        if (current.includes(itemId)) {
          // Remove
          const filtered = current.filter((id) => id !== itemId);
          return { ...prev, [catId]: filtered };
        }
        // Add (respect max)
        if (max && current.length >= max) return prev;
        return { ...prev, [catId]: [...current, itemId] };
      });
    },
    [],
  );

  const handleQuantity = useCallback((catId: string, itemId: string) => {
    setSelections((prev) => {
      const current = prev[catId] ?? [];
      const count = current.filter((id) => id === itemId).length;
      const others = current.filter((id) => id !== itemId);

      if (count === 0) {
        // Add 1
        return { ...prev, [catId]: [...others, itemId] };
      } else if (count === 1) {
        // Go to 2
        return { ...prev, [catId]: [...others, itemId, itemId] };
      } else {
        // Remove all (back to 0)
        return { ...prev, [catId]: others };
      }
    });
  }, []);

  const applyPreset = useCallback((preset: BuilderPreset) => {
    setSelections({ ...preset.selections });
  }, []);

  /* ── Add to log ─────────────────────────────────────────── */

  const handleAdd = useCallback(() => {
    if (!builder) return;

    const name = buildMealName(builder, selections, sliceCount);
    const entryId = `builder-${restaurantId}-${Date.now()}`;

    const entry: FoodEntry = {
      id: entryId,
      name,
      source: "custom",
      servings: builder.id === "pizza" ? sliceCount : 1,
      servingSize: buildServingSize(builder, sliceCount),
      calories: Math.round(totals.cal),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      fiber: Math.round(totals.fiber),
      timestamp: Date.now(),
      nycBadge: true,
      builderSource: restaurantId,
    };

    // Store builder details for re-editing
    try {
      localStorage.setItem(
        `pulsenyc_builder_details_${entryId}`,
        JSON.stringify({
          restaurantId,
          selections,
          sliceCount,
        }),
      );
    } catch {
      // localStorage may be unavailable
    }

    onAdd(entry);
  }, [builder, selections, sliceCount, totals, restaurantId, onAdd]);

  /* ── Render ─────────────────────────────────────────────── */

  if (!builder) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-dim">Restaurant not found.</p>
        <button
          onClick={onBack}
          className="rounded-xl bg-hp-green/10 px-4 py-2 text-sm font-semibold text-hp-green"
        >
          Go Back
        </button>
      </div>
    );
  }

  const hasSelections = Object.values(selections).some((arr) => arr.length > 0);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-36 sm:px-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-light bg-surface text-dim transition-colors hover:bg-hp-green/5"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={builder.name}>
            {builder.emoji}
          </span>
          <h2 className="font-display text-lg font-bold text-text">
            Build Your {builder.name} Order
          </h2>
        </div>
      </div>

      {/* Presets */}
      {builder.presets.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            Quick Presets
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {builder.presets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                color={builder.color}
                onApply={() => applyPreset(preset)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {builder.categories.map((cat) => (
        <CategorySection
          key={cat.id}
          category={cat}
          selections={selections[cat.id] ?? []}
          color={builder.color}
          onRadio={(itemId) => handleRadio(cat.id, itemId, cat.required)}
          onCheck={(itemId) => handleCheck(cat.id, itemId, cat.max)}
          onQuantity={(itemId) => handleQuantity(cat.id, itemId)}
        />
      ))}

      {/* Pizza slice count */}
      {builder.id === "pizza" && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            How Many Slices?
          </h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setSliceCount(n)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${
                  sliceCount === n
                    ? "border-hp-orange bg-hp-orange/10 text-hp-orange"
                    : "border-border-light bg-surface text-dim hover:border-hp-orange/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <p className="text-xs leading-relaxed text-muted">
        {builder.disclaimer}
      </p>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-light bg-surface/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          {/* Totals */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
            <span className="font-display text-lg font-bold text-text">
              {Math.round(totals.cal)}{" "}
              <span className="text-sm font-normal text-dim">cal</span>
            </span>
            <MacroPill label="P" value={Math.round(totals.protein)} unit="g" />
            <MacroPill label="C" value={Math.round(totals.carbs)} unit="g" />
            <MacroPill label="F" value={Math.round(totals.fat)} unit="g" />
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!hasSelections}
            className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-40"
            style={{
              backgroundColor: hasSelections ? builder.color : undefined,
            }}
          >
            Add to {MEAL_LABELS[meal] ?? "Log"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function MacroPill({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <span className="text-dim">
      <span className="font-semibold text-text">{label}</span>{" "}
      {value}
      {unit}
    </span>
  );
}

function PresetCard({
  preset,
  color,
  onApply,
}: {
  preset: BuilderPreset;
  color: string;
  onApply: () => void;
}) {
  return (
    <button
      onClick={onApply}
      className="group flex flex-col gap-1 rounded-2xl border border-border-light bg-surface p-3 text-left transition-all hover:shadow-md"
      style={{ borderColor: undefined }}
    >
      <div className="flex items-center gap-1.5">
        {preset.emoji && (
          <span className="text-base" role="img" aria-hidden>
            {preset.emoji}
          </span>
        )}
        <span className="text-sm font-bold text-text">{preset.name}</span>
      </div>
      <p className="line-clamp-2 text-xs leading-snug text-muted">
        {preset.description}
      </p>
      <div className="mt-auto flex items-baseline gap-2 pt-1 text-xs">
        <span className="font-bold" style={{ color }}>
          {preset.cal} cal
        </span>
        <span className="text-muted">P: {preset.protein}g</span>
      </div>
    </button>
  );
}

function CategorySection({
  category,
  selections,
  color,
  onRadio,
  onCheck,
  onQuantity,
}: {
  category: BuilderCategory;
  selections: string[];
  color: string;
  onRadio: (itemId: string) => void;
  onCheck: (itemId: string) => void;
  onQuantity: (itemId: string) => void;
}) {
  const typeHint =
    category.type === "quantity"
      ? " (tap for 1\u00D7, again for 2\u00D7)"
      : category.type === "check" && category.max
        ? ` (pick up to ${category.max})`
        : "";

  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        {category.label}
        {category.required && (
          <span className="ml-1 text-hp-red">*</span>
        )}
        {typeHint && (
          <span className="ml-1 font-normal normal-case tracking-normal text-muted/70">
            {typeHint}
          </span>
        )}
      </h3>
      <div className="flex flex-wrap gap-2">
        {category.items.map((item) => (
          <IngredientChip
            key={item.id}
            item={item}
            category={category}
            selected={selections.includes(item.id)}
            quantity={
              category.type === "quantity"
                ? quantityOf(selections, item.id)
                : undefined
            }
            color={color}
            onClick={() => {
              if (category.type === "radio") onRadio(item.id);
              else if (category.type === "check") onCheck(item.id);
              else onQuantity(item.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function IngredientChip({
  item,
  category,
  selected,
  quantity,
  color,
  onClick,
}: {
  item: BuilderIngredient;
  category: BuilderCategory;
  selected: boolean;
  quantity?: number;
  color: string;
  onClick: () => void;
}) {
  const isActive = category.type === "quantity" ? (quantity ?? 0) > 0 : selected;

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm transition-all ${
        isActive
          ? "bg-opacity-10 font-semibold shadow-sm"
          : "border-border-light bg-surface text-text hover:border-border-light/80"
      }`}
      style={
        isActive
          ? {
              borderColor: color,
              backgroundColor: `${color}15`,
              color,
            }
          : undefined
      }
    >
      {/* Radio indicator */}
      {category.type === "radio" && (
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
            isActive ? "" : "border-border-light"
          }`}
          style={isActive ? { borderColor: color } : undefined}
        >
          {isActive && (
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
        </span>
      )}

      {/* Check indicator */}
      {category.type === "check" && isActive && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}

      {/* Label + calories */}
      <span>{item.name}</span>
      <span className={`text-xs ${isActive ? "opacity-70" : "text-muted"}`}>
        {item.cal > 0 ? `${item.cal}cal` : "0cal"}
      </span>

      {/* Quantity badge */}
      {category.type === "quantity" && (quantity ?? 0) > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          \u00D7{quantity}
        </span>
      )}
    </button>
  );
}

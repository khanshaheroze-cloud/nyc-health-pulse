"use client";

import { useEffect, useRef } from "react";
import type { MealCategory } from "@/lib/inferMealType";

const MEALS: { id: MealCategory; emoji: string; label: string }[] = [
  { id: "breakfast", emoji: "🍳", label: "Breakfast" },
  { id: "lunch", emoji: "🥗", label: "Lunch" },
  { id: "coffee", emoji: "☕", label: "Coffee & Tea" },
  { id: "snack", emoji: "🍪", label: "Snack" },
  { id: "dinner", emoji: "🍽️", label: "Dinner" },
];

interface MealTypeToggleProps {
  active: MealCategory;
  onChange: (meal: MealCategory) => void;
}

export function MealTypeToggle({ active, onChange }: MealTypeToggleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-meal="${active}"]`);
    if (el) el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = MEALS.findIndex(m => m.id === active);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(MEALS[(idx + 1) % MEALS.length].id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(MEALS[(idx - 1 + MEALS.length) % MEALS.length].id);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="flex justify-center gap-1.5 mt-4 px-4 overflow-x-auto scrollbar-hide"
      role="tablist"
      aria-label="Meal type"
      onKeyDown={handleKeyDown}
    >
      {MEALS.map((meal) => {
        const isActive = meal.id === active;
        return (
          <button
            key={meal.id}
            data-meal={meal.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(meal.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] border transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${
              isActive
                ? "bg-[#2F8F4D] text-white border-[#2F8F4D]"
                : "bg-white text-[#1A1A1A] border-[#E6E5DE] hover:border-[#C8C8C0]"
            }`}
          >
            <span>{meal.emoji}</span>
            <span>{meal.label}</span>
          </button>
        );
      })}
    </div>
  );
}

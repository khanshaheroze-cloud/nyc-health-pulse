"use client";

import { useRef, useEffect } from "react";
import type { MenuCategoryId } from "@/lib/eat-smart/types";
import { CATEGORY_LABELS } from "@/lib/eat-smart/types";

interface CategoryPillsProps {
  categories: MenuCategoryId[];
  active: "all" | MenuCategoryId;
  onSelect: (cat: "all" | MenuCategoryId) => void;
}

export function CategoryPills({ categories, active, onSelect }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active pill into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-active=true]");
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
    >
      <button
        data-active={active === "all"}
        onClick={() => onSelect("all")}
        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
          active === "all"
            ? "bg-hp-green text-white"
            : "bg-surface-warm text-dim hover:text-text"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          data-active={active === cat}
          onClick={() => onSelect(cat)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap ${
            active === cat
              ? "bg-hp-green text-white"
              : "bg-surface-warm text-dim hover:text-text"
          }`}
        >
          {CATEGORY_LABELS[cat] ?? cat}
        </button>
      ))}
    </div>
  );
}

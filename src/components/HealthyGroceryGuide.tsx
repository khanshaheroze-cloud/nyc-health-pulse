"use client";

import { useState } from "react";
import { healthyByCategory, type HealthyItem } from "@/lib/groceryData";

const CATEGORIES = ["Protein", "Produce", "Grains", "Dairy", "Pantry"] as const;

function ItemCard({ item, expanded, onToggle }: { item: HealthyItem; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-bg/50 transition-colors text-left"
      >
        <span className="text-lg">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-text">{item.name}</p>
          <p className="text-[9px] text-dim truncate">{item.why.split(".")[0]}</p>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`text-dim transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5 L6 7.5 L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border">
          <p className="text-[11px] text-text mt-2 leading-relaxed">{item.why}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {item.nutrients.map((n) => (
              <span key={n} className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-hp-green/10 text-hp-green">
                {n}
              </span>
            ))}
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1.5">
              <span className="text-[9px] mt-0.5">💡</span>
              <p className="text-[10px] text-dim">{item.servingTip}</p>
            </div>
            <div className="flex gap-1.5">
              <span className="text-[9px] mt-0.5">💲</span>
              <p className="text-[10px] text-dim">{item.budgetTip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HealthyGroceryGuide() {
  const [activeCategory, setActiveCategory] = useState<string>("Protein");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const items = healthyByCategory[activeCategory] ?? [];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🥗</span>
        <div>
          <h3 className="text-[13px] font-bold text-text">Healthy Grocery Guide</h3>
          <p className="text-[10px] text-muted">Budget-friendly picks based on USDA dietary guidelines</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setExpandedItem(null); }}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 ${
              activeCategory === cat
                ? "bg-hp-green/10 text-hp-green border-hp-green/20"
                : "text-dim border-border hover:text-text hover:bg-bg"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <ItemCard
            key={item.name}
            item={item}
            expanded={expandedItem === item.name}
            onToggle={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
          />
        ))}
      </div>

      <p className="text-[9px] text-muted mt-3 text-center">
        Based on USDA Dietary Guidelines for Americans · Prices reflect NYC-area averages
      </p>
    </div>
  );
}

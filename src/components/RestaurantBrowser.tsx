"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CHAINS, CATEGORIES, DIET_FILTERS } from "@/lib/restaurantData";
import type { RestaurantChain } from "@/lib/restaurantData";

export function RestaurantBrowser() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDiets, setActiveDiets] = useState<Set<string>>(new Set());
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());

  const toggleDiet = (diet: string) => {
    setActiveDiets((prev) => {
      const next = new Set(prev);
      if (next.has(diet)) next.delete(diet);
      else next.add(diet);
      return next;
    });
  };

  const toggleTip = (slug: string) => {
    setExpandedTips((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const resetFilters = () => {
    setQuery("");
    setActiveCategory("All");
    setActiveDiets(new Set());
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    return CHAINS.map((chain) => {
      // Category filter
      if (activeCategory !== "All" && chain.category !== activeCategory) return null;

      // Search filter: match chain name or any item name
      const nameMatch = !q || chain.name.toLowerCase().includes(q);
      const itemMatches = chain.items.filter((item) =>
        !q || item.name.toLowerCase().includes(q) || nameMatch
      );

      if (!nameMatch && itemMatches.length === 0) return null;

      // Diet filter: keep only items matching ALL active diets
      let dietFiltered = itemMatches;
      if (activeDiets.size > 0) {
        dietFiltered = itemMatches.filter((item) =>
          [...activeDiets].every((diet) => item.tags?.includes(diet))
        );
      }

      if (dietFiltered.length === 0) return null;

      return { chain, matchingItems: dietFiltered };
    }).filter(Boolean) as { chain: RestaurantChain; matchingItems: RestaurantChain["items"] }[];
  }, [query, activeCategory, activeDiets]);

  const totalItems = filtered.reduce((sum, r) => sum + r.matchingItems.length, 0);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chains or menu items..."
          className="w-full pl-11 pr-4 py-2.5 rounded-full bg-surface border border-border text-sm text-text placeholder:text-muted focus-ring"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn-press whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeCategory === cat
                ? "bg-hp-green/10 text-hp-green border-hp-green/20"
                : "bg-surface text-dim border-border hover:border-hp-green/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Diet filter chips */}
      {DIET_FILTERS.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {DIET_FILTERS.map((df) => (
            <button
              key={df.id}
              onClick={() => toggleDiet(df.id)}
              className={`btn-press whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeDiets.has(df.id)
                  ? "bg-hp-green/10 text-hp-green border-hp-green/20"
                  : "bg-surface text-dim border-border hover:border-hp-green/30"
              }`}
            >
              {df.emoji} {df.label}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-dim">
        Showing <span className="font-semibold text-text">{filtered.length}</span> chains
        {" · "}
        <span className="font-semibold text-text">{totalItems}</span> items
      </p>

      {/* Results grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(({ chain, matchingItems }, i) => {
            const lowestCal = [...matchingItems]
              .sort((a, b) => a.cal - b.cal)
              .slice(0, 3);

            return (
              <div
                key={chain.slug}
                className="card-hover bg-surface border border-border rounded-xl p-4 flex flex-col animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{chain.emoji}</span>
                    <h3 className="font-semibold text-sm text-text truncate">{chain.name}</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-hp-blue/10 text-hp-blue whitespace-nowrap shrink-0">
                    {chain.category}
                  </span>
                </div>

                {/* Meta line */}
                <p className="text-[11px] text-dim mb-3">
                  {matchingItems.length} items · {chain.nycLocations} NYC locations · {"$".repeat(chain.priceRange)}
                </p>

                {/* Top 3 lowest-cal items */}
                <div className="space-y-1 mb-3 flex-1">
                  <p className="text-[10px] font-medium text-muted uppercase tracking-wide">Lowest Cal</p>
                  {lowestCal.map((item) => (
                    <p key={item.name} className="text-xs text-dim truncate">
                      <span className="text-text">{item.name}</span>
                      {" — "}
                      <span className="text-hp-orange">{item.cal} cal</span>
                      {item.protein != null && (
                        <span className="text-hp-blue">, {item.protein}g protein</span>
                      )}
                    </p>
                  ))}
                </div>

                {/* Ordering tip */}
                {chain.orderingTip && (
                  <div className="mb-3">
                    <button
                      onClick={() => toggleTip(chain.slug)}
                      className="btn-press text-[11px] text-hp-green font-medium flex items-center gap-1"
                    >
                      <span className={`transition-transform ${expandedTips.has(chain.slug) ? "rotate-90" : ""}`}>
                        ▶
                      </span>
                      Ordering Tip
                    </button>
                    {expandedTips.has(chain.slug) && (
                      <p className="text-[11px] text-dim mt-1 pl-4 leading-relaxed">
                        {chain.orderingTip}
                      </p>
                    )}
                  </div>
                )}

                {/* View menu link */}
                <Link
                  href={`/restaurants/${chain.slug}`}
                  className="btn-press text-xs font-medium text-hp-green hover:text-hp-green/80 transition-colors mt-auto"
                >
                  View Full Menu →
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-sm font-medium text-text mb-1">No restaurants match your filters</p>
          <p className="text-xs text-dim mb-4">Try adjusting your search or filters</p>
          <button
            onClick={resetFilters}
            className="btn-press px-4 py-2 rounded-full bg-hp-green text-white text-xs font-medium hover:bg-hp-green/90 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

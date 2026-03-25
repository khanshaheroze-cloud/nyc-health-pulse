import type { Metadata } from "next";
import { RESTAURANT_STATS } from "@/lib/restaurantData";
import { SectionShell } from "@/components/SectionShell";
import { RestaurantBrowser } from "@/components/RestaurantBrowser";

export const metadata: Metadata = {
  title: "Restaurant Nutrition Guide",
  description: `Browse ${RESTAURANT_STATS.totalItems}+ menu items from ${RESTAURANT_STATS.totalChains} NYC restaurant chains with full calorie and macro breakdowns.`,
};

export default function RestaurantsPage() {
  return (
    <SectionShell
      icon="🍽️"
      title="NYC Restaurant Nutrition Guide"
      description={`${RESTAURANT_STATS.totalChains} chains · ${RESTAURANT_STATS.totalItems}+ items · ${RESTAURANT_STATS.totalNycLocations.toLocaleString()}+ NYC locations`}
    >
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="font-display font-bold text-xl text-hp-green">{RESTAURANT_STATS.totalChains}</p>
          <p className="text-[11px] text-dim">Chains</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="font-display font-bold text-xl text-hp-blue">{RESTAURANT_STATS.totalItems}+</p>
          <p className="text-[11px] text-dim">Menu Items</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="font-display font-bold text-xl text-hp-purple">{RESTAURANT_STATS.totalNycLocations.toLocaleString()}+</p>
          <p className="text-[11px] text-dim">NYC Locations</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="font-display font-bold text-xl text-hp-orange">{RESTAURANT_STATS.avgCalories}</p>
          <p className="text-[11px] text-dim">Avg Calories</p>
        </div>
      </div>

      <RestaurantBrowser />
    </SectionShell>
  );
}

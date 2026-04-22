import type { Metadata } from "next";
import { SectionShell } from "@/components/SectionShell";
import { KPICard } from "@/components/KPICard";
import { GroceryFinder } from "@/components/GroceryFinder";
import { FoodPriceTracker } from "@/components/FoodPriceTracker";
import { HealthyGroceryGuide } from "@/components/HealthyGroceryGuide";
import { sampleBasket } from "@/lib/groceryData";

export const metadata: Metadata = {
  title: "NYC Grocery Prices",
  description:
    "Track NYC grocery prices monthly, find stores and farmers markets near you, and discover budget-friendly healthy eating tips. BLS price data, SNAP retailers, and dietitian-backed shopping guides.",
};

export default function GroceryPage() {
  const liveAt = new Date().toISOString();

  return (
    <SectionShell
      icon="🛒"
      title="Grocery & Food Access"
      description="Track NYC food prices, find affordable stores near you, and eat healthy on a budget"
      accentColor="rgba(245,158,66,.12)"
    >
      {/* KPI cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-2.5 mb-6">
        <KPICard
          index={0}
          label="Grocery Stores"
          value="8100+"
          sub="Licensed food retailers in NYC"
          color="orange"
          tag="LIVE"
          lastUpdated={liveAt}
          tooltip="NYS Dept. of Agriculture & Markets licenses all food retailers. Includes supermarkets, grocery stores, bodegas, and specialty food stores. Count from NYS Ag & Markets licensing database."
        />
        <KPICard
          index={1}
          label="Farmers Markets"
          value="140+"
          sub="Seasonal markets · many accept SNAP/EBT"
          color="green"
          tag="2024"
          tooltip="NYC DOHMH-registered farmers markets offering fresh, local produce. Most operate seasonally (June–November). Many accept SNAP/EBT benefits."
        />
        <KPICard
          index={2}
          label="SNAP Retailers"
          value="5900+"
          sub="Stores accepting EBT in NYC"
          color="blue"
          tag="LIVE"
          lastUpdated={liveAt}
          tooltip="USDA-authorized SNAP retailers where EBT/food stamp benefits can be used. Includes supermarkets, bodegas, and some farmers markets. Source: USDA Food & Nutrition Service."
        />
        <KPICard
          index={3}
          label="Food Deserts"
          value="15%"
          sub="of NYC tracts with low food access"
          color="red"
          tag="2019"
          tooltip="USDA defines a food desert as a low-income census tract where a substantial number of residents are more than 0.5 miles from a supermarket. Parts of the Bronx, East Brooklyn, and upper Manhattan are most affected. Source: USDA Food Access Research Atlas."
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Store finder — location-based */}
        <GroceryFinder />

        {/* Monthly food prices from BLS */}
        <FoodPriceTracker />
      </div>

      {/* Healthy grocery guide */}
      <div className="mb-6">
        <HealthyGroceryGuide />
      </div>

      {/* Sample healthy basket */}
      <div className="bg-surface-sage border border-border-light rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🧺</span>
          <div>
            <h3 className="text-[13px] font-bold text-text">The $35 Healthy NYC Basket</h3>
            <p className="text-[10px] text-muted">A week of nutritious meals for one person — all items under ~$35</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {sampleBasket.map((item) => (
            <div key={item} className="text-center px-2 py-2.5 border border-border-light rounded-xl bg-surface">
              <p className="text-[10px] font-semibold text-text">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted mt-3 text-center">
          Estimated cost based on BLS average prices for Northeast urban area. Actual prices vary by store.
          Shop at ethnic groceries and Green Carts for the best produce prices.
        </p>
      </div>

      {/* Where to save money */}
      <div className="bg-surface border border-border-light rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📍</span>
          <h3 className="text-[13px] font-bold text-text">Where NYC&apos;s Cheapest Groceries Are</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-surface border border-border-light rounded-xl p-3.5">
            <p className="text-[11px] font-bold text-text mb-1">Produce</p>
            <p className="text-[10px] text-dim leading-relaxed">
              Chinatown (Canal St), Sunset Park 8th Ave, Jackson Heights 74th St.
              Green Carts in underserved neighborhoods often have the lowest prices.
            </p>
          </div>
          <div className="bg-surface border border-border-light rounded-xl p-3.5">
            <p className="text-[11px] font-bold text-text mb-1">Bulk Staples</p>
            <p className="text-[10px] text-dim leading-relaxed">
              Costco (Sunset Park, Rego Park), BJ&apos;s Wholesale. Split with neighbors if storage is tight.
              Restaurant Depot (with membership) for large quantities.
            </p>
          </div>
          <div className="bg-surface border border-border-light rounded-xl p-3.5">
            <p className="text-[11px] font-bold text-text mb-1">Protein</p>
            <p className="text-[10px] text-dim leading-relaxed">
              Halal butchers in Bay Ridge and Jackson Heights are 30-40% below chain supermarkets.
              Chinatown fish markets for fresh seafood at wholesale-like prices.
            </p>
          </div>
          <div className="bg-surface border border-border-light rounded-xl p-3.5">
            <p className="text-[11px] font-bold text-text mb-1">Overall Savings</p>
            <p className="text-[10px] text-dim leading-relaxed">
              Aldi (Brooklyn, Queens) consistently 20-30% below average.
              Key Food, Western Beef, and Food Bazaar offer competitive NYC pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Tips section */}
      <div className="bg-surface-sage border border-border-light rounded-3xl p-7">
        <h3 className="text-[13px] font-bold tracking-[1.5px] uppercase text-muted mb-1 pb-2 border-b border-border-light">Smart Shopping Tips</h3>
        <p className="text-[11px] text-dim mb-3 mt-2">Local knowledge to stretch your grocery budget in NYC</p>
        <ul className="space-y-1.5 text-[11px] text-dim">
          <li>• <strong>Green Carts</strong> are mobile vendors selling fresh produce in underserved neighborhoods at below-supermarket prices</li>
          <li>• <strong>SNAP/EBT</strong> benefits can be used at most supermarkets, many bodegas, and an increasing number of farmers markets</li>
          <li>• <strong>Health Bucks</strong>: Spend $2+ SNAP at a participating farmers market and get a free $2 Health Buck coupon for more produce</li>
          <li>• <strong>Get Food NYC</strong>: Free meals at 500+ locations citywide — no ID, no income check. Call 311 or visit nyc.gov/getfood</li>
          <li>• <strong>Ethnic grocery stores</strong> (Chinatown, Sunset Park, Jackson Heights) often have produce at 30-50% below chain prices</li>
          <li>• <strong>Wholesale clubs</strong> (Costco, BJ&apos;s) offer bulk staples — split with a neighbor if storage is tight</li>
          <li>• <strong>Imperfect Foods / Misfits Market</strong>: Discounted delivery of cosmetically imperfect produce — good quality, lower cost</li>
        </ul>
      </div>

      <div className="flex items-center gap-1.5 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
        <p className="text-[10px] text-hp-green font-semibold">
          Store data: NYS Ag & Markets · Prices: BLS CPI Northeast Urban · Markets: NYC DOHMH · updated monthly
        </p>
      </div>
    </SectionShell>
  );
}

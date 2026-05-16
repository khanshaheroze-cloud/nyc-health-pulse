import type { MenuItem, RestaurantMenu } from "./types";
import { resolveVenueCategory, type VenueCategory } from "./venue-category";

type SlotKind = "drink" | "food";
type Tier = "great" | "decent" | "better-than-rest";
type Slot = { kind: SlotKind; tier: Tier };

const SLOTS_BY_CATEGORY: Record<VenueCategory, Slot[]> = {
  cafe: [
    { kind: "drink", tier: "great" },
    { kind: "drink", tier: "decent" },
    { kind: "drink", tier: "better-than-rest" },
    { kind: "food", tier: "great" },
    { kind: "food", tier: "decent" },
  ],
  restaurant: [
    { kind: "food", tier: "great" },
    { kind: "food", tier: "great" },
    { kind: "food", tier: "great" },
    { kind: "food", tier: "decent" },
    { kind: "food", tier: "better-than-rest" },
  ],
  bar: [
    { kind: "drink", tier: "great" },
    { kind: "drink", tier: "great" },
    { kind: "drink", tier: "decent" },
    { kind: "drink", tier: "decent" },
    { kind: "drink", tier: "better-than-rest" },
  ],
  bodega: [
    { kind: "food", tier: "great" },
    { kind: "food", tier: "great" },
    { kind: "food", tier: "decent" },
    { kind: "food", tier: "better-than-rest" },
    { kind: "drink", tier: "decent" },
  ],
  fastfood: [
    { kind: "food", tier: "great" },
    { kind: "food", tier: "great" },
    { kind: "food", tier: "decent" },
    { kind: "food", tier: "better-than-rest" },
    { kind: "drink", tier: "decent" },
  ],
};

function isPlainWater(item: MenuItem): boolean {
  const n = item.name.toLowerCase();
  return /^(bottled |spring |filtered )?water$|^aquafina|^dasani|^smartwater|^evian|^poland spring/.test(n);
}

function bucketByTier(items: MenuItem[]): Record<Tier, MenuItem[]> {
  if (items.length === 0) return { great: [], decent: [], "better-than-rest": [] };
  const sorted = [...items].sort((a, b) => {
    const aScore = a.isDrink ? (a.drinkScore ?? a.pulseScore) : a.pulseScore;
    const bScore = b.isDrink ? (b.drinkScore ?? b.pulseScore) : b.pulseScore;
    return bScore - aScore;
  });
  const third = Math.ceil(sorted.length / 3);
  return {
    great: sorted.slice(0, third),
    decent: sorted.slice(third, third * 2),
    "better-than-rest": sorted.slice(third * 2),
  };
}

export function selectTop5Picks(menu: RestaurantMenu): MenuItem[] {
  const category = resolveVenueCategory(menu);
  const slots = SLOTS_BY_CATEGORY[category];

  const activeItems = menu.items.filter((i) => i.availabilityStatus !== "discontinued");

  const drinks = activeItems
    .filter((i) => i.isDrink && !isPlainWater(i))
    .sort((a, b) => (b.drinkScore ?? b.pulseScore) - (a.drinkScore ?? a.pulseScore));

  const foods = activeItems
    .filter((i) => !i.isDrink)
    .sort((a, b) => b.pulseScore - a.pulseScore);

  // Bars: only low-cal, low-sugar drinks
  const drinkPool =
    category === "bar"
      ? drinks.filter((d) => d.calories <= 200 && (d.sugar ?? 0) <= 8)
      : drinks;

  const drinkTiers = bucketByTier(drinkPool);
  const foodTiers = bucketByTier(foods);

  const picked: MenuItem[] = [];
  const used = new Set<string>();

  for (const slot of slots) {
    const tierPool = slot.kind === "drink" ? drinkTiers[slot.tier] : foodTiers[slot.tier];
    let item = tierPool.find((i) => !used.has(i.id));

    if (!item) {
      const fallbackPool = slot.kind === "drink" ? drinkPool : foods;
      item = fallbackPool.find((i) => !used.has(i.id));
    }

    // Cross-kind fallback if one pool is empty
    if (!item) {
      const otherPool = slot.kind === "drink" ? foods : drinkPool;
      item = otherPool.find((i) => !used.has(i.id));
    }

    if (item) {
      picked.push(item);
      used.add(item.id);
    }
  }

  // Restaurant override: if a standout drink (score >= 85) exists, swap it in for the last slot
  if (category === "restaurant" && picked.length === 5) {
    const star = drinks.find((d) => (d.drinkScore ?? d.pulseScore) >= 85 && !used.has(d.id));
    if (star) picked[4] = star;
  }

  return picked.slice(0, 5);
}

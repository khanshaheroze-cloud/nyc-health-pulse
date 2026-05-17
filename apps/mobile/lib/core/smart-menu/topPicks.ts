import type { MenuItem, RestaurantMenu } from "./types";

export type Tier = "great" | "decent" | "better-than-rest";
export type VenueCategory = "cafe" | "restaurant" | "bar" | "bodega" | "fastfood";

export const TIER_LABELS: Record<Tier, string> = {
  great: "Best Pick",
  decent: "Smart Choice",
  "better-than-rest": "Better Than Most",
};

export function rankedTierLabel(tier: Tier, rank: number): string {
  if (tier === "great") {
    if (rank === 0) return "#1 Best Pick";
    if (rank === 1) return "#2 Strong Pick";
    return "#3 Solid Pick";
  }
  return TIER_LABELS[tier];
}

export const TIER_COLORS: Record<Tier, { bg: string; fg: string }> = {
  great: { bg: "#d1fae5", fg: "#065f46" },
  decent: { bg: "#e0f2fe", fg: "#0c4a6e" },
  "better-than-rest": { bg: "#fef3c7", fg: "#92400e" },
};

export interface TopPick extends MenuItem {
  whyLine: string;
  tier?: Tier;
}

function generateWhyLine(item: MenuItem): string {
  const parts: string[] = [];

  if (item.protein >= 30) parts.push("High protein");
  else if (item.protein >= 20) parts.push("Good protein");

  if (item.calories <= 400) parts.push("low cal");
  else if (item.calories <= 550) parts.push("moderate cal");

  if (item.fiber != null && item.fiber >= 6) parts.push("high fiber");

  if (item.sodium != null && item.sodium <= 600) parts.push("low sodium");

  if (item.fat != null && item.fat <= 12) parts.push("low fat");

  if (parts.length === 0) parts.push("Balanced macros");

  return parts.slice(0, 3).join(", ");
}

export function getTopPicks(menu: RestaurantMenu, count = 3): TopPick[] {
  const food = menu.items.filter((i) => !i.isDrink);

  const sorted = [...food].sort((a, b) => {
    if (a.isBestPick && !b.isBestPick) return -1;
    if (!a.isBestPick && b.isBestPick) return 1;
    return b.pulseScore - a.pulseScore;
  });

  return sorted.slice(0, count).map((item) => ({
    ...item,
    whyLine: generateWhyLine(item),
  }));
}

/* ── Venue-aware Top 5 ── */

const CAFE_SLUGS = new Set([
  "starbucks", "dunkin", "blue-bottle", "joe-coffee", "gregorys",
  "pret", "birch-coffee", "think-coffee", "la-colombe",
  "cafe-grumpy", "blank-street", "devocion", "cha-cha-matcha",
]);

const CAFE_RE = /coffee|caf[eé]|espresso|bakery|roaster|tea house/i;
const BAR_RE = /\bbar\b|cocktail|wine bar|pub|taproom|brewery/i;
const BODEGA_RE = /bodega|deli|convenience|grocery|corner store/i;

export function resolveVenueCategory(menu: RestaurantMenu): VenueCategory {
  if (CAFE_SLUGS.has(menu.restaurantId)) return "cafe";
  if (menu.restaurantType === "cafe") return "cafe";
  if (CAFE_RE.test(menu.cuisine)) return "cafe";
  if (BAR_RE.test(menu.cuisine)) return "bar";
  if (BODEGA_RE.test(menu.cuisine)) return "bodega";
  if (menu.restaurantType === "deli") return "bodega";
  const drinkRatio = menu.items.filter((i) => i.isDrink).length / Math.max(1, menu.items.length);
  if (drinkRatio > 0.6) return "cafe";
  if (menu.restaurantType === "fast-food") return "fastfood";
  return "restaurant";
}

type SlotKind = "drink" | "food";
type Slot = { kind: SlotKind; tier: Tier };

const SLOTS: Record<VenueCategory, Slot[]> = {
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
  return /^(bottled |spring |filtered )?water$|^aquafina|^dasani|^smartwater|^evian|^poland spring/i.test(item.name);
}

function bucketByTier(items: MenuItem[]): Record<Tier, MenuItem[]> {
  if (items.length === 0) return { great: [], decent: [], "better-than-rest": [] };
  const sorted = [...items].sort((a, b) => {
    const aS = a.isDrink ? (a.drinkScore ?? a.pulseScore) : a.pulseScore;
    const bS = b.isDrink ? (b.drinkScore ?? b.pulseScore) : b.pulseScore;
    return bS - aS;
  });
  const t = Math.ceil(sorted.length / 3);
  return {
    great: sorted.slice(0, t),
    decent: sorted.slice(t, t * 2),
    "better-than-rest": sorted.slice(t * 2),
  };
}

export function selectTop5Picks(menu: RestaurantMenu): TopPick[] {
  const category = resolveVenueCategory(menu);
  const slots = SLOTS[category];
  const active = menu.items.filter((i) => i.availabilityStatus !== "discontinued");

  const drinks = active
    .filter((i) => i.isDrink && !isPlainWater(i))
    .sort((a, b) => (b.drinkScore ?? b.pulseScore) - (a.drinkScore ?? a.pulseScore));
  const foods = active.filter((i) => !i.isDrink).sort((a, b) => b.pulseScore - a.pulseScore);

  const drinkPool = category === "bar"
    ? drinks.filter((d) => d.calories <= 200 && (d.sugar ?? 0) <= 8)
    : drinks;

  const drinkTiers = bucketByTier(drinkPool);
  const foodTiers = bucketByTier(foods);

  const picked: TopPick[] = [];
  const used = new Set<string>();

  for (const slot of slots) {
    const tierPool = slot.kind === "drink" ? drinkTiers[slot.tier] : foodTiers[slot.tier];
    let item = tierPool.find((i) => !used.has(i.id));
    if (!item) {
      const fallback = slot.kind === "drink" ? drinkPool : foods;
      item = fallback.find((i) => !used.has(i.id));
    }
    if (!item) {
      const other = slot.kind === "drink" ? foods : drinkPool;
      item = other.find((i) => !used.has(i.id));
    }
    if (item) {
      picked.push({ ...item, whyLine: generateWhyLine(item), tier: slot.tier });
      used.add(item.id);
    }
  }

  if (category === "restaurant" && picked.length === 5) {
    const star = drinks.find((d) => (d.drinkScore ?? d.pulseScore) >= 85 && !used.has(d.id));
    if (star) picked[4] = { ...star, whyLine: generateWhyLine(star), tier: "great" };
  }

  return picked.slice(0, 5);
}

export function avgPulseScore(menu: RestaurantMenu): number {
  const food = menu.items.filter((i) => !i.isDrink && i.pulseScore > 0);
  if (food.length === 0) return 0;
  return Math.round(food.reduce((s, i) => s + i.pulseScore, 0) / food.length);
}

export function letterGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  return "D";
}

export function goalContext(score: number): string {
  if (score >= 80) return "Great for cutting";
  if (score >= 65) return "Good options for cutting";
  if (score >= 50) return "Moderate — choose carefully";
  return "Limited healthy options";
}

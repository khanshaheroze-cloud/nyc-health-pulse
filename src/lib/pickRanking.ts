// ─── Pick ordering policy ─────────────────────────────────────────────────────
// July 5 evening audit (P0): topPicks[0] is the product's headline ("Order: …"),
// but venues were leading with whatever the seed rotation or strictness bonus
// put first — Woodbines headlined "Pasta with Marinara" (45) over "Roast
// Chicken Dinner" (80), Tamashii led with Edamame (a side). The stated promise
// is "ranked by PulseScore", so:
//   1. every venue's topPicks are sorted by PulseScore descending;
//   2. for breakfast/lunch/dinner the headline must be a MEAL — ≥200 cal and
//      not a side/drink/condiment (extends the round-2 "no 5-cal cold brew
//      headline" rule to sides);
//   3. ranked cards respect a 600-cal display target: over-600 items only
//      appear when a brand has nothing under 600, and then they say so.
// If no coherent meal exists for the tab, the venue gets NO picks — the card
// falls back to ordering guidance and (round 5) cannot occupy a ranked slot.

import type { MealCategory } from "@/lib/inferMealType";

export type ItemType = "meal" | "side" | "drink" | "condiment";

// Broader than the route's BEVERAGE_RE on purpose: this classifies for the
// headline rule, where "is this order a drink?" includes juices and sodas.
const DRINK_RE =
  /\b(latte|cappuccino|espresso|americano|matcha|cold.?brew|drip coffee|chai|macchiato|mocha|frappuccino|refresher|hot.?chocolate|hot.?cocoa|smoothie|juice|soda|lemonade|iced.?tea|tea)\b/i;

// Named sides — dishes that accompany a meal rather than being one. Edamame
// and miso soup may appear in a pick list, but never as the headline order.
const SIDE_RE =
  /\b(edamame|miso soup|side salad|garden salad|house salad|garden side|side of|breadstick|raita|coleslaw|cole slaw|slaw|fries|onion rings|hash brown|fruit cup|apple slices|garlic knot|mozzarella stick|chips)\b/i;

const CONDIMENT_RE = /\b(dipping sauce|dressing \(|extra sauce|condiment)\b/i;

export function classifyItemType(name: string): ItemType {
  if (DRINK_RE.test(name)) return "drink";
  if (CONDIMENT_RE.test(name)) return "condiment";
  if (SIDE_RE.test(name)) return "side";
  return "meal";
}

export interface RankablePick {
  name: string;
  calories: number;
  pulseScore: number;
  /** Set by applyCalDisplayRule when a brand has nothing under the target */
  overCalTarget?: boolean;
}

/** Ranked-card calorie display target. Items above it never show in a ranked
 *  card unless the brand has nothing under it (then they carry the label). */
export const CAL_DISPLAY_TARGET = 600;

const MAIN_MEALS = new Set<MealCategory>(["breakfast", "lunch", "dinner"]);

/** Can this pick be a card's headline ("Order: …") for the given meal tab?
 *  Calories of 0 mean "unknown" (verified menus without macros) — allowed. */
export function headlineEligible(pick: { name: string; calories: number }, meal: MealCategory): boolean {
  if (!MAIN_MEALS.has(meal)) return true;
  if (classifyItemType(pick.name) !== "meal") return false;
  return pick.calories === 0 || pick.calories >= 200;
}

/** Enforce the 600-cal display target on a ranked card's candidate picks:
 *  drop over-target items when anything under target exists; otherwise keep
 *  them but mark each so the UI labels "over the 600-cal target". */
export function applyCalDisplayRule<T extends RankablePick>(picks: T[]): T[] {
  const under = picks.filter((p) => p.calories <= CAL_DISPLAY_TARGET);
  if (under.length > 0) return under;
  return picks.map((p) => ({ ...p, overCalTarget: true }));
}

/** Order a venue's picks for a ranked card: PulseScore descending, and for
 *  breakfast/lunch/dinner headline-eligible MEALS come before sides/drinks.
 *  Returns [] when no coherent meal exists for a main-meal tab — the venue
 *  then renders ordering guidance and cannot rank. */
export function orderPicks<T extends RankablePick>(picks: T[], meal: MealCategory): T[] {
  const sorted = [...picks].sort((a, b) => b.pulseScore - a.pulseScore);
  if (!MAIN_MEALS.has(meal)) return sorted;
  const meals = sorted.filter((p) => headlineEligible(p, meal));
  if (meals.length === 0) return [];
  const rest = sorted.filter((p) => !meals.includes(p));
  return [...meals, ...rest];
}

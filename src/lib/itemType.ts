// Classify a menu item as meal | side | drink | condiment so "what can I order
// here" lists don't lead with Cane's Sauce, a Side of Queso, or Green Beans.
// Name-based heuristic (the pragmatic seed for ~560 curated items); an explicit
// `itemType` on the item always wins when present.

export type ItemType = "meal" | "side" | "drink" | "condiment";

const CONDIMENT_RE = /\b(sauce|dressing|dip|aioli|mayo|ketchup|mustard|salsa|guacamole|queso(?!\s*(bowl|burrito))|crema|ranch|vinaigrette|syrup|honey mustard|bbq|butter|jam|jelly|spread|drizzle)\b/i;
const DRINK_RE = /\b(coffee|latte|cappuccino|espresso|americano|matcha|cold.?brew|chai|macchiato|mocha|frappuccino|refresher|hot.?chocolate|hot.?cocoa|tea|lemonade|soda|juice|smoothie|shake|milk|water|kombucha|agua fresca|horchata)\b/i;
const SIDE_RE = /\b(side|fries|chips|green beans|coleslaw|slaw|biscuit|cornbread|mac (and|&) cheese|mashed potatoes|side salad|breadstick|garlic bread|rice$|beans$|pita|naan|hash browns?|tots|onion rings|apple slices|fruit cup)\b/i;

export interface HasName {
  name: string;
  itemType?: ItemType;
}

export function classifyItemType(item: HasName): ItemType {
  if (item.itemType) return item.itemType;
  const n = item.name;
  if (CONDIMENT_RE.test(n)) return "condiment";
  if (DRINK_RE.test(n)) return "drink";
  if (SIDE_RE.test(n)) return "side";
  return "meal";
}

/** A "meal-ish" item worth headlining a venue: real meals, plus sides that are
 *  substantial enough (≥100 cal) to answer "what can I order". Excludes
 *  condiments and drinks entirely, and tiny sides under ~100 cal. */
export function isHeadlineItem(item: HasName & { cal?: number; calories?: number }): boolean {
  const type = classifyItemType(item);
  if (type === "condiment" || type === "drink") return false;
  const cal = item.cal ?? item.calories ?? 0;
  if (type === "side" && cal < 100) return false;
  return true;
}

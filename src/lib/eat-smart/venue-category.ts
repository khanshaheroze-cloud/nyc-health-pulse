import type { RestaurantMenu } from "./types";

export type VenueCategory = "cafe" | "restaurant" | "bar" | "bodega" | "fastfood";

const CAFE_SLUGS = new Set([
  "starbucks", "dunkin", "blue-bottle", "joe-coffee", "gregorys",
  "pret", "birch-coffee", "think-coffee", "la-colombe", "gregorys-coffee",
  "cafe-grumpy", "blank-street", "devocion", "cha-cha-matcha",
]);

const CAFE_CUISINE_RE = /coffee|caf[eé]|espresso|bakery|roaster|tea house/i;
const BAR_CUISINE_RE = /\bbar\b|cocktail|wine bar|pub|taproom|brewery/i;
const BODEGA_CUISINE_RE = /bodega|deli|convenience|grocery|corner store/i;

export function resolveVenueCategory(menu: RestaurantMenu): VenueCategory {
  if (CAFE_SLUGS.has(menu.restaurantId)) return "cafe";
  if (menu.restaurantType === "cafe") return "cafe";
  if (CAFE_CUISINE_RE.test(menu.cuisine)) return "cafe";

  if (BAR_CUISINE_RE.test(menu.cuisine)) return "bar";
  if (BODEGA_CUISINE_RE.test(menu.cuisine)) return "bodega";
  if (menu.restaurantType === "deli") return "bodega";

  const drinkCount = menu.items.filter((i) => i.isDrink).length;
  if (drinkCount > 0 && drinkCount / Math.max(1, menu.items.length) > 0.6) return "cafe";

  if (menu.restaurantType === "fast-food") return "fastfood";
  return "restaurant";
}

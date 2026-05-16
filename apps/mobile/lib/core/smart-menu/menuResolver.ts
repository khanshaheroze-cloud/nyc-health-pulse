import type { RestaurantMenu } from "./types";

let _chainMenus: Record<string, RestaurantMenu> | null = null;
let _resolveTemplate: ((cuisine: string, name: string, id: string) => RestaurantMenu) | null = null;

function getChainMenus(): Record<string, RestaurantMenu> {
  if (!_chainMenus) {
    try {
      const mod = require("./menus");
      _chainMenus = mod.chainMenus ?? {};
    } catch {
      _chainMenus = {};
    }
  }
  return _chainMenus!;
}

function getResolveTemplate(): (cuisine: string, name: string, id: string) => RestaurantMenu {
  if (!_resolveTemplate) {
    try {
      const mod = require("./cuisine-templates");
      _resolveTemplate = mod.resolveTemplate;
    } catch {
      _resolveTemplate = (_c, name, id) => ({
        restaurantId: id,
        restaurantName: name,
        restaurantType: "other" as const,
        cuisine: _c,
        hasDrinks: false,
        items: [],
        source: "cuisine-template" as const,
        lastUpdated: "2026-05-04",
      });
    }
  }
  return _resolveTemplate!;
}

export function getMenuForRestaurant(
  chainSlug: string | null,
  cuisine: string,
  restaurantName: string,
): RestaurantMenu | null {
  if (chainSlug) {
    const menus = getChainMenus();
    if (menus[chainSlug]) return menus[chainSlug];
  }

  const resolve = getResolveTemplate();
  const menu = resolve(cuisine, restaurantName, restaurantName.toLowerCase().replace(/\s+/g, "-"));
  if (menu.items.length === 0) return null;
  return menu;
}

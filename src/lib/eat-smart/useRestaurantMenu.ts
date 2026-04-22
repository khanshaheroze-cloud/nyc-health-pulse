/* ── useRestaurantMenu — resolves curated chain or cuisine template ── */

import { useMemo } from "react";
import type { RestaurantMenu, RestaurantType } from "./types";

let _chainMenus: Record<string, RestaurantMenu> | null = null;
let _resolveTemplate: ((cuisine: string, name: string, id: string) => RestaurantMenu) | null = null;

/** Lazy-load chain menus (avoids importing all data eagerly) */
function getChainMenus(): Record<string, RestaurantMenu> {
  if (!_chainMenus) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@/data/eat-smart/menus");
      _chainMenus = mod.chainMenus ?? {};
    } catch {
      _chainMenus = {};
    }
  }
  return _chainMenus!;
}

function getResolveTemplate() {
  if (!_resolveTemplate) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("@/data/eat-smart/cuisine-templates");
      _resolveTemplate = mod.resolveTemplate;
    } catch {
      _resolveTemplate = () => ({
        restaurantId: "unknown",
        restaurantName: "Restaurant",
        restaurantType: "other" as RestaurantType,
        cuisine: "Unknown",
        hasDrinks: false,
        items: [],
        source: "cuisine-template" as const,
        lastUpdated: "2026-04-17",
      });
    }
  }
  return _resolveTemplate!;
}

export interface UseRestaurantMenuArgs {
  restaurantId: string;
  restaurantName: string;
  chainSlug: string | null;
  cuisine: string;
}

export function useRestaurantMenu({ restaurantId, restaurantName, chainSlug, cuisine }: UseRestaurantMenuArgs): RestaurantMenu | null {
  return useMemo(() => {
    // Try chain menu first
    if (chainSlug) {
      const menus = getChainMenus();
      if (menus[chainSlug]) return menus[chainSlug];
    }

    // Fall back to cuisine template
    const resolve = getResolveTemplate();
    return resolve(cuisine, restaurantName, restaurantId);
  }, [restaurantId, restaurantName, chainSlug, cuisine]);
}

/** Non-hook version for use outside React components */
export function getRestaurantMenu(chainSlug: string | null, cuisine: string, restaurantName: string, restaurantId: string): RestaurantMenu | null {
  if (chainSlug) {
    const menus = getChainMenus();
    if (menus[chainSlug]) return menus[chainSlug];
  }
  const resolve = getResolveTemplate();
  return resolve(cuisine, restaurantName, restaurantId);
}

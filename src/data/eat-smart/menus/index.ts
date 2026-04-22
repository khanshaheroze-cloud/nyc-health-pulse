import type { RestaurantMenu } from "@/lib/eat-smart/types";

import { sweetgreenMenu } from "./sweetgreen";
import { chipotleMenu } from "./chipotle";
import { starbucksMenu } from "./starbucks";
import { dunkinMenu } from "./dunkin";
import { chickFilAMenu } from "./chick-fil-a";
import { shakeShackMenu } from "./shake-shack";
import { halalGuysMenu } from "./halal-guys";
import { subwayMenu } from "./subway";
import { mcdonaldsMenu } from "./mcdonalds";
import { cavaMenu } from "./cava";
import { justSaladMenu } from "./just-salad";
import { paneraMenu } from "./panera";
import { pretMenu } from "./pret";
import { dominosMenu } from "./dominos";
import { jerseyMikesMenu } from "./jersey-mikes";

/** All curated chain menus keyed by restaurantId (slug). */
export const chainMenus: Record<string, RestaurantMenu> = {
  sweetgreen: sweetgreenMenu,
  chipotle: chipotleMenu,
  starbucks: starbucksMenu,
  dunkin: dunkinMenu,
  "chick-fil-a": chickFilAMenu,
  "shake-shack": shakeShackMenu,
  "halal-guys": halalGuysMenu,
  subway: subwayMenu,
  mcdonalds: mcdonaldsMenu,
  cava: cavaMenu,
  "just-salad": justSaladMenu,
  panera: paneraMenu,
  pret: pretMenu,
  dominos: dominosMenu,
  "jersey-mikes": jerseyMikesMenu,
};

export const CHAIN_IDS = Object.keys(chainMenus);

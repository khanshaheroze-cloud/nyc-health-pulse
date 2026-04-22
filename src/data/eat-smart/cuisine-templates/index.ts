import type { RestaurantMenu } from "@/lib/eat-smart/types";

import { createDeliTemplate } from "./deli";
import { createChineseTemplate } from "./chinese";
import { createMexicanTemplate } from "./mexican";
import { createPizzaTemplate } from "./pizza";
import { createHalalTemplate } from "./halal";
import { createIndianTemplate } from "./indian";
import { createJapaneseTemplate } from "./japanese";
import { createKoreanTemplate } from "./korean";
import { createThaiTemplate } from "./thai";
import { createMiddleEasternTemplate } from "./middle-eastern";
import { createDinerTemplate } from "./diner";
import { createCafeTemplate } from "./cafe";
import { createSeafoodTemplate } from "./seafood";
import { createVietnameseTemplate } from "./vietnamese";
import { createRamenTemplate } from "./ramen";
import { createFallbackTemplate } from "./fallback";

export {
  createDeliTemplate, createChineseTemplate, createMexicanTemplate,
  createPizzaTemplate, createHalalTemplate, createIndianTemplate,
  createJapaneseTemplate, createKoreanTemplate, createThaiTemplate,
  createMiddleEasternTemplate, createDinerTemplate, createCafeTemplate,
  createSeafoodTemplate, createVietnameseTemplate, createRamenTemplate,
  createFallbackTemplate,
};

const CUISINE_MAP: Record<string, (name: string, id: string) => RestaurantMenu> = {
  // Chinese
  "chinese":              createChineseTemplate,
  "chinese/cuban":        createChineseTemplate,
  "chinese/japanese":     createChineseTemplate,

  // Mexican / Latin
  "mexican":              createMexicanTemplate,
  "latin american":       createMexicanTemplate,
  "latin (cuban, dominican, puerto rican, south & central american)": createMexicanTemplate,
  "tex-mex":              createMexicanTemplate,
  "spanish":              createMexicanTemplate,
  "peruvian":             createMexicanTemplate,

  // Pizza / Italian
  "pizza":                createPizzaTemplate,
  "pizza/italian":        createPizzaTemplate,
  "italian":              createPizzaTemplate,

  // Deli
  "delicatessen":         createDeliTemplate,
  "deli":                 createDeliTemplate,
  "sandwiches":           createDeliTemplate,
  "sandwiches/salads/mixed buffet": createDeliTemplate,
  "bagels/pretzels":      createDeliTemplate,

  // Halal
  "halal":                createHalalTemplate,
  "moroccan":             createHalalTemplate,
  "egyptian":             createHalalTemplate,
  "afghan":               createHalalTemplate,

  // Indian
  "indian":               createIndianTemplate,
  "pakistani":            createIndianTemplate,
  "bangladeshi":          createIndianTemplate,

  // Japanese
  "japanese":             createJapaneseTemplate,
  "sushi":                createJapaneseTemplate,

  // Korean
  "korean":               createKoreanTemplate,

  // Thai
  "thai":                 createThaiTemplate,

  // Vietnamese
  "vietnamese":           createVietnameseTemplate,
  "vietnamese/chinese":   createVietnameseTemplate,
  "pho":                  createVietnameseTemplate,

  // Ramen
  "ramen":                createRamenTemplate,
  "noodles":              createRamenTemplate,
  "japanese/ramen":       createRamenTemplate,

  // Middle Eastern / Mediterranean
  "middle eastern":       createMiddleEasternTemplate,
  "mediterranean":        createMiddleEasternTemplate,
  "turkish":              createMiddleEasternTemplate,
  "greek":                createMiddleEasternTemplate,
  "lebanese":             createMiddleEasternTemplate,

  // Diner / American
  "american":             createDinerTemplate,
  "diner":                createDinerTemplate,
  "hamburgers":           createDinerTemplate,
  "hotdogs":              createDinerTemplate,
  "soul food":            createDinerTemplate,
  "southern":             createDinerTemplate,

  // Cafe
  "café/coffee/tea":      createCafeTemplate,
  "cafe/coffee/tea":      createCafeTemplate,
  "coffee/tea":           createCafeTemplate,
  "juice, smoothies, fruit salads": createCafeTemplate,
  "bottled beverages":    createCafeTemplate,

  // Seafood
  "seafood":              createSeafoodTemplate,
  "fish":                 createSeafoodTemplate,
};

export function resolveTemplate(
  cuisine: string,
  restaurantName: string,
  restaurantId: string,
): RestaurantMenu {
  const key = cuisine.toLowerCase().trim();
  const factory = CUISINE_MAP[key] ?? createFallbackTemplate;
  return factory(restaurantName, restaurantId);
}

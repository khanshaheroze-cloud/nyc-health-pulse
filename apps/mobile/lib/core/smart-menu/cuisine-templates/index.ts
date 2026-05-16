import type { RestaurantMenu } from "../types";

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
import { createCaribbeanTemplate } from "./caribbean";
import { createChickenTemplate } from "./chicken";
import { createFallbackTemplate } from "./fallback";

export {
  createDeliTemplate, createChineseTemplate, createMexicanTemplate,
  createPizzaTemplate, createHalalTemplate, createIndianTemplate,
  createJapaneseTemplate, createKoreanTemplate, createThaiTemplate,
  createMiddleEasternTemplate, createDinerTemplate, createCafeTemplate,
  createSeafoodTemplate, createVietnameseTemplate, createRamenTemplate,
  createCaribbeanTemplate, createChickenTemplate, createFallbackTemplate,
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
  "brazilian":            createMexicanTemplate,
  "colombian":            createMexicanTemplate,
  "salvadoran":           createMexicanTemplate,
  "ecuadorian":           createMexicanTemplate,
  "guatemalan":           createMexicanTemplate,
  "honduran":             createMexicanTemplate,
  "cuban":                createMexicanTemplate,
  "dominican":            createMexicanTemplate,
  "puerto rican":         createMexicanTemplate,
  "southwestern":         createMexicanTemplate,

  // Pizza / Italian
  "pizza":                createPizzaTemplate,
  "pizza/italian":        createPizzaTemplate,
  "italian":              createPizzaTemplate,

  // Deli / Bodega
  "delicatessen":         createDeliTemplate,
  "deli":                 createDeliTemplate,
  "sandwiches":           createDeliTemplate,
  "sandwiches/salads/mixed buffet": createDeliTemplate,
  "bagels/pretzels":      createDeliTemplate,
  "jewish/kosher":        createDeliTemplate,
  "kosher":               createDeliTemplate,

  // Halal
  "halal":                createHalalTemplate,
  "moroccan":             createHalalTemplate,
  "egyptian":             createHalalTemplate,
  "afghan":               createHalalTemplate,

  // Indian
  "indian":               createIndianTemplate,
  "pakistani":            createIndianTemplate,
  "bangladeshi":          createIndianTemplate,
  "sri lankan":           createIndianTemplate,
  "nepali":               createIndianTemplate,

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
  "iranian":              createMiddleEasternTemplate,

  // Caribbean
  "caribbean":            createCaribbeanTemplate,
  "jamaican":             createCaribbeanTemplate,
  "trinidadian":          createCaribbeanTemplate,
  "haitian":              createCaribbeanTemplate,

  // African
  "african":              createCaribbeanTemplate,
  "ethiopian":            createCaribbeanTemplate,
  "west african":         createCaribbeanTemplate,
  "senegalese":           createCaribbeanTemplate,
  "nigerian":             createCaribbeanTemplate,
  "ghanaian":             createCaribbeanTemplate,

  // Chicken (Kennedy Fried, Crown Fried, etc.)
  "chicken":              createChickenTemplate,
  "fried chicken":        createChickenTemplate,

  // Diner / American
  "american":             createDinerTemplate,
  "diner":                createDinerTemplate,
  "hamburgers":           createDinerTemplate,
  "hotdogs":              createDinerTemplate,
  "hotdogs/pretzels":     createDinerTemplate,
  "soul food":            createDinerTemplate,
  "southern":             createDinerTemplate,
  "cajun":                createDinerTemplate,
  "creole":               createDinerTemplate,
  "steak":                createDinerTemplate,
  "continental":          createDinerTemplate,
  "irish":                createDinerTemplate,
  "english":              createDinerTemplate,
  "german":               createDinerTemplate,
  "french":               createDinerTemplate,
  "russian":              createDinerTemplate,
  "polish":               createDinerTemplate,
  "eastern european":     createDinerTemplate,
  "scandinavian":         createDinerTemplate,
  "pancakes/waffles":     createDinerTemplate,

  // Cafe / Bakery / Coffee
  "café/coffee/tea":      createCafeTemplate,
  "cafe/coffee/tea":      createCafeTemplate,
  "coffee/tea":           createCafeTemplate,
  "juice, smoothies, fruit salads": createCafeTemplate,
  "bottled beverages":    createCafeTemplate,
  "bakery products/desserts": createCafeTemplate,
  "bakery":               createCafeTemplate,
  "donuts":               createCafeTemplate,
  "ice cream, gelato, yogurt, ices": createCafeTemplate,

  // Seafood
  "seafood":              createSeafoodTemplate,
  "fish":                 createSeafoodTemplate,

  // Other Asian (map to closest)
  "filipino":             createChineseTemplate,
  "indonesian":           createThaiTemplate,
  "malaysian":            createThaiTemplate,
  "burmese":              createThaiTemplate,
  "asian/asian fusion":   createChineseTemplate,
  "asian":                createChineseTemplate,
  "chinese/asian":        createChineseTemplate,
  "tapas":                createMiddleEasternTemplate,
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

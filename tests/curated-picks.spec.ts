import { test, expect } from "@playwright/test";
import { CHAINS as RESTAURANT_CHAINS } from "../src/lib/restaurantData";
import { CHAINS as EATSMART_CHAINS } from "../src/lib/eatSmartData";
import { GENERIC_TEMPLATES } from "../src/lib/genericRestaurants";

// Data-quality bounds for every curated menu item. Bounds like these would
// have auto-caught the year-old "Popeyes Best: 50 cal" bug the moment it was
// committed. A "meal" here = any non-drink, non-side item.

const DRINK_RE =
  /\b(latte|cappuccino|espresso|americano|matcha|cold.?brew|coffee|chai|macchiato|mocha|frappuccino|refresher|tea\b|lemonade|smoothie|juice|water|soda|shake\b)\b/i;

// Sides and condiments are legitimately tiny (Side Salad 15 cal, Hot Sauce 0
// cal) so they are exempt from the meal floor. The >=200 cal "best order must
// be a meal" rule is enforced at ranking time in /api/smart-menu/near-me.
const SIDE_RE =
  /\b(side salad|side\b|sauce|dressing|green beans|corn\b|coleslaw|slaw|mashed potatoes|apple slices|fruit\b|yogurt|hash brown|biscuit\b|rice\b|pita\b|hummus|guac)\b/i;

// Meal ceiling: worst-case real chain entrees reach ~1920 cal (Cheesecake
// Factory Pasta Carbonara, kept as a "what to avoid" entry). The ceiling
// exists to catch order-of-magnitude typos, not to police real menus.
const MEAL_CAL_FLOOR = 50;
const MEAL_CAL_CEILING = 2200;

test.describe("restaurantData CHAINS item bounds", () => {
  for (const chain of RESTAURANT_CHAINS) {
    test(`${chain.name} (${chain.items.length} items)`, () => {
      expect(chain.name.trim().length).toBeGreaterThan(0);
      expect(chain.slug.trim().length).toBeGreaterThan(0);
      for (const item of chain.items) {
        const label = `${chain.name} -> ${item.name}`;
        expect(item.name?.trim().length, `${label}: empty name`).toBeGreaterThan(0);

        const isDrink = DRINK_RE.test(item.name);
        const isSide = SIDE_RE.test(item.name);
        if (isDrink || isSide) {
          expect(item.cal, `${label}: cal out of range`).toBeGreaterThanOrEqual(0);
          expect(item.cal, `${label}: cal out of range`).toBeLessThan(1000);
        } else {
          expect(item.cal, `${label}: meal calories too low (Popeyes-50cal class bug)`).toBeGreaterThan(MEAL_CAL_FLOOR);
          expect(item.cal, `${label}: meal calories too high`).toBeLessThan(MEAL_CAL_CEILING);
        }

        // protein*4 cannot exceed calories (+10% tolerance for label rounding)
        expect(item.protein * 4, `${label}: protein kcal exceeds total calories`).toBeLessThanOrEqual(
          item.cal * 1.1 + 20,
        );
        expect(typeof item.sodium, `${label}: sodium missing`).toBe("number");
        expect(item.sodium, `${label}: sodium negative`).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

test.describe("eatSmartData CHAINS item bounds", () => {
  for (const chain of EATSMART_CHAINS) {
    test(`${chain.name} (${chain.items.length} items)`, () => {
      for (const item of chain.items) {
        const label = `${chain.name} -> ${item.name}`;
        expect(item.name?.trim().length, `${label}: empty name`).toBeGreaterThan(0);
        const isDrink = DRINK_RE.test(item.name);
        const isSide = SIDE_RE.test(item.name);
        if (!isDrink && !isSide) {
          expect(item.calories, `${label}: meal calories too low`).toBeGreaterThan(MEAL_CAL_FLOOR);
          expect(item.calories, `${label}: meal calories too high`).toBeLessThan(MEAL_CAL_CEILING);
        }
        if (item.protein != null) {
          expect(item.protein * 4, `${label}: protein kcal exceeds calories`).toBeLessThanOrEqual(
            item.calories * 1.1 + 20,
          );
        }
      }
    });
  }
});

test.describe("generic template pick bounds", () => {
  for (const t of GENERIC_TEMPLATES) {
    test(`${t.category}`, () => {
      for (const p of t.picks) {
        const label = `${t.category} -> ${p.name}`;
        expect(p.name?.trim().length, `${label}: empty name`).toBeGreaterThan(0);
        const isDrink = DRINK_RE.test(p.name);
        const isSide = SIDE_RE.test(p.name);
        if (!isDrink && !isSide) {
          expect(p.cal, `${label}: calories too low`).toBeGreaterThan(MEAL_CAL_FLOOR);
          expect(p.cal, `${label}: calories too high`).toBeLessThan(MEAL_CAL_CEILING);
        }
        expect(p.protein * 4, `${label}: protein kcal exceeds calories`).toBeLessThanOrEqual(p.cal * 1.1 + 20);
      }
    });
  }
});

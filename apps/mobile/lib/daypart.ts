/* ── Daypart → meal param, matching the web's detectMealType exactly ─────────
 * (nyc-health/src/lib/inferMealType.ts): 6–11 breakfast, 11–15 lunch,
 * 15–17 coffee, 17–22 dinner, else snack. The app's late-evening state keeps
 * its "Late Night" LABEL but queries meal=snack — same data the web serves
 * after 10pm. Evaluated on the DEVICE clock (the user is standing in NYC).
 */
import type { MealParam } from "./types";

export function detectMealParam(now: Date = new Date()): MealParam {
  const h = now.getHours();
  if (h >= 6 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 17) return "coffee";
  if (h >= 17 && h < 22) return "dinner";
  return "snack";
}

/** UI label for a meal param at a given hour — snack after 10pm/before 6am
 *  reads "Late Night" (the app's daypart language), else "Snack". */
export function mealLabel(meal: MealParam, now: Date = new Date()): string {
  if (meal === "snack") {
    const h = now.getHours();
    if (h >= 22 || h < 6) return "Late Night";
    return "Snack";
  }
  return { breakfast: "Breakfast", lunch: "Lunch", coffee: "Coffee", dinner: "Dinner" }[meal];
}

export const MEAL_OPTIONS: { meal: MealParam; icon: string }[] = [
  { meal: "breakfast", icon: "☀️" },
  { meal: "lunch", icon: "🥗" },
  { meal: "coffee", icon: "☕" },
  { meal: "snack", icon: "🍎" },
  { meal: "dinner", icon: "🌙" },
];

/** Log slot for "add to log" flows (breakfast/lunch/dinner/snack). */
export function detectLogSlot(now: Date = new Date()): "breakfast" | "lunch" | "dinner" | "snack" {
  const h = now.getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 21) return "dinner";
  return "snack";
}

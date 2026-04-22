/* ── PulseScore v2 + DrinkScore ────────────────────────────────── */

import type { MenuItem, SweetenerType } from "./types";

/** Food PulseScore v2 (0-100) — for isDrink === false items */
export function calculateFoodPulseScore(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sodium" | "sugar" | "addedSugar" | "saturatedFat">): number {
  let score = 0;

  // Protein efficiency (0-45)
  const ratio = item.protein > 0 ? item.calories / item.protein : Infinity;
  if (ratio <= 10) score += 45;
  else if (ratio <= 13) score += 38;
  else if (ratio <= 17) score += 30;
  else if (ratio <= 22) score += 20;
  else if (ratio <= 35) score += 10;

  // Absolute protein bonus (0-10)
  if (item.protein >= 40) score += 10;
  else if (item.protein >= 30) score += 7;
  else if (item.protein >= 20) score += 4;

  // Fiber density (0-15)
  if (item.fiber != null && item.calories > 0) {
    const fiberPer100 = (item.fiber / item.calories) * 100;
    if (fiberPer100 >= 3) score += 15;
    else if (fiberPer100 >= 2) score += 11;
    else if (fiberPer100 >= 1) score += 7;
    else if (fiberPer100 >= 0.5) score += 3;
  }

  // Calorie reasonableness (0-15)
  if (item.calories <= 300) score += 15;
  else if (item.calories <= 450) score += 12;
  else if (item.calories <= 600) score += 8;
  else if (item.calories <= 800) score += 4;

  // Sugar penalty (0 to -10)
  const addedSugar = item.addedSugar ?? item.sugar ?? 0;
  if (addedSugar > 25) score -= 10;
  else if (addedSugar > 15) score -= 6;
  else if (addedSugar > 8) score -= 3;

  // Saturated fat penalty (0 to -10)
  const satFat = item.saturatedFat ?? 0;
  if (satFat > 12) score -= 10;
  else if (satFat > 8) score -= 6;
  else if (satFat > 5) score -= 3;

  // Sodium penalty (0 to -10)
  if (item.sodium != null) {
    if (item.sodium > 1800) score -= 10;
    else if (item.sodium > 1200) score -= 6;
    else if (item.sodium > 900) score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

/** DrinkScore (0-100) — for isDrink === true items */
export function calculateDrinkScore(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sugar" | "saturatedFat" | "sweetenerType">): number {
  let score = 0;

  // Protein (0-35)
  if (item.protein >= 15) score += 35;
  else if (item.protein >= 10) score += 28;
  else if (item.protein >= 5) score += 18;
  else if (item.protein >= 2) score += 8;

  // Sugar (0-25)
  const sugar = item.sugar ?? 0;
  if (sugar === 0) score += 25;
  else if (sugar <= 5) score += 20;
  else if (sugar <= 10) score += 14;
  else if (sugar <= 20) score += 7;
  else if (sugar <= 30) score += 2;

  // Calories (0-15)
  if (item.calories <= 10) score += 15;
  else if (item.calories <= 50) score += 12;
  else if (item.calories <= 100) score += 9;
  else if (item.calories <= 150) score += 6;
  else if (item.calories <= 250) score += 3;

  // Fat quality (0-10)
  const satFat = item.saturatedFat ?? 0;
  if (satFat <= 1) score += 10;
  else if (satFat <= 3) score += 7;
  else if (satFat <= 6) score += 3;

  // Fiber bonus (0-5)
  if ((item.fiber ?? 0) >= 3) score += 5;
  else if ((item.fiber ?? 0) >= 1) score += 2;

  // Sweetener quality (0-10)
  const st = item.sweetenerType ?? (sugar === 0 ? "none" : sugar <= 5 ? "minimal-sugar" : "full-sugar");
  if (st === "none") score += 10;
  else if (st === "natural-zero") score += 8;
  else if (st === "sugar-free") score += 5;
  else if (st === "minimal-sugar") score += 3;

  return Math.max(0, Math.min(100, score));
}

/** Score any menu item using the appropriate formula */
export function scoreMenuItem(item: MenuItem): { pulseScore: number; drinkScore?: number } {
  if (item.isDrink) {
    const drinkScore = calculateDrinkScore(item);
    return { pulseScore: drinkScore, drinkScore };
  }
  return { pulseScore: calculateFoodPulseScore(item) };
}

/** Score breakdown for "Why this score?" tooltip */
export interface ScoreComponent {
  label: string;
  points: number;
}

export function getFoodScoreBreakdown(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sodium" | "sugar" | "addedSugar" | "saturatedFat">): ScoreComponent[] {
  const components: ScoreComponent[] = [];

  const ratio = item.protein > 0 ? item.calories / item.protein : Infinity;
  let proteinPts = 0;
  if (ratio <= 10) proteinPts = 45;
  else if (ratio <= 13) proteinPts = 38;
  else if (ratio <= 17) proteinPts = 30;
  else if (ratio <= 22) proteinPts = 20;
  else if (ratio <= 35) proteinPts = 10;
  if (proteinPts > 0) components.push({ label: `Protein (${Math.round(ratio)}:1 cal/g)`, points: proteinPts });

  let absProt = 0;
  if (item.protein >= 40) absProt = 10;
  else if (item.protein >= 30) absProt = 7;
  else if (item.protein >= 20) absProt = 4;
  if (absProt > 0) components.push({ label: `High protein (${item.protein}g)`, points: absProt });

  if (item.fiber != null && item.calories > 0) {
    const fiberPer100 = (item.fiber / item.calories) * 100;
    let fPts = 0;
    if (fiberPer100 >= 3) fPts = 15;
    else if (fiberPer100 >= 2) fPts = 11;
    else if (fiberPer100 >= 1) fPts = 7;
    else if (fiberPer100 >= 0.5) fPts = 3;
    if (fPts > 0) components.push({ label: `High fiber (${fiberPer100.toFixed(1)}g/100 cal)`, points: fPts });
  }

  let calPts = 0;
  if (item.calories <= 300) calPts = 15;
  else if (item.calories <= 450) calPts = 12;
  else if (item.calories <= 600) calPts = 8;
  else if (item.calories <= 800) calPts = 4;
  if (calPts > 0) components.push({ label: `Under ${item.calories <= 300 ? 300 : item.calories <= 450 ? 450 : item.calories <= 600 ? 600 : 800} cal`, points: calPts });

  const addedSugar = item.addedSugar ?? item.sugar ?? 0;
  let sugarPen = 0;
  if (addedSugar > 25) sugarPen = -10;
  else if (addedSugar > 15) sugarPen = -6;
  else if (addedSugar > 8) sugarPen = -3;
  if (sugarPen < 0) components.push({ label: `Sugar (${addedSugar}g)`, points: sugarPen });

  const satFat = item.saturatedFat ?? 0;
  let sfPen = 0;
  if (satFat > 12) sfPen = -10;
  else if (satFat > 8) sfPen = -6;
  else if (satFat > 5) sfPen = -3;
  if (sfPen < 0) components.push({ label: `Sat fat (${satFat}g)`, points: sfPen });

  if (item.sodium != null) {
    let naPen = 0;
    if (item.sodium > 1800) naPen = -10;
    else if (item.sodium > 1200) naPen = -6;
    else if (item.sodium > 900) naPen = -3;
    if (naPen < 0) components.push({ label: `Sodium (${item.sodium.toLocaleString()} mg)`, points: naPen });
  }

  return components;
}

export function getDrinkScoreBreakdown(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sugar" | "saturatedFat" | "sweetenerType">): ScoreComponent[] {
  const components: ScoreComponent[] = [];

  let protPts = 0;
  if (item.protein >= 15) protPts = 35;
  else if (item.protein >= 10) protPts = 28;
  else if (item.protein >= 5) protPts = 18;
  else if (item.protein >= 2) protPts = 8;
  if (protPts > 0) components.push({ label: `Protein (${item.protein}g)`, points: protPts });

  const sugar = item.sugar ?? 0;
  let sugPts = 0;
  if (sugar === 0) sugPts = 25;
  else if (sugar <= 5) sugPts = 20;
  else if (sugar <= 10) sugPts = 14;
  else if (sugar <= 20) sugPts = 7;
  else if (sugar <= 30) sugPts = 2;
  components.push({ label: sugar === 0 ? "Zero sugar" : `Low sugar (${sugar}g)`, points: sugPts });

  let calPts = 0;
  if (item.calories <= 10) calPts = 15;
  else if (item.calories <= 50) calPts = 12;
  else if (item.calories <= 100) calPts = 9;
  else if (item.calories <= 150) calPts = 6;
  else if (item.calories <= 250) calPts = 3;
  if (calPts > 0) components.push({ label: `${item.calories} cal`, points: calPts });

  const satFat = item.saturatedFat ?? 0;
  let fatPts = 0;
  if (satFat <= 1) fatPts = 10;
  else if (satFat <= 3) fatPts = 7;
  else if (satFat <= 6) fatPts = 3;
  if (fatPts > 0) components.push({ label: satFat <= 1 ? "Low fat" : `Sat fat (${satFat}g)`, points: fatPts });

  const fiber = item.fiber ?? 0;
  if (fiber >= 3) components.push({ label: `Fiber (${fiber}g)`, points: 5 });
  else if (fiber >= 1) components.push({ label: `Fiber (${fiber}g)`, points: 2 });

  const st = item.sweetenerType ?? (sugar === 0 ? "none" : sugar <= 5 ? "minimal-sugar" : "full-sugar");
  let swPts = 0;
  if (st === "none") swPts = 10;
  else if (st === "natural-zero") swPts = 8;
  else if (st === "sugar-free") swPts = 5;
  else if (st === "minimal-sugar") swPts = 3;
  const swLabel = st === "none" ? "Unsweetened" : st === "natural-zero" ? "Natural sweetener" : st === "sugar-free" ? "Sugar-free" : st === "minimal-sugar" ? "Light sweetener" : null;
  if (swLabel && swPts > 0) components.push({ label: swLabel, points: swPts });

  return components;
}

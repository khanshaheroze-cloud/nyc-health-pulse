/* ── PulseScore v2.1 + DrinkScore ──────────────────────────────── */

import type { MenuItem, SweetenerType } from "./types";

/** Food PulseScore v2.1 (0-100) — for isDrink === false items */
export function calculateFoodPulseScore(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sodium" | "sugar" | "addedSugar" | "saturatedFat">): number {
  let score = 0;

  // ── Protein efficiency (0-55) ─────────────────────────────
  const ratio = item.protein > 0 ? item.calories / item.protein : Infinity;
  if (ratio <= 7)       score += 55;
  else if (ratio <= 10) score += 50;
  else if (ratio <= 14) score += 43;
  else if (ratio <= 18) score += 32;
  else if (ratio <= 25) score += 20;
  else if (ratio <= 35) score += 12;

  // ── Protein density bonus (0-8) — rewards lean items ──────
  const proteinCalPct = item.calories > 0 ? (item.protein * 4 / item.calories) * 100 : 0;
  if (proteinCalPct >= 55)      score += 8;
  else if (proteinCalPct >= 35) score += 5;
  else if (proteinCalPct >= 22) score += 2;

  // ── Absolute protein (0-15) ───────────────────────────────
  if (item.protein >= 40)      score += 15;
  else if (item.protein >= 30) score += 12;
  else if (item.protein >= 20) score += 6;
  else if (item.protein >= 10) score += 3;

  // ── Fiber density (0-18) ──────────────────────────────────
  if (item.fiber != null && item.calories > 0) {
    const fiberPer100 = (item.fiber / item.calories) * 100;
    if (fiberPer100 >= 2.5)      score += 18;
    else if (fiberPer100 >= 1.5) score += 14;
    else if (fiberPer100 >= 0.8) score += 10;
    else if (fiberPer100 >= 0.4) score += 4;
  }

  // ── Calorie reasonableness (0-15) ─────────────────────────
  if (item.calories <= 300)      score += 15;
  else if (item.calories <= 450) score += 12;
  else if (item.calories <= 600) score += 8;
  else if (item.calories <= 800) score += 4;

  // ── Saturated fat penalty — explicit only ─────────────────
  const satFat = item.saturatedFat;
  if (satFat != null) {
    if (satFat > 15)      score -= 8;
    else if (satFat > 10) score -= 4;
    else if (satFat > 7)  score -= 2;
  }

  // ── Added sugar penalty ───────────────────────────────────
  const addedSugar = item.addedSugar ?? 0;
  if (addedSugar > 20)      score -= 6;
  else if (addedSugar > 12) score -= 3;
  else if (addedSugar > 6)  score -= 1;

  // ── Sodium penalty ────────────────────────────────────────
  if (item.sodium != null) {
    if (item.sodium > 1800)      score -= 6;
    else if (item.sodium > 1500) score -= 3;
    else if (item.sodium > 1200) score -= 1;
  }

  return Math.max(0, Math.min(100, score));
}

/** DrinkScore (0-100) — for isDrink === true items */
export function calculateDrinkScore(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sugar" | "saturatedFat" | "sweetenerType">): number {
  let score = 0;

  // Protein (0-42) — rare in drinks, high-reward
  if (item.protein >= 25)      score += 42;
  else if (item.protein >= 15) score += 36;
  else if (item.protein >= 10) score += 28;
  else if (item.protein >= 5)  score += 18;
  else if (item.protein >= 2)  score += 8;

  // Sugar (0-28)
  const sugar = item.sugar ?? 0;
  if (sugar === 0)        score += 28;
  else if (sugar <= 5)    score += 22;
  else if (sugar <= 10)   score += 15;
  else if (sugar <= 15)   score += 9;
  else if (sugar <= 25)   score += 3;

  // Calories (0-20)
  if (item.calories <= 10)       score += 20;
  else if (item.calories <= 50)  score += 16;
  else if (item.calories <= 100) score += 12;
  else if (item.calories <= 180) score += 7;
  else if (item.calories <= 300) score += 3;

  // Fat quality (0-10)
  const satFat = item.saturatedFat ?? 0;
  if (satFat <= 1)      score += 10;
  else if (satFat <= 3) score += 7;
  else if (satFat <= 6) score += 3;

  // Sweetener quality (0-10)
  const st = item.sweetenerType ?? (sugar === 0 ? "none" : sugar <= 5 ? "minimal-sugar" : "full-sugar");
  if (st === "none")                score += 10;
  else if (st === "natural-zero")   score += 8;
  else if (st === "sugar-free")     score += 5;
  else if (st === "minimal-sugar")  score += 3;

  // Protein-density bonus (0-12) — rewards protein drinks
  if (item.protein >= 20 && item.calories <= 300) score += 12;
  else if (item.protein >= 10 && item.calories <= 250) score += 8;
  else if (item.protein >= 5 && item.calories <= 200) score += 4;

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
  if (ratio <= 7) proteinPts = 55;
  else if (ratio <= 10) proteinPts = 50;
  else if (ratio <= 14) proteinPts = 43;
  else if (ratio <= 18) proteinPts = 32;
  else if (ratio <= 25) proteinPts = 20;
  else if (ratio <= 35) proteinPts = 12;
  if (proteinPts > 0) components.push({ label: `Protein ratio (${Math.round(ratio)}:1 cal/g)`, points: proteinPts });

  const proteinCalPct = item.calories > 0 ? (item.protein * 4 / item.calories) * 100 : 0;
  let densityPts = 0;
  if (proteinCalPct >= 55) densityPts = 8;
  else if (proteinCalPct >= 35) densityPts = 5;
  else if (proteinCalPct >= 22) densityPts = 2;
  if (densityPts > 0) components.push({ label: `Protein density (${Math.round(proteinCalPct)}% cal)`, points: densityPts });

  let absProt = 0;
  if (item.protein >= 40) absProt = 15;
  else if (item.protein >= 30) absProt = 12;
  else if (item.protein >= 20) absProt = 6;
  else if (item.protein >= 10) absProt = 3;
  if (absProt > 0) components.push({ label: `${item.protein}g protein`, points: absProt });

  if (item.fiber != null && item.calories > 0) {
    const fiberPer100 = (item.fiber / item.calories) * 100;
    let fPts = 0;
    if (fiberPer100 >= 2.5) fPts = 18;
    else if (fiberPer100 >= 1.5) fPts = 14;
    else if (fiberPer100 >= 0.8) fPts = 10;
    else if (fiberPer100 >= 0.4) fPts = 4;
    if (fPts > 0) components.push({ label: `Fiber (${item.fiber}g)`, points: fPts });
  }

  let calPts = 0;
  if (item.calories <= 300) calPts = 15;
  else if (item.calories <= 450) calPts = 12;
  else if (item.calories <= 600) calPts = 8;
  else if (item.calories <= 800) calPts = 4;
  if (calPts > 0) components.push({ label: `${item.calories} calories`, points: calPts });

  const satFat = item.saturatedFat;
  if (satFat != null) {
    let sfPen = 0;
    if (satFat > 15) sfPen = -8;
    else if (satFat > 10) sfPen = -4;
    else if (satFat > 7) sfPen = -2;
    if (sfPen < 0) components.push({ label: `Sat fat (${satFat}g)`, points: sfPen });
  }

  const addedSugar = item.addedSugar ?? 0;
  let sugarPen = 0;
  if (addedSugar > 20) sugarPen = -6;
  else if (addedSugar > 12) sugarPen = -3;
  else if (addedSugar > 6) sugarPen = -1;
  if (sugarPen < 0) components.push({ label: `Added sugar (${addedSugar}g)`, points: sugarPen });

  if (item.sodium != null) {
    let naPen = 0;
    if (item.sodium > 1800) naPen = -6;
    else if (item.sodium > 1500) naPen = -3;
    else if (item.sodium > 1200) naPen = -1;
    if (naPen < 0) components.push({ label: `Sodium (${item.sodium.toLocaleString()} mg)`, points: naPen });
  }

  return components;
}

export function getDrinkScoreBreakdown(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sugar" | "saturatedFat" | "sweetenerType">): ScoreComponent[] {
  const components: ScoreComponent[] = [];

  let protPts = 0;
  if (item.protein >= 25) protPts = 42;
  else if (item.protein >= 15) protPts = 36;
  else if (item.protein >= 10) protPts = 28;
  else if (item.protein >= 5) protPts = 18;
  else if (item.protein >= 2) protPts = 8;
  if (protPts > 0) components.push({ label: `Protein (${item.protein}g)`, points: protPts });

  const sugar = item.sugar ?? 0;
  let sugPts = 0;
  if (sugar === 0) sugPts = 28;
  else if (sugar <= 5) sugPts = 22;
  else if (sugar <= 10) sugPts = 15;
  else if (sugar <= 15) sugPts = 9;
  else if (sugar <= 25) sugPts = 3;
  components.push({ label: sugar === 0 ? "Zero sugar" : `Sugar (${sugar}g)`, points: sugPts });

  let calPts = 0;
  if (item.calories <= 10) calPts = 20;
  else if (item.calories <= 50) calPts = 16;
  else if (item.calories <= 100) calPts = 12;
  else if (item.calories <= 180) calPts = 7;
  else if (item.calories <= 300) calPts = 3;
  if (calPts > 0) components.push({ label: `${item.calories} cal`, points: calPts });

  const satFat = item.saturatedFat ?? 0;
  let fatPts = 0;
  if (satFat <= 1) fatPts = 10;
  else if (satFat <= 3) fatPts = 7;
  else if (satFat <= 6) fatPts = 3;
  if (fatPts > 0) components.push({ label: satFat <= 1 ? "Low fat" : `Sat fat (${satFat}g)`, points: fatPts });

  const st = item.sweetenerType ?? (sugar === 0 ? "none" : sugar <= 5 ? "minimal-sugar" : "full-sugar");
  let swPts = 0;
  if (st === "none") swPts = 10;
  else if (st === "natural-zero") swPts = 8;
  else if (st === "sugar-free") swPts = 5;
  else if (st === "minimal-sugar") swPts = 3;
  const swLabel = st === "none" ? "Unsweetened" : st === "natural-zero" ? "Natural sweetener" : st === "sugar-free" ? "Sugar-free" : st === "minimal-sugar" ? "Light sweetener" : null;
  if (swLabel && swPts > 0) components.push({ label: swLabel, points: swPts });

  let pdPts = 0;
  if (item.protein >= 20 && item.calories <= 300) pdPts = 12;
  else if (item.protein >= 10 && item.calories <= 250) pdPts = 8;
  else if (item.protein >= 5 && item.calories <= 200) pdPts = 4;
  if (pdPts > 0) components.push({ label: "Protein-rich drink", points: pdPts });

  return components;
}

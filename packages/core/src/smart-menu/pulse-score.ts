import type { MenuItem, SweetenerType } from "./types";

export interface ScoreComponent {
  label: string;
  points: number;
}

export function calculateFoodPulseScore(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sodium" | "sugar" | "addedSugar" | "saturatedFat">): number {
  let score = 0;

  const ratio = item.protein > 0 ? item.calories / item.protein : Infinity;
  if (ratio <= 7)       score += 55;
  else if (ratio <= 10) score += 50;
  else if (ratio <= 14) score += 43;
  else if (ratio <= 18) score += 32;
  else if (ratio <= 25) score += 20;
  else if (ratio <= 35) score += 12;

  const proteinCalPct = item.calories > 0 ? (item.protein * 4 / item.calories) * 100 : 0;
  if (proteinCalPct >= 55)      score += 8;
  else if (proteinCalPct >= 35) score += 5;
  else if (proteinCalPct >= 22) score += 2;

  if (item.protein >= 40)      score += 15;
  else if (item.protein >= 30) score += 12;
  else if (item.protein >= 20) score += 6;
  else if (item.protein >= 10) score += 3;

  if (item.fiber != null && item.calories > 0) {
    const fiberPer100 = (item.fiber / item.calories) * 100;
    if (fiberPer100 >= 2.5)      score += 18;
    else if (fiberPer100 >= 1.5) score += 14;
    else if (fiberPer100 >= 0.8) score += 10;
    else if (fiberPer100 >= 0.4) score += 4;
  }

  if (item.calories <= 300)      score += 15;
  else if (item.calories <= 450) score += 12;
  else if (item.calories <= 600) score += 8;
  else if (item.calories <= 800) score += 4;

  const satFat = item.saturatedFat;
  if (satFat != null) {
    if (satFat > 15)      score -= 8;
    else if (satFat > 10) score -= 4;
    else if (satFat > 7)  score -= 2;
  }

  const addedSugar = item.addedSugar ?? 0;
  if (addedSugar > 20)      score -= 6;
  else if (addedSugar > 12) score -= 3;
  else if (addedSugar > 6)  score -= 1;

  if (item.sodium != null) {
    if (item.sodium > 1800)      score -= 6;
    else if (item.sodium > 1500) score -= 3;
    else if (item.sodium > 1200) score -= 1;
  }

  return Math.max(0, Math.min(100, score));
}

export function calculateDrinkScore(item: Pick<MenuItem, "calories" | "protein" | "fiber" | "sugar" | "saturatedFat" | "sweetenerType">): number {
  let score = 0;

  if (item.protein >= 25)      score += 42;
  else if (item.protein >= 15) score += 36;
  else if (item.protein >= 10) score += 28;
  else if (item.protein >= 5)  score += 18;
  else if (item.protein >= 2)  score += 8;

  const sugar = item.sugar ?? 0;
  if (sugar === 0)        score += 28;
  else if (sugar <= 5)    score += 22;
  else if (sugar <= 10)   score += 15;
  else if (sugar <= 15)   score += 9;
  else if (sugar <= 25)   score += 3;

  if (item.calories <= 10)       score += 20;
  else if (item.calories <= 50)  score += 16;
  else if (item.calories <= 100) score += 12;
  else if (item.calories <= 180) score += 7;
  else if (item.calories <= 300) score += 3;

  const satFat = item.saturatedFat ?? 0;
  if (satFat <= 1)      score += 10;
  else if (satFat <= 3) score += 7;
  else if (satFat <= 6) score += 3;

  const st: SweetenerType = item.sweetenerType ?? (sugar === 0 ? "none" : sugar <= 5 ? "minimal-sugar" : "full-sugar");
  if (st === "none")                score += 10;
  else if (st === "natural-zero")   score += 8;
  else if (st === "sugar-free")     score += 5;
  else if (st === "minimal-sugar")  score += 3;

  if (item.protein >= 20 && item.calories <= 300) score += 12;
  else if (item.protein >= 10 && item.calories <= 250) score += 8;
  else if (item.protein >= 5 && item.calories <= 200) score += 4;

  return Math.max(0, Math.min(100, score));
}

export function scoreMenuItem(item: MenuItem): { pulseScore: number; drinkScore?: number } {
  if (item.isDrink) {
    const drinkScore = calculateDrinkScore(item);
    return { pulseScore: drinkScore, drinkScore };
  }
  return { pulseScore: calculateFoodPulseScore(item) };
}

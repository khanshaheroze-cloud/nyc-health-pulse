import type { MenuItem, RestaurantMenu } from "./types";

export interface TopPick extends MenuItem {
  whyLine: string;
}

function generateWhyLine(item: MenuItem): string {
  const parts: string[] = [];

  if (item.protein >= 30) parts.push("High protein");
  else if (item.protein >= 20) parts.push("Good protein");

  if (item.calories <= 400) parts.push("low cal");
  else if (item.calories <= 550) parts.push("moderate cal");

  if (item.fiber != null && item.fiber >= 6) parts.push("high fiber");

  if (item.sodium != null && item.sodium <= 600) parts.push("low sodium");

  if (item.fat != null && item.fat <= 12) parts.push("low fat");

  if (parts.length === 0) parts.push("Balanced macros");

  return parts.slice(0, 3).join(", ");
}

export function getTopPicks(menu: RestaurantMenu, count = 3): TopPick[] {
  const food = menu.items.filter((i) => !i.isDrink);

  const sorted = [...food].sort((a, b) => {
    if (a.isBestPick && !b.isBestPick) return -1;
    if (!a.isBestPick && b.isBestPick) return 1;
    return b.pulseScore - a.pulseScore;
  });

  return sorted.slice(0, count).map((item) => ({
    ...item,
    whyLine: generateWhyLine(item),
  }));
}

export function avgPulseScore(menu: RestaurantMenu): number {
  const food = menu.items.filter((i) => !i.isDrink && i.pulseScore > 0);
  if (food.length === 0) return 0;
  return Math.round(food.reduce((s, i) => s + i.pulseScore, 0) / food.length);
}

export function letterGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  return "D";
}

export function goalContext(score: number): string {
  if (score >= 80) return "Great for cutting";
  if (score >= 65) return "Good options for cutting";
  if (score >= 50) return "Moderate — choose carefully";
  return "Limited healthy options";
}

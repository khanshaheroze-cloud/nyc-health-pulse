/* ── Quick Log — writes to existing Nutrition Tracker localStorage ─── */

import type { MenuItem } from "./types";
import { detectMealSlot } from "./types";

export type QuickLogSource = "map-quick-log" | "menu-item-log" | "homepage-card-log";

interface LogResult {
  logId: string;
  date: string;
  meal: string;
  entryIndex: number;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function getLog(date: string) {
  try {
    const raw = localStorage.getItem(`pulsenyc_nutrition_${date}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { meals: { breakfast: [], lunch: [], dinner: [], snack: [] } };
}

function saveLog(date: string, log: Record<string, unknown>) {
  localStorage.setItem(`pulsenyc_nutrition_${date}`, JSON.stringify(log));
}

/** Add a restaurant menu item to today's food log */
export function quickLogMenuItem(args: {
  item: MenuItem;
  restaurantName: string;
  restaurantId: string;
  source: QuickLogSource;
}): LogResult {
  const date = todayStr();
  const meal = detectMealSlot();
  const log = getLog(date);
  const meals = log.meals ?? { breakfast: [], lunch: [], dinner: [], snack: [] };

  const logId = `ql-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const entry = {
    id: logId,
    name: `${args.restaurantName} — ${args.item.name}`,
    source: "quick" as const,
    servings: 1,
    servingSize: "1 order",
    calories: args.item.calories,
    protein: args.item.protein,
    carbs: args.item.carbs ?? 0,
    fat: args.item.fat ?? 0,
    fiber: args.item.fiber ?? 0,
    timestamp: Date.now(),
    // Extra metadata for analytics
    _quickLog: {
      source: args.source,
      restaurantId: args.restaurantId,
      menuItemId: args.item.id,
      pulseScore: args.item.pulseScore,
    },
  };

  if (!meals[meal]) meals[meal] = [];
  meals[meal].push(entry);
  log.meals = meals;
  saveLog(date, log);

  // Also add to recent food history
  addToRecentHistory(entry);

  return { logId, date, meal, entryIndex: meals[meal].length - 1 };
}

/** Remove a quick-logged entry (undo) */
export function removeQuickLog(logId: string, date?: string): boolean {
  const d = date ?? todayStr();
  const log = getLog(d);
  const meals = log.meals;
  if (!meals) return false;

  for (const slot of ["breakfast", "lunch", "dinner", "snack"]) {
    const arr = meals[slot] as { id: string }[];
    if (!arr) continue;
    const idx = arr.findIndex((e) => e.id === logId);
    if (idx >= 0) {
      arr.splice(idx, 1);
      saveLog(d, log);
      return true;
    }
  }
  return false;
}

/** Count how many times an item was logged today */
export function countTodayLogs(menuItemId: string): number {
  const log = getLog(todayStr());
  const meals = log.meals;
  if (!meals) return 0;
  let count = 0;
  for (const slot of ["breakfast", "lunch", "dinner", "snack"]) {
    const arr = meals[slot] as { _quickLog?: { menuItemId: string } }[];
    if (!arr) continue;
    count += arr.filter((e) => e._quickLog?.menuItemId === menuItemId).length;
  }
  return count;
}

function addToRecentHistory(entry: { id: string; name: string; calories: number; protein: number; source: string }) {
  try {
    const raw = localStorage.getItem("pulsenyc_food_history");
    const history = raw ? JSON.parse(raw) : [];
    history.unshift(entry);
    // Keep last 20
    localStorage.setItem("pulsenyc_food_history", JSON.stringify(history.slice(0, 20)));
  } catch { /* ignore */ }
}

/* ── Neighborhood Streak ─────────────────────────────────────── */

const STREAK_KEY = "pulsenyc_eat_streaks";

export function getStreak(neighborhoodSlug: string): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data[neighborhoodSlug]?.count ?? 0;
  } catch { return 0; }
}

export function incrementStreak(neighborhoodSlug: string, pulseScore: number): number {
  if (pulseScore < 70) return 0; // only healthy meals count
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const today = todayStr();
    const entry = data[neighborhoodSlug] ?? { count: 0, lastDate: "" };

    if (entry.lastDate === today) return entry.count; // already counted today
    entry.count += 1;
    entry.lastDate = today;
    data[neighborhoodSlug] = entry;
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    return entry.count;
  } catch { return 0; }
}

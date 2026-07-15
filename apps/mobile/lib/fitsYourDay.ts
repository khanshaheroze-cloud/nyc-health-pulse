/* ── "✓ Fits your day" — identical semantics to the web chip ─────────────────
 * Remaining budget = stored goals (pulse-nutrition-goals, else TDEE defaults)
 * minus today's logged intake. A pick fits when it fits the remaining CALORIE
 * budget; protein is a target to hit, never a disqualifier. Pure math is
 * exported separately for unit tests.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readTodayEntries, totals } from "./foodLog";

const GOALS_KEY = "pulse-nutrition-goals";
const DEFAULT_GOALS = { calories: 2000, protein: 150 };

export interface RemainingMacros {
  calLeft: number;
  proteinLeft: number;
}

/** Pure: remaining = max(0, goal − eaten). */
export function remaining(goal: { calories: number; protein: number }, eaten: { calories: number; protein: number }): RemainingMacros {
  return {
    calLeft: Math.max(0, Math.round(goal.calories - eaten.calories)),
    proteinLeft: Math.max(0, Math.round(goal.protein - eaten.protein)),
  };
}

/** Pure: a pick fits when it has known calories within the remaining budget. */
export function fitsYourDay(pick: { calories: number }, rem: RemainingMacros | null): boolean {
  if (!rem || rem.calLeft <= 0) return false;
  return pick.calories > 0 && pick.calories <= rem.calLeft;
}

/** Read goals + today's log and compute what's left of the day. */
export async function readRemainingMacros(): Promise<RemainingMacros> {
  let goals = DEFAULT_GOALS;
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      goals = {
        calories: Number(p.calories) > 0 ? Number(p.calories) : DEFAULT_GOALS.calories,
        protein: Number(p.protein) > 0 ? Number(p.protein) : DEFAULT_GOALS.protein,
      };
    }
  } catch {}
  const eaten = totals(await readTodayEntries());
  return remaining(goals, eaten);
}

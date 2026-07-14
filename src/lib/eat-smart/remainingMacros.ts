/* ── "Fits your day" — remaining macros from the nutrition tracker ──────────
 * Round 8 phase 4: pure client calculation, no new backend. Reads the
 * tracker's existing localStorage (goals + today's log) and returns what's
 * left of the day, so Find Food cards can annotate ranked picks that fit —
 * the retention hook that ties Find Food to the tracker loop.
 * Returns null when the tracker has no goals set: the chip never renders for
 * users who haven't opted into tracking.
 */

export interface RemainingMacros {
  calLeft: number;
  proteinLeft: number;
}

const GOALS_KEY = "pulsenyc_nutrition_goals";

export function readRemainingMacros(now: Date = new Date()): RemainingMacros | null {
  try {
    const goalsRaw = localStorage.getItem(GOALS_KEY);
    if (!goalsRaw) return null;
    const goals = JSON.parse(goalsRaw) as { dailyCalories?: number; proteinGoal?: number };
    const calGoal = Number(goals.dailyCalories);
    if (!Number.isFinite(calGoal) || calGoal <= 0) return null;
    const proteinGoal = Number(goals.proteinGoal) || 0;

    const date = now.toISOString().slice(0, 10);
    const raw = localStorage.getItem(`pulsenyc_nutrition_${date}`);
    let cals = 0;
    let protein = 0;
    if (raw) {
      const day = JSON.parse(raw) as { meals?: Record<string, unknown> };
      const meals = (day.meals ?? day) as Record<string, { calories?: number; protein?: number; servings?: number }[]>;
      // quickLog writes "snack"; the tracker UI writes "snacks" — read both.
      for (const slot of ["breakfast", "lunch", "dinner", "snack", "snacks"]) {
        for (const e of meals[slot] ?? []) {
          const s = e.servings || 1;
          cals += (e.calories || 0) * s;
          protein += (e.protein || 0) * s;
        }
      }
    }
    return {
      calLeft: Math.max(0, Math.round(calGoal - cals)),
      proteinLeft: Math.max(0, Math.round(proteinGoal - protein)),
    };
  } catch {
    return null;
  }
}

/** A pick fits the day when it fits the remaining calorie budget. Protein is
 *  a target to hit, not a cap — it never disqualifies a pick. */
export function fitsYourDay(pick: { calories: number }, rem: RemainingMacros | null): boolean {
  if (!rem || rem.calLeft <= 0) return false;
  return pick.calories > 0 && pick.calories <= rem.calLeft;
}

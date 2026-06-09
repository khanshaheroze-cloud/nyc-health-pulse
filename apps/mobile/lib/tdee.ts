/* ────────────────────────────────────────────────────────────────────
 *  TDEE-based Macro Target Calculator (Mifflin-St Jeor)
 * ──────────────────────────────────────────────────────────────────── */

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active";
export type Goal = "cut" | "maintain" | "bulk";

export interface UserProfile {
  weightLbs: number;
  heightInches: number; // total inches (e.g., 73 for 6'1")
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/* ── Unit helpers ── */

export function feetInchesToTotalInches(feet: number, inches: number): number {
  return feet * 12 + inches;
}

export function formatHeight(totalInches: number): string {
  const ft = Math.floor(totalInches / 12);
  const inc = Math.round(totalInches % 12);
  return `${ft}'${inc}"`;
}

export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/* ── Activity multipliers ── */

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

/* ── Goal calorie adjustments ── */

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  cut: -500,
  maintain: 0,
  bulk: 300,
};

/* ── Macro split ratios (protein / carbs / fat) ── */

const MACRO_SPLITS: Record<Goal, { protein: number; carbs: number; fat: number }> = {
  cut: { protein: 0.4, carbs: 0.35, fat: 0.25 },
  maintain: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  bulk: { protein: 0.25, carbs: 0.5, fat: 0.25 },
};

/* ── Main calculator ── */

export function calculateTDEE(profile: UserProfile): MacroTargets {
  const kg = lbsToKg(profile.weightLbs);
  const cm = inchesToCm(profile.heightInches);

  // Mifflin-St Jeor BMR
  const bmr =
    profile.sex === "male"
      ? 10 * kg + 6.25 * cm - 5 * profile.age + 5
      : 10 * kg + 6.25 * cm - 5 * profile.age - 161;

  // TDEE = BMR × activity multiplier
  const tdee = bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel];

  // Adjusted calories based on goal
  const calories = Math.round(tdee + GOAL_ADJUSTMENTS[profile.goal]);

  // Macro grams from split ratios
  const split = MACRO_SPLITS[profile.goal];
  const protein = Math.round((calories * split.protein) / 4);
  const carbs = Math.round((calories * split.carbs) / 4);
  const fat = Math.round((calories * split.fat) / 9);

  return { calories, protein, carbs, fat };
}

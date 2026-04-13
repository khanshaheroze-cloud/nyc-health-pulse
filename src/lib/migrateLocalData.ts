import { getSupabaseOrThrow } from "./supabase/client";

/**
 * Checks if there's any pulse-related data in localStorage worth migrating.
 */
export function checkLocalData() {
  const profile = localStorage.getItem("pulsenyc_body_profile");
  const userName = localStorage.getItem("pulse-user-name");
  const neighborhood = localStorage.getItem("pulse-my-neighborhood");
  const savedNeighborhoods = localStorage.getItem("pulse-saved-neighborhoods");

  // Check for any nutrition day logs (keyed as pulsenyc_nutrition_YYYY-MM-DD)
  let hasNutritionLogs = false;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("pulsenyc_nutrition_2")) {
      hasNutritionLogs = true;
      break;
    }
  }

  const hasData = !!(profile || userName || neighborhood || savedNeighborhoods || hasNutritionLogs);

  return {
    hasData,
    profile: profile ? JSON.parse(profile) : null,
    userName,
    neighborhood,
    savedNeighborhoods: savedNeighborhoods ? JSON.parse(savedNeighborhoods) : null,
    hasNutritionLogs,
  };
}

/**
 * Migrates localStorage data to Supabase for the currently-authenticated user.
 * Returns the number of items migrated.
 */
export async function migrateLocalData(): Promise<number> {
  const {
    data: { user },
  } = await getSupabaseOrThrow().auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const { hasData, profile, userName, neighborhood } = checkLocalData();
  if (!hasData) return 0;

  let migrated = 0;

  // Migrate profile + nutrition goals
  if (profile || userName || neighborhood) {
    let nutritionGoals = null;
    try {
      const goalsRaw = localStorage.getItem("pulsenyc_nutrition_goals");
      if (goalsRaw) nutritionGoals = JSON.parse(goalsRaw);
    } catch { /* ignore */ }

    const upsertData: Record<string, unknown> = {
      id: user.id,
      display_name: userName || user.user_metadata?.display_name || "PulseNYC User",
      height_ft: profile?.heightFt ?? null,
      height_in: profile?.heightIn ?? null,
      weight_lbs: profile?.weightLbs ?? null,
      age: profile?.age ?? null,
      sex: profile?.sex ?? null,
      activity_level: profile?.activityLevel ?? null,
      goal: profile?.goal ?? null,
      neighborhood: neighborhood ?? null,
    };
    if (nutritionGoals) upsertData.nutrition_goals = nutritionGoals;

    const { error } = await getSupabaseOrThrow().from("profiles").upsert(upsertData);
    if (!error) migrated++;
  }

  // Migrate nutrition day logs
  const nutritionKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("pulsenyc_nutrition_2")) {
      nutritionKeys.push(key);
    }
  }

  for (const key of nutritionKeys) {
    try {
      const dayData = JSON.parse(localStorage.getItem(key) || "{}");
      const date = key.replace("pulsenyc_nutrition_", "");
      const meals = dayData.meals;
      if (!meals || !Array.isArray(meals)) continue;

      const rows = meals.map((m: { name?: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; mealType?: string }) => ({
        user_id: user.id,
        date,
        food_name: m.name || "Unknown",
        calories: m.calories ?? 0,
        protein_g: m.protein ?? 0,
        carbs_g: m.carbs ?? 0,
        fat_g: m.fat ?? 0,
        fiber_g: m.fiber ?? 0,
        meal_type: m.mealType || null,
      }));

      if (rows.length > 0) {
        const { error } = await getSupabaseOrThrow().from("nutrition_logs").insert(rows);
        if (!error) migrated += rows.length;
      }
    } catch {
      // Skip corrupt entries
    }
  }

  return migrated;
}

/**
 * Clears all pulse-related localStorage keys after successful migration.
 */
export function clearMigratedLocalData() {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("pulsenyc_") || key === "pulse-user-name" || key === "pulse-my-neighborhood")
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface LoggedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  addedSugar?: number;
  saturatedFat?: number;
  servingSize?: string;
  servingQty?: number;
  pulseScore?: number;
  source: "scan" | "search" | "smart-menu" | "manual" | "ocr";
  restaurantId?: string;
  barcode?: string;
  loggedAt: string;
  mealSlot: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface DailyLog {
  date: string;
  entries: LoggedFood[];
  goals: NutritionGoals;
}

export interface MacroBudget {
  remainingCal: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  percentComplete: number;
}

export function calculateRemaining(log: DailyLog): MacroBudget {
  const totals = log.entries.reduce(
    (acc, e) => ({
      cal: acc.cal + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    remainingCal: Math.max(0, log.goals.calories - totals.cal),
    remainingProtein: Math.max(0, log.goals.protein - totals.protein),
    remainingCarbs: Math.max(0, log.goals.carbs - totals.carbs),
    remainingFat: Math.max(0, log.goals.fat - totals.fat),
    percentComplete: Math.min(100, Math.round((totals.cal / log.goals.calories) * 100)),
  };
}

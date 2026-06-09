export type MealCategory = "breakfast" | "lunch" | "coffee" | "snack" | "dinner";

const BREAKFAST_RE = /\b(bacon|sausage egg|egg(s)? (and|&) cheese|breakfast|pancakes?|waffles?|french.?toast|oatmeal|bagels?|muffins?|croissants?|morning|hash.?browns?|biscuits?|sausage.?mc|mcmuffin|scrambled?|omelets?|omelettes?|hotcakes|cinnamon.?rolls?|egg.?whites?|breakfast (sandwich|wrap|burrito))\b/i;

const COFFEE_RE = /\b(coffee|latte|cappuccino|espresso|mocha|frappuccino|macchiato|americano|cold.?brew|chai|matcha|hot.?chocolate|hot.?cocoa|refresher|drip coffee)\b/i;
const TEA_RE = /\btea\b/i;

const SNACK_RE = /\b(yogurt|smoothie|protein bar|nuts|fruit cup|chia pudding|granola|trail mix|hummus|crudite|popcorn|pretzel|jerky|parfait|cookie|brownie|donut|doughnut|sundae|pie|cobbler|apple.?slice|munchkins|acai bowl)\b/i;

const DINNER_RE = /\b(steak|salmon (fillet|plate)|ribeye|prime rib|lamb|braised|risotto|pasta|lasagna|paella|fillet|tasting menu|roast|teriyaki|ramen|pho|curry|tikka|tandoori|sashimi|gyro plate|steamed chicken|chicken & broccoli|shrimp.*vegg|combo over|chicken over rice|dal\b|chana masala|buddha.?s delight)\b/i;

const LUNCH_RE = /\b(bowls?|salads?|grain bowl|grilled chicken|burgers?|wraps?|sandwiches?|tacos?|burritos?|sushi|poke|shawarma|gyros?|falafel|banh mi|noodles?|sub |dumplings?|soups?)\b/i;

export function inferMealType(name: string, tags?: string[], category?: string): MealCategory {
  if (tags?.includes("breakfast")) return "breakfast";
  if (tags?.includes("coffee")) return "coffee";
  if (tags?.includes("snack")) return "snack";
  if (tags?.includes("dinner")) return "dinner";
  if (tags?.includes("lunch")) return "lunch";

  if (BREAKFAST_RE.test(name)) return "breakfast";
  if (COFFEE_RE.test(name) || TEA_RE.test(name)) return "coffee";
  if (SNACK_RE.test(name)) return "snack";
  if (DINNER_RE.test(name)) return "dinner";
  if (LUNCH_RE.test(name)) return "lunch";

  if (category) {
    const cat = category.toLowerCase();
    if (cat === "café" || cat === "cafe" || cat === "coffee") return "coffee";
    if (cat === "juice bar") return "snack";
  }

  return "lunch";
}

export function mealMatches(dishMeal: MealCategory, activeMeal: MealCategory): boolean {
  if (dishMeal === activeMeal) return true;
  if (activeMeal === "dinner" && dishMeal === "lunch") return true;
  if (activeMeal === "lunch" && dishMeal === "dinner") return true;
  if (activeMeal === "snack" && dishMeal === "coffee") return true;
  return false;
}

export function detectMealType(): MealCategory {
  const nycHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/New_York",
    }).format(new Date()),
    10,
  );
  if (nycHour >= 6 && nycHour < 11) return "breakfast";
  if (nycHour >= 11 && nycHour < 15) return "lunch";
  if (nycHour >= 15 && nycHour < 17) return "coffee";
  if (nycHour >= 17 && nycHour < 22) return "dinner";
  return "snack";
}

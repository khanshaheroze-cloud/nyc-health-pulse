export type MenuCategoryId =
  | "salads" | "bowls" | "sandwiches" | "wraps" | "rice" | "noodles"
  | "protein-plates" | "snacks" | "soups" | "breakfast" | "drinks" | "sides";

export type AvailabilityStatus = "active" | "seasonal" | "limited-time" | "discontinued";

export type SweetenerType = "none" | "natural-zero" | "sugar-free" | "minimal-sugar" | "full-sugar";

export type SourceProvider = "menustat" | "nutritionix" | "usda" | "usda-composed" | "brand-published" | "curated";

export interface ItemSource {
  provider: SourceProvider;
  externalId?: string;
  components?: { fdcId: number; grams: number }[];
  lastVerified: string;
}

export interface CachedMacros {
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  saturatedFat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  addedSugar?: number;
  caffeine?: number;
  pulseScore: number;
  drinkScore?: number;
  cachedAt: string;
}

export type MealTab = "lunch" | "dinner" | "breakfast" | "coffee";

export interface MenuItem {
  id: string;
  name: string;
  officialName?: string;
  category: MenuCategoryId;
  description?: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  addedSugar?: number;
  saturatedFat?: number;
  caffeine?: number;
  pulseScore: number;
  drinkScore?: number;
  sweetenerType?: SweetenerType;
  badges: string[];
  modifierHint?: string;
  isDrink: boolean;
  isBestPick?: boolean;
  isMiddleGround?: boolean;
  isRealisticTreat?: boolean;
  addedAt?: string;
  availabilityStatus?: AvailabilityStatus;
  source?: ItemSource;
  cachedMacros?: CachedMacros;
}

export type RestaurantType =
  | "fast-casual" | "fast-food" | "cafe" | "deli" | "full-service"
  | "halal-cart" | "pizza" | "other";

export interface RestaurantMenu {
  restaurantId: string;
  restaurantName: string;
  restaurantType: RestaurantType;
  cuisine: string;
  hasDrinks: boolean;
  hasIndoorSeating?: boolean;
  isStreetCart?: boolean;
  items: MenuItem[];
  source: "curated-chain" | "cuisine-template";
  lastUpdated: string;
  editorialTopPickId?: string;
  lastReviewedBy?: string;
  lastReviewedAt?: string;
  limitedHealthyOptions?: boolean;
}

export const CATEGORY_LABELS: Record<MenuCategoryId, string> = {
  salads: "Salads",
  bowls: "Bowls",
  sandwiches: "Sandwiches",
  wraps: "Wraps",
  rice: "Rice",
  noodles: "Noodles",
  "protein-plates": "Protein Plates",
  snacks: "Snacks",
  soups: "Soups",
  breakfast: "Breakfast",
  drinks: "Drinks",
  sides: "Sides",
};

export function detectMealSlot(): "breakfast" | "lunch" | "dinner" | "snack" {
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
  if (nycHour >= 15 && nycHour < 17) return "snack";
  if (nycHour >= 17 && nycHour < 21) return "dinner";
  return "snack";
}

export function detectMealTab(): MealTab {
  const nycHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/New_York",
    }).format(new Date()),
    10,
  );
  if (nycHour >= 6 && nycHour < 10) return "breakfast";
  if (nycHour >= 10 && nycHour < 11) return "coffee";
  if (nycHour >= 11 && nycHour < 15) return "lunch";
  if (nycHour >= 15 && nycHour < 17) return "coffee";
  if (nycHour >= 17 && nycHour < 21) return "dinner";
  return "dinner";
}

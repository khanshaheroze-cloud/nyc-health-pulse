/* ── Cuisine-Based Healthy Ordering Tips ────────────────────────────── */

export interface HealthyTip {
  category: string;
  defaultOrder: string;
  smartOrder: string;
  tip: string;
  estimatedSavings: string;
}

const CUISINE_TIPS: Record<string, HealthyTip[]> = {
  deli: [
    {
      category: "Deli / Bodega",
      defaultOrder: "Bacon Egg & Cheese on a Roll",
      smartOrder: "Egg White & Turkey Bacon on Whole Wheat Wrap",
      tip: "Egg whites cut ~60 cal & 5g fat per egg. Turkey bacon saves ~30 cal/strip. Wrap is ~80 cal less than a roll.",
      estimatedSavings: "~200 cal saved",
    },
    {
      category: "Deli / Bodega",
      defaultOrder: "Chopped Cheese on a Hero",
      smartOrder: "Chopped Cheese on a Wrap, light cheese, extra lettuce & tomato",
      tip: "The hero roll alone is 300+ cal. A wrap brings it to ~120 cal. Ask for half the cheese.",
      estimatedSavings: "~250 cal saved",
    },
    {
      category: "Deli / Bodega",
      defaultOrder: "Buttered Roll",
      smartOrder: "Whole Wheat Toast or Bagel Thin",
      tip: "A buttered roll is 350+ cal. A bagel thin is 110 cal. Toast with thin butter is ~160 cal.",
      estimatedSavings: "~200 cal saved",
    },
  ],

  pizza: [
    {
      category: "Pizza",
      defaultOrder: "2 Slices of Regular Cheese",
      smartOrder: "1 Slice + Side Salad (dressing on the side)",
      tip: "One cheese slice is ~280 cal. The second adds the same but almost zero extra satisfaction. A side salad fills the gap for ~50 cal.",
      estimatedSavings: "~230 cal saved",
    },
    {
      category: "Pizza",
      defaultOrder: "Pepperoni Slice",
      smartOrder: "Veggie Slice or Margherita (fresh mozzarella)",
      tip: "Pepperoni adds ~50 cal and 200mg sodium per slice. Fresh mozzarella is lighter than shredded.",
      estimatedSavings: "~50-80 cal saved",
    },
  ],

  chinese: [
    {
      category: "Chinese",
      defaultOrder: "General Tso's Chicken with Fried Rice",
      smartOrder: "Steamed Chicken & Broccoli with sauce on the side + brown rice (or no rice)",
      tip: "General Tso's is battered and deep fried — ~800 cal. Steamed with sauce on the side is ~350 cal. Brown rice has 3x the fiber.",
      estimatedSavings: "~400-500 cal saved",
    },
    {
      category: "Chinese",
      defaultOrder: "Pork Lo Mein",
      smartOrder: "Chicken or Shrimp with Mixed Vegetables (steamed)",
      tip: "Lo mein noodles absorb oil — a pint is 600+ cal. Steamed protein + veg is ~250 cal.",
      estimatedSavings: "~350 cal saved",
    },
  ],

  mexican: [
    {
      category: "Mexican",
      defaultOrder: "Burrito with rice, beans, cheese, sour cream",
      smartOrder: "Burrito bowl (no tortilla), skip rice, extra beans, no sour cream",
      tip: "The flour tortilla alone is 300 cal. Rice adds 210 cal. Sour cream is 110 cal. Beans give fiber + protein for fewer calories.",
      estimatedSavings: "~500 cal saved",
    },
  ],

  american: [
    {
      category: "Diner / American",
      defaultOrder: "Cheeseburger with Fries",
      smartOrder: "Grilled Chicken Sandwich (no mayo) with Side Salad",
      tip: "Grilled chicken saves ~200 cal over a burger. Salad instead of fries saves another ~350 cal. Skip mayo for -100 cal.",
      estimatedSavings: "~500+ cal saved",
    },
    {
      category: "Diner / American",
      defaultOrder: "Pancakes with Syrup & Butter",
      smartOrder: "Veggie Omelette with Whole Wheat Toast",
      tip: "A 3-stack of pancakes with syrup is ~700 cal with almost no protein. A veggie omelette is ~300 cal with 20g+ protein.",
      estimatedSavings: "~400 cal saved",
    },
  ],

  halal: [
    {
      category: "Halal Cart",
      defaultOrder: "Chicken Over Rice with White Sauce",
      smartOrder: "Chicken Over Salad (no rice) with Hot Sauce only",
      tip: "White sauce is 250-300 cal alone. Rice adds another 300 cal. Chicken over salad with hot sauce is ~350 cal vs 1,100+.",
      estimatedSavings: "~700 cal saved",
    },
  ],

  indian: [
    {
      category: "Indian / Pakistani",
      defaultOrder: "Chicken Tikka Masala with Naan + Rice",
      smartOrder: "Tandoori Chicken with 1 Roti (skip the rice)",
      tip: "Tikka masala sauce is cream-based (~400 cal for sauce alone). Tandoori is marinated and roasted — much leaner. Roti is ~100 cal vs naan at ~260 cal.",
      estimatedSavings: "~400 cal saved",
    },
  ],

  japanese: [
    {
      category: "Japanese / Sushi",
      defaultOrder: "Dragon Roll + Spicy Tuna Roll",
      smartOrder: "Sashimi Platter or Naruto Rolls (cucumber-wrapped)",
      tip: "Specialty rolls have cream cheese, tempura, and mayo — 500+ cal per roll. Sashimi is pure protein at ~40 cal per piece.",
      estimatedSavings: "~400 cal saved",
    },
  ],

  korean: [
    {
      category: "Korean",
      defaultOrder: "Bibimbap with Fried Egg and Extra Sauce",
      smartOrder: "Bibimbap with steamed egg, extra veggies, sauce on the side",
      tip: "Ask for half the rice and extra vegetables. Gochujang is fine in moderation — it's the rice volume that drives calories.",
      estimatedSavings: "~200 cal saved",
    },
  ],

  coffee: [
    {
      category: "Coffee / Bakery",
      defaultOrder: "Large Latte + Muffin",
      smartOrder: "Americano with a splash of oat milk + Protein Box or Hard Boiled Eggs",
      tip: "A large latte is ~250 cal. A muffin is 400-500 cal. An americano with a splash is ~30 cal.",
      estimatedSavings: "~400 cal saved",
    },
  ],

  thai: [
    {
      category: "Thai",
      defaultOrder: "Pad Thai with Chicken",
      smartOrder: "Larb Gai (chicken salad) or Tom Yum Soup with Shrimp",
      tip: "Pad Thai noodles are stir-fried in oil and sugar — 700+ cal. Larb is ~300 cal. Tom Yum is ~200 cal.",
      estimatedSavings: "~400 cal saved",
    },
  ],

  seafood: [
    {
      category: "Seafood",
      defaultOrder: "Fried Fish & Chips",
      smartOrder: "Grilled or Broiled Fish with Steamed Vegetables",
      tip: "Battering and frying adds 300+ cal. Grilled fish is ~130 cal per 6oz fillet with 28g protein.",
      estimatedSavings: "~350 cal saved",
    },
  ],

  caribbean: [
    {
      category: "Caribbean",
      defaultOrder: "Jerk Chicken Plate with Rice & Peas + Plantains",
      smartOrder: "Jerk Chicken (dark meat, no skin) with Steamed Cabbage",
      tip: "Rice & peas is 300+ cal. Fried plantains add 200+ cal. Steamed cabbage is ~30 cal and still traditional.",
      estimatedSavings: "~400 cal saved",
    },
  ],
};

/** Match a DOHMH cuisine type + restaurant name to a healthy tip */
export function getHealthyTip(cuisineType: string, restaurantName: string): HealthyTip | null {
  const lower = (cuisineType || "").toLowerCase();
  const nameLower = (restaurantName || "").toLowerCase();

  // Bodega/deli detection
  if (lower.includes("deli") || lower.includes("sandwich") ||
      nameLower.includes("bodega") || nameLower.includes("deli") ||
      nameLower.includes("grocery") || nameLower.includes("gourmet")) {
    const tips = CUISINE_TIPS.deli;
    return tips[Math.floor(Math.random() * tips.length)];
  }

  if (lower.includes("pizza") || lower.includes("italian")) return CUISINE_TIPS.pizza?.[0] ?? null;
  if (lower.includes("chinese")) return CUISINE_TIPS.chinese?.[0] ?? null;
  if (lower.includes("mexican") || lower.includes("latin") || lower.includes("tex-mex")) return CUISINE_TIPS.mexican?.[0] ?? null;
  if (lower.includes("american") || lower.includes("diner") || lower.includes("hamburger")) return CUISINE_TIPS.american?.[0] ?? null;
  if (lower.includes("halal") || lower.includes("middle eastern") || lower.includes("egyptian") || lower.includes("moroccan")) return CUISINE_TIPS.halal?.[0] ?? null;
  if (lower.includes("indian") || lower.includes("pakistani") || lower.includes("bangladeshi")) return CUISINE_TIPS.indian?.[0] ?? null;
  if (lower.includes("japanese") || lower.includes("sushi")) return CUISINE_TIPS.japanese?.[0] ?? null;
  if (lower.includes("korean")) return CUISINE_TIPS.korean?.[0] ?? null;
  if (lower.includes("coffee") || lower.includes("café") || lower.includes("bakery") || lower.includes("donut")) return CUISINE_TIPS.coffee?.[0] ?? null;
  if (lower.includes("thai")) return CUISINE_TIPS.thai?.[0] ?? null;
  if (lower.includes("seafood") || lower.includes("fish")) return CUISINE_TIPS.seafood?.[0] ?? null;
  if (lower.includes("caribbean") || lower.includes("jamaican")) return CUISINE_TIPS.caribbean?.[0] ?? null;

  return null;
}

/** Build a Google Maps walking directions URL */
export function getDirectionsUrl(lat: number, lng: number, name?: string, address?: string): string {
  const dest = name && address
    ? encodeURIComponent(`${name}, ${address}, New York, NY`)
    : name
      ? `${encodeURIComponent(name)}@${lat},${lng}`
      : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
}

/** Get a marker icon (emoji) based on cuisine type */
export function getMarkerIcon(cuisine: string, chainSlug: string | null, isHealthy: boolean): string {
  if (chainSlug) return "🌯";
  if (isHealthy) return "🥬";
  const c = (cuisine || "").toLowerCase();
  if (c.includes("deli") || c.includes("sandwich")) return "🏪";
  if (c.includes("pizza") || c.includes("italian")) return "🍕";
  if (c.includes("chinese") || c.includes("asian")) return "🥡";
  if (c.includes("mexican") || c.includes("latin") || c.includes("tex-mex") || c.includes("taco")) return "🌮";
  if (c.includes("japanese") || c.includes("sushi")) return "🍣";
  if (c.includes("indian") || c.includes("pakistani") || c.includes("bangladeshi")) return "🍛";
  if (c.includes("middle eastern") || c.includes("halal")) return "🧆";
  if (c.includes("korean")) return "🍜";
  if (c.includes("thai")) return "🍜";
  if (c.includes("coffee") || c.includes("bakery") || c.includes("café") || c.includes("donut")) return "☕";
  if (c.includes("juice") || c.includes("smoothie")) return "🥤";
  if (c.includes("american") || c.includes("diner")) return "🍳";
  if (c.includes("seafood") || c.includes("fish")) return "🐟";
  if (c.includes("burger") || c.includes("hamburger")) return "🍔";
  if (c.includes("chicken")) return "🍗";
  if (c.includes("caribbean") || c.includes("jamaican")) return "🍗";
  if (c.includes("jewish") || c.includes("kosher")) return "🥯";
  if (c.includes("ice cream") || c.includes("dessert")) return "🍦";
  if (c.includes("salad") || c.includes("vegetarian") || c.includes("vegan")) return "🥗";
  return "🍴";
}

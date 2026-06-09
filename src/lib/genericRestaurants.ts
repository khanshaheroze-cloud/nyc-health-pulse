export interface GenericPick {
  name: string;
  description?: string;
  cal: number;
  protein: number;
  estimatedPrice?: number;
}

export interface GenericTemplate {
  category: string;
  cuisineKey: string;
  emoji: string;
  orderingTip?: string;
  priceRange: 1 | 2;
  picks: GenericPick[];
}

export const GENERIC_TEMPLATES: GenericTemplate[] = [
  {
    category: "Deli",
    cuisineKey: "deli",
    emoji: "🥪",
    priceRange: 1,
    orderingTip: "Ask for egg whites + turkey bacon on a whole wheat wrap — saves 200+ cal vs a BEC on a roll.",
    picks: [
      { name: "Egg White + Turkey Bacon Wrap", description: "Whole wheat wrap, spinach, egg whites, turkey bacon", cal: 320, protein: 24, estimatedPrice: 7 },
      { name: "Bacon Egg & Cheese on Wheat", description: "Classic BEC on whole wheat roll", cal: 420, protein: 22, estimatedPrice: 6 },
      { name: "Turkey on Whole Wheat (mustard)", description: "Lean turkey, whole wheat, mustard instead of mayo", cal: 380, protein: 28, estimatedPrice: 9 },
      { name: "Greek Yogurt + Banana", description: "Grab-and-go protein snack", cal: 220, protein: 16, estimatedPrice: 5 },
      { name: "Oatmeal + Banana + PB", description: "Instant oatmeal with banana and peanut butter packet", cal: 340, protein: 10, estimatedPrice: 5 },
      { name: "Cold Brew Coffee (black)", description: "Large cold brew, no sugar", cal: 5, protein: 0, estimatedPrice: 4 },
      { name: "Chopped Cheese (light)", description: "Half cheese, extra lettuce & tomato on wheat", cal: 560, protein: 32, estimatedPrice: 8 },
    ],
  },
  {
    category: "Halal Cart",
    cuisineKey: "halal",
    emoji: "🧆",
    priceRange: 1,
    orderingTip: "Skip the white sauce to save ~200 cal; use hot sauce instead. Chicken over salad is the gold standard order.",
    picks: [
      { name: "Chicken over Salad (no white sauce)", description: "Grilled chicken on mixed greens, hot sauce only", cal: 340, protein: 36, estimatedPrice: 8 },
      { name: "Combo over Salad (no white sauce)", description: "Chicken + gyro over salad, hot sauce", cal: 420, protein: 38, estimatedPrice: 9 },
      { name: "Chicken over Rice (half rice)", description: "Ask for half rice, extra salad on the side", cal: 520, protein: 36, estimatedPrice: 8 },
      { name: "Falafel Wrap (no white sauce)", description: "Falafel, lettuce, tomato, hot sauce in pita", cal: 450, protein: 14, estimatedPrice: 7 },
      { name: "Gyro Salad (tzatziki on side)", description: "Gyro meat over greens, dressing separate", cal: 380, protein: 24, estimatedPrice: 8 },
    ],
  },
  {
    category: "Pizza",
    cuisineKey: "pizza",
    emoji: "🍕",
    priceRange: 1,
    orderingTip: "One cheese slice + a side salad is a solid 400-cal meal. Blotting oil off the top saves ~40 cal per slice.",
    picks: [
      { name: "Cheese Slice + Side Salad", description: "Classic thin slice with a garden side salad", cal: 380, protein: 16, estimatedPrice: 7 },
      { name: "Margherita Slice", description: "Fresh mozzarella, basil, tomato — lighter than regular", cal: 280, protein: 12, estimatedPrice: 5 },
      { name: "Chicken Slice / Topping", description: "Add grilled chicken to any slice for protein", cal: 350, protein: 22, estimatedPrice: 6 },
      { name: "Garden Salad (oil + vinegar)", description: "Mixed greens, tomato, cucumber, light dressing", cal: 120, protein: 3, estimatedPrice: 6 },
      { name: "Veggie Slice", description: "Loaded with peppers, onions, mushrooms, spinach", cal: 290, protein: 12, estimatedPrice: 5 },
      { name: "Chicken Parm with Pasta", description: "Breaded chicken cutlet, marinara, over pasta", cal: 680, protein: 38, estimatedPrice: 14 },
      { name: "Lasagna", description: "Baked lasagna with ricotta, mozzarella, meat sauce", cal: 550, protein: 26, estimatedPrice: 12 },
    ],
  },
  {
    category: "Diner",
    cuisineKey: "diner",
    emoji: "🍳",
    priceRange: 1,
    orderingTip: "Egg white omelette with veggies is the best diner hack. Skip the toast or ask for whole wheat.",
    picks: [
      { name: "Egg White Omelette (veggie)", description: "Egg whites, spinach, peppers, onions, mushrooms", cal: 200, protein: 24, estimatedPrice: 10 },
      { name: "Scrambled Eggs + Turkey Sausage", description: "Two scrambled eggs, turkey sausage patty, wheat toast", cal: 340, protein: 28, estimatedPrice: 11 },
      { name: "Oatmeal + Fruit", description: "Bowl of oatmeal with fresh berries", cal: 280, protein: 8, estimatedPrice: 8 },
      { name: "Pancakes (short stack, 2)", description: "Two buttermilk pancakes, side of fruit", cal: 380, protein: 8, estimatedPrice: 10 },
      { name: "Grilled Chicken Sandwich", description: "Grilled chicken breast on whole wheat, lettuce, tomato", cal: 380, protein: 34, estimatedPrice: 12 },
      { name: "Turkey Burger (no bun)", description: "Lean turkey patty on a bed of greens", cal: 320, protein: 28, estimatedPrice: 12 },
      { name: "Greek Salad + Grilled Chicken", description: "Feta, olives, cucumber, tomato, grilled chicken", cal: 420, protein: 32, estimatedPrice: 14 },
      { name: "Roast Chicken Dinner", description: "Half roast chicken with steamed vegetables", cal: 420, protein: 38, estimatedPrice: 14 },
      { name: "Pasta with Marinara", description: "Penne pasta with marinara sauce, side salad", cal: 480, protein: 16, estimatedPrice: 13 },
    ],
  },
  {
    category: "Chinese",
    cuisineKey: "chinese",
    emoji: "🥡",
    priceRange: 1,
    orderingTip: "Steamed instead of fried + sauce on the side. Brown rice if available. Chicken & broccoli is the safe bet.",
    picks: [
      { name: "Chicken & Broccoli (steamed)", description: "Steamed chicken and broccoli, sauce on side", cal: 280, protein: 26, estimatedPrice: 10 },
      { name: "Steamed Shrimp & Mixed Veggies", description: "Steamed shrimp with bok choy, snow peas, carrots", cal: 240, protein: 22, estimatedPrice: 11 },
      { name: "Wonton Soup (8 pcs)", description: "Broth-based soup with pork or shrimp wontons", cal: 300, protein: 14, estimatedPrice: 6 },
      { name: "Buddha's Delight (steamed)", description: "Steamed tofu and mixed vegetables", cal: 180, protein: 12, estimatedPrice: 9 },
      { name: "Steamed Chicken Dumplings (8 pcs)", description: "Steamed, not fried — dip in low-sodium soy", cal: 320, protein: 18, estimatedPrice: 7 },
    ],
  },
  {
    category: "Mexican",
    cuisineKey: "mexican",
    emoji: "🌮",
    priceRange: 1,
    orderingTip: "Bowl over burrito saves 300 cal (skip the tortilla). Ask for half rice, double beans, extra salsa.",
    picks: [
      { name: "Breakfast Burrito (egg, beans, salsa)", description: "Scrambled eggs, black beans, pico, flour tortilla", cal: 420, protein: 22, estimatedPrice: 9 },
      { name: "Chicken Bowl (half rice, extra beans)", description: "Chicken, beans, salsa, lettuce — skip sour cream", cal: 420, protein: 32, estimatedPrice: 10 },
      { name: "2 Chicken Tacos (corn tortilla)", description: "Corn tortillas, grilled chicken, salsa, onion, cilantro", cal: 340, protein: 24, estimatedPrice: 8 },
      { name: "Veggie Burrito Bowl", description: "Black beans, rice, fajita veggies, corn salsa, guac", cal: 480, protein: 16, estimatedPrice: 9 },
      { name: "Steak Tacos (2, corn)", description: "Grilled steak, onion, cilantro, lime", cal: 380, protein: 26, estimatedPrice: 10 },
    ],
  },
  {
    category: "Café",
    cuisineKey: "cafe",
    emoji: "☕",
    priceRange: 2,
    orderingTip: "Swap syrup for sugar-free, oat milk saves ~30 cal vs whole. Protein box or egg wrap over pastries.",
    picks: [
      { name: "Oat Milk Latte (no sugar)", description: "Espresso + steamed oat milk, no added sweetener", cal: 120, protein: 3, estimatedPrice: 6 },
      { name: "Cold Brew Coffee + Protein Bar", description: "Black cold brew with a grab-and-go protein bar", cal: 250, protein: 20, estimatedPrice: 8 },
      { name: "Americano", description: "Double shot over hot water — 5 cal, max caffeine", cal: 5, protein: 0, estimatedPrice: 4 },
      { name: "Egg & Cheese Breakfast Wrap", description: "Scrambled eggs and cheese in a whole wheat wrap", cal: 310, protein: 18, estimatedPrice: 6 },
      { name: "Greek Yogurt Parfait", description: "Greek yogurt, granola, fresh berries", cal: 280, protein: 14, estimatedPrice: 6 },
      { name: "Protein Box (cheese, nuts, fruit)", description: "Grab-and-go snack box", cal: 350, protein: 20, estimatedPrice: 8 },
      { name: "Matcha Latte (oat milk)", description: "Ceremonial matcha, oat milk, no sweetener", cal: 140, protein: 3, estimatedPrice: 6 },
    ],
  },
  {
    category: "Indian",
    cuisineKey: "indian",
    emoji: "🍛",
    priceRange: 1,
    orderingTip: "Tandoori chicken is the protein powerhouse. Skip naan for rice, or get one naan to share.",
    picks: [
      { name: "Tandoori Chicken (2 pcs)", description: "Clay-oven chicken, high protein, lower fat than curry", cal: 260, protein: 32, estimatedPrice: 12 },
      { name: "Chicken Tikka (6 pcs)", description: "Boneless grilled chicken chunks, yogurt marinade", cal: 280, protein: 30, estimatedPrice: 11 },
      { name: "Chana Masala + Rice", description: "Chickpea curry — high fiber, good plant protein", cal: 420, protein: 14, estimatedPrice: 10 },
      { name: "Dal + Brown Rice", description: "Lentil stew, complete plant protein with rice", cal: 380, protein: 16, estimatedPrice: 9 },
      { name: "Raita (yogurt side)", description: "Cooling yogurt with cucumber — probiotic bonus", cal: 60, protein: 4, estimatedPrice: 3 },
      { name: "Chicken Wrap with Raita", description: "Grilled chicken in naan wrap with raita", cal: 380, protein: 26, estimatedPrice: 10 },
      { name: "Chickpea Salad Bowl", description: "Chickpeas, cucumber, tomato, onion, lemon dressing", cal: 320, protein: 14, estimatedPrice: 9 },
    ],
  },
  {
    category: "Japanese",
    cuisineKey: "japanese",
    emoji: "🍱",
    priceRange: 2,
    orderingTip: "Sashimi over rolls saves 200+ cal (no rice). Edamame is the best appetizer for protein.",
    picks: [
      { name: "Salmon Sashimi (8 pcs)", description: "Pure protein + omega-3, no rice filler", cal: 200, protein: 24, estimatedPrice: 14 },
      { name: "Edamame", description: "Steamed soybeans — 18g protein per cup", cal: 190, protein: 18, estimatedPrice: 6 },
      { name: "Chicken Teriyaki Bowl", description: "Grilled chicken, steamed rice, teriyaki sauce", cal: 520, protein: 30, estimatedPrice: 12 },
      { name: "Miso Soup", description: "Low-cal, warm, probiotic broth", cal: 60, protein: 4, estimatedPrice: 3 },
      { name: "Salmon Avocado Roll (6 pcs)", description: "Salmon, avocado, rice, nori — balanced roll", cal: 350, protein: 16, estimatedPrice: 10 },
    ],
  },
  {
    category: "Sandwich Shop",
    cuisineKey: "sandwiches",
    emoji: "🥖",
    priceRange: 1,
    orderingTip: "Mustard over mayo, wheat over white, double the veggies. Turkey or grilled chicken are the protein picks.",
    picks: [
      { name: "Turkey Sub (wheat, mustard)", description: "Turkey breast, wheat bread, mustard, lettuce, tomato", cal: 350, protein: 28, estimatedPrice: 9 },
      { name: "Grilled Chicken Wrap", description: "Grilled chicken, lettuce, tomato, light dressing", cal: 380, protein: 30, estimatedPrice: 10 },
      { name: "Veggie Sub (wheat)", description: "All veggies + avocado or hummus on wheat", cal: 320, protein: 10, estimatedPrice: 8 },
      { name: "Tuna Salad Sub (light mayo)", description: "Tuna with light mayo on wheat", cal: 420, protein: 24, estimatedPrice: 9 },
      { name: "Side Salad", description: "Garden salad with vinaigrette", cal: 80, protein: 2, estimatedPrice: 4 },
    ],
  },
  {
    category: "Seafood",
    cuisineKey: "seafood",
    emoji: "🐟",
    priceRange: 2,
    orderingTip: "Grilled over fried every time. Fish tacos on corn tortillas are a great balanced option.",
    picks: [
      { name: "Grilled Fish Plate", description: "Grilled white fish (tilapia/cod) with veggies", cal: 280, protein: 32, estimatedPrice: 14 },
      { name: "Shrimp Cocktail (6 pcs)", description: "Cold shrimp, cocktail sauce — pure lean protein", cal: 120, protein: 18, estimatedPrice: 10 },
      { name: "Fish Tacos (2, grilled)", description: "Grilled fish, cabbage slaw, lime, corn tortillas", cal: 340, protein: 24, estimatedPrice: 12 },
      { name: "Clam Chowder (cup)", description: "New England style — moderate cal for a cup", cal: 200, protein: 8, estimatedPrice: 7 },
      { name: "Grilled Salmon Fillet", description: "Wild salmon, omega-3 rich", cal: 350, protein: 34, estimatedPrice: 16 },
    ],
  },
];

const DOHMH_CUISINE_MAP: Record<string, string> = {
  "delicatessen": "deli",
  "sandwiches": "sandwiches",
  "sandwiches/salads/mixed buffet": "sandwiches",
  "bagels/pretzels": "deli",
  "pizza": "pizza",
  "pizza/italian": "pizza",
  "italian": "pizza",
  "chinese": "chinese",
  "chinese/cuban": "chinese",
  "chinese/japanese": "chinese",
  "mexican": "mexican",
  "latin american": "mexican",
  "latin (cuban, dominican, puerto rican, south & central american)": "mexican",
  "tex-mex": "mexican",
  "spanish": "mexican",
  "hamburgers": "diner",
  "american": "diner",
  "hotdogs": "diner",
  "soul food": "diner",
  "hotdogs/pretzels": "diner",
  "chicken": "diner",
  "halal": "halal",
  "moroccan": "halal",
  "egyptian": "halal",
  "afghan": "halal",
  "middle eastern": "halal",
  "turkish": "halal",
  "mediterranean": "halal",
  "greek": "halal",
  "lebanese": "halal",
  "indian": "indian",
  "pakistani": "indian",
  "bangladeshi": "indian",
  "japanese": "japanese",
  "sushi": "japanese",
  "korean": "japanese",
  "thai": "chinese",
  "vietnamese/chinese": "chinese",
  "café/coffee/tea": "cafe",
  "cafe/coffee/tea": "cafe",
  "coffee/tea": "cafe",
  "juice, smoothies, fruit salads": "cafe",
  "seafood": "seafood",
  "fish": "seafood",

  // Bakeries & sweets → cafe
  "bakery products/desserts": "cafe",
  "donuts": "cafe",
  "frozen desserts": "cafe",
  "pancakes/waffles": "cafe",
  "ice cream, gelato, yogurt, ices": "cafe",
  "bottled beverages": "cafe",
  "fruits/vegetables": "cafe",
  "soups": "cafe",
  "vegan": "cafe",
  "vegetarian": "cafe",
  "salads": "cafe",

  // Asian catch-alls
  "southeast asian": "chinese",
  "asian/asian fusion": "chinese",
  "asian": "chinese",
  "fusion": "chinese",
  "filipino": "chinese",
  "indonesian": "chinese",
  "hawaiian": "chinese",
  "vietnamese/chinese/southeast asian": "chinese",

  // American variants → diner
  "new american": "diner",
  "irish": "diner",
  "steakhouse": "diner",
  "barbecue": "diner",
  "cajun": "diner",
  "creole": "diner",
  "creole/cajun": "diner",
  "continental": "diner",
  "australian": "diner",
  "english": "diner",
  "southern": "diner",
  "eastern european": "diner",
  "russian": "diner",
  "polish": "diner",
  "german": "diner",

  // Caribbean & Latin → mexican
  "caribbean": "mexican",
  "peruvian": "mexican",
  "brazilian": "mexican",
  "colombian": "mexican",
  "salvadoran": "mexican",
  "ecuadorian": "mexican",
  "guatemalan": "mexican",
  "honduran": "mexican",
  "venezuelan": "mexican",
  "cuban": "mexican",
  "dominican": "mexican",
  "puerto rican": "mexican",

  // Mediterranean & Middle Eastern → halal
  "tapas": "halal",
  "african": "halal",
  "ethiopian": "halal",
  "west african": "halal",
  "north african": "halal",
  "iranian": "halal",

  // Deli-adjacent
  "jewish/kosher": "deli",
  "nuts/confectionary": "deli",
  "pretzels": "deli",

  // Sandwiches catch-all
  "soups/salads/sandwiches": "sandwiches",
  "wraps": "sandwiches",

  // European → pizza (closest Italian template)
  "french": "pizza",
  "new french": "pizza",
  "portuguese": "pizza",
  "scandinavian": "pizza",
};

export function matchGenericCategory(cuisineDescription: string): GenericTemplate | null {
  const key = cuisineDescription.toLowerCase().trim();
  const cuisineKey = DOHMH_CUISINE_MAP[key];
  if (!cuisineKey) return null;
  return GENERIC_TEMPLATES.find(t => t.cuisineKey === cuisineKey) ?? null;
}

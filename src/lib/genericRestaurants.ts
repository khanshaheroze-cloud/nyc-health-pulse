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
    // Places-sourced bodegas/delis (Round 7): licensed by NY State Ag &
    // Markets, not DOHMH — they arrive via the Places ingestion path with
    // source:'places' and never carry a letter grade. Cuisine-coherent picks
    // only; the chopped cheese keeps its honest calories and gets the
    // over-600-target label instead of a flattering estimate.
    category: "Bodega",
    cuisineKey: "bodega",
    emoji: "🥪",
    priceRange: 1,
    orderingTip: "Ask for it on whole wheat, easy on the mayo — every bodega will do it.",
    picks: [
      { name: "Egg White Sandwich on Whole Wheat", description: "Egg whites off the grill, whole wheat roll, cheese optional", cal: 350, protein: 20, estimatedPrice: 5 },
      { name: "Turkey & Swiss on Wheat (mustard)", description: "Lean turkey, swiss, mustard instead of mayo", cal: 420, protein: 28, estimatedPrice: 7 },
      { name: "Chopped Cheese — make it lighter", description: "Half the cheese, extra lettuce & tomato — honest calories, over the 600 target", cal: 650, protein: 32, estimatedPrice: 8 },
      { name: "Greek Yogurt + Banana (cold case)", description: "Grab-and-go protein from the cold case", cal: 250, protein: 15, estimatedPrice: 4 },
    ],
  },
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
      // Leaner canonical Italian orders — a 550-cal cheese casserole is not the
      // healthy archetype. (Removed Lasagna + Chicken-Parm-over-pasta headliners.)
      // Picks must be dishes a pizzeria/red-sauce spot actually serves AND
      // price ≤ $15 — this template feeds an under-$15 product (July 5 audit:
      // Carmine's showed "$16 est." 400px under the under-$15 headline).
      { name: "Grilled Chicken + Sautéed Greens", description: "Simple grilled chicken with a vegetable side, hold the pasta", cal: 420, protein: 40, estimatedPrice: 13 },
      { name: "Minestrone + Side Salad", description: "Vegetable-and-bean soup with a garden salad", cal: 330, protein: 14, estimatedPrice: 11 },
      { name: "Antipasto Plate (meats, mozzarella, veg)", description: "Cured meats, fresh mozzarella, marinated vegetables", cal: 420, protein: 24, estimatedPrice: 13 },
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
    // Round 6: bagel shops were licensed as Diner and got grilled-chicken
    // picks. Breakfast picks carry the bagel; lunch picks are the sandwich
    // counter every NYC bagel shop actually runs.
    category: "Bagel Shop",
    cuisineKey: "bagels",
    emoji: "🥯",
    priceRange: 1,
    orderingTip: "Egg whites on whole wheat beats a BEC on a plain bagel (−150 cal). Scooped + light schmear saves another ~120.",
    picks: [
      { name: "Egg White & Cheese Bagel (whole wheat)", description: "Egg whites, cheese, whole-wheat bagel", cal: 380, protein: 22, estimatedPrice: 7 },
      { name: "Lox Bagel (no cream cheese)", description: "Nova lox, tomato, onion, capers on whole wheat — skip the schmear", cal: 400, protein: 26, estimatedPrice: 12 },
      { name: "Whole-Wheat Bagel with Peanut Butter", description: "Grab-and-go breakfast", cal: 450, protein: 14, estimatedPrice: 5 },
      { name: "Turkey Sandwich (whole wheat, mustard)", description: "From the sandwich counter — on a scooped bagel or wheat bread", cal: 380, protein: 28, estimatedPrice: 9 },
      { name: "Tuna Salad Sandwich (scooped)", description: "Scooped bagel or wheat bread, light mayo tuna", cal: 420, protein: 24, estimatedPrice: 9 },
      { name: "Grilled Chicken Sandwich", description: "Grilled chicken, lettuce, tomato from the deli case", cal: 380, protein: 34, estimatedPrice: 10 },
    ],
  },
  {
    // Round 6: "The Inkan" (Peruvian) was getting the Mexican taco template —
    // Peruvian places don't serve tacos. Rotisserie chicken is the anchor.
    category: "Peruvian",
    cuisineKey: "peruvian",
    emoji: "🍗",
    priceRange: 2,
    orderingTip: "Pollo a la brasa 1/4 white meat (no skin) + salad is the order. Ají verde is only ~30 cal — the fried sides are where it slips.",
    picks: [
      { name: "Pollo a la Brasa (1/4 white, no skin) + Salad", description: "Rotisserie chicken with a side salad instead of fries", cal: 380, protein: 42, estimatedPrice: 13 },
      { name: "Lomo Saltado (light rice)", description: "Beef stir-fry — ask for half rice, extra vegetables", cal: 550, protein: 34, estimatedPrice: 14 },
      { name: "Ceviche Mixto", description: "Citrus-cured fish and seafood — lean protein, no oil", cal: 280, protein: 26, estimatedPrice: 14 },
      { name: "Pollo a la Brasa (1/4) + Beans", description: "Rotisserie quarter with beans instead of fries", cal: 480, protein: 40, estimatedPrice: 12 },
    ],
  },
  {
    // Round 6: Caribbean/South-American cuisines used to borrow the Mexican
    // TACO template. Pan-Latin plates are the real menu shape.
    category: "Latin",
    cuisineKey: "latin",
    emoji: "🥘",
    priceRange: 1,
    orderingTip: "Grilled or rotisserie chicken with beans is the anchor order — half the rice, skip the fried sides (tostones +300 cal).",
    picks: [
      { name: "Grilled Chicken + Rice & Beans (half rice)", description: "Ask for half rice, double beans", cal: 520, protein: 38, estimatedPrice: 11 },
      { name: "Roast Pork (Pernil) + Black Beans + Salad", description: "Lean cut, beans, side salad — skip the rice", cal: 480, protein: 32, estimatedPrice: 11 },
      { name: "Rotisserie Chicken (1/4) + Beans", description: "Quarter chicken, beans, no fried sides", cal: 430, protein: 36, estimatedPrice: 10 },
      { name: "Grilled Fish + Salad", description: "Grilled white fish with salad, dressing on the side", cal: 340, protein: 30, estimatedPrice: 12 },
      { name: "Chicken Soup (Sancocho, bowl)", description: "Hearty broth-based soup with chicken and root vegetables", cal: 320, protein: 22, estimatedPrice: 9 },
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
      { name: "Grilled Salmon Fillet", description: "Wild salmon, omega-3 rich", cal: 350, protein: 34, estimatedPrice: 15 },
    ],
  },
];

const DOHMH_CUISINE_MAP: Record<string, string> = {
  "delicatessen": "deli",
  "sandwiches": "sandwiches",
  "sandwiches/salads/mixed buffet": "sandwiches",
  "bagels/pretzels": "bagels",
  "pizza": "pizza",
  "pizza/italian": "pizza",
  "italian": "pizza",
  "chinese": "chinese",
  "chinese/cuban": "chinese",
  "chinese/japanese": "chinese",
  // Only actual Mexican/Tex-Mex cuisines get the taco template (July 6
  // audit: "The Inkan", Peruvian, was serving taco picks). The rest of the
  // Latin family gets pan-Latin plates; Peruvian gets pollo a la brasa.
  "mexican": "mexican",
  "tex-mex": "mexican",
  "latin american": "latin",
  "latin (cuban, dominican, puerto rican, south & central american)": "latin",
  "spanish": "latin",
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

  // Caribbean & Latin → pan-Latin plates (NOT tacos); Peruvian → its own
  "caribbean": "latin",
  "peruvian": "peruvian",
  "brazilian": "latin",
  "colombian": "latin",
  "salvadoran": "latin",
  "ecuadorian": "latin",
  "guatemalan": "latin",
  "honduran": "latin",
  "venezuelan": "latin",
  "cuban": "latin",
  "dominican": "latin",
  "puerto rican": "latin",

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

  // French leans café/bistro (breakfast pastries, eggs, salads) — NOT the
  // pizza/Italian template, which used to hand Maman a "Lasagna" pick.
  "french": "cafe",
  "new french": "cafe",
  "portuguese": "pizza",
  "scandinavian": "cafe",
};

/* Category chips must tell the truth about the VENUE, not the template family
 * that supplies its picks (July 5 audit: Havana Central — Cuban — wore a
 * "MEXICAN" chip because Cuban borrows the Mexican pick template). Long DOHMH
 * descriptors get a short display form; everything else passes through. */
const CUISINE_DISPLAY_OVERRIDES: Record<string, string> = {
  "latin (cuban, dominican, puerto rican, south & central american)": "Latin American",
  "café/coffee/tea": "Café",
  "cafe/coffee/tea": "Café",
  "coffee/tea": "Café",
  "juice, smoothies, fruit salads": "Juice & Smoothies",
  "sandwiches/salads/mixed buffet": "Sandwiches",
  "soups/salads/sandwiches": "Sandwiches",
  "pizza/italian": "Pizza",
  "bagels/pretzels": "Bagels",
  "hotdogs/pretzels": "Hot Dogs",
  "jewish/kosher": "Kosher",
  "bakery products/desserts": "Bakery",
  "ice cream, gelato, yogurt, ices": "Ice Cream",
  "delicatessen": "Deli",
  "chinese/cuban": "Chinese",
  "chinese/japanese": "Chinese",
  "vietnamese/chinese": "Vietnamese",
  "asian/asian fusion": "Asian Fusion",
  "creole/cajun": "Creole",
};

export function displayCuisine(cuisineDescription: string): string {
  const key = (cuisineDescription || "").toLowerCase().trim();
  if (!key || key === "not listed/not applicable") return "";
  const override = CUISINE_DISPLAY_OVERRIDES[key];
  if (override) return override;
  // Title-case the raw descriptor ("AMERICAN" → "American", "middle eastern" → "Middle Eastern")
  return key.replace(/(^|[\s/(-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

/** Look up a template by cuisineKey directly (used by the classification
 *  override path). Returns null for the sentinel "none". */
export function templateByCuisineKey(cuisineKey: string): GenericTemplate | null {
  if (cuisineKey === "none") return null;
  return GENERIC_TEMPLATES.find(t => t.cuisineKey === cuisineKey) ?? null;
}

export function matchGenericCategory(cuisineDescription: string): GenericTemplate | null {
  const key = cuisineDescription.toLowerCase().trim();
  const cuisineKey = DOHMH_CUISINE_MAP[key];
  if (!cuisineKey) return null;
  return GENERIC_TEMPLATES.find(t => t.cuisineKey === cuisineKey) ?? null;
}

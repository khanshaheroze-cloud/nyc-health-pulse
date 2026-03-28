// ─────────────────────────────────────────────────────────────
// Restaurant Meal Builder — Nutrition Data
// Used by the interactive meal builder UI on the /nutrition page
// ─────────────────────────────────────────────────────────────

// ── Interfaces ───────────────────────────────────────────────

export interface BuilderIngredient {
  id: string;
  name: string;
  cal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
}

export interface BuilderCategory {
  id: string;
  label: string;
  type: "radio" | "check" | "quantity"; // radio = pick one, check = toggle multiple, quantity = 0/1/2
  items: BuilderIngredient[];
  required?: boolean;
  max?: number; // max selections for "check" type
}

export interface BuilderPreset {
  name: string;
  emoji?: string;
  description: string;
  selections: Record<string, string[]>; // categoryId -> item ids
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RestaurantBuilder {
  id: string;
  name: string;
  emoji: string;
  color: string; // accent color for the builder UI
  categories: BuilderCategory[];
  presets: BuilderPreset[];
  disclaimer: string;
  year: string; // data source year
}

export interface GenericModifier {
  id: string;
  label: string;
  action: "add" | "remove";
  calChange: number;
  proteinChange?: number;
  fatChange?: number;
  carbsChange?: number;
}

// ── Trigger Detection ────────────────────────────────────────

export const RESTAURANT_TRIGGERS: Record<string, string[]> = {
  chipotle: ["chipotle", "chipotle bowl", "chipotle burrito", "chipotle tacos"],
  cava: ["cava bowl", "cava pita", "cava salad", "cava"],
  sweetgreen: ["sweetgreen", "sweet green"],
  pizza: ["pizza", "dominos", "domino's", "papa johns", "papa john's", "pizza hut", "dollar slice", "nyc pizza", "cheese pizza", "pepperoni pizza"],
  subway: ["subway", "subway sandwich", "subway sub"],
  shakeshack: ["shake shack", "shakeshack", "shack burger", "shackburger"],
  halal: ["halal", "halal cart", "halal guys", "chicken over rice", "lamb over rice", "combo over rice", "street cart", "food cart", "street meat"],
  starbucks: ["starbucks", "starbucks latte", "starbucks coffee", "frappuccino", "frapp", "starbucks protein milk"],
  dunkin: ["dunkin", "dunkin donuts", "dunkin'", "dunkin donut"],
  chopt: ["chopt", "chopt salad"],
};

// Word-boundary-aware matching: "cava" alone won't match inside "excavation"
// We check that the trigger is either at the start, or preceded by a space/start-of-string
function matchesTrigger(query: string, trigger: string): boolean {
  const idx = query.indexOf(trigger);
  if (idx === -1) return false;
  // Must be at start or preceded by space
  return idx === 0 || query[idx - 1] === " ";
}

export function detectRestaurantTrigger(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  for (const [restaurant, triggers] of Object.entries(RESTAURANT_TRIGGERS)) {
    for (const trigger of triggers) {
      if (matchesTrigger(q, trigger)) return restaurant;
    }
  }
  return null;
}

// ── Builder Hint Parser ──────────────────────────────────────
// Parses natural-language modifiers from a query string, e.g.
// "chipotle bowl double chicken sour cream no rice"
// Returns partial selections keyed by category id.

const HINT_MAPS: Record<string, Record<string, { category: string; id: string }>> = {
  chipotle: {
    chicken: { category: "proteins", id: "chicken" },
    steak: { category: "proteins", id: "steak" },
    barbacoa: { category: "proteins", id: "barbacoa" },
    carnitas: { category: "proteins", id: "carnitas" },
    sofritas: { category: "proteins", id: "sofritas" },
    "white rice": { category: "rice", id: "white_rice" },
    "brown rice": { category: "rice", id: "brown_rice" },
    rice: { category: "rice", id: "white_rice" },
    "black beans": { category: "beans", id: "black_beans" },
    "pinto beans": { category: "beans", id: "pinto_beans" },
    beans: { category: "beans", id: "black_beans" },
    "sour cream": { category: "toppings", id: "sour_cream" },
    guac: { category: "toppings", id: "guacamole" },
    guacamole: { category: "toppings", id: "guacamole" },
    queso: { category: "toppings", id: "queso" },
    cheese: { category: "toppings", id: "cheese" },
    lettuce: { category: "toppings", id: "lettuce" },
    "corn salsa": { category: "toppings", id: "corn_salsa" },
    salsa: { category: "toppings", id: "fresh_salsa" },
    "fajita veggies": { category: "toppings", id: "fajita_veggies" },
    veggies: { category: "toppings", id: "fajita_veggies" },
    burrito: { category: "vessel", id: "burrito" },
    bowl: { category: "vessel", id: "bowl" },
    salad: { category: "vessel", id: "salad" },
    tacos: { category: "vessel", id: "tacos_crispy" },
    "soft tacos": { category: "vessel", id: "tacos_soft" },
    chips: { category: "sides", id: "chips" },
  },
  cava: {
    chicken: { category: "proteins", id: "grilled_chicken" },
    "grilled chicken": { category: "proteins", id: "grilled_chicken" },
    "harissa chicken": { category: "proteins", id: "harissa_chicken" },
    meatballs: { category: "proteins", id: "grilled_meatballs" },
    "lamb meatballs": { category: "proteins", id: "spicy_lamb_meatballs" },
    lamb: { category: "proteins", id: "braised_lamb" },
    steak: { category: "proteins", id: "grilled_steak" },
    falafel: { category: "proteins", id: "falafel" },
    hummus: { category: "dips", id: "hummus" },
    "crazy feta": { category: "dips", id: "crazy_feta" },
    tzatziki: { category: "dips", id: "tzatziki" },
    pita: { category: "bases", id: "pita" },
  },
  sweetgreen: {
    chicken: { category: "proteins", id: "roasted_chicken" },
    "blackened chicken": { category: "proteins", id: "blackened_chicken" },
    salmon: { category: "proteins", id: "roasted_salmon" },
    tofu: { category: "proteins", id: "roasted_tofu" },
    steak: { category: "proteins", id: "roasted_steak" },
  },
  pizza: {
    pepperoni: { category: "toppings", id: "pepperoni" },
    sausage: { category: "toppings", id: "sausage" },
    mushroom: { category: "toppings", id: "mushrooms" },
    mushrooms: { category: "toppings", id: "mushrooms" },
    "extra cheese": { category: "toppings", id: "extra_cheese" },
    bacon: { category: "toppings", id: "bacon" },
    "hot honey": { category: "toppings", id: "hot_honey" },
    pineapple: { category: "toppings", id: "pineapple" },
  },
  subway: {
    turkey: { category: "proteins", id: "turkey" },
    chicken: { category: "proteins", id: "rotisserie_chicken" },
    "rotisserie chicken": { category: "proteins", id: "rotisserie_chicken" },
    bmt: { category: "proteins", id: "italian_bmt" },
    "italian bmt": { category: "proteins", id: "italian_bmt" },
    steak: { category: "proteins", id: "sub_steak" },
    tuna: { category: "proteins", id: "tuna" },
    meatball: { category: "proteins", id: "meatball" },
    teriyaki: { category: "proteins", id: "chicken_teriyaki" },
    "chicken teriyaki": { category: "proteins", id: "chicken_teriyaki" },
    wheat: { category: "bread", id: "wheat_6" },
    italian: { category: "bread", id: "italian_6" },
    flatbread: { category: "bread", id: "flatbread_6" },
    wrap: { category: "bread", id: "wrap" },
    footlong: { category: "bread", id: "footlong_italian" },
    mayo: { category: "sauces", id: "mayo" },
    mayonnaise: { category: "sauces", id: "mayo" },
    mustard: { category: "sauces", id: "mustard" },
    ranch: { category: "sauces", id: "ranch" },
    chipotle: { category: "sauces", id: "chipotle_southwest" },
    sauce: { category: "sauces", id: "sweet_onion" },
    bacon: { category: "sauces", id: "sub_bacon" },
    avocado: { category: "sauces", id: "sub_avocado" },
    lettuce: { category: "veggies", id: "sub_lettuce" },
    tomato: { category: "veggies", id: "sub_tomato" },
    onion: { category: "veggies", id: "sub_onion" },
    peppers: { category: "veggies", id: "sub_peppers" },
    jalapenos: { category: "veggies", id: "sub_jalapenos" },
    spinach: { category: "veggies", id: "sub_spinach" },
  },
  shakeshack: {
    shackburger: { category: "burger", id: "shackburger" },
    smokeshack: { category: "burger", id: "smokeshack" },
    "shack stack": { category: "burger", id: "shack_stack" },
    "chicken shack": { category: "burger", id: "chicken_shack" },
    "veggie shack": { category: "burger", id: "veggie_shack" },
    "hot dog": { category: "burger", id: "hot_dog" },
    bacon: { category: "addons", id: "ss_bacon" },
    "extra cheese": { category: "addons", id: "ss_extra_cheese" },
    avocado: { category: "addons", id: "ss_avocado" },
    fries: { category: "sides", id: "ss_fries" },
    "cheese fries": { category: "sides", id: "ss_cheese_fries" },
    shake: { category: "shakes", id: "ss_vanilla_shake" },
  },
  halal: {
    chicken: { category: "protein", id: "h_chicken" },
    lamb: { category: "protein", id: "h_lamb" },
    combo: { category: "protein", id: "h_combo" },
    falafel: { category: "protein", id: "h_falafel" },
    "yellow rice": { category: "base", id: "h_yellow_rice" },
    "white rice": { category: "base", id: "h_white_rice" },
    rice: { category: "base", id: "h_yellow_rice" },
    salad: { category: "base", id: "h_salad" },
    "white sauce": { category: "white_sauce", id: "h_ws_full" },
    "hot sauce": { category: "hot_sauce", id: "h_hs_full" },
    pita: { category: "toppings", id: "h_pita" },
  },
  starbucks: {
    latte: { category: "drink_base", id: "sb_latte" },
    cappuccino: { category: "drink_base", id: "sb_cappuccino" },
    americano: { category: "drink_base", id: "sb_americano" },
    "cold brew": { category: "drink_base", id: "sb_cold_brew" },
    frappuccino: { category: "drink_base", id: "sb_mocha_frapp" },
    chai: { category: "drink_base", id: "sb_chai" },
    matcha: { category: "drink_base", id: "sb_matcha" },
    oat: { category: "milk", id: "sb_oat" },
    almond: { category: "milk", id: "sb_almond" },
    "protein milk": { category: "milk", id: "sb_protein_milk" },
    protein: { category: "milk", id: "sb_protein_milk" },
    vanilla: { category: "sweetener", id: "sb_vanilla_syrup" },
    caramel: { category: "sweetener", id: "sb_caramel_syrup" },
    whip: { category: "extras", id: "sb_whipped_cream" },
    "whipped cream": { category: "extras", id: "sb_whipped_cream" },
  },
  dunkin: {
    coffee: { category: "drink_base", id: "dk_hot_coffee" },
    "iced coffee": { category: "drink_base", id: "dk_iced_coffee" },
    latte: { category: "drink_base", id: "dk_latte" },
    "iced latte": { category: "drink_base", id: "dk_iced_latte" },
    "cold brew": { category: "drink_base", id: "dk_cold_brew" },
    cream: { category: "cream_milk", id: "dk_cream" },
    oat: { category: "cream_milk", id: "dk_oat" },
    "protein milk": { category: "cream_milk", id: "dk_protein_milk" },
    protein: { category: "cream_milk", id: "dk_protein_milk" },
    sugar: { category: "sweetener", id: "dk_sugar_1" },
    donut: { category: "food", id: "dk_glazed" },
    bagel: { category: "food", id: "dk_bagel_plain" },
    "bacon egg cheese": { category: "food", id: "dk_bec_croissant" },
    "hash browns": { category: "food", id: "dk_hash_browns" },
  },
  chopt: {
    chicken: { category: "protein", id: "ch_grilled_chicken" },
    salmon: { category: "protein", id: "ch_roasted_salmon" },
    steak: { category: "protein", id: "ch_grilled_steak" },
    tofu: { category: "protein", id: "ch_roasted_tofu" },
    avocado: { category: "toppings", id: "ch_avocado" },
    corn: { category: "toppings", id: "ch_corn" },
    chickpeas: { category: "toppings", id: "ch_chickpeas" },
    croutons: { category: "toppings", id: "ch_croutons" },
    feta: { category: "toppings", id: "ch_feta" },
    ranch: { category: "dressing", id: "ch_ranch" },
    caesar: { category: "dressing", id: "ch_mexican_caesar" },
    wrap: { category: "base", id: "ch_wrap" },
    bowl: { category: "base", id: "ch_grain_bowl" },
  },
};

const NEGATION_WORDS = ["no", "without", "skip", "hold", "remove"];
const DOUBLE_WORDS = ["double", "extra", "2x"];

export function parseBuilderHints(
  query: string,
  restaurantId: string,
): Record<string, string[]> {
  const q = query.toLowerCase().trim();
  const hints: Record<string, string[]> = {};
  const map = HINT_MAPS[restaurantId];
  if (!map) return hints;

  // Check for negations ("no rice", "without beans")
  for (const neg of NEGATION_WORDS) {
    for (const [keyword, target] of Object.entries(map)) {
      const pattern = `${neg} ${keyword}`;
      if (q.includes(pattern)) {
        // Set the category to empty to indicate removal
        hints[target.category] = [];
      }
    }
  }

  // Check for doubles ("double chicken")
  for (const dbl of DOUBLE_WORDS) {
    for (const [keyword, target] of Object.entries(map)) {
      const pattern = `${dbl} ${keyword}`;
      if (q.includes(pattern)) {
        if (!hints[target.category]) hints[target.category] = [];
        hints[target.category].push(target.id, target.id);
      }
    }
  }

  // Check for plain mentions (only if not already handled by negation/double)
  for (const [keyword, target] of Object.entries(map)) {
    // Skip if already handled
    const alreadyHandled =
      NEGATION_WORDS.some((n) => q.includes(`${n} ${keyword}`)) ||
      DOUBLE_WORDS.some((d) => q.includes(`${d} ${keyword}`));
    if (alreadyHandled) continue;

    if (q.includes(keyword)) {
      if (!hints[target.category]) hints[target.category] = [];
      hints[target.category].push(target.id);
    }
  }

  return hints;
}

// ── Generic Modifiers ────────────────────────────────────────

export const GENERIC_MODIFIERS: GenericModifier[] = [
  { id: "extra_cheese", label: "Extra cheese", action: "add", calChange: 100, proteinChange: 5, fatChange: 8 },
  { id: "double_protein", label: "Double protein", action: "add", calChange: 200, proteinChange: 25, fatChange: 8 },
  { id: "add_guac", label: "Add guacamole", action: "add", calChange: 230, proteinChange: 3, fatChange: 22, carbsChange: 8 },
  { id: "add_avocado", label: "Add avocado", action: "add", calChange: 80, proteinChange: 1, fatChange: 7, carbsChange: 4 },
  { id: "add_bacon", label: "Add bacon", action: "add", calChange: 80, proteinChange: 6, fatChange: 6 },
  { id: "add_sour_cream", label: "Add sour cream", action: "add", calChange: 110, proteinChange: 2, fatChange: 9 },
  { id: "remove_bread", label: "Remove bread/tortilla", action: "remove", calChange: -250, proteinChange: -8, fatChange: -4, carbsChange: -40 },
  { id: "sauce_on_side", label: "Sauce on the side (half used)", action: "remove", calChange: -60, fatChange: -6 },
  { id: "half_rice", label: "Half rice", action: "remove", calChange: -120, carbsChange: -20 },
  { id: "no_rice", label: "No rice", action: "remove", calChange: -210, carbsChange: -38 },
  { id: "sub_greens", label: "Sub greens for rice", action: "remove", calChange: -200, carbsChange: -36 },
  { id: "large_size", label: "Large / upsized", action: "add", calChange: 300, proteinChange: 12, fatChange: 10, carbsChange: 20 },
  { id: "kids_size", label: "Kids / half portion", action: "remove", calChange: -999 }, // special: means 50% of total
];

// ── Chipotle ─────────────────────────────────────────────────

const CHIPOTLE: RestaurantBuilder = {
  id: "chipotle",
  name: "Chipotle",
  emoji: "🌯",
  color: "#A81612",
  categories: [
    {
      id: "vessel",
      label: "Vessel",
      type: "radio",
      required: true,
      items: [
        { id: "bowl", name: "Bowl", cal: 0, protein: 0, fat: 0, carbs: 0 },
        { id: "burrito", name: "Burrito (flour tortilla)", cal: 320, protein: 10, fat: 9, carbs: 50 },
        { id: "tacos_crispy", name: "Tacos (3 crispy corn)", cal: 210, protein: 3, fat: 9, carbs: 27 },
        { id: "tacos_soft", name: "Tacos (3 flour soft)", cal: 255, protein: 6, fat: 7.5, carbs: 39 },
        { id: "salad", name: "Salad", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "rice",
      label: "Rice",
      type: "radio",
      items: [
        { id: "white_rice", name: "White Rice", cal: 210, protein: 4, fat: 5, carbs: 40 },
        { id: "brown_rice", name: "Brown Rice", cal: 210, protein: 4, fat: 6, carbs: 36 },
        { id: "no_rice", name: "No Rice", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "beans",
      label: "Beans",
      type: "radio",
      items: [
        { id: "black_beans", name: "Black Beans", cal: 130, protein: 8, fat: 1, carbs: 22 },
        { id: "pinto_beans", name: "Pinto Beans", cal: 130, protein: 8, fat: 1.5, carbs: 22 },
        { id: "no_beans", name: "No Beans", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "proteins",
      label: "Protein",
      type: "quantity",
      items: [
        { id: "chicken", name: "Chicken", cal: 180, protein: 32, fat: 7, carbs: 1 },
        { id: "steak", name: "Steak", cal: 150, protein: 21, fat: 6, carbs: 1 },
        { id: "barbacoa", name: "Barbacoa", cal: 170, protein: 24, fat: 7, carbs: 2 },
        { id: "carnitas", name: "Carnitas", cal: 210, protein: 23, fat: 12, carbs: 1 },
        { id: "sofritas", name: "Sofritas", cal: 150, protein: 8, fat: 10, carbs: 9 },
      ],
    },
    {
      id: "toppings",
      label: "Toppings",
      type: "check",
      items: [
        { id: "fresh_salsa", name: "Fresh Tomato Salsa", cal: 25, protein: 1, fat: 0, carbs: 4 },
        { id: "corn_salsa", name: "Roasted Chili-Corn Salsa", cal: 80, protein: 2, fat: 1, carbs: 15 },
        { id: "green_salsa", name: "Tomatillo Green-Chili Salsa", cal: 15, protein: 0, fat: 0, carbs: 3 },
        { id: "red_salsa", name: "Tomatillo Red-Chili Salsa", cal: 30, protein: 1, fat: 0, carbs: 4 },
        { id: "sour_cream", name: "Sour Cream", cal: 110, protein: 2, fat: 9, carbs: 2 },
        { id: "cheese", name: "Cheese", cal: 110, protein: 6, fat: 8, carbs: 1 },
        { id: "guacamole", name: "Guacamole", cal: 230, protein: 3, fat: 22, carbs: 8 },
        { id: "queso", name: "Queso Blanco", cal: 120, protein: 5, fat: 9, carbs: 4 },
        { id: "fajita_veggies", name: "Fajita Veggies", cal: 20, protein: 1, fat: 0, carbs: 4 },
        { id: "lettuce", name: "Romaine Lettuce", cal: 5, protein: 0, fat: 0, carbs: 1 },
      ],
    },
    {
      id: "sides",
      label: "Sides",
      type: "check",
      items: [
        { id: "chips", name: "Chips", cal: 540, protein: 7, fat: 26, carbs: 68 },
        { id: "chips_guac", name: "Chips & Guac", cal: 770, protein: 10, fat: 48, carbs: 76 },
        { id: "chips_queso", name: "Chips & Queso", cal: 660, protein: 12, fat: 35, carbs: 72 },
        { id: "vinaigrette", name: "Chipotle Honey Vinaigrette", cal: 220, protein: 0, fat: 22, carbs: 6 },
      ],
    },
  ],
  presets: [
    {
      name: "The Standard",
      emoji: "🍚",
      description: "Classic chicken bowl with all the fixings",
      selections: {
        vessel: ["bowl"],
        rice: ["white_rice"],
        beans: ["black_beans"],
        proteins: ["chicken"],
        toppings: ["fresh_salsa", "corn_salsa", "cheese", "sour_cream", "lettuce"],
      },
      cal: 685,
      protein: 55,
      carbs: 89,
      fat: 31,
    },
    {
      name: "High Protein",
      emoji: "💪",
      description: "Double chicken, no rice",
      selections: {
        vessel: ["bowl"],
        rice: ["no_rice"],
        beans: ["black_beans"],
        proteins: ["chicken", "chicken"],
        toppings: ["fresh_salsa", "lettuce"],
      },
      cal: 495,
      protein: 73,
      carbs: 28,
      fat: 15,
    },
    {
      name: "Loaded",
      emoji: "🤤",
      description: "Steak bowl with guac, queso, cheese, sour cream",
      selections: {
        vessel: ["bowl"],
        rice: ["white_rice"],
        beans: ["black_beans"],
        proteins: ["steak"],
        toppings: ["guacamole", "queso", "cheese", "sour_cream", "corn_salsa"],
      },
      cal: 1105,
      protein: 51,
      carbs: 97,
      fat: 62,
    },
    {
      name: "Keto",
      emoji: "🥑",
      description: "Low-carb chicken bowl, no rice or beans",
      selections: {
        vessel: ["bowl"],
        rice: ["no_rice"],
        beans: ["no_beans"],
        proteins: ["chicken"],
        toppings: ["cheese", "sour_cream", "lettuce", "fresh_salsa"],
      },
      cal: 430,
      protein: 41,
      carbs: 5,
      fat: 24,
    },
  ],
  disclaimer: "Nutrition data based on Chipotle published nutrition info. Actual values may vary by location and serving size.",
  year: "2025",
};

// ── CAVA ─────────────────────────────────────────────────────

const CAVA: RestaurantBuilder = {
  id: "cava",
  name: "CAVA",
  emoji: "🫒",
  color: "#1D6F42",
  categories: [
    {
      id: "bases",
      label: "Base",
      type: "radio",
      required: true,
      items: [
        { id: "saffron_rice", name: "Saffron Rice", cal: 290, protein: 6, fat: 6, carbs: 54 },
        { id: "brown_rice_quinoa", name: "Brown Rice + Quinoa", cal: 310, protein: 8, fat: 10, carbs: 48 },
        { id: "black_lentils", name: "Black Lentils", cal: 260, protein: 17, fat: 7, carbs: 37 },
        { id: "splendid_greens", name: "Splendid Greens", cal: 30, protein: 2, fat: 0, carbs: 5 },
        { id: "pita", name: "Pita", cal: 320, protein: 12, fat: 8, carbs: 52 },
        { id: "mini_pitas", name: "Mini Pitas (3)", cal: 270, protein: 9, fat: 4, carbs: 48 },
      ],
    },
    {
      id: "proteins",
      label: "Protein",
      type: "quantity",
      items: [
        { id: "grilled_chicken", name: "Grilled Chicken", cal: 250, protein: 38, fat: 10, carbs: 1 },
        { id: "harissa_chicken", name: "Harissa Honey Chicken", cal: 260, protein: 35, fat: 10, carbs: 6 },
        { id: "grilled_meatballs", name: "Grilled Meatballs", cal: 190, protein: 15, fat: 12, carbs: 5 },
        { id: "spicy_lamb_meatballs", name: "Spicy Lamb Meatballs", cal: 220, protein: 14, fat: 15, carbs: 6 },
        { id: "braised_lamb", name: "Braised Lamb", cal: 290, protein: 24, fat: 20, carbs: 3 },
        { id: "grilled_steak", name: "Grilled Steak", cal: 280, protein: 30, fat: 18, carbs: 1 },
        { id: "falafel", name: "Falafel (6 pieces)", cal: 320, protein: 10, fat: 20, carbs: 26 },
      ],
    },
    {
      id: "dips",
      label: "Dips & Spreads",
      type: "check",
      items: [
        { id: "hummus", name: "Hummus", cal: 100, protein: 4, fat: 7, carbs: 8 },
        { id: "crazy_feta", name: "Crazy Feta", cal: 90, protein: 3, fat: 8, carbs: 2 },
        { id: "tzatziki", name: "Tzatziki", cal: 60, protein: 2, fat: 4, carbs: 4 },
        { id: "harissa", name: "Harissa", cal: 30, protein: 0, fat: 2, carbs: 3 },
        { id: "roasted_eggplant", name: "Roasted Eggplant Dip", cal: 50, protein: 1, fat: 3, carbs: 5 },
      ],
    },
    {
      id: "toppings",
      label: "Toppings",
      type: "check",
      items: [
        { id: "avocado", name: "Avocado", cal: 160, protein: 2, fat: 15, carbs: 9 },
        { id: "crumbled_feta", name: "Crumbled Feta", cal: 50, protein: 3, fat: 4, carbs: 1 },
        { id: "kalamata_olives", name: "Kalamata Olives", cal: 45, protein: 0, fat: 5, carbs: 1 },
        { id: "fire_roasted_corn", name: "Fire-Roasted Corn", cal: 40, protein: 1, fat: 2, carbs: 6 },
        { id: "cabbage_slaw", name: "Cabbage Slaw", cal: 35, protein: 1, fat: 2, carbs: 4 },
        { id: "pita_crisps", name: "Pita Crisps", cal: 120, protein: 2, fat: 5, carbs: 16 },
        { id: "diced_cucumber", name: "Diced Cucumber", cal: 15, protein: 1, fat: 0, carbs: 3 },
        { id: "pickled_onions", name: "Pickled Onions", cal: 10, protein: 0, fat: 0, carbs: 2 },
        { id: "tomato_onion", name: "Tomato & Onion", cal: 15, protein: 0, fat: 0, carbs: 3 },
        { id: "shredded_romaine", name: "Shredded Romaine", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "basil", name: "Fresh Basil", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "dressings",
      label: "Dressing",
      type: "radio",
      items: [
        { id: "lemon_herb_tahini", name: "Lemon Herb Tahini", cal: 120, protein: 2, fat: 11, carbs: 4 },
        { id: "greek_vinaigrette", name: "Greek Vinaigrette", cal: 110, protein: 0, fat: 12, carbs: 2 },
        { id: "skhug", name: "Skhug", cal: 15, protein: 0, fat: 1, carbs: 1 },
      ],
    },
  ],
  presets: [
    {
      name: "Greens + Grilled Chicken",
      emoji: "🥗",
      description: "Light and lean with greens, hummus, and tahini",
      selections: {
        bases: ["splendid_greens"],
        proteins: ["grilled_chicken"],
        dips: ["hummus"],
        toppings: ["crumbled_feta", "diced_cucumber", "tomato_onion"],
        dressings: ["lemon_herb_tahini"],
      },
      cal: 610,
      protein: 49,
      carbs: 24,
      fat: 34,
    },
    {
      name: "Harissa Honey Bowl",
      emoji: "🍯",
      description: "Saffron rice with harissa chicken, feta, corn, and pita crisps",
      selections: {
        bases: ["saffron_rice"],
        proteins: ["harissa_chicken"],
        dips: ["crazy_feta"],
        toppings: ["fire_roasted_corn", "cabbage_slaw", "pita_crisps"],
        dressings: ["lemon_herb_tahini"],
      },
      cal: 895,
      protein: 48,
      carbs: 95,
      fat: 38,
    },
  ],
  disclaimer: "Nutrition data based on CAVA published nutrition info. Actual values may vary.",
  year: "2025",
};

// ── Sweetgreen ───────────────────────────────────────────────

const SWEETGREEN: RestaurantBuilder = {
  id: "sweetgreen",
  name: "Sweetgreen",
  emoji: "🥬",
  color: "#2E7D32",
  categories: [
    {
      id: "bases",
      label: "Base",
      type: "radio",
      required: true,
      items: [
        { id: "wild_rice", name: "Wild Rice", cal: 180, protein: 4, fat: 2, carbs: 36 },
        { id: "warm_quinoa", name: "Warm Quinoa", cal: 190, protein: 6, fat: 4, carbs: 32 },
        { id: "crispy_rice", name: "Crispy Rice", cal: 220, protein: 3, fat: 8, carbs: 34 },
        { id: "spring_mix", name: "Spring Mix", cal: 10, protein: 1, fat: 0, carbs: 2 },
        { id: "shredded_kale", name: "Shredded Kale", cal: 25, protein: 2, fat: 0, carbs: 4 },
        { id: "roasted_sweet_potatoes", name: "Roasted Sweet Potatoes", cal: 140, protein: 2, fat: 4, carbs: 24 },
      ],
    },
    {
      id: "proteins",
      label: "Protein",
      type: "quantity",
      items: [
        { id: "roasted_chicken", name: "Roasted Chicken", cal: 130, protein: 28, fat: 2, carbs: 0 },
        { id: "blackened_chicken", name: "Blackened Chicken", cal: 140, protein: 28, fat: 3, carbs: 1 },
        { id: "roasted_tofu", name: "Roasted Tofu", cal: 150, protein: 14, fat: 9, carbs: 4 },
        { id: "roasted_salmon", name: "Roasted Salmon", cal: 240, protein: 22, fat: 16, carbs: 2 },
        { id: "miso_salmon", name: "Miso-Glazed Salmon", cal: 250, protein: 22, fat: 16, carbs: 4 },
        { id: "roasted_steak", name: "Roasted Steak", cal: 210, protein: 26, fat: 11, carbs: 1 },
      ],
    },
    {
      id: "toppings",
      label: "Toppings",
      type: "check",
      items: [
        { id: "raw_carrots", name: "Raw Carrots", cal: 15, protein: 0, fat: 0, carbs: 3 },
        { id: "shredded_cabbage", name: "Shredded Cabbage", cal: 10, protein: 0, fat: 0, carbs: 2 },
        { id: "cucumbers", name: "Cucumbers", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "tomatoes", name: "Tomatoes", cal: 10, protein: 0, fat: 0, carbs: 2 },
        { id: "roasted_almonds", name: "Roasted Almonds", cal: 110, protein: 4, fat: 10, carbs: 4 },
        { id: "crispy_onions", name: "Crispy Onions", cal: 45, protein: 1, fat: 2, carbs: 6 },
        { id: "tortilla_chips", name: "Tortilla Chips", cal: 130, protein: 2, fat: 7, carbs: 16 },
        { id: "sg_avocado", name: "Avocado", cal: 110, protein: 1, fat: 10, carbs: 6 },
        { id: "warm_broccoli", name: "Warm Broccoli", cal: 40, protein: 3, fat: 2, carbs: 5 },
        { id: "apples", name: "Apples", cal: 15, protein: 0, fat: 0, carbs: 4 },
        { id: "goat_cheese", name: "Goat Cheese", cal: 60, protein: 4, fat: 5, carbs: 0 },
        { id: "shaved_parmesan", name: "Shaved Parmesan", cal: 50, protein: 4, fat: 3, carbs: 1 },
        { id: "hard_boiled_egg", name: "Hard-Boiled Egg", cal: 60, protein: 6, fat: 4, carbs: 0 },
        { id: "spicy_broccoli", name: "Spicy Broccoli", cal: 45, protein: 3, fat: 2, carbs: 5 },
        { id: "shallots", name: "Shallots", cal: 10, protein: 0, fat: 0, carbs: 2 },
      ],
    },
    {
      id: "dressings",
      label: "Dressing",
      type: "radio",
      items: [
        { id: "green_goddess_ranch", name: "Green Goddess Ranch", cal: 140, protein: 1, fat: 14, carbs: 3 },
        { id: "balsamic_vinaigrette", name: "Balsamic Vinaigrette", cal: 130, protein: 0, fat: 12, carbs: 6 },
        { id: "pesto_vinaigrette", name: "Pesto Vinaigrette", cal: 190, protein: 1, fat: 20, carbs: 2 },
        { id: "lime_cilantro_jalapeno", name: "Lime Cilantro Jalapeno", cal: 110, protein: 0, fat: 10, carbs: 4 },
        { id: "miso_sesame_ginger", name: "Miso Sesame Ginger", cal: 130, protein: 1, fat: 12, carbs: 5 },
        { id: "sweetgreen_hot_sauce", name: "Sweetgreen Hot Sauce", cal: 20, protein: 0, fat: 1, carbs: 3 },
        { id: "spicy_cashew", name: "Spicy Cashew", cal: 180, protein: 3, fat: 16, carbs: 6 },
      ],
    },
  ],
  presets: [
    {
      name: "Harvest Bowl",
      emoji: "🍂",
      description: "Wild rice, blackened chicken, roasted sweet potatoes, goat cheese, almonds",
      selections: {
        bases: ["wild_rice"],
        proteins: ["blackened_chicken"],
        toppings: ["roasted_almonds", "goat_cheese", "shredded_cabbage", "apples"],
        dressings: ["balsamic_vinaigrette"],
      },
      cal: 640,
      protein: 39,
      carbs: 55,
      fat: 33,
    },
    {
      name: "Kale Caesar",
      emoji: "🥗",
      description: "Shredded kale, roasted chicken, parmesan, tortilla chips",
      selections: {
        bases: ["shredded_kale"],
        proteins: ["roasted_chicken"],
        toppings: ["shaved_parmesan", "tortilla_chips", "tomatoes"],
        dressings: ["lime_cilantro_jalapeno"],
      },
      cal: 465,
      protein: 35,
      carbs: 26,
      fat: 22,
    },
  ],
  disclaimer: "Nutrition data based on Sweetgreen published nutrition info. Actual values may vary by location.",
  year: "2025",
};

// ── Pizza ────────────────────────────────────────────────────

const PIZZA: RestaurantBuilder = {
  id: "pizza",
  name: "Pizza",
  emoji: "🍕",
  color: "#D32F2F",
  categories: [
    {
      id: "base",
      label: "Base Slice",
      type: "radio",
      required: true,
      items: [
        { id: "nyc_cheese", name: "NYC Cheese Slice", cal: 285, protein: 12, fat: 10, carbs: 36 },
        { id: "dollar_slice", name: "Dollar Slice", cal: 250, protein: 10, fat: 8, carbs: 34 },
        { id: "dominos_cheese", name: "Domino's Cheese", cal: 200, protein: 8, fat: 8, carbs: 25 },
        { id: "papa_johns_cheese", name: "Papa John's Cheese", cal: 210, protein: 8, fat: 8, carbs: 26 },
        { id: "pizza_hut_cheese", name: "Pizza Hut Cheese", cal: 220, protein: 9, fat: 9, carbs: 26 },
        { id: "thin_crust", name: "Thin Crust Cheese", cal: 180, protein: 8, fat: 7, carbs: 20 },
        { id: "deep_dish", name: "Deep Dish Cheese", cal: 340, protein: 13, fat: 14, carbs: 38 },
      ],
    },
    {
      id: "toppings",
      label: "Toppings (per slice)",
      type: "check",
      items: [
        { id: "pepperoni", name: "Pepperoni", cal: 30, protein: 1.5, fat: 2.5, carbs: 0 },
        { id: "sausage", name: "Italian Sausage", cal: 40, protein: 2, fat: 3, carbs: 1 },
        { id: "extra_cheese", name: "Extra Cheese", cal: 50, protein: 3, fat: 4, carbs: 0.5 },
        { id: "mushrooms", name: "Mushrooms", cal: 5, protein: 0.5, fat: 0, carbs: 1 },
        { id: "green_peppers", name: "Green Peppers", cal: 3, protein: 0, fat: 0, carbs: 1 },
        { id: "onions", name: "Onions", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "black_olives", name: "Black Olives", cal: 10, protein: 0, fat: 1, carbs: 0.5 },
        { id: "bacon", name: "Bacon", cal: 35, protein: 2.5, fat: 3, carbs: 0 },
        { id: "ham", name: "Ham", cal: 15, protein: 2, fat: 0.5, carbs: 0 },
        { id: "chicken", name: "Grilled Chicken", cal: 25, protein: 4, fat: 1, carbs: 0 },
        { id: "jalapenos", name: "Jalapenos", cal: 3, protein: 0, fat: 0, carbs: 0.5 },
        { id: "pineapple", name: "Pineapple", cal: 10, protein: 0, fat: 0, carbs: 2.5 },
        { id: "anchovies", name: "Anchovies", cal: 15, protein: 2, fat: 1, carbs: 0 },
        { id: "ricotta", name: "Ricotta", cal: 30, protein: 2, fat: 2, carbs: 1 },
        { id: "fresh_mozzarella", name: "Fresh Mozzarella", cal: 45, protein: 3, fat: 3.5, carbs: 0 },
        { id: "spinach", name: "Spinach", cal: 3, protein: 0.5, fat: 0, carbs: 0 },
        { id: "garlic", name: "Garlic", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "hot_honey", name: "Hot Honey", cal: 25, protein: 0, fat: 0, carbs: 7 },
      ],
    },
    {
      id: "slices",
      label: "Number of Slices",
      type: "quantity",
      items: [
        { id: "slice_count", name: "Slices", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
  ],
  presets: [
    {
      name: "NYC Cheese (1 slice)",
      emoji: "🧀",
      description: "Classic plain NYC cheese slice",
      selections: {
        base: ["nyc_cheese"],
      },
      cal: 285,
      protein: 12,
      carbs: 36,
      fat: 10,
    },
    {
      name: "NYC Pepperoni (1 slice)",
      emoji: "🔴",
      description: "NYC slice with pepperoni",
      selections: {
        base: ["nyc_cheese"],
        toppings: ["pepperoni"],
      },
      cal: 315,
      protein: 13.5,
      carbs: 36,
      fat: 12.5,
    },
    {
      name: "2 Slices Cheese",
      emoji: "✌️",
      description: "Two classic NYC cheese slices",
      selections: {
        base: ["nyc_cheese"],
        slices: ["slice_count", "slice_count"],
      },
      cal: 570,
      protein: 24,
      carbs: 72,
      fat: 20,
    },
    {
      name: "Pepperoni + Extra Cheese (1)",
      emoji: "🍕",
      description: "Loaded pepperoni slice with extra cheese",
      selections: {
        base: ["nyc_cheese"],
        toppings: ["pepperoni", "extra_cheese"],
      },
      cal: 365,
      protein: 16.5,
      carbs: 36.5,
      fat: 17,
    },
    {
      name: "Supreme (1 slice)",
      emoji: "👑",
      description: "Pepperoni, sausage, mushrooms, peppers, onions",
      selections: {
        base: ["nyc_cheese"],
        toppings: ["pepperoni", "sausage", "mushrooms", "green_peppers", "onions"],
      },
      cal: 368,
      protein: 16,
      carbs: 39,
      fat: 15.5,
    },
  ],
  disclaimer: "Nutrition values are per slice. NYC slice = standard 18-inch pie (8 slices). Chain values from published nutrition info.",
  year: "2025",
};

// ── Subway ───────────────────────────────────────────────────

const SUBWAY: RestaurantBuilder = {
  id: "subway",
  name: "Subway",
  emoji: "🥖",
  color: "#008C15",
  categories: [
    {
      id: "bread",
      label: "Bread",
      type: "radio",
      required: true,
      items: [
        { id: "italian_6", name: 'Italian (6")', cal: 200, protein: 7, fat: 2, carbs: 38 },
        { id: "wheat_6", name: '9-Grain Wheat (6")', cal: 200, protein: 8, fat: 2.5, carbs: 36 },
        { id: "herbs_cheese_6", name: 'Italian Herbs & Cheese (6")', cal: 240, protein: 9, fat: 5, carbs: 40 },
        { id: "flatbread_6", name: 'Flatbread (6")', cal: 220, protein: 7, fat: 4, carbs: 38 },
        { id: "footlong_italian", name: "Footlong Italian", cal: 400, protein: 14, fat: 4, carbs: 76 },
        { id: "wrap", name: "Spinach Wrap", cal: 300, protein: 8, fat: 8, carbs: 50 },
        { id: "protein_bowl", name: "Protein Bowl (no bread)", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "proteins",
      label: "Protein",
      type: "radio",
      required: true,
      items: [
        { id: "turkey", name: "Turkey Breast", cal: 60, protein: 9, fat: 1, carbs: 2 },
        { id: "rotisserie_chicken", name: "Rotisserie-Style Chicken", cal: 80, protein: 16, fat: 2, carbs: 0 },
        { id: "italian_bmt", name: "Italian B.M.T.", cal: 180, protein: 10, fat: 12, carbs: 4 },
        { id: "sub_steak", name: "Steak", cal: 110, protein: 14, fat: 4.5, carbs: 3 },
        { id: "tuna", name: "Tuna", cal: 250, protein: 14, fat: 21, carbs: 0 },
        { id: "meatball", name: "Meatball Marinara", cal: 310, protein: 16, fat: 17, carbs: 24 },
        { id: "chicken_teriyaki", name: "Chicken Teriyaki", cal: 110, protein: 16, fat: 2, carbs: 8 },
        { id: "cold_cut", name: "Cold Cut Combo", cal: 130, protein: 8, fat: 8, carbs: 4 },
      ],
    },
    {
      id: "cheese",
      label: "Cheese",
      type: "radio",
      items: [
        { id: "american", name: "American", cal: 40, protein: 2, fat: 3, carbs: 1 },
        { id: "provolone", name: "Provolone", cal: 50, protein: 4, fat: 4, carbs: 0 },
        { id: "pepper_jack", name: "Pepper Jack", cal: 50, protein: 4, fat: 4, carbs: 0 },
        { id: "shredded_mozzarella", name: "Shredded Mozzarella", cal: 45, protein: 3, fat: 3, carbs: 1 },
        { id: "no_cheese", name: "No Cheese", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "veggies",
      label: "Veggies",
      type: "check",
      items: [
        { id: "sub_lettuce", name: "Lettuce", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "sub_tomato", name: "Tomato", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "sub_onion", name: "Onion", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "sub_green_pepper", name: "Green Pepper", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "sub_cucumber", name: "Cucumber", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "sub_pickles", name: "Pickles", cal: 0, protein: 0, fat: 0, carbs: 0 },
        { id: "sub_black_olives", name: "Black Olives", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "sub_jalapenos", name: "Jalapenos", cal: 0, protein: 0, fat: 0, carbs: 0 },
        { id: "sub_spinach", name: "Spinach", cal: 3, protein: 0, fat: 0, carbs: 1 },
        { id: "sub_banana_peppers", name: "Banana Peppers", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "sauces",
      label: "Sauces & Extras",
      type: "check",
      items: [
        { id: "mayo", name: "Mayonnaise", cal: 100, protein: 0, fat: 11, carbs: 0 },
        { id: "light_mayo", name: "Light Mayo", cal: 50, protein: 0, fat: 5, carbs: 1 },
        { id: "mustard", name: "Yellow Mustard", cal: 5, protein: 0, fat: 0, carbs: 0 },
        { id: "ranch", name: "Ranch", cal: 110, protein: 0, fat: 12, carbs: 1 },
        { id: "sweet_onion", name: "Sweet Onion Sauce", cal: 40, protein: 0, fat: 0, carbs: 9 },
        { id: "chipotle_southwest", name: "Chipotle Southwest", cal: 100, protein: 0, fat: 10, carbs: 1 },
        { id: "oil_vinegar", name: "Oil & Vinegar", cal: 45, protein: 0, fat: 5, carbs: 0 },
        { id: "sub_avocado", name: "Avocado", cal: 70, protein: 1, fat: 6, carbs: 4 },
        { id: "sub_bacon", name: "Bacon", cal: 80, protein: 6, fat: 6, carbs: 0 },
        { id: "sub_guacamole", name: "Guacamole", cal: 70, protein: 1, fat: 6, carbs: 4 },
      ],
    },
  ],
  presets: [
    {
      name: 'Turkey Club 6"',
      emoji: "🦃",
      description: "Classic turkey on wheat with provolone and veggies",
      selections: {
        bread: ["wheat_6"],
        proteins: ["turkey"],
        cheese: ["provolone"],
        veggies: ["sub_lettuce", "sub_tomato", "sub_onion"],
        sauces: ["mustard"],
      },
      cal: 325,
      protein: 23,
      carbs: 41,
      fat: 7.5,
    },
    {
      name: 'Italian BMT 6"',
      emoji: "🇮🇹",
      description: "Italian B.M.T. on Italian with provolone, veggies, oil & vinegar",
      selections: {
        bread: ["italian_6"],
        proteins: ["italian_bmt"],
        cheese: ["provolone"],
        veggies: ["sub_lettuce", "sub_tomato", "sub_onion"],
        sauces: ["oil_vinegar"],
      },
      cal: 480,
      protein: 21,
      carbs: 46,
      fat: 23.5,
    },
  ],
  disclaimer: "Nutrition data based on Subway published nutrition info for standard servings.",
  year: "2025",
};

// ── Shake Shack ─────────────────────────────────────────────

const SHAKE_SHACK: RestaurantBuilder = {
  id: "shakeshack",
  name: "Shake Shack",
  emoji: "🍔",
  color: "#1F1F1F",
  categories: [
    {
      id: "burger",
      label: "Burger Base",
      type: "radio",
      required: true,
      items: [
        { id: "shackburger", name: "ShackBurger", cal: 530, protein: 28, fat: 34, carbs: 27 },
        { id: "smokeshack", name: "SmokeShack", cal: 610, protein: 30, fat: 40, carbs: 28 },
        { id: "shack_stack", name: "Shack Stack", cal: 780, protein: 33, fat: 49, carbs: 31 },
        { id: "chicken_shack", name: "Chicken Shack", cal: 580, protein: 30, fat: 28, carbs: 45 },
        { id: "veggie_shack", name: "Veggie Shack", cal: 520, protein: 18, fat: 28, carbs: 44 },
        { id: "chickn_bites_6", name: "Chick'n Bites 6pc", cal: 300, protein: 22, fat: 14, carbs: 20 },
        { id: "chickn_bites_10", name: "Chick'n Bites 10pc", cal: 500, protein: 37, fat: 23, carbs: 34 },
        { id: "hot_dog", name: "Hot Dog", cal: 420, protein: 14, fat: 25, carbs: 28 },
      ],
    },
    {
      id: "addons",
      label: "Add-ons",
      type: "check",
      items: [
        { id: "ss_bacon", name: "Bacon", cal: 80, protein: 6, fat: 6, carbs: 0 },
        { id: "ss_extra_cheese", name: "Extra Cheese", cal: 80, protein: 4, fat: 7, carbs: 0 },
        { id: "ss_avocado", name: "Avocado", cal: 60, protein: 1, fat: 5, carbs: 3 },
        { id: "ss_fried_shallots", name: "Fried Shallots", cal: 30, protein: 0, fat: 2, carbs: 3 },
        { id: "ss_cherry_peppers", name: "Chopped Cherry Peppers", cal: 5, protein: 0, fat: 0, carbs: 1 },
      ],
    },
    {
      id: "sides",
      label: "Sides",
      type: "check",
      items: [
        { id: "ss_fries", name: "Fries Regular", cal: 470, protein: 5, fat: 23, carbs: 56 },
        { id: "ss_cheese_fries", name: "Cheese Fries", cal: 600, protein: 10, fat: 32, carbs: 56 },
        { id: "ss_cajun_fries", name: "Cajun Fries", cal: 490, protein: 5, fat: 25, carbs: 56 },
      ],
    },
    {
      id: "shakes",
      label: "Shakes",
      type: "check",
      items: [
        { id: "ss_vanilla_shake", name: "Vanilla Shake", cal: 680, protein: 12, fat: 36, carbs: 76 },
        { id: "ss_chocolate_shake", name: "Chocolate Shake", cal: 720, protein: 13, fat: 38, carbs: 78 },
        { id: "ss_strawberry_shake", name: "Strawberry Shake", cal: 680, protein: 12, fat: 34, carbs: 78 },
      ],
    },
    {
      id: "drinks",
      label: "Drinks",
      type: "radio",
      items: [
        { id: "ss_lemonade", name: "Lemonade", cal: 180, protein: 0, fat: 0, carbs: 46 },
        { id: "ss_iced_tea", name: "Iced Tea", cal: 5, protein: 0, fat: 0, carbs: 0 },
        { id: "ss_water", name: "Water", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
  ],
  presets: [
    {
      name: "Classic ShackBurger",
      emoji: "🍔",
      description: "The original ShackBurger, no sides",
      selections: {
        burger: ["shackburger"],
      },
      cal: 530,
      protein: 28,
      carbs: 27,
      fat: 34,
    },
    {
      name: "ShackBurger + Fries",
      emoji: "🍟",
      description: "ShackBurger with regular fries",
      selections: {
        burger: ["shackburger"],
        sides: ["ss_fries"],
      },
      cal: 1000,
      protein: 33,
      carbs: 83,
      fat: 57,
    },
    {
      name: "High Protein",
      emoji: "💪",
      description: "Chick'n Bites 10pc, no sides",
      selections: {
        burger: ["chickn_bites_10"],
      },
      cal: 500,
      protein: 37,
      carbs: 34,
      fat: 23,
    },
  ],
  disclaimer: "Nutrition data based on Shake Shack published nutrition info. Actual values may vary.",
  year: "2025",
};

// ── Halal Cart ──────────────────────────────────────────────

const HALAL_CART: RestaurantBuilder = {
  id: "halal",
  name: "Halal Cart",
  emoji: "🥙",
  color: "#D4A017",
  categories: [
    {
      id: "protein",
      label: "Protein",
      type: "radio",
      required: true,
      items: [
        { id: "h_chicken", name: "Chicken", cal: 340, protein: 38, fat: 12, carbs: 8 },
        { id: "h_lamb", name: "Lamb / Gyro", cal: 420, protein: 28, fat: 28, carbs: 12 },
        { id: "h_combo", name: "Combo (Chicken + Lamb)", cal: 380, protein: 33, fat: 20, carbs: 10 },
        { id: "h_falafel", name: "Falafel", cal: 320, protein: 12, fat: 16, carbs: 32 },
      ],
    },
    {
      id: "base",
      label: "Base",
      type: "radio",
      required: true,
      items: [
        { id: "h_yellow_rice", name: "Yellow Rice", cal: 300, protein: 6, fat: 4, carbs: 58 },
        { id: "h_white_rice", name: "White Rice", cal: 280, protein: 5, fat: 1, carbs: 62 },
        { id: "h_salad", name: "Salad Only", cal: 40, protein: 2, fat: 0, carbs: 8 },
        { id: "h_half_half", name: "Half Rice Half Salad", cal: 170, protein: 4, fat: 2, carbs: 33 },
      ],
    },
    {
      id: "white_sauce",
      label: "White Sauce",
      type: "radio",
      items: [
        { id: "h_ws_full", name: "Full", cal: 160, protein: 0, fat: 16, carbs: 4 },
        { id: "h_ws_half", name: "Half", cal: 80, protein: 0, fat: 8, carbs: 2 },
        { id: "h_ws_none", name: "None", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "hot_sauce",
      label: "Hot Sauce",
      type: "radio",
      items: [
        { id: "h_hs_full", name: "Full", cal: 10, protein: 0, fat: 0, carbs: 2 },
        { id: "h_hs_half", name: "Half", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "h_hs_none", name: "None", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "toppings",
      label: "Toppings",
      type: "check",
      items: [
        { id: "h_lettuce", name: "Lettuce", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "h_tomato", name: "Tomato", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "h_onion", name: "Onion", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "h_pita", name: "Pita Bread", cal: 170, protein: 5, fat: 1, carbs: 32 },
        { id: "h_extra_pita", name: "Extra Pita", cal: 170, protein: 5, fat: 1, carbs: 32 },
      ],
    },
  ],
  presets: [
    {
      name: "Classic Chicken Over Rice",
      emoji: "🍗",
      description: "Chicken, yellow rice, full white sauce, half hot, lettuce, tomato, pita",
      selections: {
        protein: ["h_chicken"],
        base: ["h_yellow_rice"],
        white_sauce: ["h_ws_full"],
        hot_sauce: ["h_hs_half"],
        toppings: ["h_lettuce", "h_tomato", "h_pita"],
      },
      cal: 760,
      protein: 49,
      carbs: 105,
      fat: 33,
    },
    {
      name: "Lamb Combo Platter",
      emoji: "🥩",
      description: "Combo over yellow rice, loaded",
      selections: {
        protein: ["h_combo"],
        base: ["h_yellow_rice"],
        white_sauce: ["h_ws_full"],
        hot_sauce: ["h_hs_full"],
        toppings: ["h_lettuce", "h_tomato", "h_onion", "h_pita"],
      },
      cal: 920,
      protein: 42,
      carbs: 109,
      fat: 42,
    },
    {
      name: "Light Plate",
      emoji: "🥗",
      description: "Chicken over salad, half white sauce, no hot sauce",
      selections: {
        protein: ["h_chicken"],
        base: ["h_salad"],
        white_sauce: ["h_ws_half"],
        hot_sauce: ["h_hs_none"],
      },
      cal: 445,
      protein: 40,
      carbs: 18,
      fat: 20,
    },
  ],
  disclaimer: "Nutrition estimates for typical NYC halal cart serving. Actual values vary by cart.",
  year: "2025",
};

// ── Starbucks ───────────────────────────────────────────────

const STARBUCKS: RestaurantBuilder = {
  id: "starbucks",
  name: "Starbucks",
  emoji: "☕",
  color: "#00704A",
  categories: [
    {
      id: "drink_base",
      label: "Drink Base (Grande)",
      type: "radio",
      required: true,
      items: [
        { id: "sb_latte", name: "Latte", cal: 190, protein: 13, fat: 7, carbs: 19 },
        { id: "sb_cappuccino", name: "Cappuccino", cal: 140, protein: 10, fat: 5, carbs: 14 },
        { id: "sb_americano", name: "Americano", cal: 15, protein: 1, fat: 0, carbs: 2 },
        { id: "sb_cold_brew", name: "Cold Brew", cal: 5, protein: 0, fat: 0, carbs: 0 },
        { id: "sb_iced_coffee", name: "Iced Coffee", cal: 5, protein: 0, fat: 0, carbs: 0 },
        { id: "sb_pike_place", name: "Pike Place Drip", cal: 5, protein: 0, fat: 0, carbs: 0 },
        { id: "sb_mocha_frapp", name: "Mocha Frappuccino", cal: 370, protein: 5, fat: 15, carbs: 54 },
        { id: "sb_caramel_frapp", name: "Caramel Frappuccino", cal: 380, protein: 4, fat: 16, carbs: 55 },
        { id: "sb_chai", name: "Chai Tea Latte", cal: 240, protein: 8, fat: 4, carbs: 42 },
        { id: "sb_matcha", name: "Matcha Latte", cal: 240, protein: 12, fat: 7, carbs: 32 },
        { id: "sb_hot_chocolate", name: "Hot Chocolate", cal: 370, protein: 14, fat: 14, carbs: 47 },
      ],
    },
    {
      id: "milk",
      label: "Milk",
      type: "radio",
      items: [
        { id: "sb_whole", name: "Whole Milk", cal: 30, protein: 2, fat: 2, carbs: 2 },
        { id: "sb_2pct", name: "2% Milk (default)", cal: 20, protein: 1, fat: 1, carbs: 2 },
        { id: "sb_oat", name: "Oat Milk", cal: 25, protein: 0, fat: 1, carbs: 4 },
        { id: "sb_almond", name: "Almond Milk", cal: 10, protein: 0, fat: 0, carbs: 1 },
        { id: "sb_coconut", name: "Coconut Milk", cal: 15, protein: 0, fat: 1, carbs: 1 },
        { id: "sb_skim", name: "Skim Milk", cal: 15, protein: 1, fat: 0, carbs: 2 },
        { id: "sb_protein_milk", name: "Protein Milk", cal: 230, protein: 36, fat: 5.5, carbs: 10, fiber: 0 },
        { id: "sb_no_milk", name: "None / Black", cal: 0, protein: 0, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "espresso",
      label: "Espresso",
      type: "check",
      items: [
        { id: "sb_extra_shot", name: "Extra Shot", cal: 5, protein: 1, fat: 0, carbs: 0 },
      ],
    },
    {
      id: "sweetener",
      label: "Sweetener",
      type: "check",
      items: [
        { id: "sb_vanilla_syrup", name: "Vanilla Syrup", cal: 80, protein: 0, fat: 0, carbs: 20 },
        { id: "sb_caramel_syrup", name: "Caramel Syrup", cal: 80, protein: 0, fat: 0, carbs: 20 },
        { id: "sb_mocha_sauce", name: "Mocha Sauce", cal: 100, protein: 1, fat: 4, carbs: 16 },
        { id: "sb_sf_vanilla", name: "Sugar-Free Vanilla", cal: 0, protein: 0, fat: 0, carbs: 0 },
        { id: "sb_classic_syrup", name: "Classic Syrup", cal: 80, protein: 0, fat: 0, carbs: 20 },
        { id: "sb_honey", name: "Honey", cal: 60, protein: 0, fat: 0, carbs: 17 },
      ],
    },
    {
      id: "extras",
      label: "Extras",
      type: "check",
      items: [
        { id: "sb_whipped_cream", name: "Whipped Cream", cal: 110, protein: 1, fat: 11, carbs: 2 },
        { id: "sb_cold_foam", name: "Cold Foam", cal: 40, protein: 3, fat: 2, carbs: 3 },
        { id: "sb_choc_drizzle", name: "Chocolate Drizzle", cal: 15, protein: 0, fat: 1, carbs: 2 },
      ],
    },
  ],
  presets: [
    {
      name: "Grande Oat Milk Latte",
      emoji: "🥛",
      description: "Latte with oat milk, no sweetener",
      selections: {
        drink_base: ["sb_latte"],
        milk: ["sb_oat"],
      },
      cal: 215,
      protein: 13,
      carbs: 23,
      fat: 8,
    },
    {
      name: "Iced Americano",
      emoji: "🧊",
      description: "Simple iced americano, black",
      selections: {
        drink_base: ["sb_americano"],
        milk: ["sb_no_milk"],
      },
      cal: 15,
      protein: 1,
      carbs: 2,
      fat: 0,
    },
    {
      name: "Vanilla Sweet Cream Cold Brew",
      emoji: "🍦",
      description: "Cold brew with vanilla syrup and cold foam",
      selections: {
        drink_base: ["sb_cold_brew"],
        milk: ["sb_no_milk"],
        sweetener: ["sb_vanilla_syrup"],
        extras: ["sb_cold_foam"],
      },
      cal: 125,
      protein: 4,
      carbs: 23,
      fat: 2,
    },
    {
      name: "Caramel Frappuccino",
      emoji: "🥤",
      description: "Blended caramel frappuccino with whipped cream",
      selections: {
        drink_base: ["sb_caramel_frapp"],
        extras: ["sb_whipped_cream"],
      },
      cal: 490,
      protein: 5,
      carbs: 57,
      fat: 27,
    },
  ],
  disclaimer: "Based on Starbucks published nutrition for US menu. Custom modifications may differ.",
  year: "2025",
};

// ── Dunkin' ─────────────────────────────────────────────────

const DUNKIN: RestaurantBuilder = {
  id: "dunkin",
  name: "Dunkin'",
  emoji: "🍩",
  color: "#FF671F",
  categories: [
    {
      id: "drink_base",
      label: "Drink Base (Medium)",
      type: "radio",
      required: true,
      items: [
        { id: "dk_hot_coffee", name: "Hot Coffee", cal: 5, protein: 0, fat: 0, carbs: 0 },
        { id: "dk_iced_coffee", name: "Iced Coffee", cal: 10, protein: 0, fat: 0, carbs: 0 },
        { id: "dk_latte", name: "Latte", cal: 120, protein: 10, fat: 4, carbs: 12 },
        { id: "dk_iced_latte", name: "Iced Latte", cal: 120, protein: 10, fat: 4, carbs: 12 },
        { id: "dk_cold_brew", name: "Cold Brew", cal: 5, protein: 0, fat: 0, carbs: 0 },
        { id: "dk_cappuccino", name: "Cappuccino", cal: 80, protein: 6, fat: 4, carbs: 7 },
        { id: "dk_refresher", name: "Refresher", cal: 130, protein: 0, fat: 0, carbs: 33 },
        { id: "dk_hot_chocolate", name: "Hot Chocolate", cal: 330, protein: 12, fat: 12, carbs: 44 },
      ],
    },
    {
      id: "cream_milk",
      label: "Add Cream / Milk",
      type: "radio",
      items: [
        { id: "dk_black", name: "Black", cal: 0, protein: 0, fat: 0, carbs: 0 },
        { id: "dk_cream", name: "Cream", cal: 60, protein: 1, fat: 6, carbs: 1 },
        { id: "dk_whole", name: "Whole Milk", cal: 30, protein: 2, fat: 2, carbs: 2 },
        { id: "dk_oat", name: "Oat Milk", cal: 25, protein: 0, fat: 1, carbs: 4 },
        { id: "dk_almond", name: "Almond Milk", cal: 10, protein: 0, fat: 0, carbs: 1 },
        { id: "dk_skim", name: "Skim Milk", cal: 15, protein: 1, fat: 0, carbs: 2 },
        { id: "dk_protein_milk", name: "Protein Milk", cal: 75, protein: 8, fat: 2.5, carbs: 6, fiber: 0 },
      ],
    },
    {
      id: "sweetener",
      label: "Sweetener",
      type: "check",
      items: [
        { id: "dk_sugar_1", name: "Sugar x1", cal: 15, protein: 0, fat: 0, carbs: 4 },
        { id: "dk_sugar_2", name: "Sugar x2", cal: 30, protein: 0, fat: 0, carbs: 8 },
        { id: "dk_sugar_3", name: "Sugar x3", cal: 45, protein: 0, fat: 0, carbs: 12 },
        { id: "dk_liquid_sugar", name: "Liquid Sugar", cal: 25, protein: 0, fat: 0, carbs: 7 },
      ],
    },
    {
      id: "flavor",
      label: "Flavor",
      type: "check",
      items: [
        { id: "dk_flavor_shot", name: "Flavor Shot (unsweetened)", cal: 0, protein: 0, fat: 0, carbs: 0 },
        { id: "dk_swirl_caramel", name: "Flavor Swirl Caramel", cal: 150, protein: 0, fat: 2, carbs: 32 },
        { id: "dk_swirl_mocha", name: "Flavor Swirl Mocha", cal: 150, protein: 1, fat: 3, carbs: 30 },
        { id: "dk_swirl_french_vanilla", name: "Flavor Swirl French Vanilla", cal: 150, protein: 0, fat: 2, carbs: 32 },
        { id: "dk_swirl_pumpkin", name: "Flavor Swirl Pumpkin", cal: 150, protein: 0, fat: 2, carbs: 33 },
      ],
    },
    {
      id: "food",
      label: "Food",
      type: "check",
      items: [
        { id: "dk_glazed", name: "Glazed Donut", cal: 260, protein: 3, fat: 11, carbs: 37 },
        { id: "dk_boston_kreme", name: "Boston Kreme", cal: 300, protein: 4, fat: 15, carbs: 38 },
        { id: "dk_choc_frosted", name: "Chocolate Frosted", cal: 280, protein: 3, fat: 13, carbs: 38 },
        { id: "dk_bagel_plain", name: "Bagel Plain", cal: 310, protein: 11, fat: 2, carbs: 62 },
        { id: "dk_bagel_cc", name: "Bagel w/ Cream Cheese", cal: 450, protein: 14, fat: 14, carbs: 62 },
        { id: "dk_bec_croissant", name: "Bacon Egg Cheese Croissant", cal: 510, protein: 20, fat: 32, carbs: 35 },
        { id: "dk_sausage_wrap", name: "Sausage Egg Cheese Wake-Up Wrap", cal: 290, protein: 12, fat: 18, carbs: 18 },
        { id: "dk_hash_browns", name: "Hash Browns", cal: 130, protein: 1, fat: 7, carbs: 15 },
      ],
    },
  ],
  presets: [
    {
      name: "Medium Iced w/ Cream & Sugar",
      emoji: "🧊",
      description: "Iced coffee with cream and one sugar",
      selections: {
        drink_base: ["dk_iced_coffee"],
        cream_milk: ["dk_cream"],
        sweetener: ["dk_sugar_1"],
      },
      cal: 85,
      protein: 1,
      carbs: 5,
      fat: 6,
    },
    {
      name: "Medium Latte",
      emoji: "☕",
      description: "Classic medium latte",
      selections: {
        drink_base: ["dk_latte"],
      },
      cal: 120,
      protein: 10,
      carbs: 12,
      fat: 4,
    },
    {
      name: "Loaded: Latte + Donut + Hashbrowns",
      emoji: "🤤",
      description: "Latte with a glazed donut and hash browns",
      selections: {
        drink_base: ["dk_latte"],
        food: ["dk_glazed", "dk_hash_browns"],
      },
      cal: 510,
      protein: 14,
      carbs: 64,
      fat: 22,
    },
  ],
  disclaimer: "Based on Dunkin' published nutrition. Custom drink builds may differ.",
  year: "2025",
};

// ── Chopt ───────────────────────────────────────────────────

const CHOPT: RestaurantBuilder = {
  id: "chopt",
  name: "Chopt",
  emoji: "🥗",
  color: "#2E5339",
  categories: [
    {
      id: "base",
      label: "Base",
      type: "radio",
      required: true,
      items: [
        { id: "ch_classic_chopped", name: "Classic Chopped", cal: 15, protein: 1, fat: 0, carbs: 3 },
        { id: "ch_grain_bowl", name: "Warm Grain Bowl", cal: 230, protein: 8, fat: 3, carbs: 42 },
        { id: "ch_wrap", name: "Wrap", cal: 280, protein: 8, fat: 6, carbs: 46 },
      ],
    },
    {
      id: "protein",
      label: "Protein",
      type: "quantity",
      items: [
        { id: "ch_grilled_chicken", name: "Grilled Chicken", cal: 180, protein: 34, fat: 4, carbs: 0 },
        { id: "ch_roasted_salmon", name: "Roasted Salmon", cal: 280, protein: 28, fat: 18, carbs: 0 },
        { id: "ch_crispy_chicken", name: "Crispy Chicken", cal: 250, protein: 20, fat: 12, carbs: 14 },
        { id: "ch_grilled_steak", name: "Grilled Steak", cal: 230, protein: 30, fat: 12, carbs: 0 },
        { id: "ch_roasted_tofu", name: "Roasted Tofu", cal: 120, protein: 12, fat: 6, carbs: 4 },
        { id: "ch_hard_boiled_egg", name: "Hard-Boiled Egg", cal: 70, protein: 6, fat: 5, carbs: 0 },
      ],
    },
    {
      id: "toppings",
      label: "Toppings",
      type: "check",
      max: 6,
      items: [
        { id: "ch_avocado", name: "Avocado", cal: 120, protein: 1, fat: 10, carbs: 6 },
        { id: "ch_corn", name: "Corn", cal: 40, protein: 1, fat: 0, carbs: 8 },
        { id: "ch_tomato", name: "Tomato", cal: 10, protein: 0, fat: 0, carbs: 2 },
        { id: "ch_cucumber", name: "Cucumber", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "ch_red_onion", name: "Red Onion", cal: 5, protein: 0, fat: 0, carbs: 1 },
        { id: "ch_chickpeas", name: "Chickpeas", cal: 80, protein: 4, fat: 1, carbs: 13 },
        { id: "ch_dried_cranberries", name: "Dried Cranberries", cal: 65, protein: 0, fat: 0, carbs: 16 },
        { id: "ch_sunflower_seeds", name: "Sunflower Seeds", cal: 90, protein: 3, fat: 8, carbs: 3 },
        { id: "ch_bacon_bits", name: "Bacon Bits", cal: 70, protein: 5, fat: 5, carbs: 0 },
        { id: "ch_croutons", name: "Croutons", cal: 60, protein: 2, fat: 2, carbs: 9 },
        { id: "ch_tortilla_chips", name: "Tortilla Chips", cal: 130, protein: 2, fat: 6, carbs: 17 },
        { id: "ch_feta", name: "Feta Cheese", cal: 60, protein: 4, fat: 5, carbs: 1 },
        { id: "ch_goat_cheese", name: "Goat Cheese", cal: 50, protein: 3, fat: 4, carbs: 0 },
        { id: "ch_parm_crisps", name: "Parmesan Crisps", cal: 80, protein: 5, fat: 6, carbs: 1 },
        { id: "ch_blue_cheese", name: "Blue Cheese", cal: 60, protein: 4, fat: 5, carbs: 1 },
        { id: "ch_shredded_carrots", name: "Shredded Carrots", cal: 10, protein: 0, fat: 0, carbs: 2 },
        { id: "ch_sweet_potato", name: "Roasted Sweet Potato", cal: 70, protein: 1, fat: 1, carbs: 14 },
      ],
    },
    {
      id: "dressing",
      label: "Dressing",
      type: "radio",
      items: [
        { id: "ch_mexican_caesar", name: "Mexican Caesar", cal: 140, protein: 2, fat: 14, carbs: 2 },
        { id: "ch_creamy_balsamic", name: "Creamy Balsamic", cal: 130, protein: 0, fat: 13, carbs: 4 },
        { id: "ch_lemon_tahini", name: "Lemon Tahini", cal: 120, protein: 2, fat: 11, carbs: 4 },
        { id: "ch_pesto_vin", name: "Pesto Vinaigrette", cal: 160, protein: 1, fat: 17, carbs: 2 },
        { id: "ch_ranch", name: "Ranch", cal: 140, protein: 1, fat: 15, carbs: 2 },
        { id: "ch_greek_yogurt_caesar", name: "Greek Yogurt Caesar", cal: 80, protein: 2, fat: 7, carbs: 2 },
        { id: "ch_lime_cilantro", name: "Lime Cilantro", cal: 90, protein: 0, fat: 9, carbs: 3 },
        { id: "ch_balsamic_vin", name: "Balsamic Vinaigrette", cal: 80, protein: 0, fat: 7, carbs: 5 },
      ],
    },
  ],
  presets: [
    {
      name: "Classic Caesar",
      emoji: "🥗",
      description: "Chopped + chicken + parmesan crisps + croutons + Mexican Caesar",
      selections: {
        base: ["ch_classic_chopped"],
        protein: ["ch_grilled_chicken"],
        toppings: ["ch_parm_crisps", "ch_croutons"],
        dressing: ["ch_mexican_caesar"],
      },
      cal: 475,
      protein: 42,
      carbs: 15,
      fat: 26,
    },
    {
      name: "High Protein Bowl",
      emoji: "💪",
      description: "Warm grain bowl + chicken + egg + chickpeas + Greek yogurt Caesar",
      selections: {
        base: ["ch_grain_bowl"],
        protein: ["ch_grilled_chicken", "ch_hard_boiled_egg"],
        toppings: ["ch_chickpeas"],
        dressing: ["ch_greek_yogurt_caesar"],
      },
      cal: 660,
      protein: 54,
      carbs: 59,
      fat: 19,
    },
    {
      name: "Light & Fresh",
      emoji: "🌿",
      description: "Chopped + tofu + tomato + cucumber + corn + balsamic vinaigrette",
      selections: {
        base: ["ch_classic_chopped"],
        protein: ["ch_roasted_tofu"],
        toppings: ["ch_tomato", "ch_cucumber", "ch_corn"],
        dressing: ["ch_balsamic_vin"],
      },
      cal: 270,
      protein: 13,
      carbs: 21,
      fat: 13,
    },
  ],
  disclaimer: "Based on Chopt published nutrition data. Actual values may vary.",
  year: "2025",
};

// ── Exports ──────────────────────────────────────────────────

export const RESTAURANT_BUILDERS: Record<string, RestaurantBuilder> = {
  chipotle: CHIPOTLE,
  cava: CAVA,
  sweetgreen: SWEETGREEN,
  pizza: PIZZA,
  subway: SUBWAY,
  shakeshack: SHAKE_SHACK,
  halal: HALAL_CART,
  starbucks: STARBUCKS,
  dunkin: DUNKIN,
  chopt: CHOPT,
};

export const RESTAURANT_LIST = Object.values(RESTAURANT_BUILDERS);

/** Get a builder by id, or null if not found */
export function getRestaurantBuilder(id: string): RestaurantBuilder | null {
  return RESTAURANT_BUILDERS[id] ?? null;
}

/** Calculate totals from a set of selections against a builder */
export function calculateMealTotals(
  builder: RestaurantBuilder,
  selections: Record<string, string[]>,
): { cal: number; protein: number; fat: number; carbs: number; fiber: number } {
  let cal = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let fiber = 0;

  for (const category of builder.categories) {
    const selected = selections[category.id] ?? [];
    for (const itemId of selected) {
      const item = category.items.find((i) => i.id === itemId);
      if (item) {
        cal += item.cal;
        protein += item.protein;
        fat += item.fat;
        carbs += item.carbs;
        fiber += item.fiber ?? 0;
      }
    }
  }

  return { cal, protein, fat, carbs, fiber };
}

/** Apply a generic modifier to totals */
export function applyModifier(
  totals: { cal: number; protein: number; fat: number; carbs: number },
  modifier: GenericModifier,
): { cal: number; protein: number; fat: number; carbs: number } {
  // Special case: kids_size means halve everything
  if (modifier.id === "kids_size") {
    return {
      cal: Math.round(totals.cal / 2),
      protein: Math.round(totals.protein / 2),
      fat: Math.round(totals.fat / 2),
      carbs: Math.round(totals.carbs / 2),
    };
  }

  return {
    cal: Math.max(0, totals.cal + modifier.calChange),
    protein: Math.max(0, totals.protein + (modifier.proteinChange ?? 0)),
    fat: Math.max(0, totals.fat + (modifier.fatChange ?? 0)),
    carbs: Math.max(0, totals.carbs + (modifier.carbsChange ?? 0)),
  };
}

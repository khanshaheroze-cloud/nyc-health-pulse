/* ── Eat Smart NYC — Curated chain restaurant data ─────────────────── */

export interface MenuItem {
  name: string;
  calories: number;
  protein?: number;   // grams
  fiber?: number;     // grams
  sodium?: number;    // mg
  note?: string;
}

export interface SmartSwap {
  from: string;       // popular high-cal item name
  fromCal: number;
  fromProtein?: number;
  to: string;         // better alternative
  toCal: number;
  toProtein?: number;
  tip?: string;       // short explanation
}

export interface ChainData {
  name: string;
  emoji: string;
  slug: string;
  locations: number;        // approx NYC locations
  hack: string;
  items: MenuItem[];
  swaps?: SmartSwap[];
}

/* ── PulseScore v2 — protein-first scoring (0-100) ─────────────────── */

export function calculatePulseScore(item: MenuItem): number {
  let score = 0;
  const protein = item.protein ?? 0;

  // Protein efficiency (0-45)
  const ratio = protein > 0 ? item.calories / protein : Infinity;
  if (ratio <= 10) score += 45;
  else if (ratio <= 13) score += 38;
  else if (ratio <= 17) score += 30;
  else if (ratio <= 22) score += 20;
  else if (ratio <= 35) score += 10;

  // Absolute protein bonus (0-10)
  if (protein >= 40) score += 10;
  else if (protein >= 30) score += 7;
  else if (protein >= 20) score += 4;

  // Fiber density (0-15)
  if (item.fiber != null && item.calories > 0) {
    const fiberPer100 = (item.fiber / item.calories) * 100;
    if (fiberPer100 >= 3) score += 15;
    else if (fiberPer100 >= 2) score += 11;
    else if (fiberPer100 >= 1) score += 7;
    else if (fiberPer100 >= 0.5) score += 3;
  }

  // Calorie reasonableness (0-15)
  if (item.calories <= 300) score += 15;
  else if (item.calories <= 450) score += 12;
  else if (item.calories <= 600) score += 8;
  else if (item.calories <= 800) score += 4;

  // Sodium penalty (0 to -10)
  if (item.sodium != null) {
    if (item.sodium > 1800) score -= 10;
    else if (item.sodium > 1200) score -= 6;
    else if (item.sodium > 900) score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

export function getBadges(item: MenuItem): string[] {
  const badges: string[] = [];
  const protein = item.protein ?? 0;
  const ratio = protein > 0 ? item.calories / protein : Infinity;

  if (ratio <= 10) badges.push("💪 High Protein");
  else if (ratio <= 15) badges.push("💪 Lean");

  if (item.fiber != null && item.fiber >= 5) badges.push("🌿 High Fiber");

  if (item.calories <= 300 && protein >= 15) badges.push("🎯 Smart Pick");

  return badges;
}

/** Get top picks for a chain, sorted by PulseScore */
export function getChainTopPicks(chain: ChainData, limit = 3): (MenuItem & { pulseScore: number; badges: string[] })[] {
  return chain.items
    .map(item => ({ ...item, pulseScore: calculatePulseScore(item), badges: getBadges(item) }))
    .sort((a, b) => b.pulseScore - a.pulseScore)
    .slice(0, limit);
}

/** ~30 NYC chains with best-under-600-cal picks */
export const CHAINS: ChainData[] = [
  {
    name: "Chipotle",
    emoji: "🌯",
    slug: "chipotle",
    locations: 90,
    hack: "Skip the tortilla, double the fajita veggies — saves 300 calories and adds fiber. Brown rice → lettuce base saves another 210 cal.",
    items: [
      { name: "Chicken Burrito Bowl (no rice, no sour cream)", calories: 415, protein: 46, fiber: 8, sodium: 1250 },
      { name: "Chicken Salad (no dressing)", calories: 360, protein: 42, fiber: 6, sodium: 1060 },
      { name: "Sofritas Bowl (half rice)", calories: 480, protein: 18, fiber: 10, sodium: 1350 },
      { name: "Steak Bowl (no rice, no cheese)", calories: 400, protein: 44, fiber: 7, sodium: 1180 },
    ],
    swaps: [
      { from: "White Rice", fromCal: 210, to: "No Rice (extra fajita veggies)", toCal: 20, tip: "Saves 190 cal, adds fiber" },
      { from: "Sour Cream", fromCal: 110, fromProtein: 2, to: "Fresh Tomato Salsa", toCal: 25, toProtein: 0, tip: "Saves 85 cal" },
    ],
  },
  {
    name: "Sweetgreen",
    emoji: "🥗",
    slug: "sweetgreen",
    locations: 45,
    hack: "Ask for dressing on the side — most salads drop 100+ cal. The warm bowls are filling but calorie-dense; half portions of grains help.",
    items: [
      { name: "Kale Caesar (half dressing)", calories: 380, protein: 14, fiber: 4, sodium: 620 },
      { name: "Harvest Bowl", calories: 490, protein: 19, fiber: 6, sodium: 580 },
      { name: "Shroomami", calories: 470, protein: 16, fiber: 5, sodium: 640 },
      { name: "Buffalo Chicken Bowl", calories: 530, protein: 34, fiber: 5, sodium: 890 },
    ],
    swaps: [
      { from: "Caesar Dressing (full)", fromCal: 180, to: "Lime Cilantro Jalapeño Vinaigrette", toCal: 80, tip: "Saves 100 cal on any salad" },
    ],
  },
  {
    name: "Chick-fil-A",
    emoji: "🐔",
    slug: "chick-fil-a",
    locations: 40,
    hack: "Sub grilled for fried in any sandwich — saves 150-200 calories. The Grilled Nuggets are the single best protein-per-calorie item on any fast food menu.",
    items: [
      { name: "Grilled Nuggets (12pc)", calories: 200, protein: 38, sodium: 660 },
      { name: "Grilled Chicken Sandwich", calories: 390, protein: 29, sodium: 1060 },
      { name: "Market Salad (no dressing)", calories: 340, protein: 28, fiber: 5, sodium: 630 },
      { name: "Grilled Chicken Cool Wrap", calories: 350, protein: 37, fiber: 3, sodium: 1060 },
    ],
    swaps: [
      { from: "Fried Chicken Sandwich", fromCal: 440, fromProtein: 28, to: "Grilled Chicken Sandwich", toCal: 390, toProtein: 29, tip: "Same protein, 50 fewer cal" },
      { from: "CFA Sauce (140 cal)", fromCal: 140, to: "Polynesian Sauce", toCal: 110, tip: "Saves 30 cal per packet" },
    ],
  },
  {
    name: "McDonald's",
    emoji: "🍟",
    slug: "mcdonalds",
    locations: 250,
    hack: "Order a Happy Meal as an adult — it's portion-controlled and under 500 cal with apple slices. The Egg McMuffin is the best calorie-to-satisfaction ratio on the breakfast menu.",
    items: [
      { name: "Egg McMuffin", calories: 300, protein: 17, sodium: 770 },
      { name: "McChicken", calories: 400, protein: 14, sodium: 560 },
      { name: "6pc Chicken McNuggets", calories: 250, protein: 14, sodium: 500 },
      { name: "Hamburger", calories: 250, protein: 12, sodium: 510 },
      { name: "Southwest Grilled Chicken Salad", calories: 350, protein: 37, fiber: 6, sodium: 1070 },
    ],
    swaps: [
      { from: "Big Mac", fromCal: 550, fromProtein: 25, to: "McDouble (no bun)", toCal: 260, toProtein: 22, tip: "Half the cal, nearly the same protein" },
      { from: "Large Fries", fromCal: 490, fromProtein: 7, to: "Side Salad", toCal: 15, toProtein: 1, tip: "Saves 475 cal" },
    ],
  },
  {
    name: "Shake Shack",
    emoji: "🍔",
    slug: "shake-shack",
    locations: 35,
    hack: "There's no low-cal option here. The best strategy: single burger, no fries, water. A ShackBurger + fries + shake is 1,600+ calories — nearly a full day.",
    items: [
      { name: "ShackBurger (single, no fries)", calories: 530, protein: 28, sodium: 1050 },
      { name: "Chicken Shack", calories: 570, protein: 35, sodium: 1260 },
      { name: "'Shroom Burger", calories: 550, protein: 18, sodium: 920 },
      { name: "Chicken Bites (6pc)", calories: 300, protein: 22, sodium: 780 },
    ],
    swaps: [
      { from: "ShackBurger", fromCal: 530, fromProtein: 28, to: "Hamburger (single)", toCal: 370, toProtein: 22, tip: "Saves 160 cal — skip the ShackSauce" },
    ],
  },
  {
    name: "Halal Guys",
    emoji: "🧆",
    slug: "halal-guys",
    locations: 25,
    hack: "The white sauce alone is ~300 calories per serving. Ask for all veggies, light white sauce, and hot sauce instead. Half-and-half rice/salad saves 150 cal.",
    items: [
      { name: "Chicken over Salad (light white sauce)", calories: 500, protein: 42, sodium: 1100 },
      { name: "Chicken over Rice (half portion white sauce)", calories: 650, protein: 38, sodium: 1350 },
      { name: "Falafel Sandwich", calories: 480, protein: 16, fiber: 6, sodium: 920 },
    ],
    swaps: [
      { from: "Full White Sauce", fromCal: 300, to: "Hot Sauce Only", toCal: 20, tip: "Saves 280 cal — the biggest single swap in NYC fast food" },
      { from: "Chicken over Rice", fromCal: 780, fromProtein: 38, to: "Chicken over Salad (no rice)", toCal: 445, toProtein: 42, tip: "More protein, 335 fewer cal" },
    ],
  },
  {
    name: "Subway",
    emoji: "🥖",
    slug: "subway",
    locations: 400,
    hack: "6-inch > footlong (obvious but people forget). Load up veggies for free. Mustard or vinegar instead of mayo saves 110 cal. The 9-grain wheat bread is the best bread option.",
    items: [
      { name: "6\" Turkey Breast Sub", calories: 270, protein: 18, fiber: 3, sodium: 670 },
      { name: "6\" Veggie Delite", calories: 200, protein: 8, fiber: 4, sodium: 280 },
      { name: "6\" Grilled Chicken", calories: 320, protein: 26, fiber: 3, sodium: 580 },
      { name: "Chopped Salad (chicken, no dressing)", calories: 240, protein: 24, fiber: 4, sodium: 500 },
    ],
    swaps: [
      { from: "Mayo", fromCal: 110, to: "Mustard", toCal: 10, tip: "Saves 100 cal on any sub" },
      { from: "White Bread", fromCal: 200, to: "Multigrain Bread", toCal: 210, tip: "+3g fiber for 10 extra cal" },
    ],
  },
  {
    name: "Panera Bread",
    emoji: "🍞",
    slug: "panera",
    locations: 55,
    hack: "Half portions are your friend — a 'You Pick Two' with half soup + half salad is usually under 500 cal. Avoid the pastries and bread bowls (800+ cal).",
    items: [
      { name: "Half Asian Sesame Chicken Salad", calories: 280, protein: 16, sodium: 390 },
      { name: "Cup of Turkey Chili", calories: 190, protein: 16, sodium: 690 },
      { name: "Mediterranean Veggie Sandwich (half)", calories: 290, protein: 12, sodium: 560 },
      { name: "Strawberry Poppyseed Salad (half)", calories: 260, protein: 14, sodium: 310 },
    ],
  },
  {
    name: "Starbucks",
    emoji: "☕",
    slug: "starbucks",
    locations: 350,
    hack: "A Venti Caramel Frappuccino is 470 cal — more than a Big Mac. Switch to cold brew with a splash of oat milk (35 cal). For food, the egg bites are protein-dense and under 300 cal.",
    items: [
      { name: "Egg White & Roasted Red Pepper Egg Bites", calories: 170, protein: 13, sodium: 460 },
      { name: "Spinach, Feta & Egg White Wrap", calories: 290, protein: 20, fiber: 3, sodium: 840 },
      { name: "Protein Box (Cheese & Fruit)", calories: 470, protein: 20, sodium: 650 },
      { name: "Turkey & Basil Pesto Sandwich", calories: 480, protein: 28, sodium: 960 },
    ],
    swaps: [
      { from: "Venti Caramel Frappuccino", fromCal: 470, fromProtein: 5, to: "Cold Brew + Splash Oat Milk", toCal: 35, toProtein: 0, tip: "Saves 435 cal" },
    ],
  },
  {
    name: "Dunkin'",
    emoji: "🍩",
    slug: "dunkin",
    locations: 600,
    hack: "A medium iced latte with skim milk is 80 cal vs. 400+ for a frozen coffee. For food, stick to egg wraps over donuts and bagels. One glazed donut = 280 cal with zero protein.",
    items: [
      { name: "Egg & Cheese Wake-Up Wrap", calories: 180, protein: 10, sodium: 520 },
      { name: "Turkey Sausage Egg & Cheese", calories: 390, protein: 21, sodium: 940 },
      { name: "Veggie Egg White Omelet Bites (3pc)", calories: 170, protein: 13, sodium: 430 },
      { name: "Avocado Toast", calories: 280, protein: 7, sodium: 440 },
    ],
    swaps: [
      { from: "Glazed Donut", fromCal: 260, fromProtein: 3, to: "Egg & Cheese Wrap", toCal: 180, toProtein: 10, tip: "3x the protein, 80 fewer cal" },
      { from: "Frozen Coffee (medium)", fromCal: 420, to: "Iced Latte (skim, medium)", toCal: 80, tip: "Saves 340 cal" },
    ],
  },
  {
    name: "Panda Express",
    emoji: "🐼",
    slug: "panda-express",
    locations: 30,
    hack: "Super Greens instead of fried rice or chow mein saves 400+ calories. The Grilled Teriyaki Chicken is the leanest protein. Avoid orange chicken (490 cal per serving).",
    items: [
      { name: "Grilled Teriyaki Chicken + Super Greens", calories: 340, protein: 36, fiber: 4, sodium: 830 },
      { name: "Mushroom Chicken + Super Greens", calories: 290, protein: 18, fiber: 4, sodium: 760 },
      { name: "String Bean Chicken Breast + Super Greens", calories: 280, protein: 20, fiber: 5, sodium: 780 },
    ],
    swaps: [
      { from: "Fried Rice (side)", fromCal: 520, to: "Super Greens (side)", toCal: 90, tip: "Saves 430 cal — the single biggest side swap" },
      { from: "Orange Chicken", fromCal: 490, fromProtein: 18, to: "Grilled Teriyaki Chicken", toCal: 250, toProtein: 36, tip: "Double the protein, half the cal" },
    ],
  },
  {
    name: "Popeyes",
    emoji: "🍗",
    slug: "popeyes",
    locations: 120,
    hack: "The Blackened Chicken Tenders are the hidden gem — almost half the calories of the fried version. Skip the biscuit (260 cal of pure butter and flour).",
    items: [
      { name: "Blackened Chicken Tenders (5pc)", calories: 340, protein: 48, sodium: 1260 },
      { name: "Blackened Chicken Tenders (3pc)", calories: 200, protein: 29, sodium: 760 },
      { name: "Regular Chicken Leg (mild)", calories: 210, protein: 16, sodium: 420 },
      { name: "Green Beans (regular side)", calories: 50, protein: 2, fiber: 3, sodium: 340 },
      { name: "Corn on the Cob", calories: 190, protein: 5, fiber: 2, sodium: 210 },
    ],
    swaps: [
      { from: "Fried Chicken Sandwich", fromCal: 700, fromProtein: 28, to: "Blackened Tenders (3pc)", toCal: 200, toProtein: 29, tip: "Same protein, 500 fewer cal" },
      { from: "Biscuit (side)", fromCal: 260, fromProtein: 4, to: "Green Beans (side)", toCal: 50, toProtein: 2, tip: "Saves 210 cal" },
    ],
  },
  {
    name: "Five Guys",
    emoji: "🍔",
    slug: "five-guys",
    locations: 20,
    hack: "A regular burger is actually a DOUBLE. A \"Little\" burger is a single patty. Little Bacon Burger + no fries is the move. Their regular fries are 950 cal.",
    items: [
      { name: "Little Hamburger", calories: 480, protein: 23, sodium: 380 },
      { name: "Little Bacon Burger (lettuce wrap)", calories: 420, protein: 27, sodium: 590 },
      { name: "Veggie Sandwich", calories: 440, protein: 15, sodium: 640 },
      { name: "Hot Dog", calories: 520, protein: 18, sodium: 1130 },
    ],
  },
  {
    name: "Wingstop",
    emoji: "🍗",
    slug: "wingstop",
    locations: 50,
    hack: "Plain wings (no sauce) are 90 cal each. Most sauces add 30-60 cal per wing. Atomic and Lemon Pepper are the lowest-cal sauce options. Skip the fries and ranch.",
    items: [
      { name: "Plain Boneless Wings (8pc)", calories: 360, protein: 28, sodium: 780 },
      { name: "Classic Wings - Atomic (6pc)", calories: 390, protein: 30, sodium: 1020 },
      { name: "Classic Wings - Lemon Pepper (6pc)", calories: 420, protein: 30, sodium: 960 },
    ],
  },
  {
    name: "Domino's",
    emoji: "🍕",
    slug: "dominos",
    locations: 180,
    hack: "Thin crust saves 50-70 cal per slice vs. hand-tossed. Two slices of thin-crust veggie pizza is ~400 cal — a reasonable meal. Avoid stuffed crust and pan pizza.",
    items: [
      { name: "2 Slices Thin Crust Veggie (medium)", calories: 400, protein: 16, sodium: 920 },
      { name: "2 Slices Thin Crust Cheese (medium)", calories: 380, protein: 16, sodium: 780 },
      { name: "Grilled Chicken Caesar Salad (half)", calories: 210, protein: 18, sodium: 540 },
    ],
  },
  {
    name: "Joe's Pizza",
    emoji: "🍕",
    slug: "joes-pizza",
    locations: 5,
    hack: "A classic NYC cheese slice is about 280 cal — that's actually reasonable for a quick meal. The key is stopping at one or two slices. Blot the grease with a napkin (saves ~40 cal — this is real science).",
    items: [
      { name: "Cheese Slice", calories: 280, protein: 12, sodium: 480 },
      { name: "Fresh Mozzarella Slice", calories: 310, protein: 14, sodium: 420 },
      { name: "Two Cheese Slices", calories: 560, protein: 24, sodium: 960, note: "Classic NYC lunch" },
    ],
  },
  {
    name: "Just Salad",
    emoji: "🥬",
    slug: "just-salad",
    locations: 40,
    hack: "The reusable bowl program is great, but watch the toppings — avocado, cheese, and crispy toppings add up fast. Base + protein + veggies + light dressing is the formula.",
    items: [
      { name: "Thai Chicken Crunch (light dressing)", calories: 380, protein: 32, sodium: 620 },
      { name: "Crispy Chicken Caesar (half croutons)", calories: 420, protein: 30, sodium: 740 },
      { name: "Harvest Bowl (no cheese)", calories: 360, protein: 22, sodium: 510 },
    ],
  },
  {
    name: "Dig",
    emoji: "🥘",
    slug: "dig",
    locations: 25,
    hack: "Dig portions are generous — a protein + two veggie sides is a complete meal under 600 cal. Skip the grains if you're watching calories. Charred chicken is the leanest protein.",
    items: [
      { name: "Charred Chicken + 2 Veggie Sides", calories: 420, protein: 38, sodium: 680 },
      { name: "Wild Salmon + Roasted Vegetables", calories: 480, protein: 34, sodium: 590 },
      { name: "Roasted Tofu + 2 Veggie Sides", calories: 380, protein: 20, sodium: 520 },
    ],
  },
  {
    name: "CAVA",
    emoji: "🫒",
    slug: "cava",
    locations: 20,
    hack: "Build a greens + grains bowl and skip the pita. Harissa avocado is the richest dressing — ask for half. Crazy Feta dip adds 120 cal per serving; skip it or use sparingly.",
    items: [
      { name: "Greens + Grilled Chicken Bowl (no dressing)", calories: 360, protein: 36, sodium: 720 },
      { name: "Grilled Meatball Bowl (half grains)", calories: 480, protein: 28, sodium: 850 },
      { name: "Falafel Greens Bowl (lemon herb dressing)", calories: 420, protein: 14, sodium: 680 },
    ],
  },
  {
    name: "Chopt",
    emoji: "🥗",
    slug: "chopt",
    locations: 30,
    hack: "Get dressing on the side — Chopt is generous with it. The 'Mexicali Vegan' and 'Kale Caesar' are the best cal-to-satisfaction ratio. Avoid crispy toppings (tortilla strips add 150 cal).",
    items: [
      { name: "Kale Caesar (light dressing)", calories: 390, protein: 22, sodium: 640 },
      { name: "Mexicali Vegan (no tortilla strips)", calories: 350, protein: 15, sodium: 580 },
      { name: "Greek Salad + Grilled Chicken", calories: 420, protein: 34, sodium: 720 },
    ],
  },
  {
    name: "Bon Chon",
    emoji: "🍗",
    slug: "bon-chon",
    locations: 15,
    hack: "Korean fried chicken is double-fried — crispier but more oil. Soy Garlic sauce has slightly fewer calories than Spicy. Skip the fried rice; steamed rice saves 200 cal.",
    items: [
      { name: "Soy Garlic Wings (6pc) + Steamed Rice", calories: 540, protein: 28, sodium: 980 },
      { name: "Bibimbap Bowl (no egg)", calories: 480, protein: 22, sodium: 760 },
      { name: "Chicken Drumsticks (4pc, no side)", calories: 440, protein: 32, sodium: 860 },
    ],
  },
  {
    name: "Dos Toros",
    emoji: "🌮",
    slug: "dos-toros",
    locations: 20,
    hack: "Dos Toros portions are Chipotle-sized. Get a bowl over a burrito to save 300 cal on the tortilla. Skip cheese + sour cream, double the salsa — saves 200 cal.",
    items: [
      { name: "Chicken Bowl (no rice, no cheese)", calories: 380, protein: 40, sodium: 920 },
      { name: "Steak Taco Plate (3 tacos, no cheese)", calories: 490, protein: 36, sodium: 1050 },
      { name: "Veggie Bowl (half rice)", calories: 420, protein: 14, sodium: 680 },
    ],
  },
  {
    name: "Hale and Hearty",
    emoji: "🍲",
    slug: "hale-and-hearty",
    locations: 15,
    hack: "A small (12oz) soup is 150-300 cal — one of the best low-cal lunch options in NYC. The bread bowl adds 350 cal. Pair a small soup with a side salad for a filling 400-cal lunch.",
    items: [
      { name: "Small Chicken Noodle Soup", calories: 180, protein: 14, sodium: 780 },
      { name: "Small Tomato Basil Bisque", calories: 220, protein: 6, sodium: 650 },
      { name: "Small Soup + Side Garden Salad", calories: 280, protein: 16, sodium: 820 },
    ],
  },
  {
    name: "Pret A Manger",
    emoji: "🥪",
    slug: "pret-a-manger",
    locations: 55,
    hack: "Pret is one of the few fast-casual chains that lists calories prominently on every item. Their protein boxes and salads are the best bets. Avoid the croissants (300+ cal each).",
    items: [
      { name: "Chicken & Avocado Protein Box", calories: 380, protein: 30, sodium: 520 },
      { name: "Tuna Nicoise Salad", calories: 340, protein: 26, sodium: 480 },
      { name: "Hummus & Veggie Baguette (half)", calories: 290, protein: 10, sodium: 560 },
      { name: "Egg & Soldiers Protein Box", calories: 350, protein: 22, sodium: 440 },
    ],
  },
  {
    name: "Naya",
    emoji: "🧆",
    slug: "naya",
    locations: 10,
    hack: "Middle Eastern bowls are naturally protein-rich. Skip the rice, double the tabbouleh. Their tahini dressing is 80 cal per serving — lighter than most chain dressings.",
    items: [
      { name: "Chicken Shawarma Bowl (no rice)", calories: 390, protein: 38, sodium: 740 },
      { name: "Falafel Salad Bowl", calories: 420, protein: 16, sodium: 620 },
      { name: "Lamb Kofta Bowl (half rice)", calories: 480, protein: 32, sodium: 810 },
    ],
  },
  {
    name: "Tender Greens",
    emoji: "🥬",
    slug: "tender-greens",
    locations: 5,
    hack: "Chef-driven salads with real portions. The Big Salad plates come with protein built in. Ask for dressing on the side to control calories — their vinaigrettes are 120+ cal.",
    items: [
      { name: "Chipotle Barbecue Chicken Salad", calories: 440, protein: 36, sodium: 680 },
      { name: "Happy Vegan Salad", calories: 360, protein: 12, sodium: 420 },
      { name: "Grilled Salmon Plate (no starch)", calories: 480, protein: 38, sodium: 540 },
    ],
  },
  {
    name: "honeygrow",
    emoji: "🍜",
    slug: "honeygrow",
    locations: 8,
    hack: "Stir-fry bowls are customizable — pick egg noodles or rice noodles (similar cal). Load veggies, pick a lean protein, go light on sauce. Their honeybar desserts are 200-300 cal.",
    items: [
      { name: "Sesame Garlic Chicken Stir-fry", calories: 490, protein: 32, sodium: 840 },
      { name: "Spicy Garlic Shrimp Stir-fry", calories: 440, protein: 28, sodium: 780 },
      { name: "Harvest Bowl (roasted veggies + egg)", calories: 380, protein: 18, sodium: 560 },
    ],
  },
  {
    name: "Taco Bell",
    emoji: "🌮",
    slug: "taco-bell",
    locations: 80,
    hack: "Taco Bell is surprisingly hackable. Order 'fresco style' to replace cheese and sauces with pico de gallo — saves 50-80 cal per item. Power Menu Bowl is the best macro ratio.",
    items: [
      { name: "Power Menu Bowl (chicken)", calories: 470, protein: 26, fiber: 7, sodium: 1160 },
      { name: "2 Chicken Soft Tacos (fresco)", calories: 320, protein: 22, sodium: 760 },
      { name: "Black Bean Crunchwrap Supreme", calories: 500, protein: 14, fiber: 8, sodium: 1040 },
      { name: "Chicken Quesadilla (no sauce)", calories: 430, protein: 24, sodium: 920 },
    ],
    swaps: [
      { from: "Any item (regular)", fromCal: 0, to: "Same item — 'Fresco Style'", toCal: 0, tip: "Replaces cheese + sauce with pico de gallo — saves 50-80 cal per item" },
    ],
  },
  {
    name: "Wendy's",
    emoji: "🍔",
    slug: "wendys",
    locations: 40,
    hack: "Jr. menu is the move — Jr. Cheeseburger is 290 cal. Chili is one of the best fast food options: 250 cal, 23g protein. Apple Pecan Salad is solid but dressing adds 200 cal.",
    items: [
      { name: "Jr. Hamburger", calories: 250, protein: 13, sodium: 510 },
      { name: "Small Chili", calories: 250, protein: 23, fiber: 6, sodium: 870 },
      { name: "Grilled Chicken Wrap", calories: 370, protein: 24, sodium: 820 },
      { name: "Apple Pecan Salad (half dressing)", calories: 420, protein: 30, fiber: 5, sodium: 680 },
    ],
    swaps: [
      { from: "Dave's Single", fromCal: 590, fromProtein: 30, to: "Jr. Hamburger + Small Chili", toCal: 500, toProtein: 36, tip: "More protein, more fiber, 90 fewer cal" },
    ],
  },
  {
    name: "Wok to Walk",
    emoji: "🥡",
    slug: "wok-to-walk",
    locations: 6,
    hack: "Build your own stir-fry: pick egg noodles (lightest base), load veggies, choose chicken or tofu. Skip the fried rice base and sweet sauces. Soy sauce or teriyaki are the leanest options.",
    items: [
      { name: "Egg Noodle + Chicken + Veggies (soy sauce)", calories: 420, protein: 30, sodium: 860 },
      { name: "Rice Noodle + Tofu + Veggies (teriyaki)", calories: 380, protein: 18, sodium: 720 },
      { name: "Egg Noodle + Shrimp + Veggies (garlic)", calories: 400, protein: 26, sodium: 780 },
    ],
  },
];

/** Rotating daily tips for the homepage */
export const DAILY_TIPS = [
  { chain: "Chipotle", item: "Chicken Bowl (no rice)", calories: 415 },
  { chain: "Chick-fil-A", item: "Grilled Nuggets (12pc)", calories: 200 },
  { chain: "Sweetgreen", item: "Kale Caesar", calories: 380 },
  { chain: "McDonald's", item: "Egg McMuffin", calories: 300 },
  { chain: "Subway", item: "6\" Turkey Breast", calories: 270 },
  { chain: "Dunkin'", item: "Egg & Cheese Wrap", calories: 180 },
  { chain: "Panda Express", item: "Teriyaki Chicken + Super Greens", calories: 340 },
  { chain: "Panera", item: "Turkey Chili (cup)", calories: 190 },
  { chain: "Starbucks", item: "Egg White Egg Bites", calories: 170 },
  { chain: "Popeyes", item: "Blackened Tenders (5pc)", calories: 340 },
  { chain: "Just Salad", item: "Harvest Bowl", calories: 360 },
  { chain: "Dig", item: "Charred Chicken + 2 Veggies", calories: 420 },
  { chain: "Joe's Pizza", item: "One Cheese Slice", calories: 280 },
  { chain: "Shake Shack", item: "Chicken Bites (6pc)", calories: 300 },
  { chain: "CAVA", item: "Grilled Chicken Bowl", calories: 360 },
  { chain: "Chopt", item: "Mexicali Vegan", calories: 350 },
  { chain: "Pret A Manger", item: "Chicken Protein Box", calories: 380 },
  { chain: "Taco Bell", item: "2 Chicken Tacos (fresco)", calories: 320 },
  { chain: "Wendy's", item: "Small Chili", calories: 250 },
  { chain: "Hale and Hearty", item: "Small Soup + Salad", calories: 280 },
  { chain: "Naya", item: "Shawarma Bowl (no rice)", calories: 390 },
  { chain: "honeygrow", item: "Harvest Bowl", calories: 380 },
  { chain: "Dos Toros", item: "Chicken Bowl (no rice)", calories: 380 },
  { chain: "Tender Greens", item: "Happy Vegan Salad", calories: 360 },
];

/** 600-cal challenge stats */
export const CHALLENGE_STATS = {
  avgFastFoodMeal: 1100,
  recommendedMealCal: 600,
  nycObesityRate: 26.4,
  source: "NYC DOHMH iChoose600 / Community Health Survey 2022",
};

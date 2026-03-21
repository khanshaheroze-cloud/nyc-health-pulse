/**
 * Curated healthy grocery recommendations based on USDA Dietary Guidelines.
 * Each item includes nutritional reasoning and budget-friendly alternatives.
 */

export interface HealthyItem {
  name: string;
  category: "Protein" | "Dairy" | "Produce" | "Grains" | "Pantry";
  why: string;           // plain-language health benefit
  budgetTip: string;     // how to save money on this item
  servingTip: string;    // portion/prep suggestion
  nutrients: string[];   // key nutrients
  icon: string;
}

export const healthyItems: HealthyItem[] = [
  // ─── Protein ───
  {
    name: "Eggs",
    category: "Protein",
    why: "Complete protein with all essential amino acids. One of the most nutrient-dense foods per dollar.",
    budgetTip: "Buy store brand. Price varies wildly — check bodegas and wholesale clubs.",
    servingTip: "2 eggs = 12g protein. Hard-boil a batch on Sunday for the week.",
    nutrients: ["Protein", "Vitamin D", "Choline", "B12"],
    icon: "🥚",
  },
  {
    name: "Chicken Thighs (bone-in)",
    category: "Protein",
    why: "High protein, more affordable than breast. Dark meat has more iron and zinc.",
    budgetTip: "Bone-in thighs are often $1-2/lb cheaper than boneless breast. Buy family packs.",
    servingTip: "4 oz cooked = ~28g protein. Roast a sheet pan of thighs for easy meal prep.",
    nutrients: ["Protein", "Iron", "Zinc", "B6"],
    icon: "🍗",
  },
  {
    name: "Canned Beans (black, kidney, chickpea)",
    category: "Protein",
    why: "Plant protein + fiber. Linked to lower heart disease risk. Extremely shelf-stable.",
    budgetTip: "Dried beans are 3-4x cheaper than canned. One bag makes ~6 cans' worth.",
    servingTip: "½ cup = 7g protein + 6g fiber. Add to rice, salads, soups.",
    nutrients: ["Protein", "Fiber", "Iron", "Folate"],
    icon: "🫘",
  },
  {
    name: "Canned Tuna/Sardines",
    category: "Protein",
    why: "Omega-3 fatty acids support heart and brain health. Long shelf life.",
    budgetTip: "Store brand canned tuna is often under $1.50/can. Sardines are nutrient-dense and cheap.",
    servingTip: "One can = 20-25g protein. Mix with mustard and crackers for a quick meal.",
    nutrients: ["Protein", "Omega-3", "Vitamin D", "Selenium"],
    icon: "🐟",
  },

  // ─── Dairy ───
  {
    name: "Plain Yogurt (Greek or regular)",
    category: "Dairy",
    why: "Probiotics for gut health. Greek yogurt has 2x the protein of regular.",
    budgetTip: "Buy the large 32oz tub — up to 50% cheaper per oz than single-serve cups.",
    servingTip: "Add your own fruit and honey instead of buying flavored (which has 2-3x more sugar).",
    nutrients: ["Protein", "Calcium", "Probiotics", "B12"],
    icon: "🥛",
  },
  {
    name: "Milk (whole or 2%)",
    category: "Dairy",
    why: "Complete protein + calcium + vitamin D. Important for bone health at every age.",
    budgetTip: "Compare bodega vs. supermarket — prices can differ by $2/gallon in NYC.",
    servingTip: "1 cup = 8g protein. Use in oatmeal, smoothies, or coffee.",
    nutrients: ["Calcium", "Vitamin D", "Protein", "Potassium"],
    icon: "🥛",
  },

  // ─── Produce ───
  {
    name: "Bananas",
    category: "Produce",
    why: "High potassium, natural energy. One of the cheapest fruits available year-round.",
    budgetTip: "Usually $0.20-0.30 each. Green Carts and street vendors often have the best prices.",
    servingTip: "Freeze overripe bananas for smoothies instead of throwing them away.",
    nutrients: ["Potassium", "Vitamin B6", "Fiber", "Vitamin C"],
    icon: "🍌",
  },
  {
    name: "Frozen Vegetables (broccoli, spinach, mixed)",
    category: "Produce",
    why: "Flash-frozen at peak nutrition — often MORE nutritious than \"fresh\" produce that sat for days.",
    budgetTip: "Store brand frozen veggies are $1-2/bag. Stock up — they last months.",
    servingTip: "Steam in the microwave in 3 minutes. Add to rice, pasta, or eggs.",
    nutrients: ["Fiber", "Vitamin C", "Vitamin K", "Iron"],
    icon: "🥦",
  },
  {
    name: "Sweet Potatoes",
    category: "Produce",
    why: "Packed with beta-carotene (vitamin A), fiber, and potassium. More nutritious than white potatoes.",
    budgetTip: "Often $1-1.50/lb. Buy loose, not pre-washed bags. They last 2+ weeks.",
    servingTip: "Microwave whole for 5 min for a fast side. No butter needed — naturally sweet.",
    nutrients: ["Vitamin A", "Fiber", "Potassium", "Vitamin C"],
    icon: "🍠",
  },
  {
    name: "Cabbage",
    category: "Produce",
    why: "One of the most nutrient-dense vegetables per dollar. Anti-inflammatory compounds.",
    budgetTip: "A whole cabbage is ~$1.50 and makes 6+ servings. Lasts 2 weeks in the fridge.",
    servingTip: "Shred for coleslaw, stir-fry, or add to soups. Great raw or cooked.",
    nutrients: ["Vitamin C", "Vitamin K", "Fiber", "Folate"],
    icon: "🥬",
  },

  // ─── Grains ───
  {
    name: "Oats (rolled or steel-cut)",
    category: "Grains",
    why: "Soluble fiber (beta-glucan) lowers cholesterol. Sustained energy release.",
    budgetTip: "A 42oz canister of store-brand oats is ~$3 and lasts a month of breakfasts.",
    servingTip: "Overnight oats = zero cooking. Mix with yogurt, banana, and peanut butter.",
    nutrients: ["Fiber", "Manganese", "Phosphorus", "Iron"],
    icon: "🥣",
  },
  {
    name: "Brown Rice",
    category: "Grains",
    why: "Whole grain with more fiber, magnesium, and B vitamins than white rice.",
    budgetTip: "Buy 5-10lb bags from ethnic grocery stores — often half the supermarket price.",
    servingTip: "Cook a big batch and refrigerate. Reheats perfectly in the microwave.",
    nutrients: ["Fiber", "Manganese", "Selenium", "Magnesium"],
    icon: "🍚",
  },
  {
    name: "Whole Wheat Bread",
    category: "Grains",
    why: "More fiber and nutrients than white bread. Look for '100% whole wheat' as the first ingredient.",
    budgetTip: "Store brand is typically $2-3 vs $4-5 for name brand. Freeze half the loaf.",
    servingTip: "2 slices = a serving. Toast with peanut butter for a protein-fiber combo.",
    nutrients: ["Fiber", "B vitamins", "Iron", "Manganese"],
    icon: "🍞",
  },

  // ─── Pantry ───
  {
    name: "Peanut Butter (natural)",
    category: "Pantry",
    why: "Heart-healthy fats, protein, and fiber. Extremely calorie-dense — great for food-insecure households.",
    budgetTip: "Store brand natural PB is $3-4/jar. Look for just 'peanuts, salt' on the label.",
    servingTip: "2 tbsp = 8g protein. Spread on toast, add to oatmeal, or eat with banana slices.",
    nutrients: ["Healthy Fats", "Protein", "Vitamin E", "Magnesium"],
    icon: "🥜",
  },
  {
    name: "Olive Oil (extra virgin)",
    category: "Pantry",
    why: "Mediterranean diet staple. Anti-inflammatory. Linked to lower heart disease and stroke risk.",
    budgetTip: "Costco/BJ's have the best per-oz prices. A 1L bottle lasts 2+ months for most households.",
    servingTip: "Use for cooking at medium heat, or drizzle on vegetables and salads.",
    nutrients: ["Monounsaturated Fat", "Vitamin E", "Polyphenols"],
    icon: "🫒",
  },
  {
    name: "Canned Tomatoes (diced or crushed)",
    category: "Pantry",
    why: "Lycopene (an antioxidant) is actually MORE available in cooked/canned tomatoes than fresh.",
    budgetTip: "Store brand 28oz cans are often under $1.50. Stock up when on sale.",
    servingTip: "Base for pasta sauce, chili, soup, shakshuka. Incredibly versatile.",
    nutrients: ["Lycopene", "Vitamin C", "Potassium", "Vitamin A"],
    icon: "🍅",
  },
];

/** Group healthy items by category for display */
export const healthyByCategory = healthyItems.reduce<Record<string, HealthyItem[]>>(
  (acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  },
  {}
);

/** A "Healthy NYC Grocery List" — one of each category staple */
export const sampleBasket = [
  "Eggs (dozen)",
  "Chicken thighs (2 lbs)",
  "Canned beans (3 cans)",
  "Milk (gallon)",
  "Bananas (bunch)",
  "Frozen broccoli (bag)",
  "Sweet potatoes (3 lbs)",
  "Oats (canister)",
  "Brown rice (2 lbs)",
  "Peanut butter (jar)",
];

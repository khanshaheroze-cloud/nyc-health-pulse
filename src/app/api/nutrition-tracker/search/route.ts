import { NextRequest, NextResponse } from "next/server";
import { searchNycDatabase, searchNycByTags } from "@/lib/nycFoodDatabase";
import { searchCommonFoods, parseQueryQuantity, type CommonFood } from "@/lib/commonFoods";

/* ── Types ────────────────────────────────────────────────────── */

interface NutrientInfo {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
  saturatedFat: number | null;
  transFat: number | null;
  cholesterol: number | null;
  sugar: number | null;
  addedSugar: number | null;
  vitA: number | null;
  vitC: number | null;
  vitD: number | null;
  vitK: number | null;
  calcium: number | null;
  iron: number | null;
  potassium: number | null;
  magnesium: number | null;
  zinc: number | null;
  b6: number | null;
  b12: number | null;
  folate: number | null;
  phosphorus: number | null;
  selenium: number | null;
}

interface SearchResult extends Partial<NutrientInfo> {
  id: string;
  name: string;
  brand?: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  servingSize: string | null;
  source: "nyc" | "usda" | "openfoodfacts" | "common";
}

/* ── USDA nutrient ID → key mapping ──────────────────────────── */

const USDA_NUTRIENT_MAP: Record<number, keyof NutrientInfo> = {
  1008: "calories",
  1003: "protein",
  1005: "carbs",
  1004: "fat",
  1079: "fiber",
  1093: "sodium",
  1258: "saturatedFat",
  1257: "transFat",
  1253: "cholesterol",
  2000: "sugar",
  1235: "addedSugar",
  1106: "vitA",
  1162: "vitC",
  1114: "vitD",
  1185: "vitK",
  1087: "calcium",
  1089: "iron",
  1092: "potassium",
  1090: "magnesium",
  1095: "zinc",
  1175: "b6",
  1178: "b12",
  1177: "folate",
  1091: "phosphorus",
  1103: "selenium",
};

/* ── USDA mapper ──────────────────────────────────────────────── */

interface FdcNutrient {
  nutrientId: number;
  value: number;
}

interface FdcSearchFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FdcNutrient[];
}

function mapUsdaFood(food: FdcSearchFood): SearchResult {
  const nutrients: NutrientInfo = {
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    sodium: null,
    saturatedFat: null,
    transFat: null,
    cholesterol: null,
    sugar: null,
    addedSugar: null,
    vitA: null,
    vitC: null,
    vitD: null,
    vitK: null,
    calcium: null,
    iron: null,
    potassium: null,
    magnesium: null,
    zinc: null,
    b6: null,
    b12: null,
    folate: null,
    phosphorus: null,
    selenium: null,
  };

  for (const fn of food.foodNutrients) {
    const key = USDA_NUTRIENT_MAP[fn.nutrientId];
    if (key) {
      nutrients[key] = Math.round(fn.value * 10) / 10;
    }
  }

  const servingDesc = food.servingSize
    ? `${food.servingSize}${food.servingSizeUnit ?? "g"}`
    : null;

  // Flag high-calorie USDA entries that are likely per-100g values
  let name = food.description;
  if (nutrients.calories != null && nutrients.calories > 900) {
    name = `${name} (per 100g)`;
  }

  return {
    id: `usda_${food.fdcId}`,
    name,
    brand: food.brandOwner || food.brandName || "USDA",
    servingSize: servingDesc,
    source: "usda",
    ...nutrients,
  };
}

/* ── Open Food Facts mapper ───────────────────────────────────── */

interface OFFProduct {
  code?: string;
  _id?: string;
  product_name?: string;
  lang?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number | undefined>;
}

function mapOpenFoodFacts(product: OFFProduct): SearchResult | null {
  if (!product.product_name) return null;

  const n = product.nutriments ?? {};

  return {
    id: `off_${product.code || product._id}`,
    name: product.product_name,
    brand: product.brands || "Unknown",
    servingSize: product.serving_size || "per 100g",
    source: "openfoodfacts",
    calories: n["energy-kcal_100g"] != null ? Math.round(n["energy-kcal_100g"]) : null,
    protein: n["proteins_100g"] != null ? Math.round(n["proteins_100g"] * 10) / 10 : null,
    carbs: n["carbohydrates_100g"] != null ? Math.round(n["carbohydrates_100g"] * 10) / 10 : null,
    fat: n["fat_100g"] != null ? Math.round(n["fat_100g"] * 10) / 10 : null,
    fiber: n["fiber_100g"] != null ? Math.round(n["fiber_100g"] * 10) / 10 : null,
    sodium: n["sodium_100g"] != null ? Math.round(n["sodium_100g"] * 1000) : null,
    saturatedFat: n["saturated-fat_100g"] != null ? Math.round(n["saturated-fat_100g"] * 10) / 10 : null,
    transFat: n["trans-fat_100g"] != null ? Math.round(n["trans-fat_100g"] * 10) / 10 : null,
    cholesterol: n["cholesterol_100g"] != null ? Math.round(n["cholesterol_100g"] * 1000) : null,
    sugar: n["sugars_100g"] != null ? Math.round(n["sugars_100g"] * 10) / 10 : null,
    addedSugar: null,
    vitA: null,
    vitC: null,
    vitD: null,
    vitK: null,
    calcium: null,
    iron: null,
    potassium: null,
    magnesium: null,
    zinc: null,
    b6: null,
    b12: null,
    folate: null,
    phosphorus: null,
    selenium: null,
  };
}

/* ── NYC trigger words ───────────────────────────────────────── */

const NYC_TRIGGERS = [
  "bodega", "deli", "halal", "cart", "food cart", "street",
  "sweetgreen", "dig", "chopt", "chopt salad", "just salad", "cava", "panera",
  "chipotle", "shake shack", "shakeshack", "five guys", "wingstop", "popeyes",
  "chick-fil-a", "chickfila", "mcdonalds", "mcdonald's", "wendys",
  "burger king", "subway", "jersey mikes", "jersey mike's",
  "pret", "levain", "insomnia", "crumbl",
  "starbucks", "starbucks latte", "starbucks coffee", "frappuccino", "frapp",
  "dunkin", "dunkin donuts", "dunkin'", "dunkin donut",
  "van leeuwen", "milk bar", "katz", "katz's", "russ and daughters",
  "gray's papaya", "grays papaya", "halal guys", "halal cart", "grimaldi's",
  "los tacos", "bonchon", "mamoun's", "mamouns", "xi'an",
  "trader joes", "trader joe's", "whole foods",
  "bacon egg and cheese", "bacon egg cheese", "bec",
  "chicken over rice", "lamb over rice", "combo over rice",
  "chopped cheese", "dollar pizza", "dollar slice",
  "street meat", "street cart", "dirty water dog", "knish",
  "shackburger", "shack burger",
  "black and white cookie", "rainbow cookie",
  "egg cream", "bodega sandwich", "hero sandwich",
  "pizza", "pizza slice", "cheese slice", "pepperoni slice",
  "sicilian", "margherita", "grandma slice", "square slice",
];

function shouldSearchNYC(query: string): boolean {
  const q = query.toLowerCase().trim();
  return NYC_TRIGGERS.some((trigger) => q.includes(trigger));
}

/* ── Common food mapper ──────────────────────────────────────── */

function mapCommonFood(food: CommonFood): SearchResult {
  return {
    id: `common_${food.id}`,
    name: food.name,
    brand: food.servingLabel,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    servingSize: food.servingLabel,
    source: "common" as const,
  };
}

/* ── Deduplication ────────────────────────────────────────────── */

function dedup(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    const key = `${r.name.toLowerCase().replace(/[^a-z0-9]/g, "")}|${r.source}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

/* ── GET handler ──────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get("q")?.trim();
  const categoryFilter = req.nextUrl.searchParams.get("category")?.trim() || undefined;
  // "local" param: return only common foods (for client-side instant results)
  const localOnly = req.nextUrl.searchParams.get("local") === "1";
  // "source" param: fetch only a specific API source ("usda" or "off")
  const sourceOnly = req.nextUrl.searchParams.get("source")?.trim() || undefined;

  // Tag-based NYC favorites search (no q required)
  const tagsParam = req.nextUrl.searchParams.get("tags")?.trim();
  if (tagsParam && sourceOnly === "nyc") {
    const tags = tagsParam.split(",").map(t => t.trim()).filter(Boolean);
    const limitParam = parseInt(req.nextUrl.searchParams.get("limit") || "15", 10);
    const nycMatches = searchNycByTags(tags, limitParam);
    const results: SearchResult[] = nycMatches.map((item) => ({
      id: item.id,
      name: item.name,
      brand: item.chain ?? undefined,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      sodium: item.sodium ?? null,
      saturatedFat: item.saturatedFat ?? null,
      sugar: item.sugar ?? null,
      servingSize: item.servingSize,
      source: "nyc" as const,
    }));
    return NextResponse.json({ results, count: results.length, tier: "nyc-tags" });
  }

  if (!rawQuery || rawQuery.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { cleanQuery, quantity, grams, oz } = parseQueryQuantity(rawQuery);
    const query = cleanQuery || rawQuery;

    // TIER 1: Common foods (instant, always searched first)
    const commonMatches = searchCommonFoods(query, categoryFilter);
    const commonResults: SearchResult[] = commonMatches.map(mapCommonFood);

    // If local-only mode, return immediately with just common foods
    if (localOnly) {
      return NextResponse.json({
        query: rawQuery,
        cleanQuery: query,
        count: commonResults.length,
        results: commonResults,
        parsedQuantity: quantity || grams || oz ? { quantity, grams, oz } : undefined,
        tier: "local",
      });
    }

    // If source-only mode, fetch just that one API source
    if (sourceOnly === "usda") {
      const usdaResults = await fetchUsda(query);
      const all = dedup([...commonResults, ...usdaResults]);
      return NextResponse.json({
        query: rawQuery,
        cleanQuery: query,
        count: all.length,
        results: all.slice(0, 25),
        parsedQuantity: quantity || grams || oz ? { quantity, grams, oz } : undefined,
        tier: "usda",
      });
    }
    if (sourceOnly === "off") {
      const offResults = await fetchOpenFoodFacts(query);
      return NextResponse.json({
        query: rawQuery,
        cleanQuery: query,
        count: offResults.length,
        results: offResults.slice(0, 15),
        parsedQuantity: quantity || grams || oz ? { quantity, grams, oz } : undefined,
        tier: "off",
      });
    }

    // TIER 2: NYC database (only if query triggers NYC-specific search)
    let nycResults: SearchResult[] = [];
    if (shouldSearchNYC(query)) {
      const nycMatches = searchNycDatabase(query);
      nycResults = nycMatches.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.chain ?? undefined,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        sodium: item.sodium ?? null,
        saturatedFat: item.saturatedFat ?? null,
        sugar: item.sugar ?? null,
        servingSize: item.servingSize,
        source: "nyc" as const,
      }));
    }

    // TIER 3 + 4: USDA and Open Food Facts — fetched in PARALLEL
    const [usdaResults, offResults] = await Promise.all([
      fetchUsda(query),
      fetchOpenFoodFacts(query),
    ]);

    // Merge: Common first, then NYC, then USDA, then OFF
    const all = dedup([...commonResults, ...nycResults, ...usdaResults, ...offResults]);
    const results = all.slice(0, 25);

    return NextResponse.json({
      query: rawQuery,
      cleanQuery: query,
      count: results.length,
      results,
      parsedQuantity: quantity || grams || oz ? { quantity, grams, oz } : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to search nutrition data" },
      { status: 500 },
    );
  }
}

/* ── API fetch helpers (extracted for parallel use) ──────────── */

async function fetchUsda(query: string): Promise<SearchResult[]> {
  try {
    const usdaKey = process.env.USDA_API_KEY || "DEMO_KEY";
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${usdaKey}`;
    const usdaRes = await fetch(usdaUrl, { signal: AbortSignal.timeout(5000) });
    if (usdaRes.ok) {
      const usdaData = await usdaRes.json();
      const foods: FdcSearchFood[] = usdaData.foods ?? [];
      return foods.map(mapUsdaFood);
    }
  } catch { /* USDA fetch failed */ }
  return [];
}

async function fetchOpenFoodFacts(query: string): Promise<SearchResult[]> {
  try {
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&lc=en&cc=us`;
    const offRes = await fetch(offUrl, { signal: AbortSignal.timeout(5000) });
    if (offRes.ok) {
      const offData = await offRes.json();
      const products: OFFProduct[] = offData.products ?? [];
      return products
        .filter((p) => !p.lang || p.lang === "en")
        .map(mapOpenFoodFacts)
        .filter((r): r is SearchResult => r !== null)
        .filter((r) => /^[a-zA-Z0-9\s\-&',.()/]+$/.test(r.name));
    }
  } catch { /* OFF fetch failed */ }
  return [];
}

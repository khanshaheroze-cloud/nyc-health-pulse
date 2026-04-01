import { NextRequest, NextResponse } from "next/server";
import { searchNycDatabase, searchNycByTags } from "@/lib/nycFoodDatabase";
import { searchCommonFoods, parseQueryQuantity, type CommonFood } from "@/lib/commonFoods";
import { scoreSearchResult, applySourceBonus } from "@/lib/searchScoring";

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
  score?: number;
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

/* ── Common food mapper ──────────────────────────────────────── */

function mapCommonFood(food: CommonFood & { score?: number }): SearchResult {
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
    score: applySourceBonus(food.score ?? 0, "common"),
  };
}

/** Filter out results with no nutritional data (bad data from APIs) */
function filterZeroCalorieJunk(results: SearchResult[]): SearchResult[] {
  return results.filter(r =>
    (r.calories != null && r.calories > 0) ||
    (r.protein != null && r.protein > 0) ||
    (r.carbs != null && r.carbs > 0) ||
    (r.fat != null && r.fat > 0)
  );
}

/* ── Score-aware deduplication ───────────────────────────────── */

function dedup(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  for (const r of results) {
    // Normalize: lowercase, strip parenthetical, remove punctuation
    const normalized = r.name
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const existing = seen.get(normalized);
    if (!existing || (r.score ?? 0) > (existing.score ?? 0)) {
      seen.set(normalized, r);
    }
  }
  return Array.from(seen.values());
}

/* ── GET handler ──────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const rawQuery = req.nextUrl.searchParams.get("q")?.trim();
  const categoryFilter = req.nextUrl.searchParams.get("category")?.trim() || undefined;
  const localOnly = req.nextUrl.searchParams.get("local") === "1";
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

    // TIER 1: Common foods (instant, scored by relevance)
    const commonMatches = searchCommonFoods(query, categoryFilter);
    const commonResults: SearchResult[] = commonMatches.map(mapCommonFood);

    // If local-only mode, also include NYC results (both are instant in-memory)
    if (localOnly) {
      // Always search NYC database (instant, no API call)
      const nycMatches = searchNycDatabase(query);
      const nycResults: SearchResult[] = nycMatches.map((item) => ({
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
        score: applySourceBonus(scoreSearchResult(query, item.name, item.tags || []), "nyc"),
      })).filter(r => r.score > 0);

      // Merge common + NYC by score, filter zero-calorie junk
      const all = filterZeroCalorieJunk(dedup([...commonResults, ...nycResults]));
      all.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      return NextResponse.json({
        query: rawQuery,
        cleanQuery: query,
        count: all.length,
        results: all.slice(0, 15),
        parsedQuantity: quantity || grams || oz ? { quantity, grams, oz } : undefined,
        tier: "local",
      });
    }

    // If source-only mode, fetch just that one API source and re-score
    if (sourceOnly === "usda") {
      const usdaResults = await fetchUsda(query);
      // Re-score USDA results for relevance with source bonus
      const scoredUsda = usdaResults.map(r => ({
        ...r,
        score: applySourceBonus(scoreSearchResult(query, r.name, []), "usda"),
      }));
      const all = filterZeroCalorieJunk(dedup([...commonResults, ...scoredUsda]));
      all.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
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
      const scoredOff = filterZeroCalorieJunk(offResults
        .map(r => ({
          ...r,
          score: applySourceBonus(scoreSearchResult(query, r.name, []), "openfoodfacts"),
        }))
        .filter(r => r.score > 0));
      scoredOff.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      return NextResponse.json({
        query: rawQuery,
        cleanQuery: query,
        count: scoredOff.length,
        results: scoredOff.slice(0, 15),
        parsedQuantity: quantity || grams || oz ? { quantity, grams, oz } : undefined,
        tier: "off",
      });
    }

    // FULL SEARCH: Common + NYC + USDA + OFF — all scored and merged

    // NYC database (always searched now — instant, no API call)
    const nycMatches = searchNycDatabase(query);
    const nycResults: SearchResult[] = nycMatches.map((item) => ({
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
      score: applySourceBonus(scoreSearchResult(query, item.name, item.tags || []), "nyc"),
    })).filter(r => r.score > 0);

    // USDA + OFF in parallel
    const [usdaResults, offResults] = await Promise.all([
      fetchUsda(query),
      fetchOpenFoodFacts(query),
    ]);

    // Re-score API results with source bonuses and filter out 0-calorie junk data
    const scoredUsda = usdaResults.map(r => ({
      ...r,
      score: applySourceBonus(scoreSearchResult(query, r.name, []), "usda"),
    })).filter(r => r.score > 0);

    const scoredOff = offResults.map(r => ({
      ...r,
      score: applySourceBonus(scoreSearchResult(query, r.name, []), "openfoodfacts"),
    })).filter(r => r.score > 0);

    // Merge ALL results by score, dedup by id then name, filter zero-calorie junk
    const merged = [...commonResults, ...nycResults, ...scoredUsda, ...scoredOff];
    // ID-based dedup first
    const seenIds = new Set<string>();
    const idDeduped = merged.filter(r => {
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    });
    const all = filterZeroCalorieJunk(dedup(idDeduped));
    all.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
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

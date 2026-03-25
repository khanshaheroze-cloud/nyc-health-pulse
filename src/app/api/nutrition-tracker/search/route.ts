import { NextRequest, NextResponse } from "next/server";
import { searchNycDatabase } from "@/lib/nycFoodDatabase";

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
  source: "nyc" | "usda" | "openfoodfacts";
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

  return {
    id: `usda_${food.fdcId}`,
    name: food.description,
    brand: food.brandOwner || food.brandName || "USDA",
    servingSize: food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit ?? "g"}`
      : null,
    source: "usda",
    ...nutrients,
  };
}

/* ── Open Food Facts mapper ───────────────────────────────────── */

interface OFFProduct {
  code?: string;
  _id?: string;
  product_name?: string;
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
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    // 1. NYC curated database (instant, no network)
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
    }));

    // 2. USDA FoodData Central (if API key available)
    const usdaKey = process.env.USDA_API_KEY;
    let usdaResults: SearchResult[] = [];
    if (usdaKey) {
      try {
        const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${usdaKey}`;
        const usdaRes = await fetch(usdaUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (usdaRes.ok) {
          const usdaData = await usdaRes.json();
          const foods: FdcSearchFood[] = usdaData.foods ?? [];
          usdaResults = foods.map(mapUsdaFood);
        }
      } catch {
        // USDA fetch failed — continue without it
      }
    }

    // 3. Open Food Facts
    let offResults: SearchResult[] = [];
    try {
      const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`;
      const offRes = await fetch(offUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (offRes.ok) {
        const offData = await offRes.json();
        const products: OFFProduct[] = offData.products ?? [];
        offResults = products
          .map(mapOpenFoodFacts)
          .filter((r): r is SearchResult => r !== null);
      }
    } catch {
      // OFF fetch failed — continue without it
    }

    // Merge: NYC first, then USDA, then OFF — deduplicate, cap at 25
    const all = dedup([...nycResults, ...usdaResults, ...offResults]);
    const results = all.slice(0, 25);

    return NextResponse.json({
      query,
      count: results.length,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to search nutrition data" },
      { status: 500 },
    );
  }
}

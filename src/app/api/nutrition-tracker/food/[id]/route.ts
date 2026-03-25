import { NextRequest, NextResponse } from "next/server";
import { NYC_FOOD_DATABASE } from "@/lib/nycFoodDatabase";

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

interface FoodDetail extends NutrientInfo {
  id: string;
  name: string;
  brand: string;
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

const EMPTY_NUTRIENTS: NutrientInfo = {
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

/* ── USDA detail mapper ───────────────────────────────────────── */

interface FdcNutrient {
  nutrient: { id: number };
  amount?: number;
}

interface FdcFoodDetail {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FdcNutrient[];
}

function mapUsdaDetail(food: FdcFoodDetail): FoodDetail {
  const nutrients: NutrientInfo = { ...EMPTY_NUTRIENTS };

  for (const fn of food.foodNutrients) {
    const key = USDA_NUTRIENT_MAP[fn.nutrient.id];
    if (key && fn.amount != null) {
      nutrients[key] = Math.round(fn.amount * 10) / 10;
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

/* ── Open Food Facts detail mapper ────────────────────────────── */

interface OFFProductDetail {
  code?: string;
  _id?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number | undefined>;
}

function mapOffDetail(product: OFFProductDetail, barcode: string): FoodDetail {
  const n = product.nutriments ?? {};

  return {
    id: `off_${barcode}`,
    name: product.product_name || "Unknown Product",
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

/* ── GET handler ──────────────────────────────────────────────── */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    // NYC curated database
    if (id.startsWith("nyc_")) {
      const item = NYC_FOOD_DATABASE.find((f) => f.id === id);
      if (!item) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
      }
      return NextResponse.json({ food: { ...item, source: "nyc" } });
    }

    // USDA FoodData Central
    if (id.startsWith("usda_")) {
      const fdcId = id.replace("usda_", "");
      const usdaKey = process.env.USDA_API_KEY;
      if (!usdaKey) {
        return NextResponse.json(
          { error: "USDA API key not configured" },
          { status: 503 },
        );
      }

      const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${usdaKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
      }

      const data: FdcFoodDetail = await res.json();
      const food = mapUsdaDetail(data);
      return NextResponse.json({ food });
    }

    // Open Food Facts
    if (id.startsWith("off_")) {
      const barcode = id.replace("off_", "");
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
      }

      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
      }

      const food = mapOffDetail(data.product as OFFProductDetail, barcode);
      return NextResponse.json({ food });
    }

    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch food details" },
      { status: 500 },
    );
  }
}

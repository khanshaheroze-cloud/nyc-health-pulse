import { NextRequest, NextResponse } from "next/server";

// MenuStat — NYC DOHMH official chain restaurant nutrition data
// ~5,000 items across 60+ chains with full macro breakdown
// Updates annually, so cache for 30 days
export const revalidate = 2592000;

const MENUSTAT_URL = "https://data.cityofnewyork.us/resource/qgc5-ecnb.json";

interface MenuItem {
  restaurant: string;
  food_category: string;
  item_name: string;
  calories: number;
  total_fat: number;
  saturated_fat: number;
  sodium: number;
  total_carb: number;
  fiber: number;
  sugar: number;
  protein: number;
  serving_size: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const chain = searchParams.get("chain")?.trim();
  const maxCal = searchParams.get("maxCal");
  const category = searchParams.get("category")?.trim();
  const q = searchParams.get("q")?.trim();

  try {
    const where: string[] = ["calories IS NOT NULL"];

    if (chain) {
      where.push(`upper(restaurant) LIKE upper('%${chain.replace(/'/g, "''")}%')`);
    }
    if (maxCal) {
      const cal = parseInt(maxCal);
      if (!isNaN(cal)) where.push(`calories <= ${cal}`);
    }
    if (category) {
      where.push(`upper(food_category) LIKE upper('%${category.replace(/'/g, "''")}%')`);
    }
    if (q) {
      where.push(`upper(item_name) LIKE upper('%${q.replace(/'/g, "''")}%')`);
    }

    const select = "restaurant,food_category,item_name,calories,total_fat,saturated_fat,sodium,carbohydrates,dietary_fiber,sugar,protein,serving_size,serving_size_unit";
    const url = `${MENUSTAT_URL}?$where=${encodeURIComponent(where.join(" AND "))}&$select=${select}&$order=calories ASC&$limit=200`;

    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) throw new Error(`MenuStat API ${res.status}`);

    const raw = (await res.json()) as Record<string, string>[];

    const items: MenuItem[] = raw.map((r) => ({
      restaurant: r.restaurant || "",
      food_category: r.food_category || "",
      item_name: r.item_name || "",
      calories: Math.round(parseFloat(r.calories) || 0),
      total_fat: Math.round(parseFloat(r.total_fat) || 0),
      saturated_fat: Math.round(parseFloat(r.saturated_fat) || 0),
      sodium: Math.round(parseFloat(r.sodium) || 0),
      total_carb: Math.round(parseFloat(r.carbohydrates) || 0),
      fiber: Math.round(parseFloat(r.dietary_fiber) || 0),
      sugar: Math.round(parseFloat(r.sugar) || 0),
      protein: Math.round(parseFloat(r.protein) || 0),
      serving_size: r.serving_size ? `${r.serving_size}${r.serving_size_unit ? ` ${r.serving_size_unit}` : ""}` : "",
    }));

    // Get unique chains for discovery
    const chains = [...new Set(items.map((i) => i.restaurant))].sort();
    // Get unique categories
    const categories = [...new Set(items.map((i) => i.food_category).filter(Boolean))].sort();

    return NextResponse.json({
      items,
      total: items.length,
      chains,
      categories,
    });
  } catch (e) {
    console.error("MenuStat API error:", e);
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

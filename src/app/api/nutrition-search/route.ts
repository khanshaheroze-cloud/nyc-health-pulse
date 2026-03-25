import { NextRequest, NextResponse } from "next/server";
import { CHAINS } from "@/lib/restaurantData";
import { searchPopularFoods } from "@/lib/popularFoods";

/**
 * Smart tiered nutrition search:
 *
 *  Tier 1 — Our curated chain database (55 chains, 350+ items with full macros)
 *           Fuzzy-matches chain names + menu item names. "chipotle chicken bowl"
 *           instantly finds Chipotle's chicken bowls.
 *
 *  Tier 2 — NYC popular food database (halal cart, bodega, street food, etc.)
 *           "chicken over rice" → halal cart platter with accurate NYC-portion macros.
 *
 *  Tier 3 — USDA FoodData Central + Open Food Facts (500K+ foods)
 *           Fallback for everything else, with relevance-based ranking.
 *
 * Results are merged with tier priority: curated > popular > external.
 */

const USDA_KEY = process.env.USDA_API_KEY || "DEMO_KEY";
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1/foods/search";
const OFF_BASE = "https://world.openfoodfacts.org/cgi/search.pl";

/* ── Result type ────────────────────────────────────────────── */

interface NutritionResult {
  id: string;
  name: string;
  brand: string;
  servingSize: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  sodium: number | null;
  fiber: number | null;
  sugar: number | null;
  source: "curated" | "popular" | "usda" | "off";
  chainSlug?: string;       // link to /restaurants/[slug] if from our chain db
  relevanceScore: number;    // internal ranking score
}

/* ── Fuzzy matching helpers ─────────────────────────────────── */

/** Normalize string for matching: lowercase, remove punctuation, collapse spaces */
function norm(s: string): string {
  return s.toLowerCase().replace(/[''`]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Common typo/alias map for chain names */
const CHAIN_ALIASES: Record<string, string[]> = {
  "chipotle": ["chipotel", "chipotl", "chipote", "chipotlé", "chipolte"],
  "mcdonald's": ["mcdonalds", "mcdonald", "mickey d", "mickey ds", "mickeyd"],
  "dunkin'": ["dunkin", "dunkin donuts", "dunkn"],
  "chick-fil-a": ["chickfila", "chick fila", "chik fil a", "chickfil a"],
  "sweetgreen": ["sweet green"],
  "shake shack": ["shakeshack"],
  "starbucks": ["starbuck", "sbux"],
  "popeyes": ["popeye", "popeys"],
  "panera": ["panera bread"],
  "panda express": ["panda"],
  "wendy's": ["wendys", "wendy"],
  "taco bell": ["tacobell"],
  "subway": ["sub way"],
  "five guys": ["5 guys", "fiveguys"],
  "buffalo wild wings": ["bdubs", "b dubs", "bww"],
  "jersey mike's": ["jersey mikes", "jersey mike"],
  "domino's": ["dominos", "domino"],
  "papa john's": ["papa johns", "papa john"],
  "pizza hut": ["pizzahut"],
  "raising cane's": ["raising canes", "canes"],
  "wingstop": ["wing stop"],
  "just salad": ["justsalad"],
  "cava": ["cava grill"],
  "halal guys": ["the halal guys", "halal guy"],
};

/** Check if query matches a chain name (fuzzy) */
function matchChainName(query: string, chainName: string): number {
  const q = norm(query);
  const cn = norm(chainName);

  // Exact match
  if (q === cn) return 100;

  // Query contains chain name
  if (q.includes(cn)) return 90;

  // Chain name contains query (only if query is substantial)
  if (q.length >= 4 && cn.includes(q)) return 85;

  // Check aliases
  const key = Object.keys(CHAIN_ALIASES).find(k => norm(k) === cn);
  if (key) {
    const aliases = CHAIN_ALIASES[key];
    for (const alias of aliases) {
      if (q.includes(norm(alias)) || norm(alias).includes(q)) return 80;
    }
  }

  // Check if first word of query matches first word of chain
  const qWords = q.split(" ");
  const cWords = cn.split(" ");
  if (qWords[0].length >= 4 && cWords[0].startsWith(qWords[0])) return 70;

  return 0;
}

/** Score how well a menu item name matches the query */
function matchItemName(query: string, itemName: string): number {
  const q = norm(query);
  const item = norm(itemName);

  if (q === item) return 100;
  if (item.includes(q)) return 80;

  // Word-level matching
  const qWords = q.split(" ").filter(w => w.length >= 2);
  const itemWords = item.split(" ");

  // Remove chain name words from query for item matching
  let matchCount = 0;
  for (const qw of qWords) {
    if (itemWords.some(iw => iw.includes(qw) || qw.includes(iw))) {
      matchCount++;
    }
  }

  if (matchCount === 0) return 0;
  return Math.round((matchCount / qWords.length) * 60);
}

/* ── Tier 1: Chain database search ──────────────────────────── */

function searchChains(query: string): NutritionResult[] {
  const q = norm(query);
  if (q.length < 2) return [];

  const results: NutritionResult[] = [];

  for (const chain of CHAINS) {
    const chainScore = matchChainName(query, chain.name);

    for (const item of chain.items) {
      const itemScore = matchItemName(query, item.name);

      // Must match either chain or item meaningfully
      let relevance = 0;

      if (chainScore >= 70 && itemScore >= 30) {
        // Query matches BOTH chain and item (e.g., "chipotle chicken bowl")
        relevance = chainScore + itemScore + 50;
      } else if (chainScore >= 80) {
        // Strong chain match — show all items from that chain, ranked by item match
        relevance = chainScore + Math.max(itemScore, 10);
      } else if (itemScore >= 50) {
        // Good item match even without chain match (e.g., "harvest bowl")
        relevance = itemScore + 20;
      } else if (chainScore >= 70) {
        // Decent chain match
        relevance = chainScore;
      }

      // Boost by NYC presence (more locations = more relevant)
      if (relevance > 0) {
        relevance += Math.min(chain.nycLocations / 10, 5);

        results.push({
          id: `chain-${chain.slug}-${norm(item.name).replace(/\s/g, "-")}`,
          name: item.name,
          brand: chain.name,
          servingSize: "1 serving",
          calories: item.cal,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          sodium: item.sodium,
          fiber: item.fiber ?? null,
          sugar: item.sugar ?? null,
          source: "curated",
          chainSlug: chain.slug,
          relevanceScore: relevance,
        });
      }
    }
  }

  // If we matched a chain strongly, limit items to top ones from that chain
  // plus best matches from other chains
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/* ── Tier 2: Popular NYC foods search ───────────────────────── */

function searchPopular(query: string): NutritionResult[] {
  const matches = searchPopularFoods(query);
  return matches.map(m => ({
    id: `pop-${norm(m.name).replace(/\s/g, "-")}`,
    name: m.name,
    brand: m.brand,
    servingSize: m.servingSize,
    calories: m.calories,
    protein: m.protein,
    fat: m.fat,
    carbs: m.carbs,
    sodium: m.sodium,
    fiber: m.fiber,
    sugar: m.sugar,
    source: "popular" as const,
    relevanceScore: m.score + 30, // boost popular foods above generic USDA
  }));
}

/* ── Tier 3: USDA FoodData Central ──────────────────────────── */

interface FdcNutrient {
  nutrientId: number;
  value: number;
}

interface FdcFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FdcNutrient[];
  dataType?: string;
  score?: number; // USDA relevance score
}

function extractNutrient(nutrients: FdcNutrient[], id: number): number | null {
  const n = nutrients.find((x) => x.nutrientId === id);
  return n ? Math.round(n.value * 10) / 10 : null;
}

async function fetchUSDA(q: string): Promise<NutritionResult[]> {
  try {
    const url = `${USDA_BASE}?query=${encodeURIComponent(q)}&dataType=Branded,Survey%20(FNDDS)&pageSize=15&api_key=${USDA_KEY}`;
    const res = await fetch(url, { next: { revalidate: 604800 } });
    if (!res.ok) return [];
    const data = await res.json();
    const foods: FdcFood[] = data.foods ?? [];
    return foods.map((f, idx) => ({
      id: `usda-${f.fdcId}`,
      name: f.description,
      brand: f.brandOwner || f.brandName || (f.dataType === "Survey (FNDDS)" ? "USDA Standard" : "Unknown"),
      servingSize: f.servingSize ? `${f.servingSize}${f.servingSizeUnit ?? "g"}` : null,
      calories: extractNutrient(f.foodNutrients, 1008),
      protein: extractNutrient(f.foodNutrients, 1003),
      fat: extractNutrient(f.foodNutrients, 1004),
      carbs: extractNutrient(f.foodNutrients, 1005),
      sodium: extractNutrient(f.foodNutrients, 1093),
      fiber: extractNutrient(f.foodNutrients, 1079),
      sugar: extractNutrient(f.foodNutrients, 2000),
      source: "usda" as const,
      // Use USDA's own relevance scoring, decayed by position
      relevanceScore: Math.max(20 - idx * 1.5, 2),
    }));
  } catch {
    return [];
  }
}

/* ── Tier 3: Open Food Facts ────────────────────────────────── */

interface OFFProduct {
  _id: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    fat_100g?: number;
    carbohydrates_100g?: number;
    sodium_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    "energy-kcal_serving"?: number;
    proteins_serving?: number;
    fat_serving?: number;
    carbohydrates_serving?: number;
    sodium_serving?: number;
    fiber_serving?: number;
    sugars_serving?: number;
  };
}

async function fetchOFF(q: string): Promise<NutritionResult[]> {
  try {
    const url = `${OFF_BASE}?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=_id,product_name,brands,serving_size,nutriments`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 604800 } });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    const products: OFFProduct[] = data.products ?? [];

    return products
      .filter((p) => p.product_name && p.nutriments)
      .map((p, idx) => {
        const n = p.nutriments!;
        const hasSrv = n["energy-kcal_serving"] != null;
        const cal = hasSrv ? n["energy-kcal_serving"] : n["energy-kcal_100g"];
        return {
          id: `off-${p._id}`,
          name: p.product_name!,
          brand: p.brands || "Unknown",
          servingSize: p.serving_size || (hasSrv ? null : "per 100g"),
          calories: cal != null ? Math.round(cal) : null,
          protein: Math.round((hasSrv ? n.proteins_serving : n.proteins_100g) ?? 0) || null,
          fat: Math.round((hasSrv ? n.fat_serving : n.fat_100g) ?? 0) || null,
          carbs: Math.round((hasSrv ? n.carbohydrates_serving : n.carbohydrates_100g) ?? 0) || null,
          sodium: Math.round(((hasSrv ? n.sodium_serving : n.sodium_100g) ?? 0) * 1000) || null,
          fiber: Math.round((hasSrv ? n.fiber_serving : n.fiber_100g) ?? 0) || null,
          sugar: Math.round((hasSrv ? n.sugars_serving : n.sugars_100g) ?? 0) || null,
          source: "off" as const,
          relevanceScore: Math.max(12 - idx, 2),
        };
      });
  } catch {
    return [];
  }
}

/* ── Deduplication ──────────────────────────────────────────── */

function dedup(results: NutritionResult[]): NutritionResult[] {
  const seen = new Map<string, NutritionResult>();
  for (const r of results) {
    const key = norm(`${r.name}|${r.brand}`).replace(/[^a-z0-9]/g, "");
    if (!seen.has(key)) {
      seen.set(key, r);
    }
  }
  return Array.from(seen.values());
}

/* ── Main handler ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    // Tier 1 & 2: instant (no network), run synchronously
    const chainResults = searchChains(q);
    const popularResults = searchPopular(q);

    // Tier 3: network fetches in parallel
    const [usdaResults, offResults] = await Promise.all([
      fetchUSDA(q),
      fetchOFF(q),
    ]);

    // Merge all tiers — curated/popular first, then external
    const all = dedup([...chainResults, ...popularResults, ...usdaResults, ...offResults]);

    // Sort by relevance score (highest first)
    all.sort((a, b) => {
      // Primary: relevance score
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      // Secondary: items with calories first
      if (a.calories != null && b.calories == null) return -1;
      if (a.calories == null && b.calories != null) return 1;
      return 0;
    });

    // Cap at 25 results
    const results = all.slice(0, 25);

    // Count sources
    const sourceCount = {
      curated: results.filter(r => r.source === "curated").length,
      popular: results.filter(r => r.source === "popular").length,
      usda: results.filter(r => r.source === "usda").length,
      openFoodFacts: results.filter(r => r.source === "off").length,
    };

    return NextResponse.json({
      query: q,
      count: results.length,
      sources: sourceCount,
      results,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch nutrition data" }, { status: 500 });
  }
}

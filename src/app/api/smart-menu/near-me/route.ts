import { NextRequest, NextResponse } from "next/server";
import { CHAINS, type MenuItem as ChainMenuItem } from "@/lib/restaurantData";
import { inferMealType, mealMatches, type MealCategory } from "@/lib/inferMealType";
import { matchGenericCategory, type GenericTemplate, type GenericPick } from "@/lib/genericRestaurants";

export const dynamic = "force-dynamic";

const NON_FOOD_VENUE_RE = /\b(golf|bowling|cinema|theatre|theater|gym|fitness|coworking|workspace|co-work|members?\s*club|club\s*lounge|axe\s*throw|escape\s*room|trampoline|laser\s*tag|arcade|batting\s*cage|billiard|pool\s*hall|hookah|karaoke|night\s*club|strip\s*club|gentlemen|tattoo|spa\b(?!ghetti)|nail\s*salon|barber|beauty|laundromat|dry\s*clean|self.?storage|parking|gas\s*station)\b/i;

const COFFEE_ALLOWED_CATS = new Set(["cafe", "café", "deli", "sandwiches"]);
const COFFEE_ALLOWED_CHAIN_CATS = new Set(["Coffee & Bakery"]);

const BODEGA_CLASS_KEYS = new Set(["deli", "halal"]);

function isPrimaryFoodVenue(dba: string, cuisine: string): boolean {
  if (process.env.PULSENYC_VENUE_GATE === "off") return true;
  if (NON_FOOD_VENUE_RE.test(dba)) return false;
  return true;
}

function priceTierLabel(priceRange: number): string {
  if (priceRange <= 1) return "$";
  if (priceRange <= 2) return "$$";
  return "$$$";
}

const SNACK_FULL_MEAL_RE = /\b(entrees?|plates?|platters?|dinners?|combos?|family\s*size)\b/i;
const UNHEALTHY_SNACK_RE = /\b(glazed\s*donut|frosted\s*donut|cheese\s*danish|cinnamon\s*roll|chocolate\s*croissant)\b/i;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pulseScore(item: ChainMenuItem): number {
  let score = 0;
  const ratio = item.protein > 0 ? item.cal / item.protein : Infinity;
  if (ratio <= 7) score += 55;
  else if (ratio <= 10) score += 50;
  else if (ratio <= 14) score += 43;
  else if (ratio <= 18) score += 32;
  else if (ratio <= 25) score += 20;
  else if (ratio <= 35) score += 12;

  if (item.protein >= 40) score += 15;
  else if (item.protein >= 30) score += 12;
  else if (item.protein >= 20) score += 6;
  else if (item.protein >= 10) score += 3;

  if (item.fiber != null && item.cal > 0) {
    const fiberPer100 = (item.fiber / item.cal) * 100;
    if (fiberPer100 >= 2.5) score += 18;
    else if (fiberPer100 >= 1.5) score += 14;
    else if (fiberPer100 >= 0.8) score += 10;
    else if (fiberPer100 >= 0.4) score += 4;
  }

  if (item.cal <= 300) score += 15;
  else if (item.cal <= 450) score += 12;
  else if (item.cal <= 600) score += 8;
  else if (item.cal <= 800) score += 4;

  if (item.sodium > 1800) score -= 6;
  else if (item.sodium > 1500) score -= 3;
  else if (item.sodium > 1200) score -= 1;

  const addedSugar = item.sugar ?? 0;
  if (addedSugar > 20) score -= 6;
  else if (addedSugar > 12) score -= 3;
  else if (addedSugar > 6) score -= 1;

  return Math.max(0, Math.min(100, score));
}

const CHAIN_PATTERNS: { patterns: string[]; slug: string }[] = CHAINS.map((c) => {
  const n = c.name.toUpperCase();
  const patterns: string[] = [n];
  const VARIATIONS: Record<string, string[]> = {
    "MCDONALD'S": ["MCDONALDS", "MC DONALDS"],
    "DUNKIN'": ["DUNKIN", "DUNKIN DONUTS"],
    "CHICK-FIL-A": ["CHICK FIL A", "CHICKFILA"],
    "CHIPOTLE": ["CHIPOTLE MEXICAN", "CHIPOTLE MEXICAN GRILL"],
    "SWEETGREEN": ["SWEET GREEN"],
    "SUBWAY": ["SUBWAY RESTAURANT", "SUBWAY SANDWICHES"],
    "STARBUCKS": ["STARBUCKS COFFEE"],
    "SHAKE SHACK": ["SHAKESHACK"],
    "PANERA": ["PANERA BREAD"],
    "CAVA": ["CAVA GRILL", "CAVA MEZZE"],
    "WENDY'S": ["WENDYS"],
    "BURGER KING": ["BURGER KING CORP"],
    "TACO BELL": ["TACO BELL CORP"],
    "POPEYES": ["POPEYE'S", "POPEYES LOUISIANA"],
    "FIVE GUYS": ["FIVE GUYS BURGERS", "5 GUYS"],
    "JUST SALAD": ["JUST SALAD INC"],
    "PRET A MANGER": ["PRET-A-MANGER"],
    "DIG": ["DIG INN", "DIG FOOD"],
    "KFC": ["KENTUCKY FRIED CHICKEN"],
    "JERSEY MIKE'S": ["JERSEY MIKES"],
  };
  const extra = VARIATIONS[n];
  if (extra) patterns.push(...extra);
  return { patterns, slug: c.slug };
});

function matchChain(dba: string): string | null {
  const upper = dba.toUpperCase().trim();
  for (const { patterns, slug } of CHAIN_PATTERNS) {
    for (const p of patterns) {
      if (upper === p || upper.startsWith(p + " ") || upper.startsWith(p + "#")) return slug;
      if (p.length >= 5 && upper.includes(p)) return slug;
    }
  }
  return null;
}

const BEVERAGE_RE = /\b(latte|cappuccino|espresso|americano|matcha|cold.?brew|drip coffee|chai|macchiato|mocha|frappuccino|refresher|hot.?chocolate|hot.?cocoa)\b/i;
const STRICT_BREAKFAST_RE = /\b(egg.?(and|&).?cheese|breakfast (wrap|burrito|sandwich|taco)|pancakes?|waffles?|french.?toast|hash.?browns?|biscuits?|omelets?|omelettes?|hotcakes|egg.?whites?.*(wrap|sandwich)|bagels?.*(cream|cheese)|mcmuffin|scrambled?)\b/i;
const ALL_DAY_BREAKFAST_CATS = new Set(["deli", "diner", "cafe", "café"]);

function applyMealGuards(name: string, protein: number, cal: number, activeMeal: MealCategory, categoryKey: string, sugar?: number): boolean {
  if (BEVERAGE_RE.test(name)) {
    if (activeMeal === "lunch" || activeMeal === "dinner") return false;
    if (activeMeal !== "coffee" && protein < 5) return false;
  }
  if (activeMeal === "lunch" || activeMeal === "dinner" || activeMeal === "snack") {
    if (STRICT_BREAKFAST_RE.test(name) && !ALL_DAY_BREAKFAST_CATS.has(categoryKey.toLowerCase())) return false;
  }
  if (activeMeal === "snack") {
    if (cal > 450) return false;
    if (protein > 25) return false;
    if (SNACK_FULL_MEAL_RE.test(name)) return false;
    if (UNHEALTHY_SNACK_RE.test(name)) return false;
    if (sugar != null && sugar > 20 && protein < 5) return false;
  }
  if (activeMeal === "coffee") {
    if (protein >= 15 && cal >= 400) return false;
  }
  if ((activeMeal === "lunch" || activeMeal === "dinner") && cal < 250 && protein < 10) return false;
  return true;
}

function mealFilterFn(meal: string): (item: ChainMenuItem) => boolean {
  const activeMeal = meal as MealCategory;
  return (item) => {
    const inferred = inferMealType(item.name, item.tags);
    if (!mealMatches(inferred, activeMeal)) {
      if (!(activeMeal === "snack" && item.cal <= 300 && inferred !== "lunch" && inferred !== "dinner")) return false;
    }
    return applyMealGuards(item.name, item.protein, item.cal, activeMeal, "", item.sugar);
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function filterGenericPicks(picks: GenericPick[], meal: string, category: string, seed: number = 0): GenericPick[] {
  const activeMeal = meal as MealCategory;
  const catKey = category.toLowerCase();
  const scored = picks
    .filter(p => applyMealGuards(p.name, p.protein, p.cal, activeMeal, catKey))
    .map(p => {
      const inferred = inferMealType(p.name, undefined, category);
      let priority = 0;
      if (inferred === activeMeal) priority = 2;
      else if (mealMatches(inferred, activeMeal)) priority = 1;
      return { pick: p, priority };
    });

  if (scored.length === 0) return picks.slice(0, 3);

  scored.sort((a, b) => b.priority - a.priority);
  const result: GenericPick[] = [];
  const maxPri = scored[0].priority;
  const topTier = scored.filter(s => s.priority === maxPri);
  const rest = scored.filter(s => s.priority < maxPri);

  const offset = seed % topTier.length;
  for (let i = 0; i < Math.min(3, topTier.length); i++) {
    result.push(topTier[(offset + i) % topTier.length].pick);
  }
  if (result.length < 3 && rest.length > 0) {
    const nextPri = rest[0].priority;
    const nextBatch = rest.filter(s => s.priority === nextPri);
    const rOff = seed % nextBatch.length;
    for (let i = 0; result.length < 3 && i < nextBatch.length; i++) {
      result.push(nextBatch[(rOff + i) % nextBatch.length].pick);
    }
  }
  return result;
}

interface DOHMHRow {
  dba?: string;
  cuisine_description?: string;
  grade?: string;
  building?: string;
  street?: string;
  boro?: string;
  latitude?: string;
  longitude?: string;
}

interface ApiResult {
  restaurantId: string;
  slug: string;
  restaurantName: string;
  cuisine: string;
  priceRange: number;
  priceTier: string;
  distance: number;
  walkMinutes: number;
  lat: number;
  lng: number;
  address: string;
  grade: string;
  isGeneric: boolean;
  category: string;
  topPicks: { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; pulseScore: number }[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const meal = searchParams.get("meal") || "lunch";

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng required", restaurants: [] }, { status: 400 });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const where = `within_circle(location, ${latNum}, ${lngNum}, 800) AND grade IN('A','B')`;
    const url = `https://data.cityofnewyork.us/resource/43nn-pn8j.json?$where=${encodeURIComponent(where)}&$select=dba,cuisine_description,grade,building,street,boro,latitude,longitude&$limit=500&$order=grade ASC`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const rows: DOHMHRow[] = res.ok ? await res.json() : [];

    const filterFn = mealFilterFn(meal);
    const chainResults: ApiResult[] = [];
    const genericResults: ApiResult[] = [];
    const seenKeys = new Set<string>();

    let venueGateExcluded = 0;

    for (const r of rows) {
      const rLat = parseFloat(r.latitude || "0");
      const rLng = parseFloat(r.longitude || "0");
      if (rLat === 0) continue;

      if (!isPrimaryFoodVenue(r.dba || "", r.cuisine_description || "")) {
        venueGateExcluded++;
        continue;
      }

      const address = [r.building, r.street, r.boro].filter(Boolean).join(" ");
      const distMeters = haversine(latNum, lngNum, rLat, rLng);
      const walkMinutes = Math.round(distMeters / 80);

      const chainSlug = matchChain(r.dba || "");

      if (chainSlug) {
        const key = `${chainSlug}-${r.building}-${r.street}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const chain = CHAINS.find((c) => c.slug === chainSlug);
        if (!chain) continue;

        if (meal === "coffee" && !COFFEE_ALLOWED_CHAIN_CATS.has(chain.category)) continue;

        const activeMeal = meal as MealCategory;
        const scored = chain.items
          .filter(filterFn)
          .map((item) => {
            const ps = pulseScore(item);
            const strict = inferMealType(item.name, item.tags) === activeMeal;
            return {
              id: `${chainSlug}-${item.name.replace(/\s+/g, "-").toLowerCase()}`,
              name: item.name,
              calories: item.cal,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              fiber: item.fiber ?? 0,
              pulseScore: ps,
              _sort: ps + (strict ? 10 : 0),
            };
          })
          .sort((a, b) => b._sort - a._sort)
          .map(({ _sort, ...rest }) => rest)
          .slice(0, 3);

        if (scored.length === 0) continue;

        chainResults.push({
          restaurantId: `${chainSlug}-${rLat.toFixed(4)}`,
          slug: chainSlug,
          restaurantName: chain.name,
          cuisine: chain.category,
          priceRange: chain.priceRange,
          priceTier: priceTierLabel(chain.priceRange),
          distance: Math.round(distMeters),
          walkMinutes,
          lat: rLat,
          lng: rLng,
          address,
          grade: r.grade || "",
          isGeneric: false,
          category: chain.category,
          topPicks: scored,
        });
      } else {
        const template = matchGenericCategory(r.cuisine_description || "");
        if (!template) continue;

        if (meal === "coffee" && !COFFEE_ALLOWED_CATS.has(template.cuisineKey)) continue;

        const addrKey = `generic-${template.cuisineKey}-${r.building}-${r.street}`;
        if (seenKeys.has(addrKey)) continue;
        seenKeys.add(addrKey);

        const dba = r.dba || template.category;
        const seed = hashStr(dba + (r.building || "") + (r.street || ""));

        const filteredPicks = filterGenericPicks(template.picks, meal, template.category, seed);
        const topPicks = filteredPicks.map((p, i) => ({
          id: `${template.cuisineKey}-generic-${seed}-${i}`,
          name: p.name,
          calories: p.cal,
          protein: p.protein,
          carbs: 0,
          fat: 0,
          fiber: 0,
          pulseScore: p.protein >= 30 ? 80 : p.protein >= 20 ? 65 : p.protein >= 10 ? 45 : 30,
        }));

        genericResults.push({
          restaurantId: `generic-${template.cuisineKey}-${rLat.toFixed(4)}`,
          slug: `generic-${template.cuisineKey}`,
          restaurantName: dba,
          cuisine: template.category,
          priceRange: template.priceRange,
          priceTier: priceTierLabel(template.priceRange),
          distance: Math.round(distMeters),
          walkMinutes,
          lat: rLat,
          lng: rLng,
          address,
          grade: r.grade || "",
          isGeneric: true,
          category: template.category,
          topPicks,
        });
      }
    }

    chainResults.sort((a, b) => a.distance - b.distance);
    genericResults.sort((a, b) => a.distance - b.distance);

    // Interleave: aim for 2+ generics in the top 5 when available
    const mixed: ApiResult[] = [];
    let ci = 0, gi = 0;
    const seenSlugs = new Set<string>();

    // Take closest generic first, then alternate
    while (mixed.length < 10 && (ci < chainResults.length || gi < genericResults.length)) {
      const genericCount = mixed.filter(r => r.isGeneric).length;
      const chainCount = mixed.filter(r => !r.isGeneric).length;

      // Prefer generic if we need more to reach the 2-minimum target within first 5
      const needMoreGeneric = genericCount < 2 && mixed.length < 5 && gi < genericResults.length;
      const needMoreChain = chainCount < 2 && mixed.length < 5 && ci < chainResults.length;

      let pickGeneric: boolean;
      if (needMoreGeneric && !needMoreChain) {
        pickGeneric = true;
      } else if (needMoreChain && !needMoreGeneric) {
        pickGeneric = false;
      } else if (gi < genericResults.length && ci < chainResults.length) {
        pickGeneric = genericResults[gi].distance <= chainResults[ci].distance;
      } else {
        pickGeneric = gi < genericResults.length;
      }

      if (pickGeneric && gi < genericResults.length) {
        const spot = genericResults[gi++];
        const dedup = `${spot.category}-${spot.address}`;
        if (!seenSlugs.has(dedup)) {
          seenSlugs.add(dedup);
          mixed.push(spot);
        }
      } else if (ci < chainResults.length) {
        const spot = chainResults[ci++];
        if (!seenSlugs.has(spot.slug + "-" + spot.address)) {
          seenSlugs.add(spot.slug + "-" + spot.address);
          mixed.push(spot);
        }
      } else {
        break;
      }
    }

    const deduped: ApiResult[] = [];
    const seenPicks = new Set<string>();
    for (const spot of mixed) {
      const pickKey = `${spot.topPicks[0]?.name}-${spot.topPicks[0]?.calories}`;
      if (seenPicks.has(pickKey) && spot.isGeneric) continue;
      seenPicks.add(pickKey);
      deduped.push(spot);
    }

    // Forced bodega minimum: guarantee ≥1 deli/halal in results (except coffee mode)
    if (meal !== "coffee") {
      const hasBodega = deduped.some(r => r.isGeneric && BODEGA_CLASS_KEYS.has(r.slug.replace("generic-", "")));
      if (!hasBodega) {
        const bodegaCandidate = genericResults.find(r => {
          const key = r.slug.replace("generic-", "");
          return BODEGA_CLASS_KEYS.has(key) && !deduped.some(d => d.restaurantId === r.restaurantId);
        });
        if (bodegaCandidate) {
          if (deduped.length >= 5) {
            deduped.splice(4, 0, bodegaCandidate);
          } else {
            deduped.push(bodegaCandidate);
          }
        }
      }
    }

    const final = deduped.slice(0, 10);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[smart-menu] meal=${meal} venueGateExcluded=${venueGateExcluded} chains=${chainResults.length} generic=${genericResults.length} final=${final.length}`);
      const bodegaInFinal = final.filter(r => r.isGeneric && BODEGA_CLASS_KEYS.has(r.slug.replace("generic-", "")));
      if (bodegaInFinal.length > 0) console.log(`[smart-menu] bodega in results: ${bodegaInFinal.map(r => r.restaurantName).join(", ")}`);
    }

    return NextResponse.json({ restaurants: final });
  } catch (err) {
    console.error("smart-menu/near-me error:", err);
    return NextResponse.json({ restaurants: [] });
  }
}

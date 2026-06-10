import { CHAINS } from "@/lib/restaurantData";

/* ── Venue name normalization ──────────────────────────────────────────────
 * DOHMH `dba` values arrive as raw ALL-CAPS strings with store numbers and
 * typos: "CHIPOTLE MEXCIAN GRILL # 2760", "DUNKIN' #350162", "WXYZ BAR &
 * LOUNGE". Everything user-facing goes through normalizeVenueName(); brand
 * detection goes through canonicalBrand().
 */

// Tokens that keep specific casing rather than plain Title Case
const CASE_OVERRIDES: Record<string, string> = {
  "mcdonald's": "McDonald's",
  mcdonalds: "McDonald's",
  bbq: "BBQ",
  blt: "BLT",
  nyc: "NYC",
  usa: "USA",
  ii: "II",
  iii: "III",
  iv: "IV",
  kfc: "KFC",
  ihop: "IHOP",
  "chick-fil-a": "Chick-fil-A",
  cava: "CAVA",
  "a&w": "A&W",
};

// Small words stay lowercase unless they start the name
const SMALL_WORDS = new Set(["of", "the", "and", "a", "an", "at", "on", "in", "by", "de", "la", "del", "y"]);

function titleCaseToken(token: string, isFirst: boolean): string {
  const lower = token.toLowerCase();
  if (CASE_OVERRIDES[lower]) return CASE_OVERRIDES[lower];
  if (!isFirst && SMALL_WORDS.has(lower)) return lower;
  // Mc/Mac prefix handling: MCNULTY'S -> McNulty's
  const mc = lower.match(/^mc(\w)(.*)$/);
  if (mc) return `Mc${mc[1].toUpperCase()}${mc[2]}`;
  // Hyphen/slash segments get capitalized; after an apostrophe only when more
  // than one letter follows (O'MALLEY -> O'Malley, but JOE'S -> Joe's)
  return lower
    .replace(/(^|[-/])(\w)/g, (_, sep, ch) => sep + ch.toUpperCase())
    .replace(/'(\w)(?=\w)/g, (_, ch) => `'${ch.toUpperCase()}`);
}

export function normalizeVenueName(raw: string): string {
  if (!raw) return "";
  let s = raw
    .trim()
    // strip trailing store numbers: "# 2760", "#350162", "NO. 5", "STORE 1234"
    .replace(/\s*#\s*\d+\s*$/g, "")
    .replace(/\s+(NO\.?|STORE)\s*\d+\s*$/i, "")
    // strip corporate suffixes
    .replace(/\s+(INC|LLC|CORP|CO|LTD)\.?\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Already mixed-case (not shouting)? Leave the owner's casing alone.
  if (s !== s.toUpperCase()) return s;

  return s
    .split(" ")
    .map((tok, i) => {
      // Keep "&" and single punctuation as-is
      if (/^[&+·]$/.test(tok)) return tok;
      return titleCaseToken(tok, i === 0);
    })
    .join(" ");
}

/* ── Canonical brand matching ─────────────────────────────────────────────── */

export interface Brand {
  slug: string;
  name: string;
}

// Alias map: DOHMH spellings (including common misspellings) → chain slug.
// Patterns are matched uppercase. A brand match means curated picks data is
// used — never a generic template.
const BRAND_ALIASES: Record<string, string[]> = {
  mcdonalds: ["MCDONALDS", "MC DONALDS", "MCDONALD"],
  dunkin: ["DUNKIN", "DUNKIN DONUTS", "DUNKIN' DONUTS"],
  "chick-fil-a": ["CHICK FIL A", "CHICKFILA", "CHICK-FIL-A"],
  chipotle: ["CHIPOTLE MEXICAN", "CHIPOTLE MEXICAN GRILL", "CHIPOTLE MEXCIAN GRILL", "CHIPOTLE MEXCIAN"],
  sweetgreen: ["SWEET GREEN", "SWEETGREENS"],
  subway: ["SUBWAY RESTAURANT", "SUBWAY SANDWICHES", "SUBWAY CAFE"],
  starbucks: ["STARBUCKS COFFEE", "STARBUCKS RESERVE"],
  "shake-shack": ["SHAKESHACK", "SHAKE SHACK"],
  panera: ["PANERA BREAD", "PANERA CARES"],
  cava: ["CAVA GRILL", "CAVA MEZZE"],
  wendys: ["WENDYS", "WENDY'S", "WENDY S"],
  "burger-king": ["BURGER KING CORP", "BURGER KING"],
  "taco-bell": ["TACO BELL CORP", "TACO BELL CANTINA"],
  popeyes: ["POPEYE'S", "POPEYES LOUISIANA", "POPEYES LOUISIANA KITCHEN", "POPEYE"],
  "five-guys": ["FIVE GUYS BURGERS", "5 GUYS", "FIVE GUYS BURGERS AND FRIES"],
  "just-salad": ["JUST SALAD INC", "JUST SALAD LLC"],
  "pret-a-manger": ["PRET-A-MANGER", "PRET A MANGER", "PRET"],
  dig: ["DIG INN", "DIG FOOD GROUP", "DIG INN SEASONAL MARKET"],
  kfc: ["KENTUCKY FRIED CHICKEN"],
  "jersey-mikes": ["JERSEY MIKES", "JERSEY MIKE'S SUBS", "JERSEY MIKE'S"],
  "halal-guys": ["THE HALAL GUYS", "HALAL GUYS"],
  "panda-express": ["PANDA EXPRESS"],
  wingstop: ["WING STOP"],
  dominos: ["DOMINOS", "DOMINO'S PIZZA", "DOMINOS PIZZA", "DOMINO'S"],
  chopt: ["CHOPT CREATIVE SALAD", "CHOP'T"],
  naya: ["NAYA EXPRESS", "NAYA MIDTOWN", "NAYA MEZZE"],
  "papa-johns": ["PAPA JOHNS", "PAPA JOHN'S PIZZA", "PAPA JOHNS PIZZA"],
  "pizza-hut": ["PIZZA HUT EXPRESS"],
  "joes-pizza": ["JOES PIZZA", "FAMOUS JOE'S PIZZA"],
  "2-bros-pizza": ["2 BROS", "TWO BROS", "2BROS", "2 BROS. PIZZA"],
  "buffalo-wild-wings": ["B-DUBS", "BUFFALO WILD WINGS"],
  "raising-canes": ["RAISING CANES", "RAISING CANE"],
  "kung-fu-tea": ["KUNGFU TEA"],
  "gregorys-coffee": ["GREGORYS COFFEE", "GREGORY'S COFFEE"],
  "lukes-lobster": ["LUKES LOBSTER", "LUKE'S LOBSTER"],
  smashburger: ["SMASH BURGER"],
  applebees: ["APPLEBEES", "APPLEBEE'S GRILL", "APPLEBEE'S"],
  chilis: ["CHILIS", "CHILI'S GRILL", "CHILI'S"],
  "tgi-fridays": ["TGI FRIDAYS", "T.G.I. FRIDAY'S", "TGI FRIDAY'S"],
  "olive-garden": ["OLIVE GARDEN ITALIAN"],
  dennys: ["DENNYS", "DENNY'S"],
  ihop: ["INTERNATIONAL HOUSE OF PANCAKES"],
  "cheesecake-factory": ["THE CHEESECAKE FACTORY"],
  "bon-chon": ["BONCHON", "BON CHON CHICKEN"],
  "jamba-juice": ["JAMBA JUICE"],
  "juice-press": ["JUICEPRESS", "JUICE PRESS"],
  "dos-toros": ["DOS TOROS TAQUERIA"],
  "tender-greens": ["TENDERGREENS"],
  honeygrow: ["HONEY GROW"],
  "playa-bowls": ["PLAYA BOWL"],
  pokeworks: ["POKÉWORKS", "POKE WORKS"],
  "sweetcatch-poke": ["SWEET CATCH", "SWEETCATCH"],
  "hale-and-hearty": ["HALE AND HEARTY", "HALE & HEARTY", "HALE & HEARTY SOUPS"],
  "wok-to-walk": ["WOKTOWALK"],
};

interface BrandPattern {
  patterns: string[];
  slug: string;
  name: string;
}

let _patterns: BrandPattern[] | null = null;

function brandPatterns(): BrandPattern[] {
  if (_patterns) return _patterns;
  _patterns = CHAINS.map((c) => {
    const upper = c.name.toUpperCase();
    const fromAliases =
      BRAND_ALIASES[c.slug] ??
      // Also look the chain up by uppercase name for alias keys defined by name
      BRAND_ALIASES[c.name.toLowerCase()] ??
      [];
    // Apostrophe-less variant catches "MCDONALDS"/"WENDYS" style DBAs generically
    const noApostrophe = upper.replace(/'/g, "");
    const patterns = [upper, ...(noApostrophe !== upper ? [noApostrophe] : []), ...fromAliases];
    return { patterns: [...new Set(patterns)], slug: c.slug, name: c.name };
  });
  return _patterns;
}

export function canonicalBrand(raw: string): Brand | null {
  if (!raw) return null;
  const upper = raw.toUpperCase().trim();
  for (const { patterns, slug, name } of brandPatterns()) {
    for (const p of patterns) {
      if (upper === p || upper.startsWith(p + " ") || upper.startsWith(p + "#")) {
        return { slug, name };
      }
      // Substring match only for distinctive (≥5 char) patterns to avoid
      // matching "SUBWAY DELI GROCERY" style false positives on short names
      if (p.length >= 5 && upper.includes(p)) return { slug, name };
    }
  }
  return null;
}

/* ── Healthy-pick eligibility ─────────────────────────────────────────────
 * Venues that should never appear in ranked "healthy picks": bars, lounges,
 * nightlife, dessert/donut-only spots, hotel kitchens. They stay findable in
 * the full map view — this only gates the ranked list. Brand-matched venues
 * are exempt (Dunkin' is curated even though "DONUT" appears).
 */

// "BAR" is excluded only when it is not a healthy bar type (juice/salad/poke/etc.)
const HEALTHY_BAR_RE = /\b(juice|salad|poke|smoothie|acai|grain|soup|veggie|wellness)\s+bar\b/i;
const EXCLUDED_NAME_RE =
  /\b(lounge|cabaret|night\s*club|nightclub|tavern|saloon|speakeasy|brewery|brewing|taproom|tap\s*room|wine\s*bar|whiskey|cocktail|pastry|patisserie|donut|doughnut|cupcake|creamery|gelato|ice\s*cream|candy|chocolatier|dessert|main\s*kitchen|banquet|room\s*service|employee\s*(cafeteria|dining)|catering|caterers?|commissary|test\s*kitchen|events?\s+(center|space|hall|venue))\b/i;
// Venues whose name ENDS in "EVENT(S)" are event spaces, not walk-in lunch
// ("HILTON EVENTS") — separate pattern because $ can't live inside the \b group
const EVENTS_SUFFIX_RE = /\bevents?\s*$/i;
const BAR_WORD_RE = /\bbar\b/i;
const EXCLUDED_CUISINE_RE =
  /^(bottled beverages|donuts|bakery products\/desserts|frozen desserts|coffee\/tea|not listed\/not applicable)$/i;
// Cuisine "Coffee/Tea" stays eligible in coffee mode — handled by caller.

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function healthyPickEligibility(
  rawName: string,
  cuisineDescription: string,
  isBrandMatched: boolean,
  meal?: string,
): EligibilityResult {
  if (isBrandMatched) return { eligible: true };
  const name = rawName || "";
  if (EXCLUDED_NAME_RE.test(name) || EVENTS_SUFFIX_RE.test(name)) {
    return { eligible: false, reason: "nightlife/dessert/event venue" };
  }
  if (BAR_WORD_RE.test(name) && !HEALTHY_BAR_RE.test(name)) {
    return { eligible: false, reason: "bar" };
  }
  const cuisine = (cuisineDescription || "").trim();
  if (EXCLUDED_CUISINE_RE.test(cuisine)) {
    if (meal === "coffee" && /^coffee\/tea$/i.test(cuisine)) return { eligible: true };
    return { eligible: false, reason: `cuisine: ${cuisine}` };
  }
  return { eligible: true };
}

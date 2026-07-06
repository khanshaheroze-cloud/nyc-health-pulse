import { CHAINS } from "@/lib/restaurantData";
import { classifyBar } from "@/lib/venuePolicy";
import { matchGenericCategory } from "@/lib/genericRestaurants";

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
  lic: "LIC",
  ues: "UES",
  uws: "UWS",
  les: "LES",
  dumbo: "DUMBO",
  soho: "SoHo",
  noho: "NoHo",
  jfk: "JFK",
};

// Acronyms that can be glued to a leading digit run: "4747LIC" -> "4747 LIC".
// Only split when the letter run is a known acronym — "21CLUB" stays intact.
const DIGIT_GLUE_ACRONYMS = new Set(["lic", "nyc", "bbq", "ues", "uws", "les", "jfk"]);

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
    .flatMap((tok) => {
      const glued = tok.match(/^(\d+)([a-z]+)$/i);
      if (glued && DIGIT_GLUE_ACRONYMS.has(glued[2].toLowerCase())) {
        return [glued[1], glued[2]];
      }
      return [tok];
    })
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

/* THE WALK-IN TEST (July 5 2026 audit, P0): a ranked pick must be a venue a
 * member of the public can walk into and order at, during posted hours. DOHMH
 * licenses plenty of real food-service operations that fail this test —
 * corporate-cafeteria pop-ups (Fooda), contract caterers (Sodexo, Aramark,
 * Compass/Flik, Guckenheimer), employee dining rooms, commissaries. They are
 * real records with real inspections, but a stranger cannot eat there, so they
 * must never rank. They stay on the map, dimmed, labeled "Private/institutional". */
const NON_WALKIN_RE =
  /\b(fooda|sodexo|aramark|guckenheimer|compass\s*group|flik|restaurant\s*associates|cafeterias?|commissary|commissaries|catering|caterers?|food\s*services?|dining\s*services?|employees?|staff\s*(dining|cafeteria|canteen|kitchen)|canteen)\b/i;
// DOHMH cuisine descriptors that indicate institutional (non-public) service
const NON_WALKIN_CUISINE_RE = /\b(cafeteria|employee|institutional)\b/i;

/* Round 6 (third leak of this class — Fooda → UNFCU/Boyce Technologies):
 * DOHMH also permits employee cafés under the ORGANIZATION'S name — "UNITED
 * NATIONS FEDERAL CREDIT UNION", "BOYCE TECHNOLOGIES" — which the service-
 * token list above can't see. Organizational tokens on the DBA are an
 * institutional signal. Trailing legal suffixes are stripped FIRST so the
 * ubiquitous bodega style "STAR DELI GROCERY CORP" never trips CORP; the
 * token only fires when it is part of the name itself. A name that carries
 * an org token BUT a strong food signal (KITCHEN/GRILL/RESTAURANT/CAFE) AND
 * a real food cuisine goes to a review list instead of auto-exclusion. */
const ORG_LEGAL_SUFFIX_RE = /\s+(INC|LLC|L\.L\.C|CORP|CO|LTD)\.?\s*$/i;
const ORG_TOKEN_RE =
  /\b(credit union|bank|technologies|technology|industries|manufacturing|laboratories|laboratory|corp|corporation|studios|school|academy|university|college|hospital|medical center|nursing|senior center|day\s?care|church|temple|synagogue|ymca|ywca|department of|authority)\b/i;
const ORG_FOOD_SIGNAL_RE = /\b(kitchen|grill|grille|restaurant|cafe|café)\b/i;

export interface OrgVenueVerdict {
  verdict: "exclude" | "review" | "clear";
  token?: string;
}

/** Institutional/organization-name check on a DOHMH dba. "exclude" = never
 *  rank; "review" = org token but genuine food signals — keep, but log for
 *  human review; "clear" = no org signal. */
export function classifyOrgVenue(rawName: string, cuisineDescription: string): OrgVenueVerdict {
  const name = (rawName || "")
    .replace(/\s*#\s*\d+\s*$/g, "")
    // Parentheticals are location annotations, not the venue's identity —
    // "MOGAO (Bank of China)" is a public restaurant inside that tower
    // (July 6 sweep false positive), while UNFCU/Boyce carry the org token
    // in the name proper.
    .replace(/\([^)]*\)/g, " ")
    .replace(ORG_LEGAL_SUFFIX_RE, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const m = ORG_TOKEN_RE.exec(name);
  if (!m) return { verdict: "clear" };
  const token = m[1].toUpperCase();
  const hasFoodName = ORG_FOOD_SIGNAL_RE.test(name);
  const hasFoodCuisine = !!cuisineDescription && matchGenericCategory(cuisineDescription) !== null;
  if (hasFoodName && hasFoodCuisine) return { verdict: "review", token };
  return { verdict: "exclude", token };
}

/** Non-null when a venue fails the walk-in test; the string is the reason. */
export function nonWalkInReason(rawName: string, cuisineDescription: string): string | null {
  if (NON_WALKIN_RE.test(rawName || "")) return "private/institutional food service (name)";
  if (NON_WALKIN_CUISINE_RE.test(cuisineDescription || "")) return "private/institutional food service (cuisine)";
  const org = classifyOrgVenue(rawName, cuisineDescription);
  if (org.verdict === "exclude") return `institutional/organization permit (${org.token})`;
  return null;
}
const EXCLUDED_NAME_RE =
  /\b(lounge|cabaret|night\s*club|nightclub|tavern|saloon|speakeasy|brewery|brewing|taproom|tap\s*room|wine\s*bar|whiskey|cocktail|pastry|patisserie|donut|doughnut|cupcake|creamery|gelato|ice\s*cream|candy|chocolatier|dessert|main\s*kitchen|banquet|room\s*service|employee\s*(cafeteria|dining)|catering|caterers?|commissary|test\s*kitchen|events?\s+(center|space|hall|venue))\b/i;
// Venues whose name ENDS in "EVENT(S)" are event spaces, not walk-in lunch
// ("HILTON EVENTS") — separate pattern because $ can't live inside the \b group
const EVENTS_SUFFIX_RE = /\bevents?\s*$/i;
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
  // Walk-in test first: Fooda/cafeteria/caterer records are the most
  // trust-damaging failure (a #1 pick the public cannot walk into)
  const nonWalkIn = nonWalkInReason(name, cuisineDescription);
  if (nonWalkIn) {
    return { eligible: false, reason: nonWalkIn };
  }
  // Bar policy (round 5, owner directive): drink-first dive bars are OUT of
  // ranked picks; food-forward bars — gastropubs with real kitchens, or the
  // curated allowlist (Woodbines, Gantry) — rank normally. classifyBar runs
  // BEFORE the nightlife name patterns so "X TAVERN KITCHEN" with a food
  // cuisine isn't killed by the tavern token.
  const barClass = classifyBar(name, cuisineDescription);
  if (barClass === "food-forward-bar") return { eligible: true };
  if (barClass === "drink-first-bar") {
    return { eligible: false, reason: "drink-first bar" };
  }
  if (EXCLUDED_NAME_RE.test(name) || EVENTS_SUFFIX_RE.test(name)) {
    return { eligible: false, reason: "nightlife/dessert/event venue" };
  }
  const cuisine = (cuisineDescription || "").trim();
  if (EXCLUDED_CUISINE_RE.test(cuisine)) {
    if (meal === "coffee" && /^coffee\/tea$/i.test(cuisine)) return { eligible: true };
    return { eligible: false, reason: `cuisine: ${cuisine}` };
  }
  return { eligible: true };
}

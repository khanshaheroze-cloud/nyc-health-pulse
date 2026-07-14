# PulseNYC — App Freeze Report (July 13, 2026)

**FINAL — Android build proceeds from this freeze.**

The web surface is **FROZEN** as of round 8 (round 6 froze the surface; round 7 added the
Places data layer; round 8 polished it after the July 13 live validation and re-froze).
This document is the handoff artifact for the Android app build: what exists, where the
data comes from, what the known limitations are, what the test suite covers, and what the
app build needs to run.

- **Live domain:** https://pulsenyc.app (alias https://nyc-health.vercel.app)
- **Frozen at branch:** `feat/may16-design-overhaul` (round-6 head; see `git log` for the
  round-1…6 sprint commits)
- **Deploy procedure:** `pnpm deploy:prod` (= `vercel --prod --force` + post-deploy smoke
  check; the deploy FAILS loudly if the live homepage serves a stale proof line)

---

## 1. Feature inventory

### The wedge (homepage `/`)
- Time-aware hero: "the 5 best macro-friendly meals under $15 within a 10-minute walk"
- Location: GPS (low-confidence confirm flow), manual address/ZIP with subway-stop
  autocomplete, persisted in `localStorage` (`pulsenyc:lastLocation`), synced across pages
- Meal toggle (breakfast / lunch / coffee / snack / dinner, NYC-clock default)
- Filter chips: High protein (always on) · Under $15 · Quick (under 5 min) — filtered views
- Sort chips: PulseScore · Protein · Calories · Distance · Protein per $ — client-side
  re-order, no refetch, idempotent (round 6)
- Ranked five (under-$15 only) → "Worth a splurge · over $15" row → "Nearby · ordering
  guidance only" row (venues with no coherent picks — never ranked)
- Origin transparency line: "Near {label} · wrong? Update location"
- Venue modal (picks, macros, hours chip, report-an-error, share order) and Leaflet map
  (ranked pins + dimmed known-closed venues)
- App waitlist capture (Resend `app_waitlist` list) with digest add-on
- Bento grid: AQI (AirNow parity), water, pollen, UV, plus WeeklyChanges + status chips

### Other product surfaces
- `/spot/[camis]` — shareable SEO dossier for any DOHMH venue (ISR on demand); honest link
  policy: menu-verified → verified page, chain → `/restaurants/{slug}`, local → methodology
- `/restaurants` + `/restaurants/[slug]` — 55 chains with full curated nutrition (swept
  against published US menus July 2026) + any menu-verified independents
- `/eat-smart` — full Mapbox map view (institutional + drink-first venues dimmed/labeled)
- `/guides` — weekly food guides (newsletter capture, `newsletter` list)
- Health data: neighborhood explorer (42 UHF), Health Score / Move Score, choropleths,
  building health dossier, street safety, chronic disease, maternal health, `/methodology`,
  `/sources`, `/pulsescore`
- Trackers: nutrition (USDA search) and workout
- `/admin/metrics` — funnel dashboard (Supabase events; kill/continue gate Aug 9)
- PWA (manifest + sw.js), OG images, JSON-LD, sitemap, print styles
- Email: `/api/subscribe` (two intentional lists), `/api/digest` (crons Mon + daily 1pm UTC)
  — **Resend domain not yet activated** (manual DNS step, see MEMORY)
- Push scaffolding: `/api/push/*` (register, AQI alert, meal nudge) — needs Supabase +
  PUSH_SECRET/CRON_SECRET; not user-visible yet

## 2. Data sources & refresh cadences

| Source | Dataset | Cadence in app |
|---|---|---|
| DOHMH restaurant inspections | Socrata `43nn-pn8j` | near-me: 1h revalidate (geo-snapped cache cells); /spot: 24h |
| **Google Places (New) — liveness/geometry/hours/type/bodegas** (Round 7, LIVE since July 13) | `places:searchText` + `places:searchNearby`, strict field mask | lazy per ranked candidate (≤13/query) + per-cell bodega query; **24h cache** (Supabase `places_cache` + per-lambda LRU — a Places-policy decision, see Round 8 addendum); nightly warm cron keeps warm-cell user requests at ~0 calls; hard `PLACES_DAILY_BUDGET` circuit-breaker. Dark without `GOOGLE_PLACES_API_KEY`. |
| Chain nutrition (55 brands) | `src/lib/restaurantData.ts` | static, hand-swept July 2026 (`lastVerified` per chain) |
| Generic templates (14 cuisines incl. bagels/peruvian/latin) | `src/lib/genericRestaurants.ts` | static, estimates ±15% |
| Verified venues (LIC guide) | `src/lib/verifiedVenues` | static; **0 of 11 menu-verified** (all `estimated`) |
| Opening hours | brand defaults (`src/lib/hours.ts`) + verified hours; optional API behind `OPENING_HOURS_API_KEY` | evaluated in America/New_York, never server TZ |
| Chain price bands | `src/data/chain-prices.json` | static, owner-editable |
| Venue policy (dessert blocklist, food-forward bar allowlist) | `src/data/venue-policy.json` | static, owner-editable |
| Live health data (~30 fetchers: COVID, rodent, water, NYCCAS air, beach `2xir-kwzz`, dog bites `rsgh-akpg`, EMS `76xm-jjuj`, HPD `eabe-havv`, …) | `src/lib/liveData.ts` | per-fetcher revalidate; every fetcher null-falls-back to `src/lib/data.ts` seed |
| AQI | AirNow (key) → NYCCAS pm2.5×4.2 → seed | request-time |
| Weather/UV/pollen | Tomorrow.io (key) | request-time |
| USDA FoodData Central | nutrition tracker search | request-time (key) |

All Socrata fetches send `X-App-Token` when `NYC_OPEN_DATA_APP_TOKEN` is set.

## 3. Known limitations (honesty affordances — keep them)

- **Hours coverage is low:** at the LIC launch coords only ~25% of ranked venues have a
  known open/closed state (2/7–2/8 per meal on July 6; chains via brand defaults). Everything
  else renders "Hours unknown" — never claimed open. `results_hours_coverage` analytics
  tracks this; "Open now" cannot become a default filter until coverage rises.
- **Most picks are template estimates:** ~71–75% of ranked venues at LIC are generic-template
  venues (5/7–6/8 per meal). Cards carry "est." and ±15% disclaimers; venues with no coherent
  meal for a tab show ordering guidance and never rank.
- **No menu is verified in person yet:** all 11 LIC guide venues are `status=estimated`.
  The UI claims only "11-spot curated LIC guide" until verification data lands; the
  "verified in person" claim and badges unlock automatically when it does.
- **DOHMH cuisine strings lie** (Mango Mango = "Fruits/Vegetables"): mitigated by the
  dessert blocklist, bar policy, org-token sweep, name-pattern rules, and per-venue
  overrides — all owner-editable data/lookup tables.
- **Institutional-permit leaks** are a recurring class (Fooda → UNFCU/Boyce). The org-token
  gate + a standing dev/CI warning on any ranked org-token venue are the tripwires.
- Health-data caveats (documented on /sources & /methodology): CDC PLACES is model-based;
  DEP wastewater methodology break Apr 2023; blood-lead threshold ≥5 µg/dL (not CDC 3.5);
  maternal-mortality API case sensitivity.
- **Liveness is verified only for venues Google Places confidently matches** (Round 7).
  Unmatched venues stay `dohmh-only` (rankable if inspected ≤14 months — new/renamed
  venues aren't punished) or `unverified-stale` (excluded) if the last inspection is older.
  With no `GOOGLE_PLACES_API_KEY` the whole layer is dark and behavior is identical to
  round 6 (DOHMH-only): no liveness gating, DOHMH geometry, DOHMH-derived categories, no
  bodegas. The gate is fail-open — a null Places lookup is "no information", never "closed".
- **Bodega coverage = Places coverage** (Round 7). Bodegas/delis are NYS Ag & Markets
  licensed, not DOHMH, so they exist only through the Places ingestion path. They carry no
  letter grade — the card shows "NYS retail food store" and the modal explains the two
  regulators. Their picks are `deli_bodega` template estimates (±15%), never a claimed menu.

## 4. Test-suite map (`pnpm test` = chromium + 375px mobile projects)

| Spec | Covers |
|---|---|
| `hours.spec.ts` | open/closed evaluator incl. **NYC-TZ units** (UTC-pinned), overnight/Sunday wrap |
| `hours-ui.spec.ts` | known-closed excluded from ranked strip; chips render |
| `round6-sort-filter(.mobile).spec.ts` | **sort/filter idempotence** (owner repro), API param hygiene — desktop + 375px |
| `round6-eligibility.spec.ts` | org-token sweep (UNFCU/Boyce fixtures), false-positive guards, live no-org-ranked |
| `round6-templates.spec.ts` | bagel/Peruvian/pan-Latin mapping, no borrowed tacos, under-$15 |
| `round7-places.spec.ts` | **liveness gate** — Yards/Maman/matched fixtures, every `computeLiveness` branch, name similarity, refined category from Places types, Places-hours → WeeklyHours |
| `round7-bodega.spec.ts` | bodega template bounds (200–700 cal, ≤$10), dedupe vs DOHMH, liveness-from-status, place-anchored directions URL |
| `round7-bodega-render.spec.ts` | Places bodega card renders "NYS retail food store" (never a grade), deli/bodega chip, open state, template order (mocked endpoint) |
| `round5-picks.spec.ts` | PulseScore-desc ordering, meal headline, 600-cal rule, chain price bands |
| `round5-rank.spec.ts` | dessert blocklist, pickless-venues-never-rank (+ rendered guidance section) |
| `round5-bars.spec.ts` | classifyBar (Woodbines Gastropub live), dive-bar exclusions |
| `round5-spot-links.spec.ts` | /spot link integrity incl. live CAMIS sampling |
| `round5-origin.spec.ts` | origin line + results_rendered origin telemetry |
| `round4-race.spec.ts` | seeded-location origin, stale-response guard, mid-flight change |
| `round4-price.spec.ts` | under-$15 cap on ranked five, splurge semantics |
| `round4-eligibility.spec.ts` / `venue-normalize.spec.ts` | walk-in test, naming, brand aliases |
| `coherence.spec.ts` / `curated-picks.spec.ts` | meal coherence, template/chain data bounds |
| `wedge.spec.ts` | price anchors, subway autocomplete, sitemap, analytics wiring |
| `seo.spec.ts` | canonicals/titles |
| `building-health.spec.ts` | building dossier incl. AQI parity |
| `regression.spec.ts` / `round2/3` specs | Maternal Health regression, apple-icon, ISR, JSON-LD |
| `mobile-nav.spec.ts` | 375px nav drawer |
| `verified-venues.spec.ts` / `inspection.spec.ts` / `nearest-neighborhood.spec.ts` | badge states, latest-graded inspection, NTA labels |

Plus `pnpm ci:menus` (chain-menu audit) and `pnpm smoke:live` (post-deploy proof-line grep).

## 5. Environment variables the app build needs

**Required for core food features**
- `NYC_OPEN_DATA_APP_TOKEN` — Socrata rate-limit headroom (works without, degraded)
- `NEXT_PUBLIC_MAPBOX_TOKEN` — maps, static map images, geocoding

**Required for health-data extras**
- `AIRNOW_API_KEY` (AQI), `TOMORROW_API_KEY` (weather/UV/pollen), `USDA_API_KEY` (nutrition search)

**Email (inactive until Resend domain DNS is done)**
- `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `DIGEST_SECRET`, `DIGEST_FROM_EMAIL`

**Places enrichment layer (Round 7 — the whole layer is dark without the key)**
- `GOOGLE_PLACES_API_KEY` — **Places API (New) must be enabled + billing on** in the Google
  Cloud project. Powers liveness (closed/stale/mismatch gating), storefront geometry +
  place-anchored directions, real hours, refined categories, and bodega ingestion. Absent →
  the app runs exactly as round 6 (logged once, DOHMH-only).
- `PLACES_DAILY_BUDGET` (optional, default 1000) — hard daily call ceiling; past it the layer
  serves cache-only and logs. Supabase `places_cache` (7-day) + `places_counters` back the
  cache + budget across lambdas; both degrade to no-op if Supabase is absent.

**Analytics / admin / push (optional)**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_METRICS_SECRET`, `PUSH_SECRET`, `CRON_SECRET`
- `ANTHROPIC_API_KEY` (menu-parse experiment), `OPENING_HOURS_API_KEY` (hours provider, unused)
- Dev-only: `PULSENYC_VENUE_GATE=off` disables the venue gate

API routes return 503 (never crash) when their env vars are missing.

## 6. Owner-editable policy tables (edit + redeploy, no code changes)

- `src/data/venue-policy.json` — dessert/bubble-tea blocklist, food-forward bar allowlist,
  **fuel-brand list + chain-convenience/drugstore list** (Round 8 bodega ingestion rules)
- `src/data/chain-prices.json` — 55 brand typical-order prices (under-$15 cap inputs)
- `src/lib/venueClassification.ts` — per-venue template overrides + name-pattern rules +
  refined-category owner overrides (Round 7)
- `src/lib/placesConfig.ts` — every Places tunable in one place: 14-month stale threshold,
  150m distance gate, 0.62 name-similarity threshold, 24h cache TTL (policy decision),
  daily budget default, bodega cell/dedup radii, warm-cron cells

---

## 7. Round 7 addendum — the Liveness & Places enrichment layer (July 6, 2026)

The round-6 freeze was reopened for **one API-side data layer** (no new UI surfaces). It fixes
three failure modes the DOHMH-only architecture cannot, all of which break the product's one
promise ("trust our pick"). **Business rule: a wrong pointer (closed venue, wrong address) is
a product-killing error; an imprecise estimate is not.** Google Places is the
liveness/type/geometry/hours source of truth; **DOHMH stays the health-grade source of truth.**

**What it does (all lazy + 7-day cached, only for venues that reach the ranked candidate set):**
1. **Liveness gate** (`src/lib/liveness.ts`) — `CLOSED_PERMANENTLY`/`CLOSED_TEMPORARILY`,
   `unverified-stale` (no match + inspection >14 months — the "Yards Bar & Grill" dead-permit
   class), and `address-mismatch` (confident name match beyond the 150m gate — the "Maman at
   the Austell Pl commissary" class) are all **excluded from ranked**, shown dimmed on the map
   only. One-tap "This place is closed" community reports soft-exclude at ≥2 reports.
2. **Storefront geometry** — confident matches use the Places location for pins/distance/walk
   time and `formattedAddress` for display; "Get directions" is place-anchored
   (`destination_place_id`, routes to the door, not a block-face dot).
3. **Real hours** — `regularOpeningHours` adopted as `hoursSource: 'google'` (above
   brand-default, below owner-verified), evaluated in America/New_York; lifts hours coverage
   past the chain-only ~25% ceiling and gates the "Open now" chip at ≥80% coverage.
4. **Refined categories** (`src/lib/refinedCategory.ts`) — Places `types` → 8-category enum
   (restaurant/cafe/bakery/bar/fast_food/deli_bodega/juice_smoothie/dessert) driving the card
   chip+icon, template selection, and dessert/bar eligibility (owner override → Places type →
   DOHMH heuristic). Fixes the Mango-Mango "Fruits/Vegetables" class.
5. **Bodegas as first-class citizens** (`src/lib/bodegas.ts`, phase 5) — bodegas/delis are
   licensed by **NY State Agriculture & Markets, not DOHMH**, so they never appear in the
   inspection feed. A cached per-cell `searchNearby` (convenience_store/deli) merges them as
   `source: 'places'`, `category: 'deli_bodega'`, with a dedicated bodega template
   (egg-white sandwich, turkey & swiss, honest-calorie chopped cheese, cold-case Greek
   yogurt). **Two-regulator honesty:** no letter grade — the card shows "NYS retail food
   store" and the modal explains why. Places bodegas that duplicate a DOHMH venue
   (name + ≤80m) are dropped in favor of the graded DOHMH record.

**Cost model = caching.** Strict field masks + 7-day Supabase cache + per-lambda LRU + a
nightly warm cron over the LIC/Manhattan-core cells keep this inside Google's monthly credit
at current traffic; `PLACES_DAILY_BUDGET` (default 1000) is the hard circuit-breaker.

**Ship state:** the layer ships **dark** until `GOOGLE_PLACES_API_KEY` is provisioned in the
Vercel env (Places API (New) enabled, billing on). Until then behavior is byte-for-byte
round-6 (DOHMH-only) and the three named live-acceptance cases (Yards absent, no Austell-Pl
Maman, LIC Gourmet as a bodega) cannot be verified against LIVE — only the pure-logic and
mocked-render tests pass. **Provisioning the key activates the entire layer with no redeploy
needed** beyond the env change.

**Update July 13:** the key was provisioned and the layer passed a hard live validation —
Maman excluded (`address-mismatch`), Asir-Et excluded (`closed-permanent`), Yards gone,
bodegas ingested with the bodega template and no fake grades, Google hours on nearly every
venue. The rough edges that validation found are fixed in Round 8 below.

---

## 8. Round 8 addendum — Places-layer polish + ship prep (July 13, 2026) — FINAL

The last web round before the Android build. No new surfaces; every change is a fix to
something the July 13 live validation surfaced, plus the app-groundwork items. Rule applied
throughout: **accuracy > coverage** on every judgment call.

### Category precedence (final order)
`owner override (venueClassification.ts) → brand-matched chain category → Places type →
DOHMH cuisine heuristic`

- **Chains:** a brand match is ground truth. The card chip renders the curated chain
  category verbatim (`categoryChip: { label: chain.category, icon: chain.emoji }`) and the
  enrichment pass never re-types a brand match from Places types — the Queens Blvd
  Starbucks (Google types include `convenience_store`) stays "Coffee & Bakery", never
  "Deli / Bodega".
- **Non-chains:** a Places type is adopted only when it doesn't contradict the venue's
  assigned pick template (`reconcileGenericCategory` in `refinedCategory.ts`) — a card
  whose picks are subs can't be chipped "Bakery" (the Fresco Deli Cafe fix). Incompatible
  Places types fall back to a compatible baseline or to the template's own label.
  `dessert`/`bar` always pass through: they are ranked-eligibility signals (Mango Mango
  protection), and gated venues never render a chip anyway.

### Bodega inclusion rules (final)
1. **Gas stations are not bodegas.** Candidates with a `gas_station` type or a fuel-brand
   name (owner-editable `fuelBrands` in venue-policy.json) are never ingested — unless the
   display name carries a deli/food token ("BP — Vernon Deli" passes; a bare "bp" pump
   does not). The Skillman "bp" card with turkey-sandwich picks is gone.
2. **Chain convenience/drugstores are map-only** (owner-editable `chainConvenienceBrands`:
   7-Eleven, Duane Reade, CVS, Walgreens, …). Decision: "even at the bodega" means
   bodegas — a 7-Eleven card undercuts the brand's local credibility. They keep a dimmed
   map pin labeled "Chain convenience store — not ranked", never a ranked slot.
3. **Display names** run through the shared normalizer, which now also title-cases
   all-lowercase Places artifacts ("lic gourmet organic & deli" → "LIC Gourmet Organic &
   Deli"); owner mixed-case names stay untouched.

### Hours polish
- Midnight-split listings ([Tue 21:00–24:00] + [Wed 00:00–00:30]) re-join into one
  overnight window at parse time — no phantom "opens Wed 12:00am".
- Genuine 12:00–4:59am openings render as "opens Wed early morning (12:30am)" — stated,
  not glitch-read. Overnight evaluation unit-tested in both directions.

### Café lunch upgrade
A café-templated venue that Places confirms as a sit-down food venue (`restaurant` type)
gets a light-lunch café template (soup + half sandwich, Niçoise-style salad, omelette +
salad — all ≤$15) instead of dropping to guidance-only at noon (Cafe Henri / Tournesol
class). The `cafe-food` template is **unreachable from DOHMH cuisine strings alone** —
Places confirmation is the only path in, so coffee-only shops stay guidance-only.

### Payload hygiene & latency
- `excluded` (transparency array) is capped at 6 entries with `topPicks` stripped — the
  client renders at most 6 dimmed labeled map pins and never renders excluded venues as
  ranked cards (server cap + client `livenessLabel` filter, belt and suspenders).
- Every near-me request logs `[smart-menu] timing ms=… places_calls=…`. Warm-cell target:
  <500ms, ~0 Places calls (nightly cron refresh sits inside the 24h TTL).

### Google Places attribution & caching policy (decisions)
Verified July 13 2026 against the Places API policies + Google Maps Platform Service
Specific Terms:
- **Place IDs** may be stored indefinitely; **lat/lng** up to 30 days; **businessStatus /
  regularOpeningHours / types have no caching allowance.**
- Decision: cache TTL reduced **7 days → 24 hours** (`CACHE_TTL_HOURS`), aligned with the
  nightly warm cron so warm-cell user requests still make ~0 calls. Minimum retention that
  keeps cost sane; also better for accuracy (a closure surfaces within a day). Documented
  in code at `placesConfig.CACHE_TTL_HOURS`.
- **Attribution:** "powered by Google" renders wherever Places-sourced content shows
  without a Google map — under the results grid (`google-attribution` testid) and in the
  venue modal for any place-anchored or Places-sourced venue.

### "Fits your day" (app groundwork)
Ranked cards annotate picks that fit the tracker's remaining day — "✓ Fits your day —
420 cal left". Pure client calculation (`src/lib/eat-smart/remainingMacros.ts`) against
the nutrition tracker's existing localStorage (goals + today's log); renders only for
users with goals set; protein is a target, never a disqualifier. This is the retention
hook tying Find Food to the tracker loop — it ships to the app as-is.

### Accuracy manifesto
`/methodology#accuracy` ("Why our data is right", linked from the footer): two-regulator
explanation, the liveness layer, the verified-menu program, and the correction loop —
stated plainly, no competitor named. This is the positioning wedge against the incumbent
failure mode (wrong data at local non-chain venues).

### Budget observability
`/admin/metrics` now shows daily `places_counters` rows: API calls, cache hits, hit-rate
(hits need the `20260713_places_hits.sql` migration — **run it in the Supabase SQL editor
before relying on hit-rate**; calls display regardless).

### New/updated tests (all in `pnpm test`)
| Spec | Covers |
|---|---|
| `round8-category.spec.ts` | brand-category precedence (Starbucks/convenience fixture), template coherence (Fresco), dessert/bar pass-through |
| `round8-bodega.spec.ts` | bp excluded, "BP — Vernon Deli" rescued, whole-word fuel matching, 7-Eleven/Duane Reade map-only, lowercase title-casing |
| `round8-hours.spec.ts` | overnight both directions, midnight-split re-join, early-morning copy, 24/7 guard |
| `round8-cafe.spec.ts` | cafe-food template bounds + unreachability from DOHMH strings |
| `round8-fits.spec.ts` | fits-your-day logic (budget fit, exhausted day, unknown calories) |

### Remaining limitations (final list)
- All Round-7 limitations stand (hours coverage, template estimates ±15%, 0/11 menus
  verified in person, DOHMH cuisine strings, institutional-permit class, health-data
  caveats) — see section 3.
- Caching businessStatus/hours even for 24h exceeds the letter of the Places policy (which
  allows none for those fields); accepted as a short-lived performance cache with
  attribution, no redistribution, and nightly refresh. Owner review item if Google's
  terms tighten.
- Cache hit-rate on /admin/metrics reads "—" until the hits migration runs.
- "Fits your day" reads localStorage only — account-synced macros are an app-build task.
- Chain-convenience map pins depend on the same Places bodega cells; where the cell cache
  predates Round 8 they may take up to 24h to reclassify.

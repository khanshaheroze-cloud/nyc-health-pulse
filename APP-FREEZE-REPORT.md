# PulseNYC — App Freeze Report (July 6, 2026)

The web surface is **FROZEN** as of round 6. This document is the handoff artifact for the
Android app build: what exists, where the data comes from, what the known limitations are,
what the test suite covers, and what the app build needs to run.

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

## 4. Test-suite map (`pnpm test` = chromium + 375px mobile projects)

| Spec | Covers |
|---|---|
| `hours.spec.ts` | open/closed evaluator incl. **NYC-TZ units** (UTC-pinned), overnight/Sunday wrap |
| `hours-ui.spec.ts` | known-closed excluded from ranked strip; chips render |
| `round6-sort-filter(.mobile).spec.ts` | **sort/filter idempotence** (owner repro), API param hygiene — desktop + 375px |
| `round6-eligibility.spec.ts` | org-token sweep (UNFCU/Boyce fixtures), false-positive guards, live no-org-ranked |
| `round6-templates.spec.ts` | bagel/Peruvian/pan-Latin mapping, no borrowed tacos, under-$15 |
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

**Analytics / admin / push (optional)**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_METRICS_SECRET`, `PUSH_SECRET`, `CRON_SECRET`
- `ANTHROPIC_API_KEY` (menu-parse experiment), `OPENING_HOURS_API_KEY` (hours provider, unused)
- Dev-only: `PULSENYC_VENUE_GATE=off` disables the venue gate

API routes return 503 (never crash) when their env vars are missing.

## 6. Owner-editable policy tables (edit + redeploy, no code changes)

- `src/data/venue-policy.json` — dessert/bubble-tea blocklist + food-forward bar allowlist
- `src/data/chain-prices.json` — 55 brand typical-order prices (under-$15 cap inputs)
- `src/lib/venueClassification.ts` — per-venue template overrides + name-pattern rules

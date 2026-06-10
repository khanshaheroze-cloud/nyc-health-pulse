# PulseNYC

**Macro-friendly meals under $15, within a 10-minute walk, right now** — for fitness-focused New Yorkers, starting in Long Island City / Hunters Point.

Next.js 16 App Router · Tailwind v4 · pnpm workspace (never `npm install` — it corrupts node_modules). Deployed on Vercel (`npx vercel --prod --force` from this directory).

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # full Playwright suite (chromium + 375px mobile)
pnpm test:data    # data validation only (no server needed)
pnpm build
```

## Venue verification workflow (the data moat)

Hand-verified, menu-level data on independent restaurants lives in
`src/data/verified-venues.json`. This is the only defensible asset — chains'
nutrition PDFs are public; "we walked in and checked" is not.

**Weekly operating loop:**

1. **Skeleton.** `node scripts/verify-venue.ts <CAMIS or "name">` pulls the
   DOHMH record and appends a skeleton entry (status `estimated`, empty menu).
2. **Walk in.** Photograph the menu. Note prices, hours, and the 2–4 most
   macro-friendly orders. Ask about modifications (the `orderHack`).
3. **Fill it in by hand.** `menuItems[]` with name, price, calories, protein,
   fat, carbs, `isRecommended`, `orderHack`. **Never invent numbers** — leave
   unknown fields `null`; the venue stays `estimated` until real data exists.
4. **Mark verified.** `verification: { status: "verified", verifiedAt:
   "<today>", verifiedBy: "<initials>", sourceNotes: "<what you checked>" }`.
5. **Validate.** `pnpm test:data` — the schema test fails CI on bad entries
   (price bounds, macro sanity, duplicate slugs, raw-caps names).

**Freshness SLA:** re-verify every **90 days**. A `verifiedAt` older than
**120 days** auto-downgrades the UI badge to "needs re-check"
(`src/lib/verifiedVenues.ts`). Freshness is product surface, not metadata.

Verified venues get the ✓ badge on result cards, a real
`/restaurants/{slug}` detail page, and a ranking bump over chains at equal
PulseScore.

## Kill / continue thresholds

Hard-coded decision gate (set Jun 9, 2026): **200 app-waitlist signups or
1,000 engaged content followers within 60 days (by Aug 9, 2026), else
re-evaluate the wedge.** Funnel metrics: see `/admin/metrics`.

## Tests

`tests/` is a Playwright suite (~140 specs) covering the recurring-bug
regressions: building-health timeouts, SEO canonicals, eat-smart data
quality, AQI parity, LIC reverse-geocode, verified-venue schema, 375px nav.
CI runs type-check → build → data tests → e2e on every push
(`.github/workflows/ci.yml`).

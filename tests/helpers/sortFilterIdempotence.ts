import { expect, type Page } from "@playwright/test";

// Round 6 P0 — the owner's exact repro: clicking through the sort chips
// APPENDED cards ("5 Lunch spots" headline over sixteen cards, Court Square
// Diner twelve times). Root cause: generic venues of one template share a
// slug, and cards were keyed by slug+walkMinutes — colliding React keys let
// stale nodes survive reorders. This scenario runs at desktop AND 375px.
//
// Semantics under test:
//   sort chips  → re-order (top-5 membership may shift: it's "top 5 by X"),
//                 count stable, zero duplicates, NO refetch, no "Updated" reset
//   filter chips→ filtered VIEW (subset of the canonical API set); toggling
//                 off restores the exact baseline; never append

const LIC = { lat: 40.74523, lng: -73.953506 };
const RANKED_CARDS = '[data-testid="ranked-grid"] [data-venue-id]';
const ALL_CARDS = "[data-venue-id]";

export function seedLicLocation(page: Page) {
  return page.addInitScript(
    ([lat, lng]) => {
      window.localStorage.setItem(
        "pulsenyc:lastLocation",
        JSON.stringify({ lat, lng, label: "47-10 Vernon Blvd", source: "manual", ts: Date.now() }),
      );
    },
    [LIC.lat, LIC.lng] as [number, number],
  );
}

interface CardData {
  id: string;
  name: string;
  protein: number | null;
  calories: number | null;
  walk: number | null;
}

async function readRankedCards(page: Page): Promise<CardData[]> {
  return page.$$eval(RANKED_CARDS, (els) =>
    els.map((el) => {
      const text = (el as HTMLElement).innerText.replace(/\s+/g, " ");
      const num = (re: RegExp) => {
        const m = text.match(re);
        return m ? parseInt(m[1], 10) : null;
      };
      return {
        id: el.getAttribute("data-venue-id") || "",
        name: el.getAttribute("data-venue-name") || "",
        protein: num(/(\d+)g protein/),
        calories: num(/~?(\d+) cal\b/),
        walk: num(/(\d+) min walk/),
      };
    }),
  );
}

async function assertNoDuplicatesAnywhere(page: Page, context: string) {
  const names = await page.$$eval(ALL_CARDS, (els) => els.map((el) => el.getAttribute("data-venue-name") || ""));
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  expect(dupes, `${context}: duplicate venue cards rendered: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
}

async function headlineCount(page: Page): Promise<number> {
  const h2 = await page.locator("h2", { hasText: /spots? near you/ }).first().innerText();
  const m = h2.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : -1;
}

export async function runSortFilterScenario(page: Page) {
  await seedLicLocation(page);

  let fetchCount = 0;
  const canonicalIds = new Set<string>();
  page.on("request", (req) => {
    if (req.url().includes("/api/smart-menu/near-me")) fetchCount++;
  });
  page.on("response", async (res) => {
    if (!res.url().includes("/api/smart-menu/near-me")) return;
    try {
      const data = (await res.json()) as { restaurants?: { restaurantId: string }[] };
      for (const r of data.restaurants ?? []) canonicalIds.add(r.restaurantId);
    } catch {}
  });

  await page.goto("/");
  await expect(page.locator(RANKED_CARDS).first()).toBeVisible({ timeout: 30_000 });

  const baseline = await readRankedCards(page);
  expect(baseline.length).toBeGreaterThan(0);
  expect(baseline.length).toBeLessThanOrEqual(5);
  await assertNoDuplicatesAnywhere(page, "baseline");
  expect(await headlineCount(page)).toBe(baseline.length);
  const updatedLabel = await page.getByText(/^Updated /).first().innerText();
  const fetchesAfterLoad = fetchCount;
  const baselineIds = new Set(baseline.map((c) => c.id));

  // ── Click EVERY sort chip in sequence (the owner's repro) ──────────────────
  const SORTS: { name: RegExp; check?: (cards: CardData[]) => void }[] = [
    {
      name: /^Protein$/,
      check: (cards) => {
        const max = Math.max(...cards.map((c) => c.protein ?? 0));
        expect(cards[0].protein, `Protein sort: first card should have max protein (${max})`).toBe(max);
      },
    },
    {
      name: /^Calories$/,
      check: (cards) => {
        const withCal = cards.filter((c) => c.calories != null);
        if (withCal.length === 0) return;
        const min = Math.min(...withCal.map((c) => c.calories!));
        expect(cards[0].calories, `Calories sort: first card should have min calories (${min})`).toBe(min);
      },
    },
    {
      name: /^Distance$/,
      check: (cards) => {
        const min = Math.min(...cards.map((c) => c.walk ?? 999));
        expect(cards[0].walk, `Distance sort: first card should be nearest (${min} min)`).toBe(min);
      },
    },
    { name: /^Protein per \$$/ },
    { name: /^PulseScore$/ },
  ];

  for (const sort of SORTS) {
    const chip = page.getByRole("button", { name: sort.name });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");

    const cards = await readRankedCards(page);
    // (a) card count unchanged — sorting must never add or drop cards
    expect(cards.length, `card count changed after sort ${sort.name}`).toBe(baseline.length);
    // (b) zero duplicates anywhere on the page
    await assertNoDuplicatesAnywhere(page, `after sort ${sort.name}`);
    // every rendered card is a real venue from the canonical API set
    for (const c of cards) {
      expect(canonicalIds.has(c.id), `sort rendered a card not in the API set: ${c.name}`).toBe(true);
    }
    // (c) the order actually changed correctly
    sort.check?.(cards);
    // headline count still derives from the rendered set
    expect(await headlineCount(page)).toBe(cards.length);
  }

  // Sorting is client-side: not a single refetch, and "Updated" didn't reset
  expect(fetchCount, "sort chips must not refetch").toBe(fetchesAfterLoad);
  expect(await page.getByText(/^Updated /).first().innerText()).toBe(updatedLabel);

  // ── Filter chips: subset of the canonical set on; exact restore off ────────
  for (const label of [/Under \$15/, /Quick \(under 5 min\)/]) {
    const chip = page.getByRole("button", { name: label });
    const wasPressed = (await chip.getAttribute("aria-pressed")) === "true";

    await chip.click(); // toggle
    await expect(chip).toHaveAttribute("aria-pressed", wasPressed ? "false" : "true");
    let cards = await readRankedCards(page);
    expect(cards.length).toBeLessThanOrEqual(5);
    for (const c of cards) {
      expect(canonicalIds.has(c.id), `filter introduced a non-API card: ${c.name}`).toBe(true);
    }
    await assertNoDuplicatesAnywhere(page, `filter ${label} toggled`);

    await chip.click(); // restore original chip state
    await expect(chip).toHaveAttribute("aria-pressed", wasPressed ? "true" : "false");
    cards = await readRankedCards(page);
    expect(cards.length, `filter off must restore the original set`).toBe(baseline.length);
    expect(new Set(cards.map((c) => c.id))).toEqual(baselineIds);
    await assertNoDuplicatesAnywhere(page, `filter ${label} restored`);
  }

  // Still no refetch from any filter interaction
  expect(fetchCount, "filter chips must not refetch").toBe(fetchesAfterLoad);
}

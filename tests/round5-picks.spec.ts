import { test, expect } from "@playwright/test";
import { orderPicks, applyCalDisplayRule, classifyItemType, headlineEligible } from "../src/lib/pickRanking";

// Round 5 P0 (July 5 evening audit): the headline pick must be the best
// coherent MEAL — Woodbines led with "Pasta with Marinara" (45) over "Roast
// Chicken Dinner" (80), Tamashii led with Edamame (a side), and BWW's 780-cal
// Caesar could appear in a ranked card.

const pick = (name: string, calories: number, pulseScore: number) => ({ name, calories, pulseScore });

test.describe("orderPicks — score ordering + meal headline", () => {
  test("Woodbines fixture: Roast Chicken (80) headlines over Pasta Marinara (45)", () => {
    const picks = [
      pick("Pasta with Marinara", 480, 45),
      pick("Roast Chicken Dinner", 420, 80),
      pick("Greek Salad + Grilled Chicken", 420, 80),
    ];
    const ordered = orderPicks(picks, "dinner");
    expect(ordered[0].pulseScore).toBe(80);
    expect(ordered[0].name).not.toBe("Pasta with Marinara");
    // sorted descending throughout
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].pulseScore).toBeLessThanOrEqual(ordered[i - 1].pulseScore);
    }
  });

  test("R40-style fixture: a 65 never headlines over an 80", () => {
    const ordered = orderPicks([pick("Grain Bowl", 450, 65), pick("Grilled Chicken Plate", 420, 80)], "lunch");
    expect(ordered[0].pulseScore).toBe(80);
  });

  test("Tamashii fixture: Edamame (side) never first even when listed", () => {
    const picks = [
      pick("Edamame", 190, 45),
      pick("Chicken Teriyaki Bowl", 520, 80),
      pick("Salmon Sashimi (8 pcs)", 200, 65),
    ];
    const ordered = orderPicks(picks, "lunch");
    expect(ordered[0].name).toBe("Chicken Teriyaki Bowl");
    // Edamame may remain in the list, just not as the headline
    expect(ordered.map((p) => p.name)).toContain("Edamame");
    expect(ordered[0].name).not.toBe("Edamame");
  });

  test("no coherent meal for a main-meal tab → empty (guidance card, not ranked)", () => {
    const ordered = orderPicks([pick("Edamame", 190, 45), pick("Miso Soup", 60, 30)], "dinner");
    expect(ordered).toEqual([]);
  });

  test("snack tab is exempt — a side can headline a snack", () => {
    const ordered = orderPicks([pick("Edamame", 190, 45), pick("Miso Soup", 60, 30)], "snack");
    expect(ordered[0].name).toBe("Edamame");
  });

  test("sub-200-cal items cannot headline lunch/dinner", () => {
    const ordered = orderPicks([pick("Shrimp Cocktail (6 pcs)", 120, 65), pick("Grilled Fish Plate", 280, 80)], "dinner");
    expect(ordered[0].name).toBe("Grilled Fish Plate");
  });
});

test.describe("classifyItemType", () => {
  test("sides, drinks, meals", () => {
    expect(classifyItemType("Edamame")).toBe("side");
    expect(classifyItemType("Garden Side Salad")).toBe("side");
    expect(classifyItemType("Miso Soup")).toBe("side");
    expect(classifyItemType("Cold Brew Coffee (black)")).toBe("drink");
    expect(classifyItemType("Oat Milk Latte (no sugar)")).toBe("drink");
    expect(classifyItemType("Roast Chicken Dinner")).toBe("meal");
    expect(classifyItemType("Greek Salad + Grilled Chicken")).toBe("meal");
    expect(classifyItemType("Traditional Wings (6pc, plain)")).toBe("meal");
  });

  test("headlineEligible: meals ≥200 cal only, for main meals", () => {
    expect(headlineEligible({ name: "Edamame", calories: 190 }, "lunch")).toBe(false);
    expect(headlineEligible({ name: "Roast Chicken Dinner", calories: 420 }, "dinner")).toBe(true);
    expect(headlineEligible({ name: "Shrimp Cocktail", calories: 120 }, "dinner")).toBe(false);
    expect(headlineEligible({ name: "Edamame", calories: 190 }, "snack")).toBe(true);
  });
});

test.describe("600-cal display rule (BWW fixture)", () => {
  test("780-cal Caesar dropped when under-600 items exist", () => {
    const picks = [
      pick("Chicken Caesar Salad", 780, 34),
      pick("Traditional Wings (6pc, plain)", 430, 70),
      pick("Boneless Wings (6pc, plain)", 540, 40),
    ];
    const pool = applyCalDisplayRule(picks);
    expect(pool.map((p) => p.name)).not.toContain("Chicken Caesar Salad");
    expect(pool.length).toBe(2);
    expect(pool.every((p) => !p.overCalTarget)).toBe(true);
  });

  test("brand with nothing under 600 keeps items but labels them", () => {
    const pool = applyCalDisplayRule([pick("Family Platter", 950, 40), pick("Mega Combo", 820, 35)]);
    expect(pool.length).toBe(2);
    expect(pool.every((p) => p.overCalTarget)).toBe(true);
  });
});

// ── Live API invariants (dev server, LIC coords from the audit) ──────────────
const LIC = "lat=40.74523&lng=-73.953506";

test.describe("near-me API — pick ordering invariants", () => {
  for (const meal of ["lunch", "dinner"] as const) {
    test(`${meal}: every venue's headline is a meal and nothing outscores it; no unlabeled over-600 pick`, async ({ request }) => {
      const res = await request.get(`/api/smart-menu/near-me?${LIC}&meal=${meal}`, { timeout: 60_000 });
      const data = (await res.json()) as {
        restaurants: {
          restaurantName: string;
          topPicks: { name: string; calories: number; pulseScore: number; overCalTarget?: boolean }[];
        }[];
      };
      expect(data.restaurants.length).toBeGreaterThan(0);
      for (const r of data.restaurants) {
        if (r.topPicks.length === 0) continue; // guidance-only venue (cannot rank — see round5-rank spec)
        const head = r.topPicks[0];
        expect(classifyItemType(head.name), `${r.restaurantName} headlines a non-meal: ${head.name}`).toBe("meal");
        expect(head.calories === 0 || head.calories >= 200, `${r.restaurantName} headline under 200 cal: ${head.name}`).toBeTruthy();
        // Headline must not be outscored by any other MEAL pick on the card
        for (const p of r.topPicks.slice(1)) {
          if (classifyItemType(p.name) === "meal" && headlineEligible(p, meal)) {
            expect(head.pulseScore, `${r.restaurantName}: "${p.name}" (${p.pulseScore}) outscores headline "${head.name}" (${head.pulseScore})`).toBeGreaterThanOrEqual(p.pulseScore);
          }
        }
        for (const p of r.topPicks) {
          expect(p.calories <= 600 || p.overCalTarget === true, `${r.restaurantName} shows unlabeled over-600 pick: ${p.name} (${p.calories} cal)`).toBeTruthy();
        }
      }
    });
  }
});

// ── Rendered cards: the headline order is never a side or drink ──────────────
test("no rendered ranked card headlines a side/drink; order matches best pick", async ({ page }) => {
  await page.goto("/");
  const ranked = page.locator('[data-testid="ranked-grid"]');
  await expect(ranked).toBeVisible({ timeout: 30_000 });
  const cards = ranked.locator("a, button").filter({ hasText: /Order:/ });
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const text = (await cards.nth(i).innerText()).replace(/\s+/g, " ");
    const m = text.match(/Order:\s*([^—]+)—/);
    if (!m) continue;
    const orderName = m[1].trim();
    expect(classifyItemType(orderName), `card headlines a ${classifyItemType(orderName)}: ${orderName}`).toBe("meal");
  }
});

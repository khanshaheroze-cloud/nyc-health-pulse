import { test, expect } from "@playwright/test";

// Phase 3 acceptance: at (mocked) 11pm, no known-closed venue appears in the
// ranked top-5, and cards carry an "Open now" / "Hours unknown" chip. We mock
// the near-me API with a controlled set so the assertion is deterministic —
// the exclusion logic under test lives client-side in WedgeSection.
test("known-closed venues are excluded from the ranked strip; chips render", async ({ page }) => {
  const mk = (name: string, slug: string, openState: string, chipLabel: string, chipTone: string, isGeneric = false) => ({
    slug,
    restaurantName: name,
    priceRange: 2,
    priceTier: "$$",
    walkMinutes: 4,
    lat: 40.7484 + Math.random() * 0.002,
    lng: -73.9857 + Math.random() * 0.002,
    address: `${name} Address`,
    grade: "A",
    inspectedAt: null,
    isGeneric,
    category: isGeneric ? "Deli / Bodega" : "Healthy",
    topPicks: [{ name: "Grilled Chicken Bowl", calories: 480, protein: 42, pulseScore: 88, estPrice: 12 }],
    bestDrink: null,
    locationCount: 1,
    otherLocations: [],
    openState,
    hoursSource: openState === "unknown" ? "unknown" : "brand-default",
    hoursChip: { label: chipLabel, tone: chipTone },
  });

  await page.route("**/api/smart-menu/near-me**", async (route) => {
    await route.fulfill({
      json: {
        restaurants: [
          mk("Maman Cafe", "generic-cafe", "closed", "Closed · opens 7am", "closed", true),
          mk("Sweetgreen", "sweetgreen", "open", "Open now", "open"),
          mk("Chipotle", "chipotle", "open", "Open now", "open"),
          mk("Halal Cart", "generic-halal", "unknown", "Hours unknown", "unknown", true),
          mk("CAVA", "cava", "open", "Open now", "open"),
        ],
      },
    });
  });

  await page.goto("/");
  // Scope to the ranked result cards only (the map keeps a hidden SR list that
  // intentionally still names closed venues, so assert against the cards).
  const cards = page.locator('button:has-text("min walk"), a:has-text("min walk")');
  await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  const cardsText = (await cards.allInnerTexts()).join("\n");

  // The closed café must not appear in the ranked cards
  expect(cardsText).not.toContain("Maman Cafe");
  // Open + unknown venues appear
  expect(cardsText).toContain("Sweetgreen");
  // Chips render
  expect(cardsText).toContain("Open now");
  expect(cardsText).toContain("Hours unknown");
});

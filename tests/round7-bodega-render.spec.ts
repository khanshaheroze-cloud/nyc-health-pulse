import { test, expect } from "@playwright/test";

// Round 7 phase 5 — client contract for a Places-sourced bodega. The live
// acceptance (a real LIC bodega at the owner's Davis St coords) needs
// GOOGLE_PLACES_API_KEY provisioned in Vercel; until then the layer is dark
// and no bodega comes back live. This test mocks our OWN endpoint with a
// Places-shaped bodega and asserts the honesty affordances render:
//   • the card shows "NYS retail food store", never a fake letter grade
//   • the deli/bodega category chip renders
//   • the open state / hours chip surfaces from Places hours
// (The modal's matching two-regulator sentence is gated on the same
//  source==='places' check and typechecked; the SpotModal open interaction is
//  not exercised here because no wedge test drives it and its ?spot=
//  navigation is dev-only flaky.)

const BODEGA = {
  restaurantId: "places-bodega-ChIJ_licgourmet",
  slug: "generic-bodega",
  restaurantName: "LIC Gourmet Organic & Deli",
  cuisine: "Deli / Bodega",
  priceRange: 1,
  priceTier: "$",
  distance: 120,
  walkMinutes: 2,
  lat: 40.7444,
  lng: -73.9489,
  address: "5-20 47th Rd, Long Island City",
  grade: "", // NYS-licensed — no DOHMH letter grade
  inspectedAt: null,
  isGeneric: true,
  category: "Bodega",
  topPicks: [
    { name: "Egg White Sandwich on Whole Wheat", calories: 350, protein: 20, pulseScore: 65, estPrice: 5 },
  ],
  bestDrink: null,
  locationCount: 1,
  otherLocations: [],
  orderingTip: "Ask for it on whole wheat, easy on the mayo — every bodega will do it.",
  camis: null,
  source: "places",
  placeId: "ChIJ_licgourmet",
  liveness: "places-verified",
  livenessCheckedAt: "2026-07-06T23:00:00.000Z",
  refinedCategory: "deli_bodega",
  categoryChip: { label: "Deli / Bodega", icon: "🥪" },
  openState: "open",
  hoursSource: "google",
  hoursChip: { label: "Open now", tone: "open" },
};

test("a Places bodega renders with the NYS label and no fake grade", async ({ page }) => {
  await page.route("**/api/smart-menu/near-me**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ restaurants: [BODEGA], excluded: [] }),
    }),
  );

  await page.goto("/");

  // The bodega card
  const card = page.locator('[data-venue-name="LIC Gourmet Organic & Deli"]');
  await expect(card).toBeVisible({ timeout: 20_000 });

  // Grade honesty: NYS registration, never a letter grade.
  await expect(card).toContainText("NYS retail food store");
  await expect(card).not.toContainText(/Grade [A-C]/);

  // Refined category chip from Places types.
  await expect(card).toContainText("Deli / Bodega");

  // Hours honesty: Places hours drive a real open state.
  await expect(card).toContainText("Open now");

  // The recommended order is the bodega template pick.
  await expect(card).toContainText("Egg White Sandwich on Whole Wheat");
});

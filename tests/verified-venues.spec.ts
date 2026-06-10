import { test, expect } from "@playwright/test";
import venues from "../src/data/verified-venues.json";
import { CHAINS } from "../src/lib/restaurantData";
import { getMenuVerifiedVenues, badgeState } from "../src/lib/verifiedVenues";

// CI schema validation for the verified-venue data moat. Every venue JSON
// entry is checked on every push — bad hand-entered data fails the build.

const VENUES = venues as Array<Record<string, unknown>>;
const chainSlugs = new Set(CHAINS.map((c) => c.slug));

test.describe("verified-venues.json schema", () => {
  test("file has venues", () => {
    expect(VENUES.length).toBeGreaterThan(0);
  });

  for (const v of venues as Array<{
    id: string; name: string; slug: string; address: string; lat: number; lng: number;
    neighborhood: string; venueType: string; dohmhCamis: string; dohmhGrade: string | null;
    priceBand: number | null; hours: unknown[]; verification: { status: string; verifiedAt: string | null; verifiedBy: string | null };
    menuItems: Array<{ name: string; price: number | null; calories: number | null; protein: number | null; isRecommended: boolean; verification: { status: string } }>;
  }>) {
    test(`${v.slug}`, () => {
      // Identity
      expect(v.id, "id").toMatch(/^camis-\d{8}$/);
      expect(v.name.trim().length, "name").toBeGreaterThan(0);
      // Raw DOHMH dba strings shout in ALL CAPS ("SAFIR MEDITERRANEAN") —
      // 4+ letter uppercase words flag it; short caps like "LIC"/"R40" are fine
      expect(v.name, "name must be clean title-case, not raw DOHMH caps").not.toMatch(/\b[A-Z]{4,}\b/);
      expect(v.slug, "slug").toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(chainSlugs.has(v.slug), `slug '${v.slug}' collides with a chain slug`).toBe(false);
      expect(v.dohmhCamis, "camis").toMatch(/^\d{8}$/);

      // Geo: five-borough sanity
      expect(v.lat).toBeGreaterThan(40.4);
      expect(v.lat).toBeLessThan(41.0);
      expect(v.lng).toBeGreaterThan(-74.3);
      expect(v.lng).toBeLessThan(-73.6);
      expect(v.address.trim().length).toBeGreaterThan(5);

      // Verification shape
      expect(["verified", "estimated"]).toContain(v.verification.status);
      if (v.verification.status === "verified") {
        expect(v.verification.verifiedAt, "verified venues need verifiedAt").toBeTruthy();
        expect(v.verification.verifiedBy, "verified venues need verifiedBy").toBeTruthy();
        expect(v.menuItems.length, "verified venues need menu items").toBeGreaterThan(0);
      }

      // Menu items: never invented — verified items need real numbers
      for (const m of v.menuItems) {
        expect(m.name.trim().length, "item name").toBeGreaterThan(0);
        if (m.verification.status === "verified") {
          expect(m.price, `${m.name}: verified item needs a price`).not.toBeNull();
          expect(m.calories, `${m.name}: verified item needs calories`).not.toBeNull();
          expect(m.protein, `${m.name}: verified item needs protein`).not.toBeNull();
        }
        if (m.price != null) {
          expect(m.price).toBeGreaterThan(0);
          expect(m.price).toBeLessThan(100);
        }
        if (m.calories != null) {
          expect(m.calories).toBeGreaterThan(0);
          expect(m.calories).toBeLessThan(3000);
        }
        if (m.protein != null && m.calories != null) {
          expect(m.protein * 4, `${m.name}: protein kcal exceeds calories`).toBeLessThanOrEqual(m.calories * 1.1 + 20);
        }
      }
    });
  }

  test("no duplicate slugs or CAMIS", () => {
    const slugs = VENUES.map((v) => v.slug);
    const camis = VENUES.map((v) => v.dohmhCamis);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(camis).size).toBe(camis.length);
  });
});

test.describe("verified venue detail page", () => {
  const verified = getMenuVerifiedVenues();

  test("verified venue card → detail page renders price + macros + badge", async ({ page }) => {
    test.skip(verified.length === 0, "No menu-verified venues yet — activates automatically after the first in-person verification");
    const v = verified[0];
    await page.goto(`/restaurants/${v.slug}`);
    await expect(page.getByTestId("verified-badge")).toBeVisible();
    expect(badgeState(v.verification)).not.toBe("estimated");
    const firstItem = page.getByTestId("verified-menu-item").first();
    await expect(firstItem).toBeVisible();
    await expect(firstItem).toContainText("$");
    await expect(firstItem).toContainText("protein");
  });
});

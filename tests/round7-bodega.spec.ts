import { test, expect } from "@playwright/test";
import { templateByCuisineKey } from "../src/lib/genericRestaurants";
import { BODEGA_CUISINE_KEY, bodegaLiveness, isDuplicateOfDohmh } from "../src/lib/bodegas";
import { directionsUrl } from "../src/lib/openDirections";

// Round 7 phase 5 — bodegas/delis as first-class citizens. The hero promises
// picks "even at the bodega"; these are NYS-licensed (not DOHMH) so they carry
// no letter grade and arrive via the Places ingestion path.

test.describe("bodega template", () => {
  const t = templateByCuisineKey(BODEGA_CUISINE_KEY);

  test("exists and is the Bodega category", () => {
    expect(t).not.toBeNull();
    expect(t!.category).toBe("Bodega");
    expect(t!.priceRange).toBe(1); // $ band
  });

  test("CI sanity: every bodega pick is 200–700 cal and ≤ $10", () => {
    for (const p of t!.picks) {
      expect(p.cal, `${p.name} calories`).toBeGreaterThanOrEqual(200);
      expect(p.cal, `${p.name} calories`).toBeLessThanOrEqual(700);
      expect(p.estimatedPrice ?? 0, `${p.name} price`).toBeLessThanOrEqual(10);
    }
  });

  test("carries the cuisine-coherent bodega picks the owner specified", () => {
    const names = t!.picks.map((p) => p.name.toLowerCase());
    expect(names.some((n) => /egg white/.test(n))).toBe(true);
    expect(names.some((n) => /turkey/.test(n))).toBe(true);
    expect(names.some((n) => /chopped cheese/.test(n))).toBe(true);
    expect(names.some((n) => /greek yogurt/.test(n))).toBe(true);
  });

  test("the chopped cheese keeps its honest (over-600) calories, never a flattering estimate", () => {
    const cc = t!.picks.find((p) => /chopped cheese/i.test(p.name))!;
    expect(cc.cal).toBeGreaterThan(600);
  });

  test("ordering tip is the every-bodega whole-wheat ask", () => {
    expect(t!.orderingTip).toMatch(/whole wheat/i);
  });
});

test.describe("dedupe vs DOHMH (one storefront, two regulators)", () => {
  const licGourmet = { displayName: "LIC Gourmet Organic & Deli", lat: 40.7444, lng: -73.9489 };

  test("a DOHMH deli at the same spot with a similar name → duplicate (drop Places)", () => {
    const dohmh = [{ name: "LIC Gourmet Deli", lat: 40.74442, lng: -73.94892 }];
    expect(isDuplicateOfDohmh(licGourmet, dohmh)).toBe(true);
  });

  test("same name but far away → not a duplicate", () => {
    const dohmh = [{ name: "LIC Gourmet Deli", lat: 40.7550, lng: -73.9600 }];
    expect(isDuplicateOfDohmh(licGourmet, dohmh)).toBe(false);
  });

  test("same spot but unrelated name → not a duplicate", () => {
    const dohmh = [{ name: "Joe's Pizza", lat: 40.74442, lng: -73.94892 }];
    expect(isDuplicateOfDohmh(licGourmet, dohmh)).toBe(false);
  });

  test("no DOHMH venues at all → keep the Places bodega", () => {
    expect(isDuplicateOfDohmh(licGourmet, [])).toBe(false);
  });
});

test.describe("bodega liveness from businessStatus", () => {
  test("a live Places record is places-verified", () => {
    expect(bodegaLiveness("OPERATIONAL")).toBe("places-verified");
    expect(bodegaLiveness(null)).toBe("places-verified");
  });
  test("closed statuses gate it out", () => {
    expect(bodegaLiveness("CLOSED_PERMANENTLY")).toBe("closed-permanent");
    expect(bodegaLiveness("CLOSED_TEMPORARILY")).toBe("closed-temporary");
  });
});

test.describe("place-anchored directions", () => {
  test("with a place_id, directions route to the storefront door", () => {
    const url = directionsUrl({ name: "LIC Gourmet Organic & Deli", address: "5-20 47th Rd", placeId: "ChIJ_test123" });
    expect(url).toContain("destination_place_id=ChIJ_test123");
    expect(url).toContain("/maps/dir/");
  });

  test("without a place_id, it falls back to a coordinate/name search", () => {
    const url = directionsUrl({ name: "Somewhere", lat: 40.74, lng: -73.94 });
    expect(url).toContain("/maps/search/");
    expect(url).not.toContain("destination_place_id");
  });
});

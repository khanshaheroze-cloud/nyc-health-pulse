import { test, expect } from "@playwright/test";
import { classifyOrgVenue, nonWalkInReason, healthyPickEligibility } from "../src/lib/venue-normalize";

// Round 6 P0 — third institutional leak (Fooda → UNFCU/Boyce Technologies):
// DOHMH permits employee cafés under the ORGANIZATION's name. Org tokens on
// the DBA now exclude; org token + strong food signal goes to review instead.

test.describe("classifyOrgVenue — the July 6 leaks", () => {
  test("UNITED NATIONS FEDERAL CREDIT UNION → excluded", () => {
    expect(classifyOrgVenue("UNITED NATIONS FEDERAL CREDIT UNION", "American").verdict).toBe("exclude");
    expect(nonWalkInReason("UNITED NATIONS FEDERAL CREDIT UNION", "American")).toContain("CREDIT UNION");
    expect(healthyPickEligibility("UNITED NATIONS FEDERAL CREDIT UNION", "American", false).eligible).toBe(false);
  });

  test("BOYCE TECHNOLOGIES → excluded", () => {
    expect(classifyOrgVenue("BOYCE TECHNOLOGIES", "American").verdict).toBe("exclude");
    expect(healthyPickEligibility("BOYCE TECHNOLOGIES", "American", false).eligible).toBe(false);
  });

  test("more org permits: schools, hospitals, churches, authorities", () => {
    expect(classifyOrgVenue("PS 111 SCHOOL CAFETERIA", "American").verdict).toBe("exclude");
    expect(classifyOrgVenue("MOUNT SINAI HOSPITAL", "American").verdict).toBe("exclude");
    expect(classifyOrgVenue("FIRST BAPTIST CHURCH", "").verdict).toBe("exclude");
    expect(classifyOrgVenue("PORT AUTHORITY FOOD COURT", "American").verdict).toBe("exclude");
    expect(classifyOrgVenue("QUEENSBRIDGE SENIOR CENTER", "American").verdict).toBe("exclude");
    expect(classifyOrgVenue("ACME MANUFACTURING", "American").verdict).toBe("exclude");
  });

  test("kept: Woodbines, Gantry Bar & Kitchen, and normal restaurants", () => {
    expect(classifyOrgVenue("WOODBINES", "Irish").verdict).toBe("clear");
    expect(classifyOrgVenue("GANTRY BAR & KITCHEN", "American").verdict).toBe("clear");
    expect(classifyOrgVenue("COURT SQUARE DINER", "American").verdict).toBe("clear");
    expect(healthyPickEligibility("WOODBINES", "Irish", false).eligible).toBe(true);
    expect(healthyPickEligibility("GANTRY BAR & KITCHEN", "American", false).eligible).toBe(true);
  });

  test("parenthetical location annotations don't trip org tokens (Mogao)", () => {
    expect(classifyOrgVenue("MOGAO (Bank of China)", "Chinese").verdict).toBe("clear");
    expect(healthyPickEligibility("MOGAO (Bank of China)", "Chinese", false).eligible).toBe(true);
  });

  test("food-counter PUB/BAR names are eateries, not dive bars (July 6 sweep)", () => {
    expect(healthyPickEligibility("BAGEL PUB", "Bagels/Pretzels", false).eligible).toBe(true);
    expect(healthyPickEligibility("PROVA PIZZA BAR", "Pizza", false).eligible).toBe(true);
    // real dive signals still excluded
    expect(healthyPickEligibility("PARK AVENUE TAVERN", "American", false).eligible).toBe(false);
  });

  test("trailing legal suffixes never trip CORP — the bodega style", () => {
    expect(classifyOrgVenue("STAR DELI GROCERY CORP", "Delicatessen").verdict).toBe("clear");
    expect(classifyOrgVenue("VERNON BLVD PIZZA CORP.", "Pizza").verdict).toBe("clear");
    expect(classifyOrgVenue("HAPPY DUMPLING INC", "Chinese").verdict).toBe("clear");
  });

  test("org token + strong food signal + food cuisine → review, not exclusion", () => {
    const r = classifyOrgVenue("UNIVERSITY RESTAURANT", "American");
    expect(r.verdict).toBe("review");
    // review venues remain eligible for ranking (humans decide later)
    expect(healthyPickEligibility("UNIVERSITY RESTAURANT", "American", false).eligible).toBe(true);
    expect(classifyOrgVenue("TEMPLE BAR KITCHEN", "American").verdict).toBe("review");
  });
});

// Live API: no ranked venue at LIC or Midtown carries an excluded org token
const COORDS = [
  { label: "LIC", q: "lat=40.74523&lng=-73.953506" },
  { label: "Midtown", q: "lat=40.758&lng=-73.9855" },
];

test("near-me API: no institutional/org venue ranks (LIC + Midtown, all meals)", async ({ request }) => {
  for (const { label, q } of COORDS) {
    for (const meal of ["breakfast", "lunch", "dinner"]) {
      const res = await request.get(`/api/smart-menu/near-me?${q}&meal=${meal}`, { timeout: 60_000 });
      const data = (await res.json()) as { restaurants: { restaurantName: string; cuisine: string }[] };
      for (const r of data.restaurants) {
        const org = classifyOrgVenue(r.restaurantName, r.cuisine);
        expect(org.verdict, `${label}/${meal}: org venue ranked: ${r.restaurantName} (${org.token})`).not.toBe("exclude");
      }
    }
  }
});

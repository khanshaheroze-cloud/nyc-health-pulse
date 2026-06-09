import { test, expect } from "@playwright/test";
import { normalizeVenueName, canonicalBrand, healthyPickEligibility } from "../src/lib/venue-normalize";

// Real raw DOHMH dba values from the June 2026 live audit.

test.describe("normalizeVenueName", () => {
  test("strips store numbers and title-cases", () => {
    expect(normalizeVenueName("CHIPOTLE MEXCIAN GRILL # 2760")).toBe("Chipotle Mexcian Grill");
    expect(normalizeVenueName("DUNKIN' #350162")).toBe("Dunkin'");
    expect(normalizeVenueName("WXYZ BAR & LOUNGE")).toBe("Wxyz Bar & Lounge");
    expect(normalizeVenueName("MARRIOTT MARQUIS PASTRY SHOP")).toBe("Marriott Marquis Pastry Shop");
  });

  test("keeps ampersands, apostrophes, and brand caps", () => {
    expect(normalizeVenueName("MCDONALD'S")).toBe("McDonald's");
    expect(normalizeVenueName("JOE'S PIZZA")).toBe("Joe's Pizza");
    expect(normalizeVenueName("HALE & HEARTY SOUPS")).toBe("Hale & Hearty Soups");
    expect(normalizeVenueName("BLT PRIME")).toBe("BLT Prime");
  });

  test("collapses whitespace and strips corporate suffixes", () => {
    expect(normalizeVenueName("  JUST   SALAD   LLC ")).toBe("Just Salad");
    expect(normalizeVenueName("REVEL & RYE / BROADWAY LOUNGE / M CLUB")).toBe(
      "Revel & Rye / Broadway Lounge / M Club",
    );
  });

  test("leaves already mixed-case names alone", () => {
    expect(normalizeVenueName("by CHLOE.")).toBe("by CHLOE.");
  });
});

test.describe("canonicalBrand", () => {
  test("matches DOHMH spellings including misspellings", () => {
    expect(canonicalBrand("CHIPOTLE MEXCIAN GRILL # 2760")?.slug).toBe("chipotle");
    expect(canonicalBrand("CHIPOTLE MEXICAN GRILL")?.slug).toBe("chipotle");
    expect(canonicalBrand("DUNKIN'")?.slug).toBe("dunkin");
    expect(canonicalBrand("DUNKIN")?.slug).toBe("dunkin");
    expect(canonicalBrand("DUNKIN DONUTS #338")?.slug).toBe("dunkin");
    expect(canonicalBrand("STARBUCKS COFFEE")?.slug).toBe("starbucks");
    expect(canonicalBrand("MCDONALDS")?.slug).toBe("mcdonalds");
    expect(canonicalBrand("MC DONALDS #7332")?.slug).toBe("mcdonalds");
    expect(canonicalBrand("WENDY'S")?.slug).toBe("wendys");
    expect(canonicalBrand("THE HALAL GUYS")?.slug).toBe("halal-guys");
  });

  test("does not match local venues", () => {
    expect(canonicalBrand("WXYZ BAR & LOUNGE")).toBeNull();
    expect(canonicalBrand("JOSE'S BODEGA")).toBeNull();
    expect(canonicalBrand("MARRIOTT MARQUIS PASTRY SHOP")).toBeNull();
  });
});

test.describe("healthyPickEligibility", () => {
  test("excludes bars, lounges, pastry, hotel kitchens from ranked picks", () => {
    expect(healthyPickEligibility("WXYZ BAR & LOUNGE", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("REVEL & RYE / BROADWAY LOUNGE / M CLUB", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("MARRIOTT MARQUIS PASTRY SHOP", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("PARADISE DONUTS", "Donuts", false).eligible).toBe(false);
    expect(healthyPickEligibility("O'MALLEY'S TAVERN", "American", false).eligible).toBe(false);
  });

  test("keeps healthy bar types and brand-matched venues", () => {
    expect(healthyPickEligibility("LIQUITERIA JUICE BAR", "Juice, Smoothies", false).eligible).toBe(true);
    expect(healthyPickEligibility("POKE BAR NYC", "Hawaiian", false).eligible).toBe(true);
    // Dunkin' would trip the DONUT regex if it weren't brand-matched
    expect(healthyPickEligibility("DUNKIN DONUTS", "Donuts", true).eligible).toBe(true);
    expect(healthyPickEligibility("FRESH DELI & GRILL", "Delicatessen", false).eligible).toBe(true);
  });
});

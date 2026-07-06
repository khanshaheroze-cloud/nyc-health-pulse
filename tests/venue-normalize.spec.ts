import { test, expect } from "@playwright/test";
import { normalizeVenueName, canonicalBrand, healthyPickEligibility, nonWalkInReason } from "../src/lib/venue-normalize";

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

  test("neighborhood acronyms keep their casing", () => {
    // Live audit June 2026: "MERCATO LIC" rendered as "Mercato Lic"
    expect(normalizeVenueName("MERCATO LIC")).toBe("Mercato LIC");
    expect(normalizeVenueName("POKE BAR NYC")).toBe("Poke Bar NYC");
    expect(normalizeVenueName("MIGHTY QUINN'S BBQ")).toBe("Mighty Quinn's BBQ");
    expect(normalizeVenueName("UES BAGELS")).toBe("UES Bagels");
    expect(normalizeVenueName("UWS DINER")).toBe("UWS Diner");
    expect(normalizeVenueName("LES PIZZA CO")).toBe("LES Pizza");
    expect(normalizeVenueName("DUMBO KITCHEN")).toBe("DUMBO Kitchen");
    expect(normalizeVenueName("SOHO SALADS")).toBe("SoHo Salads");
    expect(normalizeVenueName("NOHO CAFE")).toBe("NoHo Cafe");
    expect(normalizeVenueName("JFK DELI")).toBe("JFK Deli");
    expect(normalizeVenueName("PATSY'S PIZZERIA II")).toBe("Patsy's Pizzeria II");
    expect(normalizeVenueName("SPARKS STEAKHOUSE III")).toBe("Sparks Steakhouse III");
  });

  test("splits digit runs glued to known acronyms", () => {
    // Live audit June 2026: "4747LIC" rendered as "4747lic"
    expect(normalizeVenueName("4747LIC")).toBe("4747 LIC");
    expect(normalizeVenueName("4747LIC CAFE")).toBe("4747 LIC Cafe");
    expect(normalizeVenueName("212NYC BAR")).toBe("212 NYC Bar");
    // Unknown letter runs stay glued — "21CLUB" is a name, not an acronym
    expect(normalizeVenueName("21CLUB")).toBe("21club");
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

  test("excludes hotel kitchens, catering, and event spaces (can't serve walk-in lunch)", () => {
    expect(healthyPickEligibility("MARRIOTT MARQUIS - MAIN KITCHEN", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("GREAT PERFORMANCES CATERING", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("ABIGAIL KIRSCH CATERERS", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("HILTON MIDTOWN EVENTS", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("CHELSEA EVENT SPACE", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("RESTAURANT ASSOCIATES COMMISSARY", "American", false).eligible).toBe(false);
    // "event" mid-name must NOT exclude a real restaurant
    expect(healthyPickEligibility("MAIN EVENT DINER", "American", false).eligible).toBe(true);
  });

  test("walk-in test: excludes non-public food service (July 5 2026 audit)", () => {
    // Fooda ranked #1 for dinner in the audit — corporate-cafeteria pop-ups
    // inside office buildings, not restaurants the public can enter
    expect(healthyPickEligibility("FOODA", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("FOODA @ 1 COURT SQUARE", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("SODEXO CAFETERIA", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("XYZ CATERING LLC", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("ARAMARK AT CITI FIELD", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("ACME FOOD SERVICES", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("MERCY HOSPITAL DINING SERVICES", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("GOLDMAN SACHS EMPLOYEE CAFETERIA", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("STAFF CANTEEN", "American", false).eligible).toBe(false);
    expect(healthyPickEligibility("COMPASS GROUP / FLIK", "American", false).eligible).toBe(false);
    // Cuisine descriptor alone marks institutional service
    expect(nonWalkInReason("SOME PLACE", "Employee Cafeteria")).not.toBeNull();
    // Real walk-in venues must NOT trip the gate
    expect(healthyPickEligibility("HARISSA GRILL", "Middle Eastern", false).eligible).toBe(true);
    expect(healthyPickEligibility("HAN DYNASTY", "Chinese", false).eligible).toBe(true);
    expect(nonWalkInReason("R40", "Mediterranean")).toBeNull();
  });

  test("keeps healthy bar types and brand-matched venues", () => {
    expect(healthyPickEligibility("LIQUITERIA JUICE BAR", "Juice, Smoothies", false).eligible).toBe(true);
    expect(healthyPickEligibility("POKE BAR NYC", "Hawaiian", false).eligible).toBe(true);
    // Dunkin' would trip the DONUT regex if it weren't brand-matched
    expect(healthyPickEligibility("DUNKIN DONUTS", "Donuts", true).eligible).toBe(true);
    expect(healthyPickEligibility("FRESH DELI & GRILL", "Delicatessen", false).eligible).toBe(true);
  });
});

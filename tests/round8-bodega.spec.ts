import { test, expect } from "@playwright/test";
import { classifyBodegaCandidate, CHAIN_CONVENIENCE_LABEL } from "../src/lib/bodegas";
import { normalizeVenueName, normalizePlacesName } from "../src/lib/venue-normalize";

// Round 8 phase 2 — bodega ingestion gate, by the July 13 live-validation
// cases. Rule tables are owner-editable in src/data/venue-policy.json.

test.describe("gas stations are not bodegas", () => {
  test("the Skillman 'bp' pump: gas_station type → excluded entirely", () => {
    const v = classifyBodegaCandidate({ displayName: "bp", types: ["gas_station", "convenience_store"] });
    expect(v.verdict).toBe("exclude-fuel");
  });

  test("fuel-brand NAME alone excludes even without the gas_station type", () => {
    const v = classifyBodegaCandidate({ displayName: "Shell", types: ["convenience_store"] });
    expect(v.verdict).toBe("exclude-fuel");
  });

  test("a deli token rescues a fuel-brand candidate: 'BP — Vernon Deli' passes", () => {
    const v = classifyBodegaCandidate({ displayName: "BP — Vernon Deli", types: ["gas_station", "convenience_store"] });
    expect(v.verdict).toBe("ingest");
  });

  test("fuel-brand word match is whole-word: 'Subpar Deli & Grocery' is not BP", () => {
    const v = classifyBodegaCandidate({ displayName: "Subpar Deli & Grocery", types: ["deli"] });
    expect(v.verdict).toBe("ingest");
  });
});

test.describe("chain convenience/drugstores are map-only, never ranked", () => {
  // Decision (documented in venue-policy.json + APP-FREEZE-REPORT): "even at
  // the bodega" means bodegas — a 7-Eleven or Duane Reade food aisle card
  // undercuts the brand's local credibility. They keep a dimmed map pin.
  for (const name of ["7-Eleven", "Duane Reade", "CVS", "Walgreens Pharmacy"]) {
    test(`${name} → map-only-chain`, () => {
      const v = classifyBodegaCandidate({ displayName: name, types: ["convenience_store"] });
      expect(v.verdict).toBe("map-only-chain");
    });
  }

  test("the map-only label is honest about why", () => {
    expect(CHAIN_CONVENIENCE_LABEL).toContain("not ranked");
  });
});

test.describe("real bodegas still ingest, with clean display names", () => {
  test("'LIC Gourmet Organic & Deli' class → ingest", () => {
    const v = classifyBodegaCandidate({ displayName: "LIC Gourmet Organic & Deli", types: ["grocery_store", "deli"] });
    expect(v.verdict).toBe("ingest");
  });

  test("all-lowercase Places artifacts get title-cased", () => {
    expect(normalizeVenueName("lic gourmet organic & deli")).toBe("LIC Gourmet Organic & Deli");
    expect(normalizeVenueName("court square deli grocery")).toBe("Court Square Deli Grocery");
  });

  test("owner mixed-case names stay untouched", () => {
    expect(normalizeVenueName("by CHLOE.")).toBe("by CHLOE.");
  });

  test("Places names get the stronger per-token title-caser (July 14: 'Los griegos')", () => {
    expect(normalizePlacesName("Los griegos")).toBe("Los Griegos");
    expect(normalizePlacesName("Los griegos deli & grocery")).toBe("Los Griegos Deli & Grocery");
    // Case-override map still wins, tokens with existing caps untouched.
    expect(normalizePlacesName("lic gourmet organic & deli")).toBe("LIC Gourmet Organic & Deli");
    expect(normalizePlacesName("Court Square Deli")).toBe("Court Square Deli");
    expect(normalizePlacesName("CVS")).toBe("CVS"); // acronym map: never "Cvs"
  });
});

// Brand-level typical-price bands for chain orders (owner-editable table in
// src/data/chain-prices.json). Round 5 (July 5 audit): chain picks returned
// estPrice: null, which exempted them from the under-$15 top-5 assertion and
// left ranked cards showing a vague ~$ band. A brand-level typical price makes
// every ranked card show a price and puts chains under the cap logic — a $17
// Luke's Lobster order lands in "Worth a splurge", exactly as it should.

import prices from "@/data/chain-prices.json";

const TABLE = prices as Record<string, number | string>;

/** Typical price of the recommended healthy order at this brand's NYC
 *  locations; null when the brand has no entry (UI shows the ~$ band). */
export function chainTypicalPrice(slug: string): number | null {
  const v = TABLE[slug];
  return typeof v === "number" ? v : null;
}

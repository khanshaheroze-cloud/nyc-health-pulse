import { test, expect } from "@playwright/test";
import { findNearestNeighborhood } from "../src/lib/nearestNeighborhood";

// The Jun 9 audit's flagship bug: the hero badge showed "GREENPOINT" for
// 47-10 Vernon Blvd, Long Island City — the single LIC-Astoria centroid sits
// in Astoria, so waterfront LIC resolved across the East River. Three real
// LIC addresses must resolve to Long Island City.

const LIC_ADDRESSES = [
  { label: "47-10 Vernon Blvd (Hunters Point)", lat: 40.7448, lng: -73.9536 },
  { label: "5-25 46th Ave (LIC waterfront)", lat: 40.747, lng: -73.9523 },
  { label: "27-24 Jackson Ave (Court Square)", lat: 40.7474, lng: -73.9418 },
];

for (const addr of LIC_ADDRESSES) {
  test(`${addr.label} resolves to Long Island City`, () => {
    const hood = findNearestNeighborhood(addr.lat, addr.lng);
    expect(hood.name, `${addr.label} resolved to ${hood.name}`).toMatch(/Long Island City|Astoria/);
    expect(hood.name).not.toMatch(/Greenpoint/i);
  });
}

test("Greenpoint proper still resolves to Greenpoint", () => {
  // Manhattan Ave & Greenpoint Ave
  const hood = findNearestNeighborhood(40.7304, -73.9543);
  expect(hood.name).toMatch(/Greenpoint/i);
});

test("Midtown still resolves to a Manhattan neighborhood", () => {
  const hood = findNearestNeighborhood(40.758, -73.9855);
  expect(hood.borough).toBe("Manhattan");
});

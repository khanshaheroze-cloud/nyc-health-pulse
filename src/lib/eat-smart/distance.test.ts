import { haversineMeters, formatDistance, metersToMiles } from "./distance";

test("haversineMeters — known NYC distance", () => {
  // LIC (user) to Midtown Chipotle ≈ 3.5 km
  const lic = { lat: 40.7448, lng: -73.9485 };
  const chipotle = { lat: 40.758, lng: -73.9855 };
  const m = haversineMeters(lic, chipotle);
  expect(m).toBeGreaterThan(3200);
  expect(m).toBeLessThan(3700);
});

test("metersToMiles — sanity", () => {
  expect(metersToMiles(1609.34)).toBeCloseTo(1, 2);
  expect(metersToMiles(255)).toBeCloseTo(0.158, 2);
});

test("formatDistance — blocks mode (default)", () => {
  expect(formatDistance(50)).toBe("< 1 block");           // same building
  expect(formatDistance(80)).toBe("1 block");
  expect(formatDistance(240)).toBe("3 blocks");
  expect(formatDistance(400)).toBe("5 blocks");
  expect(formatDistance(800)).toBe("0.5 mi");             // threshold hit, switches to miles
  expect(formatDistance(3200)).toBe("2.0 mi");
  expect(formatDistance(25000)).toBe("16 mi");
});

test("formatDistance — imperial mode", () => {
  expect(formatDistance(50, "imperial")).toBe("164 ft");
  expect(formatDistance(255, "imperial")).toBe("0.2 mi");
  expect(formatDistance(3200, "imperial")).toBe("2.0 mi");
  expect(formatDistance(25000, "imperial")).toBe("16 mi");
});

test("formatDistance — miles mode", () => {
  expect(formatDistance(255, "miles")).toBe("0.2 mi");
  expect(formatDistance(80, "miles")).toBe("0.0 mi");     // rounds under a block
  expect(formatDistance(3200, "miles")).toBe("2.0 mi");
  expect(formatDistance(25000, "miles")).toBe("16 mi");
});

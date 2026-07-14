import { test, expect } from "@playwright/test";
import { fitsYourDay, type RemainingMacros } from "../src/lib/eat-smart/remainingMacros";

// Round 8 phase 4 — "Fits your day" chip logic. Pure; the localStorage read
// is covered by the live verification (chip renders only with goals set).

const rem = (calLeft: number, proteinLeft = 0): RemainingMacros => ({ calLeft, proteinLeft });

test("a pick within the remaining calorie budget fits", () => {
  expect(fitsYourDay({ calories: 420 }, rem(500))).toBe(true);
  expect(fitsYourDay({ calories: 420 }, rem(420))).toBe(true);
});

test("a pick over the remaining budget does not fit", () => {
  expect(fitsYourDay({ calories: 650 }, rem(500))).toBe(false);
});

test("no tracker data / exhausted day → never annotate", () => {
  expect(fitsYourDay({ calories: 300 }, null)).toBe(false);
  expect(fitsYourDay({ calories: 300 }, rem(0))).toBe(false);
});

test("zero-calorie (unknown) picks are never claimed to fit", () => {
  expect(fitsYourDay({ calories: 0 }, rem(500))).toBe(false);
});

test("protein is a target, not a cap — it never disqualifies", () => {
  expect(fitsYourDay({ calories: 400 }, rem(500, 5))).toBe(true);
});

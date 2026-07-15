/* Daypart → meal param must match the web's detectMealType exactly, with the
 * app's "Late Night" label mapping to meal=snack. */
import { detectMealParam, mealLabel, detectLogSlot } from "../lib/daypart";

const at = (hour: number) => new Date(2026, 6, 14, hour, 30);

describe("detectMealParam (web parity)", () => {
  test.each([
    [6, "breakfast"],
    [10, "breakfast"],
    [11, "lunch"],
    [14, "lunch"],
    [15, "coffee"],
    [16, "coffee"],
    [17, "dinner"],
    [21, "dinner"],
    [22, "snack"],
    [23, "snack"],
    [2, "snack"],
    [5, "snack"],
  ] as const)("%i:30 → %s", (hour, meal) => {
    expect(detectMealParam(at(hour))).toBe(meal);
  });
});

describe("mealLabel", () => {
  test("snack after 10pm reads Late Night (data stays meal=snack)", () => {
    expect(mealLabel("snack", at(23))).toBe("Late Night");
    expect(mealLabel("snack", at(2))).toBe("Late Night");
  });
  test("snack in the afternoon reads Snack", () => {
    expect(mealLabel("snack", at(15))).toBe("Snack");
  });
  test("other meals label plainly", () => {
    expect(mealLabel("breakfast", at(8))).toBe("Breakfast");
    expect(mealLabel("dinner", at(19))).toBe("Dinner");
  });
});

describe("detectLogSlot", () => {
  test("maps hours to log slots", () => {
    expect(detectLogSlot(at(8))).toBe("breakfast");
    expect(detectLogSlot(at(12))).toBe("lunch");
    expect(detectLogSlot(at(18))).toBe("dinner");
    expect(detectLogSlot(at(23))).toBe("snack");
  });
});

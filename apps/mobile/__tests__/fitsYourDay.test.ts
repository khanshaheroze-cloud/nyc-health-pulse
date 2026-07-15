/* "Fits your day" — identical semantics to the web chip. */
import { remaining, fitsYourDay } from "../lib/fitsYourDay";

describe("remaining", () => {
  test("goal minus eaten, floored at zero", () => {
    expect(remaining({ calories: 2000, protein: 150 }, { calories: 600, protein: 40 })).toEqual({
      calLeft: 1400,
      proteinLeft: 110,
    });
    expect(remaining({ calories: 2000, protein: 150 }, { calories: 2400, protein: 200 })).toEqual({
      calLeft: 0,
      proteinLeft: 0,
    });
  });
});

describe("fitsYourDay", () => {
  test("fits within the remaining calorie budget", () => {
    expect(fitsYourDay({ calories: 420 }, { calLeft: 500, proteinLeft: 0 })).toBe(true);
    expect(fitsYourDay({ calories: 500 }, { calLeft: 500, proteinLeft: 0 })).toBe(true);
  });
  test("over budget / exhausted day / no tracker → false", () => {
    expect(fitsYourDay({ calories: 650 }, { calLeft: 500, proteinLeft: 0 })).toBe(false);
    expect(fitsYourDay({ calories: 100 }, { calLeft: 0, proteinLeft: 50 })).toBe(false);
    expect(fitsYourDay({ calories: 100 }, null)).toBe(false);
  });
  test("unknown calories never claimed to fit", () => {
    expect(fitsYourDay({ calories: 0 }, { calLeft: 500, proteinLeft: 0 })).toBe(false);
  });
  test("protein is a target, never a disqualifier", () => {
    expect(fitsYourDay({ calories: 300 }, { calLeft: 400, proteinLeft: 5 })).toBe(true);
  });
});

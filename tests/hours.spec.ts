import { test, expect } from "@playwright/test";
import { evaluateOpen, nextOpenLabel, chainHours, hoursChip, hm, type VenueHours, type WeeklyHours } from "../src/lib/hours";

// Build a Date at a specific weekday + time. Base Sunday 2026-07-05 is getDay()==0.
// day: 0=Sun..6=Sat
function at(day: number, h: number, m = 0): Date {
  return new Date(2026, 6, 5 + day, h, m, 0); // July 5 2026 is a Sunday
}

const NINE_TO_FIVE: WeeklyHours = Array.from({ length: 7 }, () => [{ open: hm(9), close: hm(17) }]);
const dayHours = (weekly: WeeklyHours): VenueHours => ({ weekly, source: "brand-default" });

test.describe("evaluateOpen — basic windows", () => {
  test("open inside the window, closed outside", () => {
    const h = dayHours(NINE_TO_FIVE);
    expect(evaluateOpen(h, at(1, 12, 0))).toBe("open");
    expect(evaluateOpen(h, at(1, 8, 59))).toBe("closed");
    expect(evaluateOpen(h, at(1, 17, 0))).toBe("closed"); // close is exclusive
    expect(evaluateOpen(h, at(1, 16, 59))).toBe("open");
  });

  test("unknown hours evaluate to unknown", () => {
    expect(evaluateOpen(null, at(1, 12))).toBe("unknown");
    expect(evaluateOpen({ weekly: null, source: "unknown" }, at(1, 12))).toBe("unknown");
  });

  test("café closed at 10:34pm (the Maman bug)", () => {
    const cafe = dayHours(Array.from({ length: 7 }, () => [{ open: hm(7), close: hm(18) }]));
    expect(evaluateOpen(cafe, at(2, 22, 34))).toBe("closed");
    expect(evaluateOpen(cafe, at(2, 9, 0))).toBe("open");
  });
});

test.describe("evaluateOpen — overnight windows", () => {
  // Taco Bell: 10am–1am (close = 25:00 = 1500 minutes)
  const overnight = dayHours(Array.from({ length: 7 }, () => [{ open: hm(10), close: hm(25) }]));

  test("open before midnight", () => {
    expect(evaluateOpen(overnight, at(3, 23, 30))).toBe("open");
  });

  test("open after midnight via previous day's spillover", () => {
    // Thursday 00:30 — belongs to Wednesday's 10am–1am window
    expect(evaluateOpen(overnight, at(4, 0, 30))).toBe("open");
  });

  test("closed after the spillover ends", () => {
    expect(evaluateOpen(overnight, at(4, 1, 30))).toBe("closed");
  });
});

test.describe("evaluateOpen — Sunday wrap", () => {
  // Saturday 6pm–2am spilling into Sunday; Sunday itself closed.
  const satNight: WeeklyHours = Array.from({ length: 7 }, () => []);
  satNight[6] = [{ open: hm(18), close: hm(26) }]; // Sat 6pm–2am

  test("Sunday 1am is open from Saturday's window (week wrap)", () => {
    expect(evaluateOpen(dayHours(satNight), at(0, 1, 0))).toBe("open");
  });

  test("Sunday noon is closed", () => {
    expect(evaluateOpen(dayHours(satNight), at(0, 12, 0))).toBe("closed");
  });
});

test.describe("chainHours + labels", () => {
  test("Dunkin brand default open at 7am, closed at 11pm", () => {
    const dunkin = chainHours("dunkin", "Coffee & Bakery");
    expect(dunkin.source).toBe("brand-default");
    expect(evaluateOpen(dunkin, at(1, 7, 0))).toBe("open");
    expect(evaluateOpen(dunkin, at(1, 23, 0))).toBe("closed");
  });

  test("unknown category falls through to unknown", () => {
    expect(chainHours("nonexistent", "NoSuchCategory").source).toBe("unknown");
  });

  test("nextOpenLabel names the next opening", () => {
    const h = dayHours(NINE_TO_FIVE);
    expect(nextOpenLabel(h, at(1, 6, 0))).toBe("opens 9am");
    expect(nextOpenLabel(h, at(1, 18, 0))).toBe("opens tomorrow 9am");
  });

  test("hoursChip tones", () => {
    const h = dayHours(NINE_TO_FIVE);
    expect(hoursChip("open", h, at(1, 12)).tone).toBe("open");
    expect(hoursChip("unknown", null, at(1, 12)).label).toBe("Hours unknown");
    const closed = hoursChip("closed", h, at(1, 6));
    expect(closed.tone).toBe("closed");
    expect(closed.label).toContain("opens 9am");
  });
});

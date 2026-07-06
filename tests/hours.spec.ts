import { test, expect } from "@playwright/test";
import { evaluateOpen, nextOpenLabel, chainHours, hoursChip, hm, type VenueHours, type WeeklyHours } from "../src/lib/hours";

// Build the instant corresponding to a specific NYC weekday + wall-clock time.
// July 2026 is EDT (UTC-4), so ET wall time h:m = UTC h+4:m. Constructing via
// Date.UTC makes these tests deterministic regardless of the runner's TZ —
// the evaluator itself converts every instant to America/New_York.
// day: 0=Sun..6=Sat; July 5 2026 is a Sunday.
function at(day: number, h: number, m = 0): Date {
  return new Date(Date.UTC(2026, 6, 5 + day, h + 4, m, 0));
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

test.describe("evaluateOpen — NYC timezone (July 5 audit P0)", () => {
  // The audit: at ~7:30 PM EDT a UTC server evaluated open chains as closed
  // (7:30 PM EDT = 11:30 PM UTC, past both closes). These tests pin the clock
  // to raw UTC instants so they fail if the evaluator ever reads server time.

  test("Wed 23:30 UTC (= 7:30 PM ET Wed): Starbucks 6am–9pm is OPEN", () => {
    const starbucks = chainHours("starbucks", "Coffee & Bakery");
    expect(evaluateOpen(starbucks, new Date(Date.UTC(2026, 6, 8, 23, 30)))).toBe("open");
  });

  test("Wed 23:30 UTC (= 7:30 PM ET Wed): BWW 10:30am–12am is OPEN", () => {
    const bww = chainHours("buffalo-wild-wings", "Chicken");
    expect(evaluateOpen(bww, new Date(Date.UTC(2026, 6, 8, 23, 30)))).toBe("open");
  });

  test("Thu 03:00 UTC (= 11:00 PM ET Wed): Starbucks is CLOSED, BWW still open", () => {
    const instant = new Date(Date.UTC(2026, 6, 9, 3, 0));
    expect(evaluateOpen(chainHours("starbucks", "Coffee & Bakery"), instant)).toBe("closed");
    expect(evaluateOpen(chainHours("buffalo-wild-wings", "Chicken"), instant)).toBe("open");
  });

  test("Thu 04:30 UTC (= 12:30 AM ET Thu): BWW closed after its midnight close", () => {
    const bww = chainHours("buffalo-wild-wings", "Chicken");
    expect(evaluateOpen(bww, new Date(Date.UTC(2026, 6, 9, 4, 30)))).toBe("closed");
  });

  test("overnight window in ET: Taco Bell open at 12:30 AM ET (4:30 UTC) via spillover", () => {
    const tb = chainHours("tacobell", "Fast Food"); // 10am–1am
    expect(evaluateOpen(tb, new Date(Date.UTC(2026, 6, 9, 4, 30)))).toBe("open"); // 12:30am ET Thu
    expect(evaluateOpen(tb, new Date(Date.UTC(2026, 6, 9, 5, 30)))).toBe("closed"); // 1:30am ET Thu
  });

  test("Sunday wrap in ET: Sat 6pm–2am window is open Sun 1am ET (5:00 UTC Sun)", () => {
    const satNight: WeeklyHours = Array.from({ length: 7 }, () => []);
    satNight[6] = [{ open: hm(18), close: hm(26) }];
    // Sunday July 5 2026 01:00 ET = 05:00 UTC — belongs to Saturday's window
    expect(evaluateOpen(dayHours(satNight), new Date(Date.UTC(2026, 6, 5, 5, 0)))).toBe("open");
    expect(evaluateOpen(dayHours(satNight), new Date(Date.UTC(2026, 6, 5, 16, 0)))).toBe("closed"); // Sun noon ET
  });

  test("chip label derives next-open from the ET clock, not server clock", () => {
    const starbucks = chainHours("starbucks", "Coffee & Bakery");
    const at11pmET = new Date(Date.UTC(2026, 6, 9, 3, 0)); // Wed 11pm ET
    const chip = hoursChip(evaluateOpen(starbucks, at11pmET), starbucks, at11pmET);
    expect(chip.tone).toBe("closed");
    expect(chip.label).toContain("opens tomorrow 6am");
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

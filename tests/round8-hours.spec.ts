import { test, expect } from "@playwright/test";
import { evaluateOpen, nextOpenLabel, hoursChip, type VenueHours, type WeeklyHours } from "../src/lib/hours";
import { newPlacesPeriodsToWeekly } from "../src/lib/places";

// Round 8 phase 3 — overnight/odd hours windows, by the July 13 live
// validation ("Closed · opens Wed 12:30am", Blended Smoothies). Pure logic.
// July 2026: Mon 6 / Tue 7 / Wed 8 (NYC is UTC-4).

function google(weekly: WeeklyHours): VenueHours {
  return { weekly, source: "google" };
}

const EMPTY_WEEK = (): WeeklyHours => Array.from({ length: 7 }, () => []);

test.describe("overnight windows evaluate correctly in both directions", () => {
  // Open Tue 10pm–2am: one cross-day interval on Tuesday (day 2).
  const weekly = EMPTY_WEEK();
  weekly[2] = [{ open: 1320, close: 1560 }];

  test("Tue 11pm → open (before midnight)", () => {
    expect(evaluateOpen(google(weekly), new Date("2026-07-07T23:00:00-04:00"))).toBe("open");
  });
  test("Wed 1am → open (past-midnight spillover)", () => {
    expect(evaluateOpen(google(weekly), new Date("2026-07-08T01:00:00-04:00"))).toBe("open");
  });
  test("Wed 3am → closed (spillover ended at 2am)", () => {
    expect(evaluateOpen(google(weekly), new Date("2026-07-08T03:00:00-04:00"))).toBe("closed");
  });
  test("Tue 9pm → closed (not yet open)", () => {
    expect(evaluateOpen(google(weekly), new Date("2026-07-07T21:00:00-04:00"))).toBe("closed");
  });
});

test.describe("midnight-split periods re-join into one overnight window", () => {
  // Some listings encode Tue 9pm–12:30am as [Tue 21:00–24:00] + [Wed
  // 00:00–00:30]. Without the re-join, the evaluator sees a phantom
  // "opens Wed 12:00am" stub.
  const weekly = newPlacesPeriodsToWeekly([
    { open: { day: 2, hour: 21, minute: 0 }, close: { day: 3, hour: 0, minute: 0 } },
    { open: { day: 3, hour: 0, minute: 0 }, close: { day: 3, hour: 0, minute: 30 } },
  ])!;

  test("the stub merges into Tuesday's window (close 12:30am next day)", () => {
    expect(weekly[2]).toEqual([{ open: 1260, close: 1470 }]);
    expect(weekly[3]).toEqual([]);
  });

  test("evaluates open at Wed 12:15am, closed at Wed 1am", () => {
    expect(evaluateOpen(google(weekly), new Date("2026-07-08T00:15:00-04:00"))).toBe("open");
    expect(evaluateOpen(google(weekly), new Date("2026-07-08T01:00:00-04:00"))).toBe("closed");
  });

  test("no phantom early-morning 'opens' label on Wednesday", () => {
    // Tue 8pm: next open is Tue 9pm — never "opens Wed 12:00am".
    const label = nextOpenLabel(google(weekly), new Date("2026-07-07T20:00:00-04:00"));
    expect(label).toBe("opens 9pm");
  });

  test("a full-day [0,1440] interval is never treated as a mergeable stub", () => {
    const w = newPlacesPeriodsToWeekly([{ open: { day: 0, hour: 0, minute: 0 } }])!;
    for (const day of w) expect(day).toEqual([{ open: 0, close: 1440 }]);
  });
});

test.describe("genuine early-morning openings get human copy", () => {
  // A venue that really opens Wed 12:30am–5am (overnight prep counter class).
  const weekly = EMPTY_WEEK();
  weekly[3] = [{ open: 30, close: 300 }];

  test("'opens tomorrow early morning (12:30am)' instead of the bare glitch-read", () => {
    const label = nextOpenLabel(google(weekly), new Date("2026-07-07T22:00:00-04:00"));
    expect(label).toBe("opens tomorrow early morning (12:30am)");
  });

  test("hoursChip carries the humanized copy", () => {
    const when = new Date("2026-07-07T22:00:00-04:00");
    const chip = hoursChip(evaluateOpen(google(weekly), when), google(weekly), when);
    expect(chip.label).toBe("Closed · opens tomorrow early morning (12:30am)");
    expect(chip.tone).toBe("closed");
  });

  test("normal daytime openings are unchanged", () => {
    const w = EMPTY_WEEK();
    w[3] = [{ open: 420, close: 1080 }]; // Wed 7am–6pm
    expect(nextOpenLabel(google(w), new Date("2026-07-08T05:00:00-04:00"))).toBe("opens 7am");
  });
});

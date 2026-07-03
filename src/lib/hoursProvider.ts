import type { VenueHours, WeeklyHours, Interval } from "@/lib/hours";

// Optional third-party hours for the long tail of DOHMH venues that are neither
// chains nor in the verified guide set. Gated on OPENING_HOURS_API_KEY — with no
// key we return "unknown" and NEVER scrape.
//
// Provider choice: GOOGLE PLACES (Place Details `opening_hours`).
//   - Why over Yelp Fusion: Places keys on a stable place_id and returns
//     `periods` (per-day open/close) that map cleanly to our WeeklyHours; Yelp's
//     `hours` is coarser and its Fusion free tier (500 calls/day) is stricter.
//   - Free tier / cost: Places Details is billed per call after the monthly
//     credit; we cache aggressively (30d) and only look up venues that reach the
//     ranked set, so volume stays well within the credit for a single-city app.
//   - This module intentionally does NOT implement the network call yet (no key
//     provisioned). It documents the contract and returns unknown so the rest of
//     the pipeline degrades gracefully. Wire the fetch when a key exists.

export interface HoursProvider {
  /** Resolve hours for a venue by name + coords. Returns unknown when the
   *  provider is unconfigured or has no data — never throws. */
  lookup(input: { name: string; lat: number; lng: number }): Promise<VenueHours>;
}

const UNKNOWN: VenueHours = { weekly: null, source: "unknown" };

// Google Places `periods[]` → WeeklyHours. Each period: { open:{day,time}, close:{day,time} }
// day 0=Sun..6=Sat, time "HHMM". A missing close = open 24h.
export function placesPeriodsToWeekly(
  periods: { open: { day: number; time: string }; close?: { day: number; time: string } }[],
): WeeklyHours {
  const weekly: WeeklyHours = Array.from({ length: 7 }, () => [] as Interval[]);
  for (const p of periods) {
    const openMin = parseHHMM(p.open.time);
    if (openMin == null) continue;
    if (!p.close) {
      weekly[p.open.day].push({ open: 0, close: 1440 });
      continue;
    }
    let closeMin = parseHHMM(p.close.time);
    if (closeMin == null) continue;
    if (p.close.day !== p.open.day || closeMin <= openMin) closeMin += 1440;
    weekly[p.open.day].push({ open: openMin, close: closeMin });
  }
  return weekly;
}

function parseHHMM(t: string): number | null {
  if (!/^\d{4}$/.test(t)) return null;
  return parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(2), 10);
}

class GooglePlacesProvider implements HoursProvider {
  constructor(private readonly key: string) {}
  async lookup(): Promise<VenueHours> {
    // Not implemented until a key is provisioned. The contract: Find Place →
    // Place Details(fields=opening_hours) → placesPeriodsToWeekly → source:"api".
    // Cache the result 30d keyed by place_id.
    return UNKNOWN;
  }
}

/** The active provider, or a null provider that always returns unknown. */
export function getHoursProvider(): HoursProvider {
  const key = process.env.OPENING_HOURS_API_KEY;
  if (key) return new GooglePlacesProvider(key);
  return { lookup: async () => UNKNOWN };
}

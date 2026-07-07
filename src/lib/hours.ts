// ─── Opening hours model + open/closed evaluator ─────────────────────────────
// The hero promises meals "right now", so a café that closed at 6pm must not
// headline the 10:34pm list. There is no DOHMH hours feed, so hours come from
// (in cost order): per-brand defaults for chains, in-person-verified hours for
// the LIC guide set, an optional Places/Yelp fetch behind an env key, else
// "unknown". Unknown is a first-class state — we never claim a venue is open
// without data.

/** Minutes from local midnight. `close` may exceed 1440 to express a window
 *  that runs past midnight (e.g. open 1320 / close 1560 = 10pm–2am). */
export interface Interval {
  open: number;
  close: number;
}

/** Seven entries indexed by JS Date.getDay() — 0 = Sunday … 6 = Saturday.
 *  An empty array for a day means closed all day. */
export type WeeklyHours = Interval[][];

/** Priority when several sources exist: verified (owner walked in) beats
 *  google (Places regularOpeningHours) beats brand-default beats unknown.
 *  "api" is the legacy alias kept for older fixtures. */
export type HoursSource = "brand-default" | "verified" | "google" | "api" | "unknown";

export interface VenueHours {
  weekly: WeeklyHours | null; // null = unknown
  source: HoursSource;
  verifiedAt?: string | null;
}

export type OpenState = "open" | "closed" | "unknown";

export function hm(h: number, m = 0): number {
  return h * 60 + m;
}

// ── NYC-local clock ──────────────────────────────────────────────────────────
// July 5 2026 evening audit (P0): the evaluator used when.getHours() — SERVER
// time. On Vercel (UTC) every 7:30 PM ET query read as 11:30 PM, so open
// Starbucks/BWW showed "Closed", which both lied on the chip AND silently
// dropped them from ranked picks (known-closed are excluded). ALL open/closed
// math derives weekday + minutes in America/New_York, never from the server TZ.
const NYC_CLOCK = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** NYC-local weekday (0=Sun) + minutes since local midnight for an instant. */
export function nycDayMinutes(when: Date): { day: number; minutes: number } {
  const parts = NYC_CLOCK.formatToParts(when);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  const day = WEEKDAY_INDEX[get("weekday")];
  const hour = parseInt(get("hour"), 10) % 24; // some ICU builds emit "24" at midnight
  const minute = parseInt(get("minute"), 10);
  if (day == null || Number.isNaN(hour) || Number.isNaN(minute)) {
    // Defensive fallback — should be unreachable with a valid Date
    return { day: when.getDay(), minutes: when.getHours() * 60 + when.getMinutes() };
  }
  return { day, minutes: hour * 60 + minute };
}

/** Evaluate whether a venue is open at `when`. Handles overnight windows
 *  (checks the previous day's past-midnight intervals) and unknown hours. */
export function evaluateOpen(hours: VenueHours | null | undefined, when: Date): OpenState {
  if (!hours || hours.source === "unknown" || !hours.weekly) return "unknown";
  const weekly = hours.weekly;
  if (weekly.length !== 7) return "unknown";

  const { day, minutes } = nycDayMinutes(when);

  // Today's intervals that contain `minutes`.
  for (const iv of weekly[day]) {
    const close = iv.close > 1440 ? 1440 : iv.close; // portion before midnight
    if (minutes >= iv.open && minutes < close) return "open";
  }

  // Yesterday's intervals that wrap past midnight into today.
  const prev = (day + 6) % 7;
  for (const iv of weekly[prev]) {
    if (iv.close > 1440) {
      const spilloverEnd = iv.close - 1440; // minutes into today
      if (minutes < spilloverEnd) return "open";
    }
  }

  return "closed";
}

/** Next opening time as a friendly label, e.g. "opens 7am" or "opens Mon 9am".
 *  Returns null if hours are unknown or the venue never opens. */
export function nextOpenLabel(hours: VenueHours | null | undefined, when: Date): string | null {
  if (!hours || hours.source === "unknown" || !hours.weekly || hours.weekly.length !== 7) return null;
  const weekly = hours.weekly;
  const { day: nowDay, minutes: nowMin } = nycDayMinutes(when);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let ahead = 0; ahead < 8; ahead++) {
    const day = (nowDay + ahead) % 7;
    const intervals = [...weekly[day]].sort((a, b) => a.open - b.open);
    for (const iv of intervals) {
      if (ahead === 0 && iv.open <= nowMin) continue; // already past today
      const label = fmtClock(iv.open);
      if (ahead === 0) return `opens ${label}`;
      if (ahead === 1) return `opens tomorrow ${label}`;
      return `opens ${dayNames[day]} ${label}`;
    }
  }
  return null;
}

function fmtClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return mm === 0 ? `${h}${ampm}` : `${h}:${String(mm).padStart(2, "0")}${ampm}`;
}

// ─── Brand-default hours ─────────────────────────────────────────────────────
// NYC chain hours are near-uniform per brand. Conservative windows: we would
// rather show a still-open spot than claim an about-to-close one. All tagged
// hoursSource: 'brand-default'.

/** A single open window applied to every day of the week. */
function everyday(open: number, close: number): WeeklyHours {
  return Array.from({ length: 7 }, () => [{ open, close }]);
}

/** Weekday window + separate weekend window (Sat=6, Sun=0). */
function weekdayWeekend(wd: Interval, sat: Interval, sun: Interval): WeeklyHours {
  return [ [sun], [wd], [wd], [wd], [wd], [wd], [sat] ];
}

// Per-brand overrides for the brands whose hours are well known and differ from
// their category default.
const BRAND_HOURS: Record<string, WeeklyHours> = {
  dunkin: everyday(hm(5), hm(21)),
  starbucks: everyday(hm(6), hm(21)),
  "mcdonalds": everyday(hm(6), hm(23)),
  "burger-king": everyday(hm(7), hm(23)),
  wendys: everyday(hm(10), hm(24)),
  tacobell: everyday(hm(10), hm(25)), // to 1am
  "taco-bell": everyday(hm(10), hm(25)),
  chipotle: everyday(hm(10, 45), hm(22)),
  cava: everyday(hm(10, 45), hm(22)),
  sweetgreen: everyday(hm(10, 30), hm(22)),
  "just-salad": weekdayWeekend({ open: hm(10, 30), close: hm(21) }, { open: hm(10, 30), close: hm(20) }, { open: hm(11), close: hm(19) }),
  chopt: weekdayWeekend({ open: hm(10, 30), close: hm(21) }, { open: hm(11), close: hm(20) }, { open: hm(11), close: hm(19) }),
  "panera-bread": everyday(hm(6, 30), hm(21)),
  panera: everyday(hm(6, 30), hm(21)),
  subway: everyday(hm(8), hm(22)),
  "pret-a-manger": weekdayWeekend({ open: hm(6, 30), close: hm(20) }, { open: hm(7), close: hm(19) }, { open: hm(7), close: hm(19) }),
  "shake-shack": everyday(hm(11), hm(23)),
  "five-guys": everyday(hm(11), hm(22)),
  "buffalo-wild-wings": everyday(hm(10, 30), hm(24)),
  "popeyes": everyday(hm(10, 30), hm(24)),
  "kfc": everyday(hm(10, 30), hm(23)),
  // Chick-fil-A: closed Sundays (index 0 empty).
  "chick-fil-a": [ [], ...Array.from({ length: 6 }, () => [{ open: hm(6, 30), close: hm(22) }]) ],
  "dominos": everyday(hm(10, 30), hm(25)),
  "dominos-pizza": everyday(hm(10, 30), hm(25)),
  "papa-johns": everyday(hm(10, 30), hm(25)),
};

// Category fallbacks for chains without a specific override.
const CATEGORY_HOURS: Record<string, WeeklyHours> = {
  "Coffee & Bakery": everyday(hm(6), hm(20)),
  Coffee: everyday(hm(6), hm(20)),
  Breakfast: everyday(hm(6, 30), hm(15)),
  Diner: everyday(hm(7), hm(23)),
  Healthy: everyday(hm(10, 30), hm(22)),
  "Fast Casual": everyday(hm(10, 30), hm(22)),
  "Fast Food": everyday(hm(7), hm(23)),
  Pizza: everyday(hm(11), hm(23)),
  Mexican: everyday(hm(10, 30), hm(22)),
  Sandwich: everyday(hm(8), hm(21)),
  Chicken: everyday(hm(10, 30), hm(23)),
  Burger: everyday(hm(11), hm(23)),
  Seafood: everyday(hm(11), hm(22)),
  Asian: everyday(hm(11), hm(22, 30)),
};

/** Brand-default hours for a chain, by slug + menu category. Returns unknown
 *  only if neither the brand nor its category has a default (shouldn't happen
 *  for curated chains). */
export function chainHours(slug: string, category: string): VenueHours {
  const weekly = BRAND_HOURS[slug] ?? CATEGORY_HOURS[category] ?? null;
  return weekly
    ? { weekly, source: "brand-default" }
    : { weekly: null, source: "unknown" };
}

// ─── Verified-venue hours ────────────────────────────────────────────────────
// Parse the human-authored { days, open, close } rows on verified venues into a
// WeeklyHours. days: "Mon-Fri" | "Sat-Sun" | "Daily" | "Sun" | "Mon,Wed,Fri".
// Times: "HH:MM" 24h; a close earlier than open means past-midnight (+1 day).
const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseClock(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  return hm(parseInt(m[1], 10), parseInt(m[2], 10));
}

function expandDays(spec: string): number[] {
  const s = spec.trim().toLowerCase();
  if (s === "daily" || s === "every day" || s === "mon-sun") return [0, 1, 2, 3, 4, 5, 6];
  const out = new Set<number>();
  for (const part of s.split(",")) {
    const range = part.trim().split("-").map((x) => x.trim().slice(0, 3));
    if (range.length === 2 && DAY_INDEX[range[0]] != null && DAY_INDEX[range[1]] != null) {
      const start = DAY_ORDER.indexOf(range[0]);
      const end = DAY_ORDER.indexOf(range[1]);
      for (let i = 0; i < 7; i++) {
        const idx = (start + i) % 7;
        out.add(DAY_INDEX[DAY_ORDER[idx]]);
        if (idx === end) break;
      }
    } else if (DAY_INDEX[range[0]] != null) {
      out.add(DAY_INDEX[range[0]]);
    }
  }
  return [...out];
}

export function parseVerifiedHours(
  entries: { days: string; open: string; close: string }[] | null | undefined,
): VenueHours {
  if (!entries || entries.length === 0) return { weekly: null, source: "unknown" };
  const weekly: WeeklyHours = Array.from({ length: 7 }, () => []);
  let any = false;
  for (const e of entries) {
    const open = parseClock(e.open);
    let close = parseClock(e.close);
    if (open == null || close == null) continue;
    if (close <= open) close += 1440; // past-midnight
    for (const d of expandDays(e.days)) {
      weekly[d].push({ open, close });
      any = true;
    }
  }
  return any ? { weekly, source: "verified" } : { weekly: null, source: "unknown" };
}

/** A short "Open now" / "Closed · opens 7am" / "Hours unknown" chip label. */
export function hoursChip(state: OpenState, hours: VenueHours | null | undefined, when: Date): { label: string; tone: "open" | "closed" | "unknown" } {
  if (state === "open") return { label: "Open now", tone: "open" };
  if (state === "unknown") return { label: "Hours unknown", tone: "unknown" };
  const next = nextOpenLabel(hours, when);
  return { label: next ? `Closed · ${next}` : "Closed", tone: "closed" };
}

/**
 * Global formatting utilities — single source of truth for numeric display.
 * Using these everywhere prevents raw floats like "8.367823453" from leaking
 * into the UI when API data bypasses individual .toFixed() calls.
 */

/** Round PM2.5 to 1 decimal place. Returns "—" for null/undefined/NaN. */
export function fmtPM25(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return v.toFixed(1);
}

/** Round any number to N decimal places. Returns fallback for null/NaN. */
export function fmtNum(v: number | null | undefined, decimals = 1, fallback = "—"): string {
  if (v == null || isNaN(v)) return fallback;
  return v.toFixed(decimals);
}

/** Format a percentage (already 0-100 scale). */
export function fmtPct(v: number | null | undefined, decimals = 1): string {
  if (v == null || isNaN(v)) return "—";
  return `${v.toFixed(decimals)}%`;
}

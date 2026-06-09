// Single source of truth for freshness stamps so "Just now" and "Updated 2h
// ago" can never disagree on the same screen. All surfaces format timestamps
// through these helpers.

/** "just now" | "4 min ago" | "2h ago" | "3d ago" */
export function formatRelative(ts: number | Date): string {
  const ms = Date.now() - (ts instanceof Date ? ts.getTime() : ts);
  if (ms < 60_000) return "just now";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** "Mar 2026" from an ISO date string (e.g. DOHMH inspection_date) */
export function formatMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

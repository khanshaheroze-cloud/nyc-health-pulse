"use client";

// Product-event layer — cookieless, self-hosted (events persist to the
// Supabase `events` table via /api/events, so the kill/continue dashboard at
// /admin/metrics can query totals without a third-party analytics plan).
// Vercel Analytics handles pageviews; this handles the funnel:
//   find_food_search | result_card_click | venue_detail_view | guide_view |
//   waitlist_signup | newsletter_signup

export type FunnelEvent =
  | "find_food_search"
  | "result_card_click"
  | "venue_detail_view"
  | "guide_view"
  | "waitlist_signup"
  | "newsletter_signup";

/** UTM source passthrough: utm_source wins, else the explicit source, else direct */
function resolveSource(explicit?: string): string {
  try {
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    if (utm) return utm.slice(0, 40);
  } catch {}
  return explicit ?? "direct";
}

export function trackEvent(event: FunnelEvent, props?: { source?: string; meta?: Record<string, string | number> }) {
  try {
    const body = JSON.stringify({
      event,
      source: resolveSource(props?.source),
      path: window.location.pathname,
      meta: props?.meta ?? {},
    });
    // keepalive so signup events survive navigation
    fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}

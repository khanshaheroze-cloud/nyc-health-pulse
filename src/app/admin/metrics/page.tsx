import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Metrics",
  robots: { index: false, follow: false },
};

// Private kill/continue dashboard. Gate: ?key=<ADMIN_METRICS_SECRET>.
// Decision gate (also in README): 200 waitlist signups OR 1,000 engaged
// content followers within 60 days of Jun 9 2026 (deadline Aug 9, 2026),
// else re-evaluate the wedge.

const FUNNEL = [
  "find_food_search",
  "result_card_click",
  "venue_detail_view",
  "guide_view",
  "waitlist_signup",
  "newsletter_signup",
] as const;

const DEADLINE = "2026-08-09";
const WAITLIST_TARGET = 200;
const FOLLOWER_TARGET = 1000;

async function countEvents(event: string, sinceIso: string): Promise<number | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { count, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("event", event)
    .gte("created_at", sinceIso);
  return error ? null : (count ?? 0);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const secret = process.env.ADMIN_METRICS_SECRET;

  if (!secret || key !== secret) {
    return (
      <div className="max-w-[480px] mx-auto py-20 px-4 text-center">
        <h1 className="font-display text-[22px] text-text mb-2">Metrics</h1>
        <p className="text-[13px] text-dim">
          {secret ? "Append ?key=<secret> to view." : "Set ADMIN_METRICS_SECRET in env to enable this dashboard."}
        </p>
      </div>
    );
  }

  const windows = [
    { label: "Last 7 days", since: daysAgoIso(7) },
    { label: "Last 30 days", since: daysAgoIso(30) },
    { label: "Since Jun 9 (gate window)", since: "2026-06-09T00:00:00Z" },
  ];

  const rows = await Promise.all(
    FUNNEL.map(async (event) => ({
      event,
      counts: await Promise.all(windows.map((w) => countEvents(event, w.since))),
    })),
  );

  const waitlistTotal = rows.find((r) => r.event === "waitlist_signup")?.counts[2] ?? null;
  const newsletterTotal = rows.find((r) => r.event === "newsletter_signup")?.counts[2] ?? null;
  const daysLeft = Math.max(0, Math.ceil((new Date(DEADLINE).getTime() - Date.now()) / 86_400_000));

  return (
    <div className="max-w-[720px] mx-auto py-10 px-4">
      <h1 className="font-display text-[26px] text-text mb-1">Kill / continue dashboard</h1>
      <p className="text-[13px] text-dim mb-6">
        Gate: <strong className="text-text">{WAITLIST_TARGET} waitlist signups</strong> or{" "}
        <strong className="text-text">{FOLLOWER_TARGET.toLocaleString()} engaged followers</strong> by{" "}
        {DEADLINE} — <strong className="text-text">{daysLeft} days left</strong>.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-1">Waitlist (gate window)</p>
          <p className="font-display text-[36px] font-bold text-text">
            {waitlistTotal ?? "—"}
            <span className="text-[16px] text-muted font-normal"> / {WAITLIST_TARGET}</span>
          </p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-1">Newsletter (gate window)</p>
          <p className="font-display text-[36px] font-bold text-text">{newsletterTotal ?? "—"}</p>
        </div>
      </div>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border">
            <th className="py-2 pr-2">Event</th>
            {windows.map((w) => (
              <th key={w.label} className="py-2 px-2 text-right">{w.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.event} className="border-b border-border/50">
              <td className="py-2 pr-2 font-medium text-text">{r.event}</td>
              {r.counts.map((c, i) => (
                <td key={i} className="py-2 px-2 text-right text-dim tabular-nums">{c ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[11px] text-muted mt-6">
        Events: Supabase `events` (cookieless, no PII). &ldquo;—&rdquo; = Supabase not configured or the
        events migration hasn&apos;t run. Engaged-follower count is tracked manually (TikTok/IG).
      </p>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { WARM_CELLS } from "@/lib/placesConfig";
import { placesCallsToday } from "@/lib/places";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Nightly cache pre-warm (vercel.json cron): hit our own ranked endpoint for
// the LIC + Manhattan-core cells so the Places enrichment cache (7-day TTL,
// shared via Supabase) is hot before the morning rush. Warming through the
// real endpoint means we enrich exactly the venues real users would see —
// no separate warm path to drift.
export async function GET(req: NextRequest) {
  // Vercel cron sets x-vercel-cron; manual runs may pass the digest secret.
  const secret = process.env.DIGEST_SECRET;
  const auth = req.headers.get("authorization");
  const isCron = req.headers.get("x-vercel-cron") !== null;
  if (!isCron && secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ warmed: 0, note: "GOOGLE_PLACES_API_KEY not set — nothing to warm" });
  }

  const origin = req.nextUrl.origin;
  const meals = ["breakfast", "lunch", "dinner"] as const;
  const results: { cell: string; meal: string; ok: boolean }[] = [];

  // Sequential on purpose: warming is a background job; a burst of parallel
  // enrichment would spike the daily budget for no user-facing benefit.
  for (const cell of WARM_CELLS) {
    for (const meal of meals) {
      try {
        const res = await fetch(
          `${origin}/api/smart-menu/near-me?lat=${cell.lat}&lng=${cell.lng}&meal=${meal}`,
          { cache: "no-store" },
        );
        results.push({ cell: cell.label, meal, ok: res.ok });
      } catch {
        results.push({ cell: cell.label, meal, ok: false });
      }
    }
  }

  return NextResponse.json({
    warmed: results.filter((r) => r.ok).length,
    total: results.length,
    placesCallsThisLambdaToday: placesCallsToday(),
    results,
  });
}

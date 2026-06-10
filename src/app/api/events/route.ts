import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EVENT_RE = /^[a-z][a-z0-9_]{2,40}$/;

// Cookieless product-event sink → Supabase `events` table
// (supabase/migrations/20260610_events.sql). No PII: event name, source,
// path, small meta blob. Queried by /admin/metrics.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { event?: string; source?: string; path?: string; meta?: unknown };
    if (!body.event || !EVENT_RE.test(body.event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const row = {
      event: body.event,
      source: typeof body.source === "string" ? body.source.slice(0, 40) : "direct",
      path: typeof body.path === "string" ? body.path.slice(0, 120) : null,
      meta: body.meta && typeof body.meta === "object" ? body.meta : {},
    };

    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.from("events").insert(row);
      if (error) console.error("[events] insert failed:", error.message);
      return NextResponse.json({ ok: !error });
    }
    // Unconfigured environments (CI, local without Supabase) just ack
    return NextResponse.json({ ok: true, persisted: false });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Accepts both payload shapes:
//  - RestaurantMenuModal: { restaurantName, reason, itemId, itemName, notes, reportedAt }
//  - SpotModal:           { venueId, venueName, address, field, message, reportedAt }
// Reports persist to the Supabase `data_reports` table (see
// supabase/migrations/20260609_data_reports.sql) so corrections form a real
// review queue; if the table/env is missing we fall back to stdout so a
// report is never silently dropped.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const venueName = (body.venueName ?? body.restaurantName) as string | undefined;
    const field = (body.field ?? body.reason) as string | undefined;

    if (!venueName || !field) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report = {
      venue_id: (body.venueId ?? body.itemId ?? null) as string | null,
      venue_name: venueName,
      address: (body.address ?? null) as string | null,
      field,
      item_name: (body.itemName ?? null) as string | null,
      message: ((body.message ?? body.notes ?? "") as string).slice(0, 500),
      reported_at: (body.reportedAt as string) ?? new Date().toISOString(),
      user_agent: req.headers.get("user-agent") ?? "unknown",
    };

    let persisted = false;
    try {
      const supabase = await createClient();
      if (supabase) {
        const { error } = await supabase.from("data_reports").insert(report);
        persisted = !error;
        if (error) console.error("[menu-correction] supabase insert failed:", error.message);
      }
    } catch (e) {
      console.error("[menu-correction] supabase error:", e);
    }

    if (!persisted) {
      console.log("[menu-correction]", JSON.stringify(report));
    }

    return NextResponse.json({ ok: true, persisted });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

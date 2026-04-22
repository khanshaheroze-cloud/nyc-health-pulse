import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { restaurantName, reason, itemId, itemName, notes, reportedAt } = body as {
      restaurantName: string;
      reason: string;
      itemId: string | null;
      itemName: string | null;
      notes: string | null;
      reportedAt: string;
    };

    if (!restaurantName || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Log to server stdout for now — upgrade to Supabase/webhook in production
    console.log("[menu-correction]", JSON.stringify({
      restaurantName,
      reason,
      itemId,
      itemName,
      notes,
      reportedAt,
      userAgent: req.headers.get("user-agent") ?? "unknown",
    }));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

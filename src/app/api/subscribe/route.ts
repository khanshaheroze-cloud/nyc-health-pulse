import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, frequency, list, source } = body as { email?: string; frequency?: string; list?: string; source?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const freq = frequency === "daily" ? "daily" : "weekly";

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
      firstName: freq,
      lastName: list || undefined,
    });

    // Server-side funnel event (more reliable than the client beacon) — no
    // PII: just which list and where the signup came from. This makes
    // waitlist/newsletter totals queryable for the kill/continue dashboard.
    try {
      const supabase = await createClient();
      if (supabase) {
        await supabase.from("events").insert({
          event: list === "newsletter" ? "newsletter_signup" : "waitlist_signup",
          source: typeof source === "string" ? source.slice(0, 40) : "direct",
          path: "/api/subscribe",
          meta: { list: list ?? "digest" },
        });
      }
    } catch {
      /* analytics must never break signups */
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

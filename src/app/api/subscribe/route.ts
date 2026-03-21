import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, frequency } = body as { email?: string; frequency?: string };

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
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscription failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

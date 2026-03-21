import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/push — Trigger a push notification (placeholder).
 *
 * Full web-push integration requires:
 *   1. Install the `web-push` npm package
 *   2. Generate VAPID keys: `npx web-push generate-vapid-keys`
 *   3. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL env vars
 *   4. Store client PushSubscription objects (from the browser) in a database
 *   5. Use `webpush.sendNotification(subscription, payload)` to deliver
 *
 * This route currently validates auth and the request body but does not
 * actually send push messages — it returns { ok: true } as a placeholder.
 */

export async function POST(req: NextRequest) {
  const secret = process.env.PUSH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "PUSH_SECRET env var not configured" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; body?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: "Missing required fields: title, body" },
      { status: 400 }
    );
  }

  // TODO: iterate over stored PushSubscription objects and call
  // webpush.sendNotification(subscription, JSON.stringify({ title, body, url }))

  return NextResponse.json({ ok: true });
}

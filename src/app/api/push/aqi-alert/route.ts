import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendExpoPush } from "@/lib/expoPush";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PM25_THRESHOLD = 35;

function authorize(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  const pushSecret = process.env.PUSH_SECRET;
  if (pushSecret && req.headers.get("authorization") === `Bearer ${pushSecret}`) return true;
  return false;
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }

async function handler(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let aqi: number | null = null;
  try {
    const aqiRes = await fetch(`${req.nextUrl.origin}/api/airnow`);
    if (aqiRes.ok) {
      const data = await aqiRes.json();
      const pm25 = data.observations?.find((o: { ParameterName: string }) => o.ParameterName === "PM2.5");
      if (pm25) aqi = pm25.AQI;
    }
  } catch {}

  if (aqi == null || aqi < PM25_THRESHOLD) {
    return NextResponse.json({ sent: 0, aqi, reason: "below threshold" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("aqi_alert", true);

  if (!tokens?.length) {
    return NextResponse.json({ sent: 0, aqi });
  }

  const messages = tokens.map((t) => ({
    to: t.token,
    title: "⚠️ Air Quality Alert",
    body: `NYC AQI is ${aqi} (PM2.5 above safe levels). Consider limiting outdoor activity.`,
    sound: "default" as const,
    data: { screen: "/air-quality" },
  }));

  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    try {
      await sendExpoPush(messages.slice(i, i + 100));
      sent += messages.slice(i, i + 100).length;
    } catch (err) {
      console.error("aqi-alert push error:", err);
    }
  }

  return NextResponse.json({ sent, aqi });
}

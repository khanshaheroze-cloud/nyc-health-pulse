import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const { token, userId, preferences } = await req.json();

    if (!token || typeof token !== "string" || !token.startsWith("ExponentPushToken")) {
      return NextResponse.json({ error: "Valid Expo push token required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          token,
          user_id: userId || null,
          meal_nudge: preferences?.mealNudge ?? true,
          aqi_alert: preferences?.aqiAlert ?? true,
          weekly_digest: preferences?.weeklyDigest ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" },
      );

    if (error) {
      console.error("push/register upsert error:", error);
      return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push/register error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

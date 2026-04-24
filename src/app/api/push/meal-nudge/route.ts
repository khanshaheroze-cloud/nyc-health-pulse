import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendExpoPush } from "@/lib/expoPush";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MEAL_MESSAGES = {
  lunch: {
    title: "🥗 Lunchtime — Eat Smart",
    body: "3 high-protein picks within 0.3mi. Tap to see what fits your macros.",
  },
  dinner: {
    title: "🍽️ Dinner ideas ready",
    body: "Your remaining macro budget is loaded. Find what fits nearby.",
  },
};

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

  const mealParam = req.nextUrl.searchParams.get("meal");
  const meal = (mealParam as "lunch" | "dinner") || "lunch";
  const msg = MEAL_MESSAGES[meal] || MEAL_MESSAGES.lunch;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: tokens, error } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("meal_nudge", true);

  if (error || !tokens?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const messages = tokens.map((t) => ({
    to: t.token,
    title: msg.title,
    body: msg.body,
    sound: "default" as const,
    data: { screen: "/(tabs)" },
  }));

  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let sent = 0;
  for (const chunk of chunks) {
    try {
      await sendExpoPush(chunk);
      sent += chunk.length;
    } catch (err) {
      console.error("meal-nudge push error:", err);
    }
  }

  return NextResponse.json({ sent });
}

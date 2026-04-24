import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a nutrition expert analyzing a restaurant menu photo. Extract individual menu items and estimate their macronutrients.

Return ONLY valid JSON — no markdown, no explanation. Format:
{"items":[{"name":"Item Name","calories":500,"protein":30,"carbs":45,"fat":20,"fiber":5}]}

Rules:
- Extract up to 15 items visible in the photo
- Estimate calories, protein (g), carbs (g), fat (g), fiber (g) based on typical restaurant portions
- If a dish name is partially visible or unclear, skip it
- Use realistic NYC restaurant portion sizes
- If the image is not a menu, return {"items":[],"error":"Not a menu"}`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured", items: [] },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "base64 image required", items: [] }, { status: 400 });
    }

    const mediaType = image.startsWith("/9j/") ? "image/jpeg" : "image/png";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: image },
              },
              {
                type: "text",
                text: "Extract the menu items visible in this photo and estimate macronutrients for each. Return JSON only.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Anthropic API error:", res.status, errBody);
      return NextResponse.json(
        { error: "Menu parsing failed", items: [] },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ items: [], error: "Could not parse response" });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const items = (parsed.items || []).map((item: Record<string, unknown>) => ({
      name: String(item.name || "Unknown"),
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      fiber: Number(item.fiber) || 0,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("menu/parse error:", err);
    return NextResponse.json({ error: "Internal error", items: [] }, { status: 500 });
  }
}

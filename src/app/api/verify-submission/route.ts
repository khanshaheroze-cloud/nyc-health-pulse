import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/service";

// ─── Community Verification v1 (App v1 phase 5 — additive, freeze-permitted) ─
// POST   — a user photographs a venue's menu / posted calorie board. Stores the
//          photo (private bucket) + a row in verification_submissions, runs the
//          menu-parse extraction (vision → structured items), flags GPS-remote
//          submissions. Anonymous submissions allowed (credit "a local").
// GET    — admin review queue (ADMIN_METRICS_SECRET): pending rows with signed
//          photo URLs.
// PATCH  — approve/reject. Approval builds a ready-to-merge verified-menu
//          record (verifiedAt + contributor) stored on the row; promotion into
//          the ranked surface stays the owner's verified-venues.json workflow —
//          the frozen surface is never mutated at runtime.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel request ceiling is 4.5MB
const REMOTE_THRESHOLD_M = 150;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ExtractedItem {
  name: string;
  price: number | null;
  calories: number | null;
  protein: number | null;
  /** 'posted-board' = legally posted calories (chains) — trustworthy numbers.
   *  'menu-estimated' = independent menu; items+prices real, macros estimated. */
  source: "posted-board" | "menu-estimated";
}

// Vision extraction via the same raw-HTTP pattern as /api/menu/parse (no SDK
// dependency on the frozen web app). Non-fatal: extraction failure leaves the
// submission pending with extracted=null — the reviewer still sees the photo.
async function extractMenu(imageBase64: string, mediaType: string): Promise<{ items: ExtractedItem[]; notes?: string } | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        system:
          "You extract restaurant menu data from photos for a venue-verification program. Dish names and prices must be transcribed exactly as printed. Calories: ONLY transcribe numbers that are actually printed on the menu/board (NYC chains legally post them) — never estimate calories yourself; use null when not printed. protein is null unless printed. Set source to 'posted-board' when calorie numbers are printed on the board, else 'menu-estimated'. If the photo is not a menu or calorie board, return {\"items\":[],\"notes\":\"not a menu\"}.",
        output_config: {
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["items"],
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "price", "calories", "protein", "source"],
                    properties: {
                      name: { type: "string" },
                      price: { type: ["number", "null"] },
                      calories: { type: ["number", "null"] },
                      protein: { type: ["number", "null"] },
                      source: { type: "string", enum: ["posted-board", "menu-estimated"] },
                    },
                  },
                },
                notes: { type: ["string", "null"] },
              },
            },
          },
        },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: "Extract every legible menu item with its exact printed price and any PRINTED calorie counts." },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      console.warn("[verify-submission] extraction HTTP", res.status);
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string };
    if (data.stop_reason === "refusal") return null;
    const text = data.content?.find((b) => b.type === "text")?.text;
    if (!text) return null;
    const parsed = JSON.parse(text) as { items: ExtractedItem[]; notes?: string };
    return { items: (parsed.items ?? []).slice(0, 40), notes: parsed.notes ?? undefined };
  } catch (e) {
    console.warn("[verify-submission] extraction failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "storage not configured" }, { status: 503 });

  try {
    const body = await req.json();
    const {
      imageBase64,
      camis,
      placeId,
      restaurantId,
      venueName,
      address,
      venueLat,
      venueLng,
      lat,
      lng,
      contributorId,
      contributorName,
    } = body ?? {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }
    if (!venueName || typeof venueName !== "string") {
      return NextResponse.json({ error: "venueName required" }, { status: 400 });
    }
    const bytes = Buffer.from(imageBase64, "base64");
    if (bytes.length < 1024 || bytes.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "image must be 1KB–4MB (compress before upload)" }, { status: 413 });
    }
    const mediaType = imageBase64.startsWith("/9j/") ? "image/jpeg" : "image/png";

    // GPS honesty: a submission taken far from the venue is flagged, never
    // auto-trusted (someone photographing a menu from home ≠ standing there).
    let distanceM: number | null = null;
    let remote = false;
    if ([venueLat, venueLng, lat, lng].every((v) => typeof v === "number")) {
      distanceM = Math.round(haversineM(lat, lng, venueLat, venueLng));
      remote = distanceM > REMOTE_THRESHOLD_M;
    }

    const id = crypto.randomUUID();
    const photoPath = `${id}.${mediaType === "image/jpeg" ? "jpg" : "png"}`;
    const { error: upErr } = await sb.storage
      .from("verification-photos")
      .upload(photoPath, bytes, { contentType: mediaType });
    if (upErr) {
      console.error("[verify-submission] upload failed:", upErr.message);
      return NextResponse.json({ error: "photo upload failed" }, { status: 502 });
    }

    const extracted = await extractMenu(imageBase64, mediaType);

    const { error: insErr } = await sb.from("verification_submissions").insert({
      id,
      camis: camis ?? null,
      place_id: placeId ?? null,
      restaurant_id: restaurantId ?? null,
      venue_name: venueName,
      address: address ?? null,
      venue_lat: typeof venueLat === "number" ? venueLat : null,
      venue_lng: typeof venueLng === "number" ? venueLng : null,
      submitter_lat: typeof lat === "number" ? lat : null,
      submitter_lng: typeof lng === "number" ? lng : null,
      distance_m: distanceM,
      remote,
      contributor_id: contributorId ?? null,
      contributor_name: contributorName ?? null,
      photo_path: photoPath,
      extracted,
      extraction_model: extracted ? "claude-opus-4-8" : null,
    });
    if (insErr) {
      console.error("[verify-submission] insert failed:", insErr.message);
      return NextResponse.json({ error: "submission failed" }, { status: 502 });
    }

    return NextResponse.json({
      id,
      status: "pending",
      remote,
      extractedCount: extracted?.items.length ?? 0,
    });
  } catch (err) {
    console.error("verify-submission POST error:", err);
    return NextResponse.json({ error: "submission failed" }, { status: 500 });
  }
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.ADMIN_METRICS_SECRET;
  const key = req.nextUrl.searchParams.get("key") ?? req.headers.get("x-admin-key");
  return !!secret && key === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "storage not configured" }, { status: 503 });

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const { data, error } = await sb
    .from("verification_submissions")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });

  const rows = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await sb.storage
        .from("verification-photos")
        .createSignedUrl(row.photo_path, 3600);
      return { ...row, photoUrl: signed?.signedUrl ?? null };
    }),
  );
  return NextResponse.json({ submissions: rows });
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "storage not configured" }, { status: 503 });

  try {
    const { id, action } = await req.json();
    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "id + action (approve|reject) required" }, { status: 400 });
    }
    const { data: row, error: getErr } = await sb
      .from("verification_submissions")
      .select("*")
      .eq("id", id)
      .single();
    if (getErr || !row) return NextResponse.json({ error: "not found" }, { status: 404 });

    const update: Record<string, unknown> = {
      status: action === "approve" ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
    };

    if (action === "approve") {
      // Ready-to-merge verified-venues record: real items + prices from the
      // photo, macros only when printed (posted-board). The owner merges this
      // into src/data/verified-venues.json + redeploys — the existing weekly
      // workflow, now fed by community submissions instead of walk-ins alone.
      const items = ((row.extracted?.items ?? []) as ExtractedItem[]).map((i) => ({
        name: i.name,
        price: i.price,
        calories: i.calories,
        protein: i.protein,
        source: i.source,
      }));
      update.verified_record = {
        camis: row.camis,
        placeId: row.place_id,
        name: row.venue_name,
        address: row.address,
        verifiedAt: new Date().toISOString().slice(0, 10),
        verifiedBy: row.contributor_name || "a local",
        verificationPhotoPath: row.photo_path,
        remoteFlagged: row.remote,
        menuItems: items,
      };
    }

    const { error: updErr } = await sb.from("verification_submissions").update(update).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 502 });
    return NextResponse.json({ id, status: update.status, verifiedRecord: update.verified_record ?? null });
  } catch (err) {
    console.error("verify-submission PATCH error:", err);
    return NextResponse.json({ error: "review failed" }, { status: 500 });
  }
}

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// "Share this order" card — a clean OG image (venue, order, macros, price)
// for frictionless social posting. GET /api/share-order?venue=…&order=…&cal=…&protein=…&price=…
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const venue = (p.get("venue") ?? "PulseNYC").slice(0, 60);
  const order = (p.get("order") ?? "").slice(0, 90);
  const cal = p.get("cal");
  const protein = p.get("protein");
  const price = p.get("price");

  const stats = [
    price ? `~$${price.replace(/[^0-9.]/g, "").slice(0, 5)}` : null,
    cal ? `${cal.replace(/\D/g, "").slice(0, 4)} cal` : null,
    protein ? `${protein.replace(/\D/g, "").slice(0, 3)}g protein` : null,
  ].filter(Boolean) as string[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAFAF7",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: "#1A1A1A" }}>
          Pulse<span style={{ color: "#2F8F4D" }}>NYC</span>
          <span style={{ color: "#6B716B", fontWeight: 500, marginLeft: 16 }}>· the order</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#6B716B" }}>{venue}</div>
          <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15, maxWidth: 1020 }}>
            {order || "Exactly what to order"}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {stats.map((s) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: "#E5F1E8",
                  color: "#2F8F4D",
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#6B716B" }}>
          pulsenyc.app — macro-friendly meals under $15, near you
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

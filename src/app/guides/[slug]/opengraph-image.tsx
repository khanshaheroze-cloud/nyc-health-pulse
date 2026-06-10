import { ImageResponse } from "next/og";
import { getGuide } from "@/lib/guides";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Guide OG card: spot count + neighborhood + price anchor — built so guide
// links unfurl well on socials (the guides ARE the distribution engine).
export default async function Image({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  const title = guide?.title ?? "NYC Neighborhood Food Guides";
  const neighborhood = guide?.neighborhood ?? "New York City";
  const count = guide?.spots.length ?? 0;
  const anchor = guide?.priceAnchor ?? "Under $15";

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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #4A7C59, #6B9E7A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 24,
            }}
          >
            ♥
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#1A1A1A" }}>
            Pulse<span style={{ color: "#2F8F4D" }}>NYC</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {[`${count} spots`, anchor, neighborhood].map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  borderRadius: 999,
                  background: "#E5F1E8",
                  color: "#2F8F4D",
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 800, color: "#1A1A1A", lineHeight: 1.15, maxWidth: 1000 }}>
            {title}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#6B716B" }}>
          Exact orders · real prices · macros · nearest subway stop
        </div>
      </div>
    ),
    size,
  );
}

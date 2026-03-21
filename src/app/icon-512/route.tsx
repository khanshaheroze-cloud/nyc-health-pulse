import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#f8fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "linear-gradient(145deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 40px rgba(16,185,129,0.35)",
          }}
        >
          {/* Inner content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
            }}
          >
            {/* Pulse "P" */}
            <span
              style={{
                color: "#ffffff",
                fontSize: 200,
                fontWeight: 900,
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1,
                letterSpacing: -8,
              }}
            >
              P
            </span>
            {/* Tagline */}
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 44,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: 6,
                marginTop: -20,
              }}
            >
              NYC
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}

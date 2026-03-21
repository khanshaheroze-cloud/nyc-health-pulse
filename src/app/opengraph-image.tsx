import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pulse NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafb 0%, #eef4f0 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #2dd4a0, #5b9cf5, #a78bfa)",
          }}
        />

        {/* Live badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(45,212,160,0.10)",
            border: "1px solid rgba(45,212,160,0.30)",
            borderRadius: 100,
            padding: "6px 14px",
            marginBottom: 28,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 100, background: "#1a9a6e" }} />
          <span style={{ color: "#1a9a6e", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>
            LIVE DATA
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#1e2d2a",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Pulse NYC
        </div>

        {/* Subtitle */}
        <div style={{ color: "#5a7a6e", fontSize: 24, marginBottom: 56 }}>
          Real-time public health intelligence across all five boroughs
        </div>

        {/* Metric chips */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Air Quality", color: "#1a9a6e" },
            { label: "COVID-19", color: "#2850AD" },
            { label: "Food Safety", color: "#7c5cbf" },
            { label: "42 Neighborhoods", color: "#d48520" },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8e4",
                borderRadius: 12,
                padding: "10px 22px",
                color,
                fontSize: 16,
                fontWeight: 600,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL watermark */}
        <div style={{ color: "#8ba89c", fontSize: 16, position: "absolute", bottom: 48, right: 80 }}>
          pulsenyc.app
        </div>
      </div>
    ),
    { ...size }
  );
}

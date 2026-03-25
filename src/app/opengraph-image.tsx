import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Pulse NYC — Public health intelligence for NYC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #EEF2ED, #EDF3F8, #FDF2ED)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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
            background: "linear-gradient(90deg, #4A7C59, #3B7CB8, #C4704A)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #4A7C59, #6B9E7A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 4px 16px rgba(74,124,89,0.2)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 18 18" fill="none">
            <path d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z" fill="white" opacity="0.95"/>
          </svg>
        </div>

        {/* Logo text */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#1A1D1A" }}>Pulse</span>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#4A7C59" }}>NYC</span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 24, color: "#5C635C", marginBottom: 48 }}>
          Public health intelligence across all five boroughs
        </div>

        {/* Feature chips */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Air Quality", "Food Safety", "COVID-19", "Neighborhoods", "25+ Live APIs"].map((label) => (
            <div
              key={label}
              style={{
                background: "#ffffff",
                border: "1px solid #E8E4DE",
                borderRadius: 100,
                padding: "8px 20px",
                color: "#5C635C",
                fontSize: 15,
                fontWeight: 600,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ color: "#8A918A", fontSize: 15, position: "absolute", bottom: 32, right: 48 }}>
          pulsenyc.app
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 390,
          height: 844,
          background: "#f8fafb",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          padding: "32px 20px 20px",
          gap: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(145deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900 }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1e2d2a" }}>Pulse NYC</div>
            <div style={{ fontSize: 11, color: "#5a7a6e" }}>Public Health Dashboard</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 100, padding: "3px 10px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: 1 }}>LIVE</span>
          </div>
        </div>

        {/* Borough bar */}
        <div style={{ height: 3, background: "linear-gradient(to right, #EE352E 20%, #FF6319 20% 40%, #2850AD 40% 60%, #B933AD 60% 80%, #6CBE45 80%)", marginBottom: 20, borderRadius: 2 }} />

        {/* KPI cards row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { label: "AIR QUALITY", value: "6.66", sub: "μg/m³ PM2.5", color: "#2dd4a0" },
            { label: "COVID HOSP", value: "1,763", sub: "90-day total", color: "#5b9cf5" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ flex: 1, background: "#fff", border: "1px solid #e2e8e4", borderRadius: 12, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
              <div style={{ fontSize: 8, fontWeight: 700, color: "#5a7a6e", letterSpacing: 1, marginBottom: 4, marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 9, color: "#8ba89c" }}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[
            { label: "FOOD VIOLATIONS", value: "990", sub: "critical · 30 days", color: "#a78bfa" },
            { label: "WATER SAFETY", value: "99.9%", sub: "samples clean", color: "#22d3ee" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ flex: 1, background: "#fff", border: "1px solid #e2e8e4", borderRadius: 12, padding: "12px 14px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
              <div style={{ fontSize: 8, fontWeight: 700, color: "#5a7a6e", letterSpacing: 1, marginBottom: 4, marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 9, color: "#8ba89c" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Neighborhood search box */}
        <div style={{ background: "#fff", border: "1px solid #e2e8e4", borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ fontSize: 12, color: "#8ba89c" }}>Search 42 neighborhoods…</span>
        </div>

        {/* Quick chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { name: "Hunts Point", color: "#EE352E" },
            { name: "East Harlem", color: "#EE352E" },
            { name: "Astoria", color: "#f5c542" },
            { name: "Bed-Stuy", color: "#FF6319" },
            { name: "Flushing", color: "#B933AD" },
          ].map(({ name, color }) => (
            <div key={name} style={{ background: "rgba(0,0,0,0.04)", border: "1px solid #e2e8e4", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 6, color: "#fff", fontWeight: 900 }}>N</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#1e2d2a" }}>{name}</span>
            </div>
          ))}
        </div>

        {/* Chart area placeholder */}
        <div style={{ background: "#fff", border: "1px solid #e2e8e4", borderRadius: 12, padding: "14px 16px", flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1e2d2a", marginBottom: 12 }}>COVID-19 Trend — 12 months</div>
          {/* Simplified bar chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 120 }}>
            {[40, 65, 55, 80, 70, 45, 30, 20, 35, 28, 22, 18].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 11 ? "#5b9cf5" : "rgba(91,156,245,0.3)", borderRadius: "3px 3px 0 0" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["Mar", "Jun", "Sep", "Dec", "Mar"].map(m => (
              <span key={m} style={{ fontSize: 8, color: "#8ba89c" }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <span style={{ fontSize: 9, color: "#8ba89c" }}>pulsenyc.app · 25+ live APIs from official city data</span>
        </div>
      </div>
    ),
    { width: 390, height: 844 }
  );
}

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
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#5a7a6e" }}>← Neighborhoods</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(245,197,66,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>⭐</span>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(91,156,245,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12 }}>📤</span>
            </div>
          </div>
        </div>

        {/* Borough badge + risk */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ background: "#fff", border: "2px solid #EE352E", borderRadius: 100, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#EE352E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 7, color: "#fff", fontWeight: 900 }}>4</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#EE352E" }}>Bronx</span>
          </div>
          <div style={{ background: "#fff", border: "2px solid #f07070", borderRadius: 100, padding: "4px 12px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f07070" }}>HIGH RISK</span>
          </div>
        </div>

        {/* Neighborhood name */}
        <div style={{ fontSize: 28, fontWeight: 900, color: "#1e2d2a", lineHeight: 1.1, marginBottom: 4 }}>
          Hunts Point &
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#1e2d2a", lineHeight: 1.1, marginBottom: 4 }}>
          Mott Haven
        </div>
        <div style={{ fontSize: 11, color: "#5a7a6e", marginBottom: 20 }}>
          Pop. 194,789 · UHF42 Public Health District
        </div>

        {/* Health snapshot */}
        <div style={{ background: "#fff", border: "1px solid #e2e8e4", borderRadius: 14, padding: "16px", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e2d2a", marginBottom: 14 }}>Health Snapshot</div>
          {[
            { label: "Life Expectancy", value: "77.7 yrs", pct: 68, color: "#2dd4a0" },
            { label: "Asthma ED", value: "163.8/10K", pct: 95, color: "#f07070" },
            { label: "Obesity", value: "33.1%", pct: 82, color: "#f59e42" },
            { label: "Diabetes", value: "16.5%", pct: 78, color: "#a78bfa" },
            { label: "Poverty", value: "42.1%", pct: 92, color: "#f07070" },
            { label: "PM2.5", value: "7.1 μg/m³", pct: 45, color: "#5b9cf5" },
          ].map(({ label, value, pct, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: "#5a7a6e", width: 80 }}>{label}</span>
              <div style={{ flex: 1, height: 8, background: "#e2e8e4", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#1e2d2a", width: 60, textAlign: "right" }}>{value}</span>
            </div>
          ))}
          <div style={{ fontSize: 8, color: "#8ba89c", marginTop: 4 }}>Bars show position vs. citywide range</div>
        </div>

        {/* Mini KPI row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[
            { label: "OVERDOSE RATE", value: "42.8", sub: "per 100K", color: "#f5c542" },
            { label: "PRETERM BIRTH", value: "10.2%", sub: "of live births", color: "#f472b6" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ flex: 1, background: "#fff", border: "1px solid #e2e8e4", borderRadius: 12, padding: "10px 12px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
              <div style={{ fontSize: 7, fontWeight: 700, color: "#5a7a6e", letterSpacing: 1, marginBottom: 4, marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color, marginBottom: 1 }}>{value}</div>
              <div style={{ fontSize: 8, color: "#8ba89c" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Context card */}
        <div style={{ background: "#fff", border: "1px solid #e2e8e4", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1e2d2a", marginBottom: 6 }}>Why This Matters</div>
          <div style={{ fontSize: 9, color: "#5a7a6e", lineHeight: 1.5 }}>
            Hunts Point–Mott Haven has the highest asthma ED rates and poverty in NYC. Environmental burden from highways, waste facilities, and food deserts compounds health disparities.
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "auto", paddingTop: 12 }}>
          <span style={{ fontSize: 9, color: "#8ba89c" }}>pulsenyc.app · 42 neighborhood health profiles</span>
        </div>
      </div>
    ),
    { width: 390, height: 844 }
  );
}

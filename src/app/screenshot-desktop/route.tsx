import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1280,
          height: 800,
          background: "#FAFAF7",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
          padding: "28px 48px 24px",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(145deg,#4A7C59,#3A6347)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#1A1D1A" }}>Pulse NYC</div>
            <div style={{ fontSize: 12, color: "#5C635C" }}>Public health intelligence across all five boroughs · 25+ live APIs from NYC DOHMH, CDC, Census & more</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "rgba(74,124,89,0.1)", border: "1px solid rgba(74,124,89,0.2)", borderRadius: 100, padding: "5px 14px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4A7C59" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4A7C59", letterSpacing: 1.5 }}>LIVE DATA</span>
          </div>
        </div>

        {/* Borough bar */}
        <div style={{ height: 3, background: "linear-gradient(to right, #EE352E 20%, #FF6319 20% 40%, #2850AD 40% 60%, #B933AD 60% 80%, #6CBE45 80%)", marginBottom: 18, borderRadius: 2 }} />

        {/* KPI row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { label: "AIR QUALITY PM2.5",    value: "6.66", sub: "μg/m³ annual avg",         color: "#6B9E7A", tag: "LIVE" },
            { label: "COVID HOSP (90D)",      value: "1,763", sub: "across 5 boroughs",       color: "#5b9cf5", tag: "LIVE" },
            { label: "FOOD VIOLATIONS",       value: "990", sub: "critical · 30 days",        color: "#a78bfa", tag: "LIVE" },
            { label: "WATER SAFETY",          value: "99.9%", sub: "samples clean",           color: "#22d3ee", tag: "LIVE" },
            { label: "RAT ACTIVITY",          value: "18.4%", sub: "active per 1K inspected", color: "#f59e42", tag: "LIVE" },
            { label: "OBESITY RATE",          value: "27.1%", sub: "NYC adults · CDC PLACES", color: "#f07070", tag: "2023" },
          ].map(({ label, value, sub, color, tag }) => (
            <div key={label} style={{ flex: 1, background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "12px 14px", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 2 }}>
                <span style={{ fontSize: 7.5, fontWeight: 700, color: "#5C635C", letterSpacing: 1 }}>{label}</span>
                <span style={{ fontSize: 7, fontWeight: 700, color: tag === "LIVE" ? "#4A7C59" : "#8A918A", background: tag === "LIVE" ? "rgba(74,124,89,0.1)" : "rgba(0,0,0,0.05)", padding: "1px 5px", borderRadius: 4 }}>{tag}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 1 }}>{value}</div>
              <div style={{ fontSize: 9, color: "#8A918A" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Main content: charts + news sidebar */}
        <div style={{ display: "flex", gap: 12, flex: 1 }}>
          {/* Left: 2x2 charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <div style={{ display: "flex", gap: 10, flex: 1 }}>
              {/* COVID chart */}
              <div style={{ flex: 1, background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D1A", marginBottom: 8 }}>COVID-19 Trend</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, flex: 1 }}>
                  {[40,65,55,80,70,45,30,20,35,28,22,18].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i===11?"#5b9cf5":"rgba(91,156,245,0.3)", borderRadius: "2px 2px 0 0" }} />
                  ))}
                </div>
              </div>
              {/* Air quality chart */}
              <div style={{ flex: 1, background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D1A", marginBottom: 8 }}>Air Quality (PM2.5)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, flex: 1 }}>
                  {[55,60,65,70,62,58,55,52,50,53,56,54].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i===11?"#6B9E7A":"rgba(107,158,122,0.3)", borderRadius: "2px 2px 0 0" }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flex: 1 }}>
              {/* ILI chart */}
              <div style={{ flex: 1, background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D1A", marginBottom: 8 }}>Flu / ILI Activity</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, flex: 1 }}>
                  {[20,35,60,80,90,70,40,20,15,18,30,45].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: i===11?"#f59e42":"rgba(245,158,66,0.3)", borderRadius: "2px 2px 0 0" }} />
                  ))}
                </div>
              </div>
              {/* Chronic chart */}
              <div style={{ flex: 1, background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1D1A", marginBottom: 8 }}>Chronic Disease by Borough</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", flex: 1 }}>
                  {[
                    { name: "Bronx",     val: 36, color: "#EE352E" },
                    { name: "Brooklyn",  val: 29, color: "#FF6319" },
                    { name: "Manhattan", val: 20, color: "#2850AD" },
                    { name: "Queens",    val: 25, color: "#B933AD" },
                  ].map(({ name, val, color }) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: "#5C635C", width: 56 }}>{name}</span>
                      <div style={{ flex: 1, height: 10, background: "#E8E4DE", borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ width: `${val * 2.5}%`, height: "100%", background: color, borderRadius: 5 }} />
                      </div>
                      <span style={{ fontSize: 9, color: "#1A1D1A", fontWeight: 600, width: 24 }}>{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: news feed */}
          <div style={{ width: 260, background: "#fff", border: "1px solid #E8E4DE", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D1A" }}>📰 NYC Health News</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4A7C59" }} />
                <span style={{ fontSize: 9, color: "#4A7C59", fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            {[
              "NYC Rolls Out Updated COVID Booster Campaign for High-Risk Groups",
              "DOHMH Reports Drop in Childhood Asthma ED Visits Citywide",
              "Air Quality Alert: Ozone Levels Expected to Rise This Weekend",
              "New Report: Bronx Leads City in Heat-Related ER Visits This Summer",
            ].map((h, i) => (
              <div key={i} style={{ borderTop: i > 0 ? "1px solid #E8E4DE" : "none", paddingTop: i > 0 ? 8 : 0 }}>
                <div style={{ fontSize: 8, color: "#8A918A", marginBottom: 3 }}>NYC DOHMH · {i + 1}h ago</div>
                <div style={{ fontSize: 10, color: "#1A1D1A", lineHeight: 1.4 }}>{h}</div>
              </div>
            ))}
            <div style={{ marginTop: "auto", borderTop: "1px solid #E8E4DE", paddingTop: 8 }}>
              <span style={{ fontSize: 8, color: "#8A918A" }}>Via Google News · refreshes every 30 min</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <span style={{ fontSize: 9, color: "#8A918A" }}>pulsenyc.app · Data from NYC DOHMH, CDC, U.S. Census, EPA · Updated continuously</span>
        </div>
      </div>
    ),
    { width: 1280, height: 800 }
  );
}

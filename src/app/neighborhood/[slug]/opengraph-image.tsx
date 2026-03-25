import { ImageResponse } from "next/og";
import { getNeighborhood } from "@/lib/neighborhoodData";

export const runtime = "edge";
export const alt = "Neighborhood Health Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BOROUGH_COLORS: Record<string, string> = {
  Bronx:          "#EE352E",
  Brooklyn:       "#FF6319",
  Manhattan:      "#2850AD",
  Queens:         "#B933AD",
  "Staten Island":"#6CBE45",
};

function getRisk(asthmaED: number, obesity: number, diabetes: number, poverty: number) {
  const score = (asthmaED / 163.8) * 0.35 + (obesity / 36.1) * 0.25 + (diabetes / 18.4) * 0.25 + (poverty / 42.1) * 0.15;
  if (score > 0.65) return { label: "HIGH RISK", color: "#C45A4A" };
  if (score > 0.40) return { label: "MODERATE", color: "#C4964A" };
  return { label: "LOW RISK", color: "#4A7C59" };
}

export default function NeighborhoodOGImage({ params }: { params: { slug: string } }) {
  const n = getNeighborhood(params.slug);
  if (!n) return new ImageResponse(<div style={{ background: "#FAFAF7" }} />, { ...size });

  const color = BOROUGH_COLORS[n.borough] ?? "#2850AD";
  const risk = getRisk(n.metrics.asthmaED, n.metrics.obesity, n.metrics.diabetes, n.metrics.poverty);

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #FAFAF7 0%, #EEF2ED 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Top accent bar in borough color */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: color,
          }}
        />

        {/* Borough tag + risk */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          <div
            style={{
              background: "#ffffff",
              border: `2px solid ${color}`,
              borderRadius: 100,
              padding: "6px 18px",
              color,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {n.borough}
          </div>
          <div
            style={{
              background: "#ffffff",
              border: `2px solid ${risk.color}`,
              borderRadius: 100,
              padding: "6px 18px",
              color: risk.color,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {risk.label}
          </div>
        </div>

        {/* Neighborhood name */}
        <div style={{ color: "#1A1D1A", fontSize: 60, fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
          {n.name}
        </div>
        <div style={{ color: "#5C635C", fontSize: 20, marginBottom: 48 }}>
          Health Profile · Pop. {n.population.toLocaleString()} · UHF42 Public Health District
        </div>

        {/* Metric chips */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Asthma ED", value: `${n.metrics.asthmaED}/10K`, color: "#C45A4A" },
            { label: "Life Exp.", value: `${n.metrics.lifeExp}y`, color: "#4A7C59" },
            { label: "Poverty", value: `${n.metrics.poverty}%`, color: "#C4964A" },
            { label: "PM2.5", value: `${Number(n.metrics.pm25).toFixed(1)} μg/m³`, color: "#3B7CB8" },
          ].map(({ label, value, color: c }) => (
            <div
              key={label}
              style={{
                background: "#ffffff",
                border: "1px solid #E8E4DE",
                borderRadius: 14,
                padding: "14px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ color: "#5C635C", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
                {label.toUpperCase()}
              </span>
              <span style={{ color: c, fontSize: 24, fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ color: "#8A918A", fontSize: 15, position: "absolute", bottom: 48, right: 80 }}>
          pulsenyc.app
        </div>
      </div>
    ),
    { ...size }
  );
}

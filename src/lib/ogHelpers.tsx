import type { ReactElement } from "react";

export function SectionOG({
  icon,
  title,
  subtitle,
  chips,
  accentColor,
}: {
  icon: string;
  title: string;
  subtitle: string;
  chips: { label: string; color: string }[];
  accentColor: string;
}): ReactElement {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FAFAF7 0%, #EEF2ED 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "72px 80px",
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
          background: accentColor,
        }}
      />

      {/* Icon + section badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <span style={{ fontSize: 48 }}>{icon}</span>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #E8E4DE",
            borderRadius: 100,
            padding: "6px 16px",
            color: "#5C635C",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          PULSE NYC
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: "#1A1D1A",
          lineHeight: 1.1,
          marginBottom: 16,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div style={{ color: "#5C635C", fontSize: 22, marginBottom: 48 }}>
        {subtitle}
      </div>

      {/* Chips */}
      <div style={{ display: "flex", gap: 14 }}>
        {chips.map(({ label, color }) => (
          <div
            key={label}
            style={{
              background: "#ffffff",
              border: "1px solid #E8E4DE",
              borderRadius: 12,
              padding: "10px 20px",
              color,
              fontSize: 15,
              fontWeight: 600,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* URL */}
      <div style={{ color: "#8A918A", fontSize: 15, position: "absolute", bottom: 48, right: 80 }}>
        pulsenyc.app
      </div>
    </div>
  );
}

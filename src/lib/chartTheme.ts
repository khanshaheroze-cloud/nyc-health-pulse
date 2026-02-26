// Shared dark-mode Recharts theme — import this in every chart component.

export const chartTheme = {
  grid: { stroke: "#1d2640", strokeDasharray: "3 3" },
  axis: { stroke: "#3d4b63", tick: { fill: "#6b7a94", fontSize: 11 } },
  tooltip: {
    contentStyle: {
      background: "#171e2c",
      border: "1px solid #1d2640",
      borderRadius: 8,
      fontSize: 12,
      color: "#e2e7f0",
    },
    cursor: { fill: "rgba(255,255,255,0.03)" },
  },
} as const;

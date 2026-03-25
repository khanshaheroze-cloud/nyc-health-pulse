// Shared Recharts theme — uses CSS variables for automatic light/dark support.
// Properties are accessed at render time via getters, so they pick up the
// current theme's CSS variable values automatically.

function getCSSVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Theme-aware chart config.
 *  Properties are computed on access so they always reflect the current
 *  light/dark CSS variables. Works with all existing `chartTheme.grid` /
 *  `chartTheme.axis` / `chartTheme.tooltip` usages unchanged. */
export const chartTheme = {
  get grid() {
    return { stroke: getCSSVar("--color-border-light", "#E8E4DE"), strokeDasharray: "3 3" };
  },
  get axis() {
    return {
      stroke: getCSSVar("--color-border-light", "#E8E4DE"),
      tick: { fill: getCSSVar("--color-muted", "#8A918A"), fontSize: 11 },
    };
  },
  get tooltip() {
    return {
      contentStyle: {
        background: getCSSVar("--color-surface", "#ffffff"),
        border: `1px solid ${getCSSVar("--color-border", "#E8E4DE")}`,
        borderRadius: 12,
        fontSize: 12,
        color: getCSSVar("--color-text", "#1A1D1A"),
        boxShadow: "0 4px 16px rgba(74,124,89,0.08)",
      },
      cursor: { fill: "rgba(74,124,89,0.04)" },
    };
  },
};

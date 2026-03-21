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
    return { stroke: getCSSVar("--color-border", "#e2e8e4"), strokeDasharray: "3 3" };
  },
  get axis() {
    return {
      stroke: getCSSVar("--color-border", "#c8ddd8"),
      tick: { fill: getCSSVar("--color-dim", "#5a7a6e"), fontSize: 11 },
    };
  },
  get tooltip() {
    return {
      contentStyle: {
        background: getCSSVar("--color-surface", "#ffffff"),
        border: `1px solid ${getCSSVar("--color-border", "#e2e8e4")}`,
        borderRadius: 8,
        fontSize: 12,
        color: getCSSVar("--color-text", "#1e2d2a"),
        boxShadow: "0 4px 16px rgba(16,185,129,0.08)",
      },
      cursor: { fill: "rgba(16,185,129,0.04)" },
    };
  },
};

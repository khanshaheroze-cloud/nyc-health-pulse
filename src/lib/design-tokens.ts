/**
 * Pulse NYC — Design Tokens
 *
 * Framework-agnostic design tokens shared across platforms:
 *   - Tailwind CSS (web)
 *   - React Native StyleSheet (mobile)
 *   - Any future consumer
 *
 * All numeric values are in pixels (or unitless for weights).
 * Colors are hex strings.
 */

export const tokens = {
  colors: {
    light: {
      bg: "#FAFAF7",
      surface: "#FFFFFF",
      surfaceWarm: "#F5F0EB",
      surfaceSage: "#EEF2ED",
      surfaceSky: "#EDF3F8",
      surfacePeach: "#FDF2ED",
      border: "#E8E4DE",
      borderLight: "#F0ECE6",
      textPrimary: "#1A1D1A",
      textSecondary: "#5C635C",
      textTertiary: "#8A918A",
      accent: "#4A7C59",
      accentLight: "#6B9E7A",
      accentBg: "#E8F0EA",
      sky: "#3B7CB8",
      terracotta: "#C4704A",
      coral: "#E07B6A",
      good: "#4A7C59",
      caution: "#C4964A",
      alert: "#C45A4A",
    },
    dark: {
      bg: "#0F1410",
      surface: "#151C17",
      surfaceWarm: "#1B241D",
      surfaceSage: "#1A2A1E",
      surfaceSky: "#151E28",
      surfacePeach: "#241A15",
      border: "#2A3A2D",
      borderLight: "#1F2D22",
      textPrimary: "#E8EDE9",
      textSecondary: "#9CA89D",
      textTertiary: "#6B7A6D",
      accent: "#6ECF8A",
      accentLight: "#8BDDA0",
      accentBg: "#1A2E1F",
      sky: "#6AB0E8",
      terracotta: "#E09070",
      coral: "#F09585",
      good: "#6ECF8A",
      caution: "#E0B86A",
      alert: "#E07A6A",
    },
    borough: {
      manhattan: "#8B6CC1",
      brooklyn: "#4A8FD4",
      queens: "#4A7C59",
      bronx: "#C4704A",
      statenIsland: "#C4964A",
    },
  },

  typography: {
    fontFamily: {
      sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "'DM Serif Display', Georgia, serif",
    },
    fontSize: {
      xs: 10,
      sm: 12,
      body: 14,
      lg: 16,
      xl: 20,
      "2xl": 24,
      "3xl": 32,
      "4xl": 48,
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },

  radii: {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },

  animation: {
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  },

  shadows: {
    subtle: "0 1px 3px rgba(0,0,0,0.04)",
    card: "0 2px 12px rgba(0,0,0,0.06)",
    elevated: "0 8px 32px rgba(0,0,0,0.08)",
  },
} as const;

/** Light or dark color palette type (union of both palettes) */
export type ThemeColors = (typeof tokens.colors)["light"] | (typeof tokens.colors)["dark"];

/** All available theme modes */
export type ThemeMode = "light" | "dark";

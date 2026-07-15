/* ── PulseNYC design tokens — mirrors the FROZEN web brand (July 14 2026) ────
 * Source of truth: nyc-health/src/components/wedge/* card styles +
 * src/lib/fonts (Fraunces display / Inter body). One tokens file, no inline
 * hex in components. Legacy keys kept so untouched screens keep compiling —
 * their VALUES are aligned to the web palette.
 */
import type { TextStyle } from "react-native";

export const colors = {
  // Surfaces (web: page cream #FAFAF7, white cards on #E6E5DE hairlines)
  bg: "#FAFAF7",
  surface: "#FFFFFF",
  surfaceWarm: "#F5F0EB",
  surfaceSage: "#E8F0EA",
  surfaceSky: "#EDF3F8",
  surfacePeach: "#FDF2ED",
  border: "#E6E5DE",
  borderLight: "#F0ECE6",

  // Text (web: #1A1A1A / #6B716B / #9A9F9A)
  textPrimary: "#1A1A1A",
  textSecondary: "#5C635C",
  textTertiary: "#6B716B",
  textMuted: "#9A9F9A",

  // Brand accents (web wedge green #2F8F4D, blue #2A6BC9)
  accentSage: "#2F8F4D",
  accentSageLight: "#5CA877",
  accentSageBg: "#E5F1E8",
  accentSky: "#2A6BC9",
  accentSkyBg: "#E6EEF9",
  accentTerracotta: "#C4704A",
  accentWarm: "#D4915E",
  accentCoral: "#E07B6A",

  // Status (web score/hours tones)
  good: "#2F8F4D",
  caution: "#B06A1E",
  cautionBg: "#FDF1E2",
  alert: "#B0503F",
  alertBg: "#F3E3E0",

  // Special chips
  nysPurple: "#6B5BB5",
  nysPurpleBg: "#EDEBF7",
  verifiedAmber: "#8A6A1C",
  verifiedAmberBg: "#FBF6E8",
  neutralChipBg: "#F0EFE8",
  neutralChipText: "#8A8F8A",
} as const;

export const radius = { sm: 12, md: 16, lg: 24, xl: 32 } as const;

/* Fonts — Fraunces (display) + Inter (body), the web brand since Round 3.
 * Components build variant strings like `${fonts.body}_700Bold`, which must
 * match the @expo-google-fonts export names loaded in app/_layout.tsx:
 *   Inter_400Regular … Inter_800ExtraBold, Fraunces_400Regular/600/700. */
export const fonts = {
  body: "Inter",
  display: "Fraunces",
} as const;

/* Typography scale — the web's clamp() sizes resolved at mobile widths. */
export const typography = {
  hero: { fontSize: 28, lineHeight: 34, fontFamily: "Fraunces_600SemiBold" },
  title: { fontSize: 22, lineHeight: 28, fontFamily: "Fraunces_600SemiBold" },
  section: { fontSize: 17, lineHeight: 22, fontFamily: "Fraunces_600SemiBold" },
  scoreNum: { fontSize: 22, lineHeight: 26, fontFamily: "Fraunces_700Bold" },
  body: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_500Medium" },
  small: { fontSize: 12, lineHeight: 16, fontFamily: "Inter_400Regular" },
  label: { fontSize: 11, lineHeight: 14, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" as const },
} as const;

/** Stat/number text: Inter tabular figures so macros/prices never jitter. */
export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };

/** Web PulseScore tone thresholds — green ≥75, amber 50–74, red <50. */
export function scoreTone(score: number): { fg: string; bg: string } {
  if (score >= 75) return { fg: colors.good, bg: colors.accentSageBg };
  if (score >= 50) return { fg: colors.caution, bg: colors.cautionBg };
  return { fg: colors.alert, bg: colors.alertBg };
}

import { colors } from "../../theme/tokens";

export type TimeBand = "dawn" | "morning" | "afternoon" | "evening" | "night";

export interface ThemeSnapshot {
  band: TimeBand;
  gradient: [string, string, string];
  accent: string;
  accentSoft: string;
  textOnGradient: string;
  particleColor: string;
  particleCount: number;
  ringStroke: string;
}

export const BANDS: Record<TimeBand, ThemeSnapshot> = {
  dawn: {
    band: "dawn",
    gradient: ["#FFB88C", "#DE6262", "#F6A085"],
    accent: "#E07B6A",
    accentSoft: "rgba(224,123,106,0.12)",
    textOnGradient: "#FFFFFF",
    particleColor: "rgba(255,200,150,0.5)",
    particleCount: 12,
    ringStroke: "#E07B6A",
  },
  morning: {
    band: "morning",
    gradient: ["#89CFF0", "#A8E6CF", "#D4F1C5"],
    accent: "#4A7C59",
    accentSoft: "rgba(74,124,89,0.10)",
    textOnGradient: "#FFFFFF",
    particleColor: "rgba(168,230,207,0.4)",
    particleCount: 8,
    ringStroke: colors.accentSage,
  },
  afternoon: {
    band: "afternoon",
    gradient: ["#56CCF2", "#87CEEB", "#B8E0F0"],
    accent: "#3B7CB8",
    accentSoft: "rgba(59,124,184,0.10)",
    textOnGradient: "#FFFFFF",
    particleColor: "rgba(255,255,255,0.3)",
    particleCount: 6,
    ringStroke: "#3B7CB8",
  },
  evening: {
    band: "evening",
    gradient: ["#2C3E50", "#C06C84", "#F8B195"],
    accent: "#C06C84",
    accentSoft: "rgba(192,108,132,0.12)",
    textOnGradient: "#FFFFFF",
    particleColor: "rgba(248,177,149,0.4)",
    particleCount: 10,
    ringStroke: "#C06C84",
  },
  night: {
    band: "night",
    gradient: ["#0B1026", "#1A1F3A", "#2D3561"],
    accent: "#7C9BF5",
    accentSoft: "rgba(124,155,245,0.10)",
    textOnGradient: "#FFFFFF",
    particleColor: "rgba(255,255,255,0.6)",
    particleCount: 25,
    ringStroke: "#7C9BF5",
  },
};

export function bandForHour(h: number): TimeBand {
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

export function themeForHour(h: number): ThemeSnapshot {
  return BANDS[bandForHour(h)];
}

export function bandProgress(h: number, m: number): number {
  const totalMin = h * 60 + m;
  const ranges: [number, number][] = [
    [5 * 60, 7 * 60],       // dawn
    [7 * 60, 12 * 60],      // morning
    [12 * 60, 17 * 60],     // afternoon
    [17 * 60, 20 * 60],     // evening
    [20 * 60, 29 * 60],     // night (wraps)
  ];
  const band = bandForHour(h);
  const idx = ["dawn", "morning", "afternoon", "evening", "night"].indexOf(band);
  const [start, end] = ranges[idx];
  const adjusted = band === "night" && totalMin < 5 * 60 ? totalMin + 24 * 60 : totalMin;
  return Math.min(1, Math.max(0, (adjusted - start) / (end - start)));
}

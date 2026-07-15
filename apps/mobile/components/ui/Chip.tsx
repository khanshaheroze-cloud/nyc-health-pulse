/* ── The one chip system — visual parity with the web's card chips ───────────
 * Every tone maps 1:1 to a web chip (LiveResultsStrip/SpotModal, frozen July
 * 14 2026). No inline hex anywhere else: cards compose these tones.
 */
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, tabularNums } from "../../theme/tokens";

export type ChipTone =
  | "grade" // DOHMH letter grade — green, bordered
  | "nys" // "NYS retail food store" — purple (never a fake grade)
  | "hours-open"
  | "hours-closed"
  | "hours-unknown"
  | "category" // uppercase label chip (icon + label from the API)
  | "walk" // blue
  | "protein" // green
  | "cal" // amber
  | "price" // neutral
  | "est" // muted "est." qualifier
  | "fits" // "✓ Fits your day" — green, bordered
  | "verified" // "✓ Menu verified" — green, bordered
  | "recheck" // "⟳ Verified — needs re-check" — amber
  | "neutral";

const TONES: Record<ChipTone, { bg: string; fg: string; border?: string }> = {
  grade: { bg: colors.accentSageBg, fg: colors.good, border: "rgba(47,143,77,0.25)" },
  nys: { bg: colors.nysPurpleBg, fg: colors.nysPurple, border: "rgba(107,91,181,0.2)" },
  "hours-open": { bg: colors.accentSageBg, fg: colors.good, border: "rgba(47,143,77,0.25)" },
  "hours-closed": { bg: colors.alertBg, fg: colors.alert, border: "rgba(176,80,63,0.2)" },
  "hours-unknown": { bg: colors.neutralChipBg, fg: colors.neutralChipText, border: colors.border },
  category: { bg: "transparent", fg: colors.textTertiary },
  walk: { bg: colors.accentSkyBg, fg: colors.accentSky },
  protein: { bg: colors.accentSageBg, fg: colors.good },
  cal: { bg: colors.cautionBg, fg: colors.caution },
  price: { bg: colors.neutralChipBg, fg: colors.textPrimary },
  est: { bg: "transparent", fg: colors.textMuted },
  fits: { bg: colors.accentSageBg, fg: colors.good, border: "rgba(47,143,77,0.25)" },
  verified: { bg: colors.accentSageBg, fg: colors.good, border: "rgba(47,143,77,0.25)" },
  recheck: { bg: colors.verifiedAmberBg, fg: colors.verifiedAmber, border: "#F0E3B5" },
  neutral: { bg: colors.neutralChipBg, fg: colors.textTertiary },
};

const BOLD_TONES = new Set<ChipTone>(["grade", "nys", "fits", "verified", "recheck", "hours-open", "hours-closed", "hours-unknown"]);

export function Chip({
  label,
  tone,
  icon,
  accessibilityLabel,
}: {
  label: string;
  tone: ChipTone;
  icon?: string;
  accessibilityLabel?: string;
}) {
  const t = TONES[tone];
  const isCategory = tone === "category";
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.chip,
        { backgroundColor: t.bg },
        t.border ? { borderWidth: 1, borderColor: t.border } : null,
        isCategory ? styles.categoryChip : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: t.fg },
          BOLD_TONES.has(tone) ? styles.bold : null,
          isCategory ? styles.categoryLabel : null,
          tabularNums,
        ]}
        numberOfLines={1}
      >
        {icon ? `${icon} ` : ""}
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  categoryChip: { paddingHorizontal: 0, paddingVertical: 0 },
  label: {
    fontSize: 11,
    fontFamily: `${fonts.body}_500Medium`,
  },
  bold: { fontFamily: `${fonts.body}_700Bold` },
  categoryLabel: {
    fontFamily: `${fonts.body}_700Bold`,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 10,
  },
});

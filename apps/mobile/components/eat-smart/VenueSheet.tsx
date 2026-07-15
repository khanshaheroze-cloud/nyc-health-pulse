/* ── VenueSheet — parity with the web venue modal (SpotModal, July 14 2026) ──
 * Server intelligence only: real address, DOHMH grade + inspection date OR
 * the NYS two-regulator explainer, tone-colored hours, score-sorted top picks
 * with est. labels, orderingTip as "Pro tip", ±15% disclaimer for generics,
 * place-anchored directions, report-an-error + one-tap "This place is
 * closed", share order, per-pick "＋ log", and the required Google
 * attribution. No letter-shaped UI except the real DOHMH grade.
 */
import { useCallback, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Share,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, scoreTone, tabularNums, typography } from "../../theme/tokens";
import { Chip } from "../ui/Chip";
import { orderPriceLabel, formatWalk, inspectedLabel } from "../../lib/results";
import { reportVenueClosed, reportVenueError } from "../../lib/api";
import { appendLogEntry, type LogSlot } from "../../lib/foodLog";
import { detectLogSlot } from "../../lib/daypart";
import type { ApiRestaurant, TopPick } from "../../lib/types";

const LOG_SLOTS: { slot: LogSlot; label: string; icon: string }[] = [
  { slot: "breakfast", label: "Breakfast", icon: "☀️" },
  { slot: "lunch", label: "Lunch", icon: "🌤" },
  { slot: "dinner", label: "Dinner", icon: "🌙" },
  { slot: "snack", label: "Snack", icon: "🍎" },
];

function hoursTone(tone: "open" | "closed" | "unknown"): "hours-open" | "hours-closed" | "hours-unknown" {
  return tone === "open" ? "hours-open" : tone === "closed" ? "hours-closed" : "hours-unknown";
}

export function VenueSheet({
  venue,
  visible,
  onClose,
  onLogged,
  onVerify,
}: {
  venue: ApiRestaurant | null;
  visible: boolean;
  onClose: () => void;
  onLogged?: () => void;
  /** Phase 5: opens the "Verify this spot" camera flow. */
  onVerify?: (venue: ApiRestaurant) => void;
}) {
  const [logPick, setLogPick] = useState<TopPick | null>(null);
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent">("idle");

  const openDirections = useCallback(() => {
    if (!venue) return;
    // Place-anchored: destination_place_id routes to the storefront door,
    // never a block-face dot (web round 7).
    const dest = encodeURIComponent(venue.address || venue.restaurantName);
    const url = venue.placeId
      ? `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${venue.placeId}&travelmode=walking`
      : `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}&travelmode=walking`;
    Linking.openURL(url);
  }, [venue]);

  const shareOrder = useCallback(async () => {
    if (!venue) return;
    const pick = venue.topPicks[0];
    const line = pick
      ? `${pick.name} at ${venue.restaurantName} — ${pick.calories} cal · ${pick.protein}g protein · ${orderPriceLabel(venue)}`
      : `${venue.restaurantName} — smart ordering tips on PulseNYC`;
    try {
      await Share.share({ message: `${line}\nFound with PulseNYC → https://pulsenyc.app` });
    } catch {}
  }, [venue]);

  const reportClosed = useCallback(async () => {
    if (!venue || reportState !== "idle") return;
    setReportState("sending");
    try {
      await reportVenueClosed(venue);
    } catch {}
    setReportState("sent");
  }, [venue, reportState]);

  const reportError = useCallback(() => {
    if (!venue) return;
    Alert.prompt?.(
      "Report an error",
      "What's wrong? (wrong hours, wrong address, prices off …)",
      async (message) => {
        if (!message?.trim()) return;
        try {
          await reportVenueError(venue, "other", message.trim());
          Alert.alert("Thanks", "Flagged for review — fixes ship in the next data pass.");
        } catch {
          Alert.alert("Couldn't send", "Check your connection and try again.");
        }
      },
    ) ??
      // Android has no Alert.prompt — fall back to the one-tap closed report path.
      Alert.alert("Report an error", "Is this place permanently closed?", [
        { text: "Cancel", style: "cancel" },
        { text: "Yes — it's closed", style: "destructive", onPress: reportClosed },
      ]);
  }, [venue, reportClosed]);

  const logToSlot = useCallback(
    async (pick: TopPick, slot: LogSlot) => {
      if (!venue) return;
      await appendLogEntry({
        name: `${venue.restaurantName} — ${pick.name}`,
        calories: pick.calories,
        protein: pick.protein,
        carbs: pick.carbs ?? 0,
        fat: pick.fat ?? 0,
        fiber: pick.fiber ?? 0,
        mealSlot: slot,
        source: "venue-pick",
        restaurantId: venue.restaurantId,
        restaurantName: venue.restaurantName,
        pulseScore: pick.pulseScore,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLogPick(null);
      Alert.alert("Logged!", `${pick.name} · ${pick.calories} cal added to ${slot}.`);
      onLogged?.();
    },
    [venue, onLogged],
  );

  if (!venue) return null;
  const inspected = inspectedLabel(venue.inspectedAt);
  const hasPlaces = !!(venue.placeId || venue.source === "places" || venue.hoursSource === "google");

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={s.backdrop}>
          <TouchableOpacity style={s.dismissArea} onPress={onClose} activeOpacity={1} accessibilityLabel="Close venue details" />
          <View style={s.sheet}>
            <View style={s.handle} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Header */}
              {venue.categoryChip && (
                <Chip tone="category" icon={venue.categoryChip.icon} label={venue.categoryChip.label} />
              )}
              <Text style={s.name}>{venue.restaurantName}</Text>
              <Text style={s.meta}>
                {venue.cuisine} · {formatWalk(venue)}
              </Text>
              {!!venue.address && (
                <TouchableOpacity onPress={openDirections} accessibilityRole="link" accessibilityLabel={`Address ${venue.address}. Get walking directions.`}>
                  <Text style={s.address}>
                    📍 {venue.address} <Text style={s.directionsInline}>· Get directions →</Text>
                  </Text>
                </TouchableOpacity>
              )}

              {/* Trust row */}
              <View style={s.chipRow}>
                {venue.grade ? <Chip tone="grade" label={`Grade ${venue.grade}${inspected ? ` · ${inspected}` : ""}`} /> : null}
                {!venue.grade && venue.source === "places" ? <Chip tone="nys" label="NYS retail food store" /> : null}
                {venue.hoursChip && <Chip tone={hoursTone(venue.hoursChip.tone)} label={venue.hoursChip.label} />}
                <Chip tone="price" label={venue.priceTier} />
                {venue.verifiedBadge === "verified" && <Chip tone="verified" label="✓ Menu verified" />}
              </View>

              {/* Excluded venues opened from a dimmed map pin say WHY they
                  don't rank — the label is the server's, verbatim. */}
              {venue.livenessLabel && (
                <View style={s.gatedBox}>
                  <Text style={s.gatedText}>{venue.livenessLabel}</Text>
                </View>
              )}

              {/* Liveness honesty (web parity) */}
              {venue.liveness === "places-verified" && (
                <Text style={s.livenessOk}>
                  ✓ Verified open via Google
                  {venue.livenessCheckedAt
                    ? ` · ${new Date(venue.livenessCheckedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                    : ""}
                </Text>
              )}
              {venue.liveness === "dohmh-only" && (
                <Text style={s.livenessNote}>Not independently verified — listing from NYC DOHMH records</Text>
              )}

              {/* Two-regulator explainer for Places bodegas */}
              {venue.source === "places" && (
                <View style={s.nysBox}>
                  <Text style={s.nysText}>
                    <Text style={s.bold}>NYS retail food store.</Text> Bodegas and delis are licensed by NY State
                    Agriculture &amp; Markets, not the NYC DOHMH restaurant program — so this spot carries a state
                    registration instead of a letter grade.
                  </Text>
                </View>
              )}

              {/* Generic estimate disclaimer (web parity) */}
              {venue.isGeneric && venue.topPicks.length > 0 && (
                <View style={s.estBox}>
                  <Text style={s.estBoxText}>
                    <Text style={s.bold}>PulseNYC pick</Text> · ±15% variance expected. Recommended healthy orders for
                    a typical {venue.categoryChip?.label.toLowerCase() ?? venue.category.toLowerCase()} like this —
                    actual items and prices may differ slightly.
                  </Text>
                </View>
              )}

              {/* Pro tip */}
              {venue.orderingTip && (
                <View style={s.tipBox}>
                  <Text style={s.tipText}>
                    <Text style={s.bold}>Pro tip:</Text> {venue.orderingTip}
                  </Text>
                </View>
              )}

              {/* Top picks — score-sorted by the server; rendered verbatim */}
              {venue.topPicks.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Top picks</Text>
                  {venue.topPicks.map((pick, i) => {
                    const tone = scoreTone(pick.pulseScore);
                    return (
                      <View key={pick.id} style={[s.pickRow, i === 0 && s.pickRowTop]}>
                        <View style={[s.scoreBubble, { backgroundColor: tone.bg }]}>
                          <Text style={[s.scoreText, { color: tone.fg }, tabularNums]}>{pick.pulseScore}</Text>
                        </View>
                        <View style={s.pickInfo}>
                          <Text style={s.pickName} numberOfLines={2}>
                            {i === 0 && <Text style={{ color: colors.good }}>★ </Text>}
                            {pick.name}
                          </Text>
                          <Text style={[s.pickMacros, tabularNums]}>
                            {pick.calories} cal · {pick.protein}g protein
                            {pick.estPrice != null ? ` · ~$${pick.estPrice}` : ""}
                            {venue.isGeneric ? " · est." : ""}
                          </Text>
                          {pick.overCalTarget && <Text style={s.overCal}>over the 600-cal target</Text>}
                        </View>
                        <TouchableOpacity
                          style={s.plusBtn}
                          onPress={() => setLogPick(pick)}
                          accessibilityRole="button"
                          accessibilityLabel={`Log ${pick.name}, ${pick.calories} calories`}
                        >
                          <Text style={s.plusText}>＋</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Best drink, surfaced separately (never headlines) */}
              {venue.bestDrink && (
                <Text style={s.bestDrink}>
                  Best drink: {venue.bestDrink.name} · {venue.bestDrink.calories} cal
                </Text>
              )}

              {/* Other locations */}
              {venue.locationCount > 1 && venue.otherLocations.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>
                    {venue.locationCount} locations nearby — this is the closest
                  </Text>
                  {venue.otherLocations.map((loc, i) => (
                    <Text key={i} style={s.otherLoc}>
                      {loc.address} · {loc.walkMinutes} min walk{loc.grade ? ` · Grade ${loc.grade}` : ""}
                    </Text>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity style={s.actionBtn} onPress={openDirections} accessibilityRole="button">
                  <Text style={s.actionText}>🧭 Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={shareOrder} accessibilityRole="button">
                  <Text style={s.actionText}>↗ Share order</Text>
                </TouchableOpacity>
              </View>
              {onVerify && (
                <TouchableOpacity style={s.verifyBtn} onPress={() => onVerify(venue)} accessibilityRole="button">
                  <Text style={s.verifyText}>📸 Verify this spot</Text>
                  <Text style={s.verifySub}>Photograph the menu — help keep PulseNYC accurate</Text>
                </TouchableOpacity>
              )}

              {/* Corrections */}
              <View style={s.reportRow}>
                <TouchableOpacity onPress={reportError} style={s.reportBtn} accessibilityRole="button">
                  <Text style={s.reportText}>Report an error</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={reportClosed}
                  style={s.reportBtn}
                  disabled={reportState !== "idle"}
                  accessibilityRole="button"
                >
                  <Text style={[s.reportText, { color: colors.alert }]}>
                    {reportState === "sent" ? "✓ Flagged for review" : "🚫 This place is closed"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Attribution + sources */}
              {hasPlaces && <Text style={s.attribution}>Status, hours &amp; location powered by Google</Text>}
              <Text style={s.source}>
                Grades from NYC DOHMH · picks {venue.isGeneric ? "estimated from cuisine data (±15%)" : "from published nutrition data"}
              </Text>
              <View style={{ height: 28 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* "Log to which meal?" */}
      <Modal visible={logPick !== null} animationType="slide" transparent onRequestClose={() => setLogPick(null)}>
        <View style={s.backdrop}>
          <TouchableOpacity style={s.dismissArea} onPress={() => setLogPick(null)} activeOpacity={1} />
          <View style={s.mealSheet}>
            <View style={s.handle} />
            <Text style={s.mealTitle}>Log to which meal?</Text>
            {logPick && (
              <Text style={s.mealItem}>
                {logPick.name} · {logPick.calories} cal
              </Text>
            )}
            <View style={s.mealGrid}>
              {LOG_SLOTS.map((opt) => (
                <TouchableOpacity
                  key={opt.slot}
                  style={[s.mealOption, opt.slot === detectLogSlot() && s.mealOptionSuggested]}
                  onPress={() => logPick && logToSlot(logPick, opt.slot)}
                  accessibilityRole="button"
                  accessibilityLabel={`Log to ${opt.label}`}
                >
                  <Text style={s.mealIcon}>{opt.icon}</Text>
                  <Text style={[s.mealLabel, opt.slot === detectLogSlot() && { color: colors.accentSage }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.mealCancel} onPress={() => setLogPick(null)} accessibilityRole="button">
              <Text style={s.mealCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "86%",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 14 },

  name: { ...typography.title, color: colors.textPrimary, marginTop: 6 },
  meta: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_500Medium`, marginTop: 3 },
  address: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginTop: 4, lineHeight: 17 },
  directionsInline: { color: colors.accentSky, fontFamily: `${fonts.body}_600SemiBold` },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: 6 },
  livenessOk: { fontSize: 11, color: colors.good, fontFamily: `${fonts.body}_500Medium`, marginBottom: 4 },
  livenessNote: { fontSize: 11, color: colors.textMuted, fontFamily: `${fonts.body}_400Regular`, marginBottom: 4 },

  gatedBox: { backgroundColor: colors.alertBg, borderWidth: 1, borderColor: "rgba(176,80,63,0.25)", borderRadius: radius.sm, padding: 12, marginTop: 8 },
  gatedText: { fontSize: 12, color: colors.alert, fontFamily: `${fonts.body}_700Bold` },
  nysBox: { backgroundColor: colors.nysPurpleBg, borderWidth: 1, borderColor: "rgba(107,91,181,0.25)", borderRadius: radius.sm, padding: 12, marginTop: 8 },
  nysText: { fontSize: 12, color: colors.nysPurple, fontFamily: `${fonts.body}_400Regular`, lineHeight: 17 },
  estBox: { backgroundColor: colors.verifiedAmberBg, borderWidth: 1, borderColor: "#F0E3B5", borderRadius: radius.sm, padding: 12, marginTop: 8 },
  estBoxText: { fontSize: 12, color: colors.verifiedAmber, fontFamily: `${fonts.body}_400Regular`, lineHeight: 17 },
  tipBox: { backgroundColor: colors.accentSageBg, borderRadius: radius.sm, padding: 12, marginTop: 8 },
  tipText: { fontSize: 13, color: colors.accentSage, fontFamily: `${fonts.body}_400Regular`, lineHeight: 18 },
  bold: { fontFamily: `${fonts.body}_700Bold` },

  section: { marginTop: 16 },
  sectionTitle: { ...typography.section, color: colors.textPrimary, marginBottom: 8 },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 8,
    minHeight: 56,
  },
  pickRowTop: { borderColor: "rgba(47,143,77,0.4)" },
  scoreBubble: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  scoreText: { fontSize: 15, fontFamily: `${fonts.body}_800ExtraBold` },
  pickInfo: { flex: 1 },
  pickName: { fontSize: 14, color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },
  pickMacros: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginTop: 2 },
  overCal: { fontSize: 11, color: colors.caution, fontFamily: `${fonts.body}_500Medium`, marginTop: 1 },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSage,
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: { fontSize: 20, color: "#FFFFFF", fontFamily: `${fonts.body}_700Bold`, marginTop: -2 },
  bestDrink: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginTop: 8 },
  otherLoc: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginBottom: 4 },

  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionText: { fontSize: 14, color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },
  verifyBtn: {
    marginTop: 10,
    minHeight: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSage,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  verifyText: { fontSize: 14, color: "#FFFFFF", fontFamily: `${fonts.body}_700Bold` },
  verifySub: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontFamily: `${fonts.body}_400Regular`, marginTop: 2 },

  reportRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  reportBtn: { minHeight: 44, justifyContent: "center" },
  reportText: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_500Medium` },

  attribution: { fontSize: 10, color: colors.textMuted, fontFamily: `${fonts.body}_400Regular`, marginTop: 14 },
  source: { fontSize: 10, color: colors.textMuted, fontFamily: `${fonts.body}_400Regular`, marginTop: 4 },

  mealSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  mealTitle: { ...typography.section, color: colors.textPrimary, textAlign: "center", marginBottom: 4 },
  mealItem: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_400Regular`, textAlign: "center", marginBottom: 16 },
  mealGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  mealOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    minHeight: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mealOptionSuggested: { borderColor: colors.accentSage, backgroundColor: colors.accentSageBg },
  mealIcon: { fontSize: 20, marginBottom: 4 },
  mealLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: `${fonts.body}_600SemiBold` },
  mealCancel: { alignItems: "center", paddingVertical: 12, minHeight: 44 },
  mealCancelText: { fontSize: 14, color: colors.textTertiary, fontFamily: `${fonts.body}_500Medium` },
});

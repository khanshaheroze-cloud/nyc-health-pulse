import React, { useState, useMemo, useCallback } from "react";
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, Linking, Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, radius } from "../theme/tokens";
import { Badge } from "./ui/Badge";
import { ScoreBadge } from "./ScoreBadge";
import type { RestaurantMenu } from "../lib/core/smart-menu/types";
import { detectMealSlot } from "../lib/core/smart-menu/types";
import { selectTop5Picks, avgPulseScore, letterGrade, goalContext, TIER_LABELS, TIER_COLORS, type TopPick } from "../lib/core/smart-menu/topPicks";
import { getHealthyTip, getSwapEstimate, type HealthyTip } from "../lib/cuisineTips";

interface Restaurant {
  name: string;
  cuisine: string;
  grade: string | null;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  chainSlug: string | null;
  isHealthy: boolean;
}

const GRADE_INFO: Record<string, { bg: string; fg: string; label: string }> = {
  A: { bg: "#d1fae5", fg: "#059669", label: "Low health code violations — consistently clean inspections." },
  B: { bg: "#fef3c7", fg: "#d97706", label: "Moderate violations — corrective action was taken." },
  C: { bg: "#fecaca", fg: "#dc2626", label: "Higher violation score — may have repeat issues." },
};

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_OPTIONS: { slot: MealSlot; label: string; icon: string }[] = [
  { slot: "breakfast", label: "Breakfast", icon: "☀" },
  { slot: "lunch", label: "Lunch", icon: "🌤" },
  { slot: "dinner", label: "Dinner", icon: "🌙" },
  { slot: "snack", label: "Snack", icon: "🍎" },
];

function formatDist(meters: number): string {
  const blocks = Math.round(meters / 80);
  if (blocks <= 20) return `${blocks} blocks away`;
  return `${(meters / 1609).toFixed(1)} mi away`;
}

function formatMacros(item: TopPick): string {
  const parts = [`${item.calories} cal`];
  parts.push(`${item.protein}P`);
  if (item.carbs != null) parts.push(`${item.carbs}C`);
  if (item.fat != null) parts.push(`${item.fat}F`);
  return parts.join(" · ");
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function RestaurantDetailModal({
  restaurant,
  menu,
  visible,
  onClose,
  onLogged,
}: {
  restaurant: Restaurant | null;
  menu: RestaurantMenu | null;
  visible: boolean;
  onClose: () => void;
  onLogged?: () => void;
}) {
  const [mealSheet, setMealSheet] = useState<TopPick | null>(null);
  const [swapMealSheet, setSwapMealSheet] = useState<HealthyTip | null>(null);

  const topPicks = useMemo(() => (menu ? selectTop5Picks(menu) : []), [menu]);
  const avgScore = useMemo(() => (menu ? avgPulseScore(menu) : 0), [menu]);
  const healthyTip = useMemo(
    () => restaurant && !restaurant.chainSlug ? getHealthyTip(restaurant.cuisine, restaurant.name) : null,
    [restaurant],
  );

  const openDirections = () => {
    if (!restaurant) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}&travelmode=walking`;
    Linking.openURL(url);
  };

  const openWebMenu = () => {
    Linking.openURL("https://pulsenyc.app/eat-smart");
  };

  const logSwapToMeal = useCallback(async (tip: HealthyTip, slot: MealSlot) => {
    const est = getSwapEstimate(tip);
    const entry = {
      id: Date.now().toString(),
      name: tip.smartOrder,
      calories: est.calories,
      protein: est.protein,
      carbs: est.carbs,
      fat: est.fat,
      mealSlot: slot,
    };
    const key = `pulse-log-${todayKey()}`;
    try {
      const raw = await AsyncStorage.getItem(key);
      const existing = raw
        ? (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : p.entries ?? []; } catch { return []; } })()
        : [];
      existing.push(entry);
      await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch {}
    setSwapMealSheet(null);
    const slotLabel = MEAL_OPTIONS.find((m) => m.slot === slot)?.label ?? slot;
    Alert.alert("Logged!", `Added ${tip.smartOrder.slice(0, 40)}... to ${slotLabel} · ~${est.calories} cal`);
    onLogged?.();
  }, [onLogged]);

  const logToMeal = useCallback(async (item: TopPick, slot: MealSlot) => {
    const entry = {
      id: Date.now().toString(),
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs ?? 0,
      fat: item.fat ?? 0,
      mealSlot: slot,
    };
    const key = `pulse-log-${todayKey()}`;
    try {
      const raw = await AsyncStorage.getItem(key);
      const existing = raw
        ? (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : p.entries ?? []; } catch { return []; } })()
        : [];
      existing.push(entry);
      await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch {}
    setMealSheet(null);
    const slotLabel = MEAL_OPTIONS.find((m) => m.slot === slot)?.label ?? slot;
    Alert.alert("Logged!", `Added ${item.name} to ${slotLabel} · ${item.calories} cal`);
    onLogged?.();
  }, [onLogged]);

  if (!restaurant) return null;
  const g = restaurant.grade ? GRADE_INFO[restaurant.grade] : null;

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={s.backdrop}>
          <TouchableOpacity style={s.dismissArea} onPress={onClose} activeOpacity={1} />
          <View style={s.sheet}>
            <View style={s.handle} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* ── Header ── */}
              <View style={s.header}>
                <Text style={s.name}>{restaurant.name}</Text>
                <View style={s.metaRow}>
                  <Text style={s.cuisine}>{restaurant.cuisine}</Text>
                  <Text style={s.dot}> · </Text>
                  <Text style={s.distance}>{formatDist(restaurant.distance)}</Text>
                </View>
                <Text style={s.address}>{restaurant.address}</Text>
              </View>

              {/* ── Score pills row ── */}
              <View style={s.pillRow}>
                {/* DOHMH Sanitation */}
                {g && (
                  <View style={[s.pill, { backgroundColor: g.bg }]}>
                    <Text style={[s.pillTitle, { color: g.fg }]}>
                      DOHMH Sanitation: Grade {restaurant.grade}
                    </Text>
                    <Text style={[s.pillSub, { color: g.fg }]}>
                      {g.label.split("—")[0].trim()} — does not measure nutrition
                    </Text>
                  </View>
                )}

                {/* Avg PulseScore */}
                {avgScore > 0 && (
                  <View style={[s.pill, { backgroundColor: avgScore >= 70 ? "#d1fae5" : avgScore >= 50 ? "#fef3c7" : "#fee2e2" }]}>
                    <Text style={[s.pillTitle, { color: avgScore >= 70 ? "#065f46" : avgScore >= 50 ? "#92400e" : "#991b1b" }]}>
                      Avg PulseScore: {letterGrade(avgScore)}
                    </Text>
                    <Text style={[s.pillSub, { color: avgScore >= 70 ? "#065f46" : avgScore >= 50 ? "#92400e" : "#991b1b" }]}>
                      {goalContext(avgScore)}
                    </Text>
                  </View>
                )}
              </View>

              {/* ── Healthy Swap (non-chain restaurants) ── */}
              {healthyTip && (
                <View style={s.swapCard}>
                  <Text style={s.swapHeader}>🥗 Healthy Swap</Text>
                  <Text style={s.swapDefault}>{healthyTip.defaultOrder}</Text>
                  <Text style={s.swapArrow}>→ <Text style={s.swapSmart}>{healthyTip.smartOrder}</Text></Text>
                  <Text style={s.swapSavings}>{healthyTip.estimatedSavings}</Text>
                  <Text style={s.swapTip}>{healthyTip.tip}</Text>
                  <TouchableOpacity
                    style={s.swapLogBtn}
                    onPress={() => setSwapMealSheet(healthyTip)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.swapLogText}>+ I ate this</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Top 5 PulseScore Picks ── */}
              {topPicks.length > 0 && (
                <View style={s.picksSection}>
                  <Text style={s.picksTitle}>Top {topPicks.length} PulseScore Picks</Text>
                  {topPicks.map((pick) => (
                    <View key={pick.id} style={s.pickRow}>
                      <ScoreBadge score={pick.pulseScore} size={36} />
                      <View style={s.pickInfo}>
                        <View style={s.pickNameRow}>
                          <Text style={s.pickName} numberOfLines={1}>{pick.name}</Text>
                          {pick.tier && (
                            <View style={[s.tierBadge, { backgroundColor: TIER_COLORS[pick.tier].bg }]}>
                              <Text style={[s.tierText, { color: TIER_COLORS[pick.tier].fg }]}>
                                {TIER_LABELS[pick.tier]}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.pickMacros}>{formatMacros(pick)}</Text>
                        <Text style={s.pickWhy}>{pick.whyLine}</Text>
                      </View>
                      <TouchableOpacity
                        style={s.logBtn}
                        onPress={() => setMealSheet(pick)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.logBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Tags ── */}
              <View style={s.tagRow}>
                {restaurant.chainSlug && <Badge variant="smart" label="Chain — Menu Available" />}
                {restaurant.isHealthy && <Badge variant="fiber" label="Healthy Cuisine" />}
              </View>

              {/* ── See full menu link ── */}
              {menu && menu.items.length > 5 && (
                <TouchableOpacity style={s.seeFullBtn} onPress={openWebMenu} activeOpacity={0.7}>
                  <Text style={s.seeFullText}>
                    See Full Menu ({menu.items.filter((i) => !i.isDrink).length} items) →
                  </Text>
                </TouchableOpacity>
              )}

              {/* ── Actions ── */}
              <View style={s.actions}>
                <TouchableOpacity style={s.actionBtn} onPress={openDirections} activeOpacity={0.7}>
                  <Text style={s.actionEmoji}>🧭</Text>
                  <Text style={s.actionLabel}>Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnFilled]} onPress={onClose} activeOpacity={0.7}>
                  <Text style={s.actionEmoji}>✓</Text>
                  <Text style={[s.actionLabel, { color: "#fff" }]}>Done</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.source}>
                Nutrition data from USDA & brand sources · Inspections from NYC DOHMH
              </Text>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── "Log to which meal?" sheet (TopPick) ── */}
      <Modal
        visible={mealSheet !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setMealSheet(null)}
      >
        <View style={s.backdrop}>
          <TouchableOpacity style={s.dismissArea} onPress={() => setMealSheet(null)} activeOpacity={1} />
          <View style={s.mealSheet}>
            <View style={s.handle} />
            <Text style={s.mealSheetTitle}>Log to which meal?</Text>
            {mealSheet && (
              <Text style={s.mealSheetItem}>
                {mealSheet.name} · {mealSheet.calories} cal
              </Text>
            )}
            <View style={s.mealGrid}>
              {MEAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.slot}
                  style={[
                    s.mealOption,
                    opt.slot === detectMealSlot() && s.mealOptionSuggested,
                  ]}
                  onPress={() => mealSheet && logToMeal(mealSheet, opt.slot)}
                  activeOpacity={0.7}
                >
                  <Text style={s.mealOptionIcon}>{opt.icon}</Text>
                  <Text style={[
                    s.mealOptionLabel,
                    opt.slot === detectMealSlot() && s.mealOptionLabelSuggested,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={s.mealCancel}
              onPress={() => setMealSheet(null)}
              activeOpacity={0.7}
            >
              <Text style={s.mealCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── "Log swap to which meal?" sheet ── */}
      <Modal
        visible={swapMealSheet !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSwapMealSheet(null)}
      >
        <View style={s.backdrop}>
          <TouchableOpacity style={s.dismissArea} onPress={() => setSwapMealSheet(null)} activeOpacity={1} />
          <View style={s.mealSheet}>
            <View style={s.handle} />
            <Text style={s.mealSheetTitle}>Log to which meal?</Text>
            {swapMealSheet && (
              <Text style={s.mealSheetItem} numberOfLines={2}>
                {swapMealSheet.smartOrder} · ~{getSwapEstimate(swapMealSheet).calories} cal
              </Text>
            )}
            <View style={s.mealGrid}>
              {MEAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.slot}
                  style={[
                    s.mealOption,
                    opt.slot === detectMealSlot() && s.mealOptionSuggested,
                  ]}
                  onPress={() => swapMealSheet && logSwapToMeal(swapMealSheet, opt.slot)}
                  activeOpacity={0.7}
                >
                  <Text style={s.mealOptionIcon}>{opt.icon}</Text>
                  <Text style={[
                    s.mealOptionLabel,
                    opt.slot === detectMealSlot() && s.mealOptionLabelSuggested,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={s.mealCancel}
              onPress={() => setSwapMealSheet(null)}
              activeOpacity={0.7}
            >
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
    backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "82%", paddingHorizontal: 20, paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderLight,
    alignSelf: "center", marginBottom: 16,
  },

  /* Header */
  header: { marginBottom: 14 },
  name: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, fontFamily: `${fonts.display}_400Regular` },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cuisine: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_500Medium` },
  dot: { fontSize: 13, color: colors.textTertiary },
  distance: { fontSize: 13, color: colors.accentSage, fontWeight: "600", fontFamily: `${fonts.body}_600SemiBold` },
  address: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginTop: 4 },

  /* Score pills */
  pillRow: { gap: 8, marginBottom: 16 },
  pill: { borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 14 },
  pillTitle: { fontSize: 13, fontWeight: "700", fontFamily: `${fonts.body}_700Bold` },
  pillSub: { fontSize: 11, fontFamily: `${fonts.body}_400Regular`, marginTop: 2, opacity: 0.85 },

  /* Top picks */
  picksSection: { marginBottom: 16 },
  picksTitle: {
    fontSize: 14, fontWeight: "700", color: colors.textPrimary,
    fontFamily: `${fonts.body}_700Bold`, marginBottom: 10,
  },
  pickRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.sm, padding: 12, marginBottom: 8,
  },
  pickInfo: { flex: 1 },
  pickNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  pickName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },
  tierBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tierText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.3 },
  pickMacros: { fontSize: 11, color: colors.accentSage, fontFamily: `${fonts.body}_500Medium`, marginTop: 2 },
  pickWhy: { fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginTop: 1 },

  logBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.accentSage, alignItems: "center", justifyContent: "center",
  },
  logBtnText: { fontSize: 20, fontWeight: "700", color: "#fff", marginTop: -1 },

  /* Tags */
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },

  /* See full */
  seeFullBtn: { marginBottom: 16 },
  seeFullText: { fontSize: 13, color: colors.accentSage, fontWeight: "600", fontFamily: `${fonts.body}_600SemiBold` },

  /* Actions */
  actions: { flexDirection: "row", gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 14, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface,
  },
  actionBtnFilled: { backgroundColor: colors.accentSage, borderColor: colors.accentSage },
  actionEmoji: { fontSize: 16 },
  actionLabel: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },

  /* Healthy Swap card */
  swapCard: {
    backgroundColor: colors.surfaceSage,
    borderRadius: radius.sm,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(74,124,89,0.2)",
  },
  swapHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_700Bold`,
    marginBottom: 10,
  },
  swapDefault: {
    fontSize: 13,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    textDecorationLine: "line-through" as const,
    marginBottom: 6,
  },
  swapArrow: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    marginBottom: 8,
    lineHeight: 20,
  },
  swapSmart: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontFamily: `${fonts.body}_600SemiBold`,
  },
  swapSavings: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_700Bold`,
    marginBottom: 8,
  },
  swapTip: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    lineHeight: 16,
    marginBottom: 12,
  },
  swapLogBtn: {
    backgroundColor: colors.accentSage,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: "center" as const,
  },
  swapLogText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: `${fonts.body}_700Bold`,
  },

  source: { fontSize: 10, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, textAlign: "center" },

  /* ── Meal picker sheet ── */
  mealSheet: {
    backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34,
  },
  mealSheetTitle: {
    fontSize: 18, fontWeight: "700", color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`, textAlign: "center", marginBottom: 4,
  },
  mealSheetItem: {
    fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_400Regular`,
    textAlign: "center", marginBottom: 18,
  },
  mealGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  mealOption: {
    flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface,
  },
  mealOptionSuggested: {
    borderColor: colors.accentSage, backgroundColor: colors.accentSageBg,
  },
  mealOptionIcon: { fontSize: 22, marginBottom: 4 },
  mealOptionLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, fontFamily: `${fonts.body}_600SemiBold` },
  mealOptionLabelSuggested: { color: colors.accentSage },
  mealCancel: { alignItems: "center", paddingVertical: 10 },
  mealCancelText: { fontSize: 14, color: colors.textTertiary, fontFamily: `${fonts.body}_500Medium` },
});

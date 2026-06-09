import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Alert,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, radius } from "../theme/tokens";
import { getUserLocation, NYC_DEFAULT } from "../lib/location";
import { getBundledNearby } from "../lib/bundledRestaurants";
import { detectChainSlug } from "../lib/nearbyRestaurants";
import {
  getHealthyTip, getSwapEstimate, getPreferredCuisines,
  type HealthyTip,
} from "../lib/cuisineTips";
import { detectMealSlot } from "../lib/core/smart-menu/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = 12;

interface NearbyRestaurant {
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

interface SwapCard {
  restaurant: NearbyRestaurant;
  tip: HealthyTip;
}

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_OPTIONS: { slot: MealSlot; label: string; icon: string }[] = [
  { slot: "breakfast", label: "Breakfast", icon: "☀" },
  { slot: "lunch", label: "Lunch", icon: "🌤" },
  { slot: "dinner", label: "Dinner", icon: "🌙" },
  { slot: "snack", label: "Snack", icon: "🍎" },
];

function formatDist(m: number): string {
  const blocks = Math.round(m / 80);
  return blocks <= 20 ? `${blocks} blks` : `${(m / 1609).toFixed(1)} mi`;
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function mealWindowLabel(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return "Breakfast spots";
  if (h >= 10 && h < 15) return "Lunch spots";
  if (h >= 17 && h < 21) return "Dinner spots";
  return "Nearby spots";
}

export function HealthySwapCarousel() {
  const [cards, setCards] = useState<SwapCard[]>([]);
  const [mealSheet, setMealSheet] = useState<HealthyTip | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loc = (await getUserLocation()) ?? NYC_DEFAULT;
        if (cancelled) return;

        const bundled = getBundledNearby(loc.lat, loc.lng, 2500, 50);
        if (cancelled) return;
        const restaurants: NearbyRestaurant[] = bundled.map((r) => ({
          name: r.name,
          cuisine: r.cuisine,
          grade: r.grade,
          address: r.address,
          lat: r.lat,
          lng: r.lng,
          distance: r.distance,
          chainSlug: r.chainSlug ?? detectChainSlug(r.name),
          isHealthy: false,
        }));

        const preferred = getPreferredCuisines();
        const results: SwapCard[] = [];

        for (const r of restaurants) {
          if (r.chainSlug) continue;
          const tip = getHealthyTip(r.cuisine, r.name);
          if (!tip) continue;
          results.push({ restaurant: r, tip });
        }

        if (preferred.length > 0) {
          results.sort((a, b) => {
            const aPreferred = preferred.includes(a.tip.category) ? 0 : 1;
            const bPreferred = preferred.includes(b.tip.category) ? 0 : 1;
            if (aPreferred !== bPreferred) return aPreferred - bPreferred;
            return a.restaurant.distance - b.restaurant.distance;
          });
        }

        if (!cancelled) setCards(results.slice(0, 5));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

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
    setMealSheet(null);
    const slotLabel = MEAL_OPTIONS.find((m) => m.slot === slot)?.label ?? slot;
    Alert.alert("Logged!", `Added to ${slotLabel} · ~${est.calories} cal`);
  }, []);

  if (cards.length === 0) return null;

  const renderCard = ({ item }: { item: SwapCard }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.restaurantName} numberOfLines={1}>{item.restaurant.name}</Text>
          <Text style={s.distText}>
            {item.restaurant.cuisine} · {formatDist(item.restaurant.distance)}
          </Text>
        </View>
        {item.restaurant.grade && (
          <View style={[
            s.gradeBadge,
            { backgroundColor: item.restaurant.grade === "A" ? "#d1fae5" : item.restaurant.grade === "B" ? "#fef3c7" : "#fecaca" },
          ]}>
            <Text style={[
              s.gradeText,
              { color: item.restaurant.grade === "A" ? "#059669" : item.restaurant.grade === "B" ? "#d97706" : "#dc2626" },
            ]}>
              {item.restaurant.grade}
            </Text>
          </View>
        )}
      </View>

      <View style={s.divider} />

      <View style={s.swapBadgeRow}>
        <View style={s.swapBadge}>
          <Text style={s.swapBadgeText}>HEALTHY SWAP</Text>
        </View>
      </View>

      <Text style={s.defaultOrder} numberOfLines={1}>{item.tip.defaultOrder}</Text>
      <Text style={s.smartOrder} numberOfLines={2}>→ {item.tip.smartOrder}</Text>

      <View style={s.savingsRow}>
        <View style={s.savingsPill}>
          <Text style={s.savingsText}>{item.tip.estimatedSavings}</Text>
        </View>
        <TouchableOpacity
          style={s.ateThisBtn}
          onPress={() => setMealSheet(item.tip)}
          activeOpacity={0.7}
        >
          <Text style={s.ateThisText}>+ I ate this</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.sectionTitle}>Healthy Swaps Nearby</Text>
          <Text style={s.sectionSub}>{mealWindowLabel()} · Order smarter</Text>
        </View>
      </View>

      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => `${item.restaurant.name}-${item.tip.category}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={s.listContent}
      />

      <Modal
        visible={mealSheet !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setMealSheet(null)}
      >
        <View style={s.backdrop}>
          <TouchableOpacity style={s.dismissArea} onPress={() => setMealSheet(null)} activeOpacity={1} />
          <View style={s.mealSheetContainer}>
            <View style={s.handle} />
            <Text style={s.mealSheetTitle}>Log to which meal?</Text>
            {mealSheet && (
              <Text style={s.mealSheetItem} numberOfLines={2}>
                {mealSheet.smartOrder} · ~{getSwapEstimate(mealSheet).calories} cal
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
                  onPress={() => mealSheet && logSwapToMeal(mealSheet, opt.slot)}
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 8 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
  },

  listContent: {
    paddingRight: 20,
    gap: CARD_GAP,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_700Bold`,
  },
  distText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 2,
  },
  gradeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: `${fonts.body}_700Bold`,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },

  swapBadgeRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  swapBadge: {
    backgroundColor: colors.accentSageBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  swapBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.accentSage,
    letterSpacing: 0.5,
  },

  defaultOrder: {
    fontSize: 12,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  smartOrder: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
    fontFamily: `${fonts.body}_600SemiBold`,
    lineHeight: 18,
    marginBottom: 8,
  },

  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savingsPill: {
    backgroundColor: colors.accentSageBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_700Bold`,
  },
  ateThisBtn: {
    backgroundColor: colors.accentSage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ateThisText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: `${fonts.body}_700Bold`,
  },

  /* Meal picker */
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  dismissArea: { flex: 1 },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderLight,
    alignSelf: "center", marginBottom: 16,
  },
  mealSheetContainer: {
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

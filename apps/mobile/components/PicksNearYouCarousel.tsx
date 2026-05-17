import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInRight } from "react-native-reanimated";
import { colors, fonts, radius } from "../theme/tokens";
import { ScoreBadge } from "./ScoreBadge";
import { SkeletonShimmer } from "./ui/SkeletonShimmer";
import { getMenuForRestaurant } from "../lib/core/smart-menu/menuResolver";
import { getTopPicks, letterGrade } from "../lib/core/smart-menu/topPicks";
import { getUserLocation, NYC_DEFAULT } from "../lib/location";
import type { RestaurantMenu } from "../lib/core/smart-menu/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = 12;

type MealWindow = "breakfast" | "lunch" | "snack" | "dinner" | "late-night";

function currentMealWindow(): MealWindow {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const t = h * 60 + m;
  if (t >= 300 && t < 600) return "breakfast";
  if (t >= 600 && t < 870) return "lunch";
  if (t >= 870 && t < 1020) return "snack";
  if (t >= 1020 && t < 1260) return "dinner";
  return "late-night";
}

function mealLabel(w: MealWindow): string {
  return { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner", "late-night": "Late Night" }[w];
}

function formatDist(m: number): string {
  const blocks = Math.round(m / 80);
  return blocks <= 20 ? `${blocks} blks` : `${(m / 1609).toFixed(1)} mi`;
}

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

interface PickCard {
  restaurant: NearbyRestaurant;
  menu: RestaurantMenu;
  topItem: { name: string; pulseScore: number; calories: number; protein: number; whyLine: string };
  avgScore: number;
}

interface Props {
  onRestaurantPress?: (r: NearbyRestaurant) => void;
}

export function PicksNearYouCarousel({ onRestaurantPress }: Props) {
  const [picks, setPicks] = useState<PickCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealWindow] = useState<MealWindow>(currentMealWindow);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loc = (await getUserLocation()) ?? NYC_DEFAULT;
        if (cancelled) return;

        const res = await fetch(
          `https://pulsenyc.app/api/nearby-food?lat=${loc.lat}&lng=${loc.lng}&radius=1200`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const restaurants: NearbyRestaurant[] = (data.results ?? []).slice(0, 30);

        const cards: PickCard[] = [];
        for (const r of restaurants) {
          const menu = getMenuForRestaurant(r.chainSlug, r.cuisine, r.name);
          if (!menu) continue;
          const topPicks = getTopPicks(menu, 1);
          if (topPicks.length === 0) continue;
          const top = topPicks[0];
          const scoreable = menu.items.filter((i) => i.pulseScore > 0);
          const avg = scoreable.length > 0
            ? Math.round(scoreable.reduce((s, i) => s + i.pulseScore, 0) / scoreable.length)
            : 0;
          cards.push({
            restaurant: r,
            menu,
            topItem: {
              name: top.name,
              pulseScore: top.pulseScore,
              calories: top.calories,
              protein: top.protein,
              whyLine: top.whyLine,
            },
            avgScore: avg,
          });
        }

        cards.sort((a, b) => b.topItem.pulseScore - a.topItem.pulseScore);
        if (!cancelled) setPicks(cards.slice(0, 8));
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.sectionTitle}>Picks Near You</Text>
            <Text style={s.sectionSub}>{mealLabel(mealWindow)} · Loading...</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: CARD_GAP }}>
          {[0, 1].map((i) => (
            <View key={i} style={[s.card, { width: CARD_WIDTH }]}>
              <SkeletonShimmer width="70%" height={16} style={{ marginBottom: 10 }} />
              <SkeletonShimmer width="50%" height={12} style={{ marginBottom: 14 }} />
              <SkeletonShimmer width="100%" height={1} style={{ marginBottom: 10 }} />
              <SkeletonShimmer width="85%" height={14} style={{ marginBottom: 6 }} />
              <SkeletonShimmer width="60%" height={11} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (picks.length === 0) return null;

  const renderCard = ({ item, index }: { item: PickCard; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 80).duration(400)}>
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.8}
      onPress={() => { Haptics.selectionAsync(); onRestaurantPress?.(item.restaurant); }}
    >
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.restaurantName} numberOfLines={1}>{item.restaurant.name}</Text>
          <Text style={s.distText}>{item.restaurant.cuisine} · {formatDist(item.restaurant.distance)}</Text>
        </View>
        <ScoreBadge score={item.topItem.pulseScore} size={36} />
      </View>

      <View style={s.divider} />

      <View style={s.pickRow}>
        <View style={s.bestBadge}>
          <Text style={s.bestBadgeText}>BEST PICK</Text>
        </View>
        <Text style={s.pickName} numberOfLines={1}>{item.topItem.name}</Text>
      </View>

      <Text style={s.whyLine} numberOfLines={1}>{item.topItem.whyLine}</Text>

      <View style={s.macrosRow}>
        <View style={s.macroPill}>
          <Text style={s.macroPillText}>{item.topItem.calories} cal</Text>
        </View>
        <View style={s.macroPill}>
          <Text style={s.macroPillText}>{item.topItem.protein}g protein</Text>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.sectionTitle}>Picks Near You</Text>
          <Text style={s.sectionSub}>{mealLabel(mealWindow)} · Top PulseScore picks</Text>
        </View>
      </View>

      <FlatList
        data={picks}
        renderItem={renderCard}
        keyExtractor={(item, index) => `${item.restaurant.name}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={s.listContent}
      />
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

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },

  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  bestBadge: {
    backgroundColor: colors.accentSageBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: colors.accentSage,
    letterSpacing: 0.5,
  },
  pickName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`,
    flex: 1,
  },

  whyLine: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    marginBottom: 10,
  },

  macrosRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  macroPill: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  macroPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },
  gradePill: {
    backgroundColor: colors.accentSageBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_600SemiBold`,
  },
});

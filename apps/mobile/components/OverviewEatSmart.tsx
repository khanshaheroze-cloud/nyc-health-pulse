import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, radius } from "../theme/tokens";
import { EatSmartMap } from "./EatSmartMap";
import { RestaurantDetailModal } from "./RestaurantDetailModal";
import { Card } from "./ui/Card";
import { SectionLabel } from "./ui/SectionLabel";
import { getMenuForRestaurant } from "../lib/core/smart-menu/menuResolver";
import { getUserLocation, NYC_DEFAULT } from "../lib/location";
import { getBundledNearby } from "../lib/bundledRestaurants";
import { detectChainSlug } from "../lib/nearbyRestaurants";

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

type MealTab = "breakfast" | "lunch" | "dinner" | "coffee";

const TABS: { id: MealTab; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "🍳" },
  { id: "lunch", label: "Lunch", emoji: "🥗" },
  { id: "dinner", label: "Dinner", emoji: "🍽️" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
];

function detectMealTab(): MealTab {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 17) return "coffee";
  return "dinner";
}

const BREAKFAST_CUISINES = ["bakery", "cafe", "coffee", "donuts", "bagels/pretzels", "delicatessen", "pancakes/waffles"];
const COFFEE_CUISINES = ["cafe", "coffee", "donuts", "juice, smoothies, fruit salads"];
const GRADE_COLORS: Record<string, { bg: string; fg: string }> = {
  A: { bg: "#d1fae5", fg: "#059669" },
  B: { bg: "#fef3c7", fg: "#d97706" },
  C: { bg: "#fecaca", fg: "#dc2626" },
};

function filterByMeal(restaurants: Restaurant[], tab: MealTab): Restaurant[] {
  const all = restaurants.filter((r) => r.lat && r.lng);
  if (tab === "breakfast") {
    const bfast = all.filter((r) => BREAKFAST_CUISINES.some((c) => r.cuisine.toLowerCase().includes(c)));
    return bfast.length >= 3 ? bfast : all;
  }
  if (tab === "coffee") {
    const coffees = all.filter((r) => COFFEE_CUISINES.some((c) => r.cuisine.toLowerCase().includes(c)));
    return coffees.length >= 3 ? coffees : all;
  }
  return all.filter((r) => !COFFEE_CUISINES.some((c) => r.cuisine.toLowerCase().includes(c)) || all.length < 5);
}

function formatDist(m: number): string {
  const blocks = Math.round(m / 80);
  return blocks <= 20 ? `${blocks} blks` : `${(m / 1609).toFixed(1)} mi`;
}

export function OverviewEatSmart() {
  const router = useRouter();
  const [tab, setTab] = useState<MealTab>(detectMealTab);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState(NYC_DEFAULT.lat);
  const [userLng, setUserLng] = useState(NYC_DEFAULT.lng);
  const [detail, setDetail] = useState<Restaurant | null>(null);

  const fetchNearby = useCallback((lat: number, lng: number) => {
    console.log("[OverviewEatSmart] loading bundled nearby", { lat, lng });
    const bundled = getBundledNearby(lat, lng, 2500, 30);
    console.log("[OverviewEatSmart] bundled count:", bundled.length);
    if (bundled.length > 0) {
      setRestaurants(bundled.map((r) => ({
        name: r.name,
        cuisine: r.cuisine,
        grade: r.grade,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        distance: r.distance,
        chainSlug: r.chainSlug ?? detectChainSlug(r.name),
        isHealthy: false,
      })));
    }
  }, []);

  useEffect(() => {
    // Load bundled data immediately (sync)
    fetchNearby(userLat, userLng);
    setLoading(false);

    // Then try to get real GPS coords for better sorting
    (async () => {
      try {
        const loc = await getUserLocation();
        if (loc) {
          setUserLat(loc.lat);
          setUserLng(loc.lng);
          fetchNearby(loc.lat, loc.lng);
        }
      } catch (e) {
        console.warn("[OverviewEatSmart] GPS error:", e);
      }
    })();

  }, []);

  const filtered = filterByMeal(restaurants, tab);
  const topThree = filtered.slice(0, 3);

  if (loading) {
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <ActivityIndicator color={colors.accentSage} />
      </View>
    );
  }

  return (
    <View>
      <SectionLabel icon="🍽">EAT SMART</SectionLabel>

      {restaurants.length === 0 && !loading && (
        <Card style={{ marginBottom: 8 }}>
          <Text style={styles.emptyText}>
            No restaurants found nearby. Pull down to refresh.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={async () => {
              setLoading(true);
              const loc = await getUserLocation();
              const coords = loc ?? NYC_DEFAULT;
              await fetchNearby(coords.lat, coords.lng);
              setLoading(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </Card>
      )}

      {restaurants.length > 0 && (
        <>
          {/* Map — lazy-loaded after content */}
          <EatSmartMap
            userLat={userLat}
            userLng={userLng}
            picks={filtered.slice(0, 15).map((r) => ({
              name: r.name, item: r.cuisine, cal: 0,
              lat: r.lat, lng: r.lng, chainSlug: r.chainSlug,
            }))}
            delay={1200}
          />

          {/* Meal tabs */}
          <View style={styles.tabBar}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tab, tab === t.id && styles.tabActive]}
                onPress={() => setTab(t.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.tabEmoji}>{t.emoji}</Text>
                <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Top 3 cards */}
          {topThree.map((r, i) => (
            <TouchableOpacity key={`${r.name}-${i}`} activeOpacity={0.7} onPress={() => setDetail(r)}>
              <Card style={{ marginBottom: 8 }}>
                <View style={styles.cardRow}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
                      {r.grade && GRADE_COLORS[r.grade] && (
                        <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[r.grade].bg }]}>
                          <Text style={[styles.gradeText, { color: GRADE_COLORS[r.grade].fg }]}>{r.grade}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {r.cuisine} · {formatDist(r.distance)}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}

          {/* See all */}
          <TouchableOpacity
            style={styles.seeAll}
            onPress={() => router.push("/eat-smart" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See all {restaurants.length} restaurants →</Text>
          </TouchableOpacity>
        </>
      )}

      <RestaurantDetailModal
        restaurant={detail}
        menu={detail ? getMenuForRestaurant(detail.chainSlug, detail.cuisine, detail.name) : null}
        visible={!!detail}
        onClose={() => setDetail(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row", backgroundColor: colors.surfaceWarm,
    borderRadius: 12, padding: 4, marginBottom: 14,
  },
  tab: {
    flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 10,
    flexDirection: "row", justifyContent: "center", gap: 4,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 11, fontWeight: "600", color: colors.textTertiary, fontFamily: `${fonts.body}_600SemiBold` },
  tabLabelActive: { color: colors.textPrimary },

  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankCircle: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceWarm,
    alignItems: "center", justifyContent: "center",
  },
  rankText: { fontSize: 12, fontWeight: "700", color: colors.accentSage, fontFamily: `${fonts.body}_700Bold` },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, fontFamily: `${fonts.body}_700Bold`, flexShrink: 1 },
  cardMeta: { fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginTop: 2 },
  gradeBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  gradeText: { fontSize: 10, fontWeight: "700" },

  seeAll: { alignItems: "center", paddingVertical: 10, marginBottom: 4 },
  seeAllText: { fontSize: 13, fontWeight: "600", color: colors.accentSage, fontFamily: `${fonts.body}_600SemiBold` },

  emptyText: { fontSize: 13, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, textAlign: "center" },
  retryBtn: { alignSelf: "center", marginTop: 10, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.accentSage },
  retryText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF", fontFamily: `${fonts.body}_600SemiBold` },
});

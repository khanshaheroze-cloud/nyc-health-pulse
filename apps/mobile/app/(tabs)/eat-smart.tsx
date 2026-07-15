/* ── Eat Smart — full parity with the frozen web product (July 14 2026) ──────
 * Renders SERVER intelligence via useNearMe: ranked five (under-$15 anchor) →
 * "Worth a splurge · over $15" → "Nearby · ordering guidance only". Sort +
 * filter chips re-order/subset the fetched set client-side (idempotent, no
 * refetch, no accumulation — web round-6 semantics). Keys are restaurantId,
 * always. Excluded venues render dimmed on the map with their livenessLabel.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, typography } from "../../theme/tokens";
import { IconCamera, IconFileText } from "../../components/ui/Icons";
import { Card } from "../../components/ui/Card";
import { SkeletonCard } from "../../components/ui/SkeletonShimmer";
import { RestaurantsMap } from "../../components/eat-smart/RestaurantsMap";
import { VenueCard } from "../../components/eat-smart/VenueCard";
import { VenueSheet } from "../../components/eat-smart/VenueSheet";
import { useNearMe } from "../../lib/useNearMe";
import { sectionResults, hasPlacesData, SORT_OPTIONS, type FilterChip, type SortKey } from "../../lib/results";
import { detectMealParam, mealLabel, MEAL_OPTIONS } from "../../lib/daypart";
import { readRemainingMacros, type RemainingMacros } from "../../lib/fitsYourDay";
import { resetLocationCache } from "../../lib/location";
import { appendLogEntry } from "../../lib/foodLog";
import { detectLogSlot } from "../../lib/daypart";
import type { ApiRestaurant, MealParam } from "../../lib/types";

const FILTER_CHIPS: { id: FilterChip; label: string }[] = [
  { id: "high-protein", label: "High protein" },
  { id: "under-15", label: "Under $15" },
  { id: "quick", label: "Quick (<5 min)" },
  { id: "open-now", label: "Open now" },
];

export default function EatSmartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [meal, setMeal] = useState<MealParam>(() => detectMealParam());
  const { status, data, offline, offlineCellLabel, origin, refresh, errorMessage } = useNearMe(meal);

  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [chips, setChips] = useState<Set<FilterChip>>(() => new Set<FilterChip>(["high-protein"]));
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVenue, setSheetVenue] = useState<ApiRestaurant | null>(null);
  const [remaining, setRemaining] = useState<RemainingMacros | null>(null);

  useEffect(() => {
    readRemainingMacros().then(setRemaining).catch(() => setRemaining(null));
  }, [data]);

  const sections = useMemo(
    () => sectionResults(data?.restaurants ?? [], { sort: sortKey, chips }),
    [data, sortKey, chips],
  );
  const excluded = data?.excluded ?? [];
  const showAttribution = data ? hasPlacesData(sections, excluded) : false;

  const toggleChip = useCallback((id: FilterChip) => {
    Haptics.selectionAsync();
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 800);
  }, [refresh]);

  const updateLocation = useCallback(() => {
    Haptics.selectionAsync();
    resetLocationCache();
    refresh();
  }, [refresh]);

  const openSheet = useCallback((venue: ApiRestaurant) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetVenue(venue);
  }, []);

  const quickLog = useCallback(async (venue: ApiRestaurant) => {
    const pick = venue.topPicks[0];
    if (!pick) return;
    await appendLogEntry({
      name: `${venue.restaurantName} — ${pick.name}`,
      calories: pick.calories,
      protein: pick.protein,
      carbs: pick.carbs ?? 0,
      fat: pick.fat ?? 0,
      mealSlot: detectLogSlot(),
      source: "venue-pick",
      restaurantId: venue.restaurantId,
      restaurantName: venue.restaurantName,
      pulseScore: pick.pulseScore,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    readRemainingMacros().then(setRemaining).catch(() => {});
  }, []);

  // Map pins: ranked + splurge score bubbles, excluded dimmed + labeled.
  const mapPins = useMemo(() => {
    const ranked = [...sections.ranked, ...sections.splurge].map((r) => ({
      id: r.restaurantId,
      lat: r.lat,
      lng: r.lng,
      score: r.topPicks[0]?.pulseScore ?? 0,
      name: r.restaurantName,
    }));
    const gated = excluded.map((r) => ({
      id: r.restaurantId,
      lat: r.lat,
      lng: r.lng,
      score: 0,
      name: r.restaurantName,
      dimmed: true,
      label: r.livenessLabel ?? "Not ranked",
    }));
    return [...ranked, ...gated];
  }, [sections, excluded]);

  const onPinPress = useCallback(
    (pin: { id: string }) => {
      const all = [...(data?.restaurants ?? []), ...excluded];
      const venue = all.find((r) => r.restaurantId === pin.id);
      if (venue) openSheet(venue);
    },
    [data, excluded, openSheet],
  );

  const headline =
    sections.ranked.length > 0
      ? `${sections.ranked.length} ${mealLabel(meal).toLowerCase()} spot${sections.ranked.length === 1 ? "" : "s"} near you`
      : "Spots near you";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentSage} />}
    >
      <Text style={styles.pageTitle}>Eat Smart</Text>

      {/* Meal selector — the web's "When" control */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealRow} contentContainerStyle={{ gap: 8 }}>
        {MEAL_OPTIONS.map((opt) => {
          const active = meal === opt.meal;
          return (
            <TouchableOpacity
              key={opt.meal}
              onPress={() => {
                Haptics.selectionAsync();
                setMeal(opt.meal);
              }}
              style={[styles.mealChip, active && styles.mealChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Show ${mealLabel(opt.meal)} picks`}
            >
              <Text style={[styles.mealChipText, active && styles.mealChipTextActive]}>
                {opt.icon} {mealLabel(opt.meal)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Offline banner — honest about what's being shown */}
      {offline && (
        <View style={styles.offlineBanner} accessibilityRole="alert">
          <Text style={styles.offlineText}>
            Offline — showing saved results{offlineCellLabel ? ` near ${offlineCellLabel}` : ""}
          </Text>
        </View>
      )}

      {/* Origin transparency (web parity) */}
      {origin && status === "ready" && (
        <Text style={styles.originLine}>
          Near <Text style={styles.originLabel}>{origin.label}</Text>
          {" · wrong? "}
          <Text style={styles.originUpdate} onPress={updateLocation} accessibilityRole="button">
            Update location
          </Text>
        </Text>
      )}

      {/* Map */}
      {status === "ready" && mapPins.length > 0 && (
        <>
          <Card style={{ padding: 0, overflow: "hidden", marginBottom: 4, height: 190 }}>
            <RestaurantsMap
              userLat={origin?.lat ?? 40.744}
              userLng={origin?.lng ?? -73.9485}
              pins={mapPins}
              onPinPress={onPinPress}
            />
          </Card>
          {showAttribution && <Text style={styles.attribution}>Hours &amp; status via Google</Text>}
        </>
      )}

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {SORT_OPTIONS.map((o) => {
            const active = sortKey === o.key;
            return (
              <TouchableOpacity
                key={o.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSortKey(o.key);
                }}
                style={[styles.sortChip, active && styles.sortChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTER_CHIPS.map((f) => {
          const active = chips.has(f.id);
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => toggleChip(f.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {active ? "✓ " : ""}
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loading skeletons — never an infinite spinner */}
      {status === "loading" && (
        <View style={{ gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      )}

      {/* Error + retry (12s budget upstream) */}
      {status === "error" && (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>Couldn't load spots{errorMessage ? ` — ${errorMessage}` : ""}.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh} accessibilityRole="button">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ranked five */}
      {status === "ready" && (
        <>
          <Text style={styles.headline}>{headline}</Text>
          {sections.ranked.length === 0 && (
            <Card>
              <Text style={styles.emptyText}>
                No {mealLabel(meal).toLowerCase()} picks match these filters within a 10-minute walk. Try clearing a
                filter.
              </Text>
            </Card>
          )}
          {sections.ranked.map((venue) => (
            <VenueCard
              key={venue.restaurantId}
              venue={venue}
              onPress={openSheet}
              onLog={quickLog}
              fitsCalLeft={remaining?.calLeft ?? null}
            />
          ))}

          {/* Worth a splurge */}
          {sections.splurge.length > 0 && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>WORTH A SPLURGE · OVER $15</Text>
                <View style={styles.dividerLine} />
              </View>
              {sections.splurge.map((venue) => (
                <VenueCard
                  key={venue.restaurantId}
                  venue={venue}
                  onPress={openSheet}
                  onLog={quickLog}
                  fitsCalLeft={remaining?.calLeft ?? null}
                />
              ))}
            </>
          )}

          {/* Guidance only */}
          {sections.guidance.length > 0 && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>NEARBY · ORDERING GUIDANCE ONLY</Text>
                <View style={styles.dividerLine} />
              </View>
              {sections.guidance.map((venue) => (
                <VenueCard key={venue.restaurantId} venue={venue} onPress={openSheet} />
              ))}
            </>
          )}

          {showAttribution && (
            <Text style={styles.attributionFooter}>Venue status, hours &amp; locations powered by Google</Text>
          )}
        </>
      )}

      {/* Fallback tools */}
      <Text style={styles.cantFind}>Can't find it?</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/scan")} accessibilityRole="button" accessibilityLabel="Scan a barcode">
          <IconCamera size={18} color={colors.accentSage} />
          <Text style={styles.actionLabel}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/ocr")} accessibilityRole="button" accessibilityLabel="Read a menu with the camera">
          <IconFileText size={18} color={colors.accentSage} />
          <Text style={styles.actionLabel}>Read Menu</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: tabBarHeight + 40 }} />

      <VenueSheet venue={sheetVenue} visible={sheetVenue !== null} onClose={() => setSheetVenue(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  pageTitle: { ...typography.hero, color: colors.textPrimary, marginBottom: 10 },

  mealRow: { marginBottom: 10, flexGrow: 0 },
  mealChip: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceWarm,
    minHeight: 36,
    justifyContent: "center",
  },
  mealChipActive: { backgroundColor: colors.textPrimary },
  mealChipText: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_600SemiBold` },
  mealChipTextActive: { color: "#FFFFFF" },

  offlineBanner: {
    backgroundColor: colors.verifiedAmberBg,
    borderWidth: 1,
    borderColor: "#F0E3B5",
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 10,
  },
  offlineText: { fontSize: 12, color: colors.verifiedAmber, fontFamily: `${fonts.body}_600SemiBold` },

  originLine: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginBottom: 10 },
  originLabel: { color: colors.textPrimary, fontFamily: `${fonts.body}_700Bold` },
  originUpdate: { color: colors.accentSky, fontFamily: `${fonts.body}_600SemiBold` },

  attribution: { fontSize: 10, color: colors.textMuted, fontFamily: `${fonts.body}_400Regular`, marginBottom: 10 },
  attributionFooter: { fontSize: 10, color: colors.textMuted, fontFamily: `${fonts.body}_400Regular`, marginTop: 6, marginBottom: 4 },

  sortRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sortLabel: { fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_500Medium` },
  sortChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 32,
    justifyContent: "center",
  },
  sortChipActive: { backgroundColor: colors.accentSageBg, borderColor: colors.accentSage },
  sortChipText: { fontSize: 12, color: colors.textSecondary, fontFamily: `${fonts.body}_500Medium` },
  sortChipTextActive: { color: colors.accentSage, fontFamily: `${fonts.body}_700Bold` },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  filterChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 32,
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: colors.accentSageBg, borderColor: colors.accentSage },
  filterChipText: { fontSize: 12, color: colors.textSecondary, fontFamily: `${fonts.body}_500Medium` },
  filterChipTextActive: { color: colors.accentSage, fontFamily: `${fonts.body}_700Bold` },

  headline: { ...typography.section, color: colors.textPrimary, marginBottom: 10 },
  emptyText: { fontSize: 13, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, textAlign: "center", paddingVertical: 8 },

  errorBox: {
    backgroundColor: colors.alertBg,
    borderRadius: radius.sm,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  errorText: { fontSize: 13, color: colors.alert, fontFamily: `${fonts.body}_500Medium`, textAlign: "center" },
  retryBtn: {
    backgroundColor: colors.alert,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  retryText: { fontSize: 13, color: "#FFFFFF", fontFamily: `${fonts.body}_700Bold` },

  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, color: colors.textMuted, fontFamily: `${fonts.body}_700Bold`, letterSpacing: 1.2 },

  cantFind: { fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, textAlign: "center", marginTop: 16, marginBottom: 8 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 14,
    alignItems: "center",
    gap: 6,
    minHeight: 64,
  },
  actionLabel: { fontSize: 12, color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },
});

/* ── "Picks near you" — the Overview carousel on REAL near-me data ───────────
 * Top 5 ranked venues from the same useNearMe hook as Eat Smart (server
 * intelligence, never local scoring). Skeleton → content | error + retry —
 * the eternal "Late Night · Loading..." state is dead. Tapping a card opens
 * the shared VenueSheet; keys are restaurantId.
 */
import { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { colors, fonts, typography, radius } from "../theme/tokens";
import { SkeletonCard } from "./ui/SkeletonShimmer";
import { VenueCard } from "./eat-smart/VenueCard";
import { VenueSheet } from "./eat-smart/VenueSheet";
import { useNearMe } from "../lib/useNearMe";
import { sectionResults } from "../lib/results";
import { detectMealParam, mealLabel } from "../lib/daypart";
import { readRemainingMacros, type RemainingMacros } from "../lib/fitsYourDay";
import type { ApiRestaurant } from "../lib/types";

export function PicksNearYouCarousel() {
  const router = useRouter();
  const meal = useMemo(() => detectMealParam(), []);
  const { status, data, offline, refresh, errorMessage } = useNearMe(meal);
  const [sheetVenue, setSheetVenue] = useState<ApiRestaurant | null>(null);
  const [remaining, setRemaining] = useState<RemainingMacros | null>(null);

  useEffect(() => {
    readRemainingMacros().then(setRemaining).catch(() => setRemaining(null));
  }, [data]);

  const ranked = useMemo(
    () => sectionResults(data?.restaurants ?? []).ranked,
    [data],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Picks near you</Text>
        <Text style={styles.mealTag}>
          {mealLabel(meal)}
          {offline ? " · offline" : ""}
        </Text>
      </View>

      {status === "loading" && (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <SkeletonCard style={{ width: 260 }} />
          <SkeletonCard style={{ width: 260 }} />
        </View>
      )}

      {status === "error" && (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>Couldn't load picks{errorMessage ? ` — ${errorMessage}` : ""}.</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn} accessibilityRole="button">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "ready" && ranked.length === 0 && (
        <Text style={styles.empty}>No ranked picks nearby right now — open Eat Smart to widen the view.</Text>
      )}

      {status === "ready" && ranked.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ranked}
          keyExtractor={(item) => item.restaurantId}
          renderItem={({ item }) => (
            <VenueCard
              venue={item}
              compact
              onPress={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSheetVenue(v);
              }}
              fitsCalLeft={remaining?.calLeft ?? null}
            />
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.seeAll}
              onPress={() => router.push("/eat-smart" as never)}
              accessibilityRole="button"
              accessibilityLabel="See all picks in Eat Smart"
            >
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          }
        />
      )}

      <VenueSheet venue={sheetVenue} visible={sheetVenue !== null} onClose={() => setSheetVenue(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 },
  header: { ...typography.section, color: colors.textPrimary },
  mealTag: { fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_600SemiBold`, textTransform: "uppercase", letterSpacing: 0.6 },
  errorBox: {
    backgroundColor: colors.alertBg,
    borderRadius: radius.sm,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  errorText: { fontSize: 12, color: colors.alert, fontFamily: `${fonts.body}_500Medium`, textAlign: "center" },
  retryBtn: { minHeight: 40, justifyContent: "center", paddingHorizontal: 16, backgroundColor: colors.alert, borderRadius: 8 },
  retryText: { fontSize: 12, color: "#FFFFFF", fontFamily: `${fonts.body}_700Bold` },
  empty: { fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular` },
  seeAll: { width: 110, alignItems: "center", justifyContent: "center" },
  seeAllText: { fontSize: 13, color: colors.accentSage, fontFamily: `${fonts.body}_700Bold` },
});

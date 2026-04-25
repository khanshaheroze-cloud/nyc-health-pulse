import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { colors, fonts, radius } from "../../theme/tokens";
import { PageTitle } from "../../components/ui/PageTitle";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ButtonOutline } from "../../components/ui/ButtonOutline";

/* ------------------------------------------------------------------ */
/*  Mock data — hardcoded picks                                        */
/* ------------------------------------------------------------------ */

interface Pick {
  medal: string;
  name: string;
  item: string;
  score: number;
  cal: number;
  protein: number;
  distance: string;
  badges: Array<"protein" | "fiber" | "smart">;
}

const BADGE_LABELS: Record<string, string> = {
  protein: "💪 High Protein",
  fiber: "🌿 High Fiber",
  smart: "🎯 Smart",
};

const MOCK_PICKS: Pick[] = [
  { medal: "🥇", name: "Chipotle", item: "Chicken Bowl", score: 86, cal: 510, protein: 42, distance: "0.3 mi", badges: ["protein", "smart"] },
  { medal: "🥈", name: "Cava", item: "Grilled Chicken Bowl", score: 83, cal: 440, protein: 35, distance: "0.5 mi", badges: ["protein"] },
  { medal: "🥉", name: "Sweetgreen", item: "Harvest Bowl", score: 79, cal: 380, protein: 28, distance: "0.4 mi", badges: ["fiber"] },
  { medal: "4", name: "Just Salad", item: "Buffalo Chicken", score: 76, cal: 420, protein: 32, distance: "0.6 mi", badges: ["smart"] },
  { medal: "5", name: "Dig", item: "Charred Chicken Plate", score: 74, cal: 490, protein: 38, distance: "0.7 mi", badges: ["protein"] },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function EatSmartScreen() {
  const router = useRouter();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) {
            setLocationError(true);
            setPicks(MOCK_PICKS);
            setLoading(false);
          }
          return;
        }

        await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 8000),
          ),
        ]);

        // Location succeeded -- use mock data (API not available)
        if (!cancelled) {
          setPicks(MOCK_PICKS);
          setLoading(false);
        }
      } catch {
        // Location failed -- still show mock data
        if (!cancelled) {
          setLocationError(true);
          setPicks(MOCK_PICKS);
          setLoading(false);
        }
      }
    })();

    // Fallback: if still loading after 2s, show mocks anyway
    const timer = setTimeout(() => {
      if (!cancelled && picks.length === 0) {
        setPicks(MOCK_PICKS);
        setLoading(false);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <PageTitle>Eat Smart</PageTitle>
      <Text style={styles.subtitle}>Snack picks scored for your goals.</Text>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/scan")}
          activeOpacity={0.7}
        >
          <Text style={styles.actionEmoji}>{"📷"}</Text>
          <Text style={styles.actionLabel}>Scan Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/ocr")}
          activeOpacity={0.7}
        >
          <Text style={styles.actionEmoji}>{"🔍"}</Text>
          <Text style={styles.actionLabel}>Read Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Section label */}
      <SectionLabel icon={"🥇"}>TOP PICKS NEAR YOU</SectionLabel>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accentSage} />
          <Text style={styles.loadingText}>Finding food near you...</Text>
        </View>
      )}

      {/* Location error banner */}
      {!loading && locationError && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={styles.locErrorText}>
            Enable location to see picks within 5 blocks
          </Text>
          <ButtonOutline
            label="Enable Location"
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === "granted") setLocationError(false);
            }}
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {/* Picks list */}
      {!loading && picks.length > 0 && (
        <Card>
          {picks.map((pick, idx) => (
            <View key={pick.name}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.pickRow}>
                {/* Left: medal */}
                <Text style={styles.medal}>{pick.medal}</Text>

                {/* Center: info */}
                <View style={styles.pickInfo}>
                  <Text style={styles.pickTitle}>
                    <Text style={styles.pickName}>{pick.name}</Text>
                    {" — "}
                    {pick.item}
                  </Text>
                  <Text style={styles.pickMeta}>
                    {pick.cal} cal {"·"} {pick.protein}g protein {"·"} {pick.distance}
                  </Text>
                  {pick.badges.length > 0 && (
                    <View style={styles.badgeRow}>
                      {pick.badges.map((b) => (
                        <Badge key={b} variant={b} label={BADGE_LABELS[b]} />
                      ))}
                    </View>
                  )}
                </View>

                {/* Right: score pill */}
                <View style={styles.scorePill}>
                  <Text style={styles.scoreText}>{pick.score}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Bottom spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 4,
    marginBottom: 18,
  },

  /* Action buttons */
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },

  /* Loading */
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
  },

  /* Location error */
  locErrorText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_500Medium`,
    textAlign: "center",
  },

  /* Pick rows */
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  pickRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  medal: {
    fontSize: 20,
    width: 28,
    marginTop: 2,
  },
  pickInfo: {
    flex: 1,
    marginRight: 8,
  },
  pickTitle: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_400Regular`,
  },
  pickName: {
    fontWeight: "700",
    fontFamily: `${fonts.body}_700Bold`,
  },
  pickMeta: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },

  /* Score pill */
  scorePill: {
    backgroundColor: colors.accentSageBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  scoreText: {
    fontSize: 18,
    color: colors.accentSage,
    fontFamily: `${fonts.display}_400Regular`,
  },
});

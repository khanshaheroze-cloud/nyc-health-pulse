import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, radius } from "../../theme/tokens";
import { IconCamera, IconFileText, IconMap, IconBookmark } from "../../components/ui/Icons";
import { PageTitle } from "../../components/ui/PageTitle";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ButtonOutline } from "../../components/ui/ButtonOutline";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Pick {
  medal: string;
  name: string;
  cuisine: string;
  item: string;
  score: number;
  cal: number;
  protein: number;
  distance: string;
  badges: Array<"protein" | "fiber" | "smart">;
}

const BADGE_LABELS: Record<string, string> = {
  protein: "High Protein",
  fiber: "High Fiber",
  smart: "Smart Pick",
};

const MOCK_PICKS: Pick[] = [
  { medal: "🥇", name: "Chipotle", cuisine: "🌯", item: "Chicken Bowl", score: 86, cal: 510, protein: 42, distance: "0.3 mi", badges: ["protein", "smart"] },
  { medal: "🥈", name: "Cava", cuisine: "🥙", item: "Grilled Chicken Bowl", score: 83, cal: 440, protein: 35, distance: "0.5 mi", badges: ["protein"] },
  { medal: "🥉", name: "Sweetgreen", cuisine: "🥗", item: "Harvest Bowl", score: 79, cal: 380, protein: 28, distance: "0.4 mi", badges: ["fiber"] },
  { medal: "4", name: "Just Salad", cuisine: "🥗", item: "Buffalo Chicken", score: 76, cal: 420, protein: 32, distance: "0.6 mi", badges: ["smart"] },
  { medal: "5", name: "Dig", cuisine: "🍗", item: "Charred Chicken Plate", score: 74, cal: 490, protein: 38, distance: "0.7 mi", badges: ["protein"] },
];

const ALL_CHAINS: Pick[] = [
  ...MOCK_PICKS,
  { medal: "6", name: "Chopt", cuisine: "🥗", item: "Mexican Caesar", score: 72, cal: 350, protein: 25, distance: "0.8 mi", badges: ["fiber"] as Array<"protein" | "fiber" | "smart"> },
  { medal: "7", name: "Dos Toros", cuisine: "🌯", item: "Burrito Bowl", score: 70, cal: 480, protein: 30, distance: "1.0 mi", badges: ["smart"] as Array<"protein" | "fiber" | "smart"> },
  { medal: "8", name: "Poke Bowl", cuisine: "🍣", item: "Salmon Poke", score: 68, cal: 400, protein: 34, distance: "0.9 mi", badges: ["protein"] as Array<"protein" | "fiber" | "smart"> },
].sort((a, b) => a.name.localeCompare(b.name));

type Tab = "near" | "chains" | "saved";

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function EatSmartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("near");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  const loadSaved = useCallback(async () => {
    const raw = await AsyncStorage.getItem("pulse-eat-saved");
    if (raw) try { setSaved(JSON.parse(raw)); } catch {}
  }, []);

  const toggleSave = async (name: string) => {
    const next = saved.includes(name)
      ? saved.filter((s) => s !== name)
      : [...saved, name];
    setSaved(next);
    await AsyncStorage.setItem("pulse-eat-saved", JSON.stringify(next));
  };

  useEffect(() => {
    let cancelled = false;
    loadSaved();

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) { setLocationError(true); setPicks(MOCK_PICKS); setLoading(false); }
          return;
        }
        await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
        ]);
        if (!cancelled) { setPicks(MOCK_PICKS); setLoading(false); }
      } catch {
        if (!cancelled) { setLocationError(true); setPicks(MOCK_PICKS); setLoading(false); }
      }
    })();

    const timer = setTimeout(() => {
      if (!cancelled && picks.length === 0) { setPicks(MOCK_PICKS); setLoading(false); }
    }, 2000);

    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSaved();
    setRefreshing(false);
  }, [loadSaved]);

  const savedPicks = [...MOCK_PICKS, ...ALL_CHAINS].filter((p) => saved.includes(p.name));
  const displayPicks = activeTab === "chains" ? ALL_CHAINS : activeTab === "saved" ? savedPicks : picks;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentSage} />}
    >
      <PageTitle>Eat Smart</PageTitle>
      <Text style={styles.subtitle}>Snack picks scored for your goals.</Text>

      {/* ── Top tabs ── */}
      <View style={styles.tabBar}>
        {(["near", "chains", "saved"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "near" ? "Near Me" : tab === "chains" ? "Chains" : "Saved"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Action buttons ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/scan")} activeOpacity={0.7}>
          <IconCamera size={18} color={colors.accentSage} />
          <Text style={styles.actionLabel}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/ocr")} activeOpacity={0.7}>
          <IconFileText size={18} color={colors.accentSage} />
          <Text style={styles.actionLabel}>Read Menu</Text>
        </TouchableOpacity>
      </View>

      {/* ── Map placeholder ── */}
      {activeTab === "near" && (
        <Card style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
          <View style={styles.mapPlaceholder}>
            <IconMap size={28} color={colors.textTertiary} />
            <Text style={styles.mapPlaceholderText}>Map available with API key</Text>
          </View>
        </Card>
      )}

      {/* ── Section label ── */}
      <SectionLabel icon="🥇">
        {activeTab === "near" ? "TOP PICKS NEAR YOU" : activeTab === "chains" ? "ALL CHAINS" : "SAVED PICKS"}
      </SectionLabel>

      {/* ── Loading ── */}
      {loading && activeTab === "near" && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accentSage} />
          <Text style={styles.loadingText}>Finding food near you...</Text>
        </View>
      )}

      {/* ── Location error ── */}
      {!loading && locationError && activeTab === "near" && (
        <Card style={{ marginBottom: 14 }}>
          <Text style={styles.locErrorText}>Enable location to see picks within 5 blocks</Text>
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

      {/* ── Empty saved state ── */}
      {activeTab === "saved" && savedPicks.length === 0 && (
        <Card>
          <Text style={styles.emptyText}>
            Save items by tapping the bookmark on any pick. They'll show up here for quick re-order.
          </Text>
        </Card>
      )}

      {/* ── Picks list ── */}
      {(!loading || activeTab !== "near") && displayPicks.length > 0 && (
        <Card>
          {displayPicks.map((pick, idx) => (
            <View key={pick.name}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.pickRow}>
                <Text style={styles.medal}>{pick.medal}</Text>
                <View style={styles.pickInfo}>
                  <Text style={styles.pickTitle}>
                    <Text style={styles.pickName}>{pick.name}</Text>
                    {" — "}
                    {pick.item}
                  </Text>
                  <Text style={styles.pickMeta}>
                    {pick.cal} cal · {pick.protein}g protein · {pick.distance}
                  </Text>
                  {pick.badges.length > 0 && (
                    <View style={styles.badgeRow}>
                      {pick.badges.map((b) => (
                        <Badge key={b} variant={b} label={BADGE_LABELS[b]} />
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.pickRight}>
                  <View style={styles.pulseScore}>
                    <Text style={styles.scoreNum}>{pick.score}</Text>
                    <Text style={styles.scoreLbl}>PULSE</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleSave(pick.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IconBookmark
                      size={16}
                      color={saved.includes(pick.name) ? colors.accentSage : colors.textTertiary}
                      filled={saved.includes(pick.name)}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  subtitle: {
    fontSize: 13, color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`, marginTop: 4, marginBottom: 14,
  },

  /* Tabs */
  tabBar: {
    flexDirection: "row", backgroundColor: colors.surfaceWarm,
    borderRadius: 12, padding: 4, marginBottom: 14,
  },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  tabText: {
    fontSize: 12, fontWeight: "600", color: colors.textSecondary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },
  tabTextActive: { color: colors.textPrimary },

  /* Actions */
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  actionCard: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.sm, padding: 14, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  actionLabel: {
    fontSize: 12, fontWeight: "600", color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },

  /* Map */
  mapPlaceholder: {
    height: 160, backgroundColor: colors.surfaceWarm,
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 12, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`,
  },

  /* Loading / empty */
  loadingWrap: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_400Regular` },
  locErrorText: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_500Medium`, textAlign: "center" },
  emptyText: { fontSize: 13, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, textAlign: "center", paddingVertical: 12 },

  /* Picks */
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 12 },
  pickRow: { flexDirection: "row", alignItems: "flex-start" },
  medal: { fontSize: 20, width: 28, marginTop: 2 },
  pickInfo: { flex: 1, marginRight: 8 },
  pickTitle: { fontSize: 14, color: colors.textPrimary, fontFamily: `${fonts.body}_400Regular` },
  pickName: { fontWeight: "700", fontFamily: `${fonts.body}_700Bold` },
  pickMeta: { fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, marginTop: 3 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },

  /* Pulse Score (stacked) */
  pickRight: { alignItems: "center", gap: 6 },
  pulseScore: { alignItems: "center" },
  scoreNum: { fontSize: 22, color: colors.accentSage, fontFamily: `${fonts.display}_400Regular` },
  scoreLbl: { fontSize: 9, fontWeight: "700", color: colors.textTertiary, letterSpacing: 0.5 },
});

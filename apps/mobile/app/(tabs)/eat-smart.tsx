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
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, radius } from "../../theme/tokens";
import { IconCamera, IconFileText, IconMap, IconBookmark } from "../../components/ui/Icons";
import { PageTitle } from "../../components/ui/PageTitle";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ButtonOutline } from "../../components/ui/ButtonOutline";
import { RestaurantsMap, type MapPin } from "../../components/eat-smart/RestaurantsMap";
import { RestaurantDetailModal } from "../../components/RestaurantDetailModal";
import { getMenuForRestaurant } from "../../lib/core/smart-menu/menuResolver";
import { fetchNearbyRestaurants, detectChainSlug, ALL_CHAIN_ENTRIES, type DOHMHRestaurant } from "../../lib/nearbyRestaurants";
import { getBundledNearby, type BundledRestaurant } from "../../lib/bundledRestaurants";
import { getTopPicks } from "../../lib/core/smart-menu/topPicks";
import type { RestaurantMenu } from "../../lib/core/smart-menu/types";
import * as Haptics from "expo-haptics";

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
  distanceMeters: number;
  badges: Array<"protein" | "fiber" | "smart">;
  lat?: number;
  lng?: number;
  chainSlug: string | null;
}

const BADGE_LABELS: Record<string, string> = {
  protein: "High Protein",
  fiber: "High Fiber",
  smart: "Smart Pick",
};

function formatDistance(m: number): string {
  const blocks = Math.round(m / 80);
  if (blocks <= 20) return `${blocks} blks`;
  return `${(m / 1609).toFixed(1)} mi`;
}

function getMealIcon(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "☀️";
  if (h >= 11 && h < 15) return "🥗";
  if (h >= 15 && h < 20) return "🌙";
  return "🌃";
}

function getMealLabel(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "Breakfast";
  if (h >= 11 && h < 15) return "Lunch";
  if (h >= 15 && h < 20) return "Dinner";
  return "Late Night";
}

function buildPickFromDOHMH(r: DOHMHRestaurant, idx: number): Pick {
  const slug = detectChainSlug(r.dba);
  const menu = getMenuForRestaurant(slug, r.cuisine, r.dba);
  const topPicks = menu ? getTopPicks(menu, 1) : [];
  const top = topPicks[0];

  const medals = ["🥇", "🥈", "🥉"];
  const badges: Array<"protein" | "fiber" | "smart"> = [];
  if (top) {
    if (top.protein >= 25) badges.push("protein");
    if (top.fiber != null && top.fiber >= 5) badges.push("fiber");
    if (top.pulseScore >= 75) badges.push("smart");
  }

  return {
    medal: idx < 3 ? medals[idx] : `${idx + 1}`,
    name: r.dba,
    cuisine: r.cuisine,
    item: top?.name ?? "Menu item",
    score: top?.pulseScore ?? 65,
    cal: top?.calories ?? 400,
    protein: top?.protein ?? 20,
    distance: formatDistance(r.distance),
    distanceMeters: r.distance,
    badges: badges.slice(0, 2),
    lat: r.lat,
    lng: r.lng,
    chainSlug: slug,
  };
}

function buildPickFromBundled(r: BundledRestaurant, idx: number): Pick {
  const slug = r.chainSlug ?? detectChainSlug(r.name);
  const menu = getMenuForRestaurant(slug ?? null, r.cuisine, r.name);
  const topPicks = menu ? getTopPicks(menu, 1) : [];
  const top = topPicks[0];

  const medals = ["🥇", "🥈", "🥉"];
  const badges: Array<"protein" | "fiber" | "smart"> = [];
  if (top) {
    if (top.protein >= 25) badges.push("protein");
    if (top.fiber != null && top.fiber >= 5) badges.push("fiber");
    if (top.pulseScore >= 75) badges.push("smart");
  }

  return {
    medal: idx < 3 ? medals[idx] : `${idx + 1}`,
    name: r.name,
    cuisine: r.cuisine,
    item: top?.name ?? "Menu item",
    score: top?.pulseScore ?? 65,
    cal: top?.calories ?? 400,
    protein: top?.protein ?? 20,
    distance: formatDistance(r.distance),
    distanceMeters: r.distance,
    badges: badges.slice(0, 2),
    lat: r.lat,
    lng: r.lng,
    chainSlug: slug ?? null,
  };
}

function buildChainPicks(): Pick[] {
  return ALL_CHAIN_ENTRIES.map((chain, idx) => {
    const menu = getMenuForRestaurant(chain.slug, chain.cuisine, chain.name);
    const topPicks = menu ? getTopPicks(menu, 1) : [];
    const top = topPicks[0];
    const badges: Array<"protein" | "fiber" | "smart"> = [];
    if (top) {
      if (top.protein >= 25) badges.push("protein");
      if (top.pulseScore >= 75) badges.push("smart");
    }
    return {
      medal: `${chain.icon}`,
      name: chain.name,
      cuisine: chain.cuisine,
      item: top?.name ?? "Best pick",
      score: top?.pulseScore ?? 70,
      cal: top?.calories ?? 450,
      protein: top?.protein ?? 25,
      distance: "",
      distanceMeters: 0,
      badges: badges.slice(0, 2),
      lat: undefined,
      lng: undefined,
      chainSlug: chain.slug,
    };
  }).sort((a, b) => b.score - a.score);
}

type Tab = "near" | "chains" | "saved";

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function EatSmartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<Tab>("near");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [userLat, setUserLat] = useState(40.7440);
  const [userLng, setUserLng] = useState(-73.9485);
  const [modalPick, setModalPick] = useState<Pick | null>(null);
  const [modalMenu, setModalMenu] = useState<RestaurantMenu | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openPickDetail = useCallback((pick: Pick) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const menu = getMenuForRestaurant(pick.chainSlug, pick.cuisine, pick.name);
    setModalPick(pick);
    setModalMenu(menu);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalPick(null);
    setModalMenu(null);
  }, []);

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

  const [chainPicks] = useState<Pick[]>(buildChainPicks);

  const loadNearby = useCallback(async () => {
    setFetchError(null);
    setLocationError(false);
    loadSaved();

    let lat = userLat;
    let lng = userLng;

    // 1. IMMEDIATELY show bundled data — no waiting on network
    const bundled = getBundledNearby(lat, lng, 2500, 50);
    console.log("[EatSmart] bundled count:", bundled.length);
    const bundledPicks = bundled.map((r, i) => buildPickFromBundled(r, i));
    bundledPicks.sort((a, b) => b.score - a.score);
    setPicks(bundledPicks.slice(0, 30));
    setLoading(false);

    // 2. Try to get real GPS coords
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("[EatSmart] location permission denied");
        setLocationError(true);
        return;
      }
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Location timeout")), 8000)),
      ]);

      lat = loc.coords.latitude;
      lng = loc.coords.longitude;
      console.log("[EatSmart] got GPS", { lat, lng, accuracy: loc.coords.accuracy });
      setUserLat(lat);
      setUserLng(lng);

      // Re-sort bundled data by real location
      const reSorted = getBundledNearby(lat, lng, 2500, 50);
      const rePicks = reSorted.map((r, i) => buildPickFromBundled(r, i));
      rePicks.sort((a, b) => b.score - a.score);
      setPicks(rePicks.slice(0, 30));
    } catch (e: any) {
      console.warn("[EatSmart] GPS failed, keeping default coords", e?.message);
    }

    // 3. Try DOHMH live in background — merge extra results if it works
    fetchNearbyRestaurants(lat, lng, 1500)
      .then((live) => {
        console.log("[EatSmart] DOHMH live count:", live.length);
        if (live.length === 0) return;
        const livePicks = live.map((r, i) => buildPickFromDOHMH(r, i));
        setPicks((prev) => {
          const seen = new Set(prev.map((p) => `${p.lat?.toFixed(4)},${p.lng?.toFixed(4)}`));
          const merged = [...prev];
          for (const lp of livePicks) {
            const key = `${lp.lat?.toFixed(4)},${lp.lng?.toFixed(4)}`;
            if (!seen.has(key)) { merged.push(lp); seen.add(key); }
          }
          merged.sort((a, b) => b.score - a.score);
          return merged.slice(0, 40);
        });
      })
      .catch((e) => {
        console.warn("[EatSmart] DOHMH live failed (bundled still showing):", e?.message);
      });
  }, [loadSaved, userLat, userLng]);

  useEffect(() => { loadNearby(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNearby();
    setRefreshing(false);
  }, [loadNearby]);

  const allKnown = [...picks, ...chainPicks];
  const savedPicks = allKnown.filter((p) => saved.includes(p.name));
  const displayPicks = activeTab === "chains" ? chainPicks : activeTab === "saved" ? savedPicks : picks;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentSage} />}
    >
      <PageTitle>Eat Smart</PageTitle>
      <Text style={styles.subtitle}>Snack picks scored for your goals.</Text>

      {/* ── Time-of-day pill ── */}
      <View style={{flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14}}>
        <View style={{backgroundColor: colors.accentSageBg, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4}}>
          <Text style={{fontSize: 12}}>{getMealIcon()}</Text>
          <Text style={{fontSize: 11, fontWeight: "700", color: colors.accentSage, fontFamily: `${fonts.body}_700Bold`}}>{getMealLabel().toUpperCase()} · {new Date().toLocaleTimeString([], {hour: "numeric", minute: "2-digit"})}</Text>
        </View>
        <Text style={{fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`}}>{picks.length} picks within range</Text>
      </View>

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

      {/* ── Mapbox map ── */}
      {activeTab === "near" && (
        <Card style={{ padding: 0, overflow: "hidden", marginBottom: 14, height: 180 }}>
          <RestaurantsMap
            userLat={userLat}
            userLng={userLng}
            pins={picks
              .filter((p) => p.lat && p.lng)
              .map((p) => ({
                id: p.name,
                lat: p.lat!,
                lng: p.lng!,
                score: p.score,
                name: p.name,
              }))}
            onPinPress={(pin) => {
              const pick = picks.find((p) => p.name === pin.id);
              if (pick) openPickDetail(pick);
            }}
          />
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

      {/* ── Location error banner ── */}
      {!loading && locationError && activeTab === "near" && (
        <View style={styles.permBanner}>
          <Text style={styles.permBannerText}>Location denied. Enable it to find food near you.</Text>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); Location.requestForegroundPermissionsAsync().then(({ status }) => { if (status === "granted") setLocationError(false); }); }}
            style={styles.permBtn}
          >
            <Text style={styles.permBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Fetch error banner ── */}
      {!loading && fetchError && activeTab === "near" && !locationError && (
        <View style={styles.permBanner}>
          <Text style={[styles.permBannerText, { color: "#721c24" }]}>
            Couldn't load nearby restaurants: {fetchError}
          </Text>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); loadNearby(); }}
            style={[styles.permBtn, { backgroundColor: "#721c24" }]}
          >
            <Text style={styles.permBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
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
          {displayPicks.map((pick, idx) => {
            const isHero = activeTab === "near" && idx < 3;
            const heroColors = ["#D4AF37", "#A8A8A8", "#CD7F32"];
            return (
              <View key={pick.name}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={[styles.pickRow, isHero && {borderLeftWidth: 3, borderLeftColor: heroColors[idx], paddingLeft: 10, marginLeft: -4}]}
                  activeOpacity={0.7}
                  onPress={() => openPickDetail(pick)}
                >
                  <Text style={styles.medal}>{pick.medal}</Text>
                  <View style={styles.pickInfo}>
                    <Text style={[styles.pickTitle, isHero && {fontSize: 15}]}>
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
                    {isHero && (
                      <TouchableOpacity style={{marginTop: 6}} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/log" as any); }}>
                        <Text style={{fontSize: 11, fontWeight: "700", color: colors.accentSage, fontFamily: `${fonts.body}_700Bold`}}>Log this →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.pickRight}>
                    <View style={[styles.pulseScore, isHero && {backgroundColor: pick.score >= 80 ? "#E8F5E9" : pick.score >= 60 ? "#FFF8E1" : "#FFEBEE", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4}]}>
                      <Text style={[styles.scoreNum, {color: pick.score >= 80 ? colors.good : pick.score >= 60 ? colors.caution : colors.alert}]}>{pick.score}</Text>
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
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>
      )}

      {/* ── Action buttons (below picks) ── */}
      <Text style={{fontSize: 11, color: colors.textTertiary, fontFamily: `${fonts.body}_400Regular`, textAlign: "center", marginTop: 14, marginBottom: 8}}>Can't find it?</Text>
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

      <View style={{ height: tabBarHeight + 40 }} />

      {/* ── Restaurant detail modal ── */}
      <RestaurantDetailModal
        restaurant={modalPick ? {
          name: modalPick.name,
          cuisine: modalPick.cuisine,
          grade: null,
          address: "",
          lat: modalPick.lat ?? userLat,
          lng: modalPick.lng ?? userLng,
          distance: modalPick.distanceMeters,
          chainSlug: modalPick.chainSlug,
          isHealthy: modalPick.score >= 75,
        } : null}
        menu={modalMenu}
        visible={modalVisible}
        onClose={closeModal}
      />
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
  mapView: {
    height: 180, borderRadius: radius.sm,
  },

  /* Loading / empty */
  loadingWrap: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_400Regular` },
  locErrorText: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_500Medium`, textAlign: "center" },
  permBanner: {
    backgroundColor: "#FEF3CD", borderRadius: radius.sm, padding: 14,
    marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 10,
  },
  permBannerText: { flex: 1, fontSize: 12, color: "#856404", fontFamily: `${fonts.body}_500Medium` },
  permBtn: { backgroundColor: "#856404", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  permBtnText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
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

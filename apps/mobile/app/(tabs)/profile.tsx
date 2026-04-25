import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { colors, radius, fonts } from "../../theme/tokens";
import { Card } from "../../components/ui/Card";
import { SectionLabel } from "../../components/ui/SectionLabel";
import type { User } from "@supabase/supabase-js";

/* ── AsyncStorage keys ── */
const KEY_NAME = "pulse-user-name";
const KEY_NEIGHBORHOOD = "pulse-neighborhood";
const KEY_HEIGHT = "pulse-user-height";
const KEY_WEIGHT = "pulse-user-weight";
const KEY_NUTRITION = "pulse-nutrition-goals";

/* ── Types ── */
interface Neighborhood {
  name: string;
  borough: string;
}

/* ── Menu row data ── */
const SETTINGS_ROWS = [
  { icon: "🎯", label: "Goals & Targets" },
  { icon: "📍", label: "Neighborhood" },
  { icon: "🏋️", label: "Workout Plan" },
  { icon: "🔔", label: "Notifications" },
  { icon: "🔗", label: "Connected Apps" },
];

const SUPPORT_ROWS_AUTH = [
  { icon: "❓", label: "Help & FAQ" },
  { icon: "✉️", label: "Send Feedback" },
  { icon: "🚪", label: "Sign Out", isSignOut: true },
];

const SUPPORT_ROWS_GUEST = [
  { icon: "❓", label: "Help & FAQ" },
  { icon: "✉️", label: "Send Feedback" },
  { icon: "🚪", label: "Sign In", isSignIn: true },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* profile data */
  const [name, setName] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [calGoal, setCalGoal] = useState<string>("2,000");

  /* ── Load user + profile data ── */
  const loadProfile = useCallback(async () => {
    const [storedName, storedHood, storedH, storedW, storedGoals] =
      await Promise.all([
        AsyncStorage.getItem(KEY_NAME),
        AsyncStorage.getItem(KEY_NEIGHBORHOOD),
        AsyncStorage.getItem(KEY_HEIGHT),
        AsyncStorage.getItem(KEY_WEIGHT),
        AsyncStorage.getItem(KEY_NUTRITION),
      ]);

    setName(storedName);
    if (storedHood) {
      try {
        setNeighborhood(JSON.parse(storedHood));
      } catch {
        setNeighborhood(null);
      }
    }
    setHeight(storedH);
    setWeight(storedW);

    if (storedGoals) {
      try {
        const parsed = JSON.parse(storedGoals);
        const cal = parsed.calories ?? parsed.cal ?? 2000;
        setCalGoal(Number(cal).toLocaleString());
      } catch {
        setCalGoal("2,000");
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    loadProfile();
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  /* ── Handlers ── */
  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      },
    ]);
  };

  /* ── Derived values ── */
  const displayName = user ? name ?? "User" : "Guest";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "?";
  const locationText = neighborhood
    ? `📍 ${neighborhood.name}, ${neighborhood.borough}`
    : "Set your neighborhood";
  const supportRows = user ? SUPPORT_ROWS_AUTH : SUPPORT_ROWS_GUEST;

  /* ── Render helpers ── */
  const renderMenuRow = (
    item: { icon: string; label: string; isSignOut?: boolean; isSignIn?: boolean },
    index: number,
    total: number
  ) => {
    const isLast = index === total - 1;

    const onPress = () => {
      if (item.isSignOut) {
        handleSignOut();
      } else if (item.isSignIn) {
        router.push("/signin");
      }
    };

    return (
      <TouchableOpacity
        key={item.label}
        style={[styles.menuRow, !isLast && styles.menuRowBorder]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <Text style={styles.menuIcon}>{item.icon}</Text>
        <Text
          style={[
            styles.menuLabel,
            item.isSignOut && { color: colors.alert },
            item.isSignIn && { color: colors.accentSage },
          ]}
        >
          {item.label}
        </Text>
        {!item.isSignOut && !item.isSignIn && (
          <Text style={styles.menuChevron}>{"›"}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ── Avatar ── */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
      </View>

      {/* ── Name ── */}
      <Text style={styles.name}>{displayName}</Text>

      {/* ── Location ── */}
      <Text style={styles.location}>{locationText}</Text>

      {/* ── Stat tiles ── */}
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{height ?? "—"}</Text>
          <Text style={styles.statLabel}>HEIGHT</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{weight ?? "—"}</Text>
          <Text style={styles.statLabel}>WEIGHT</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{user ? calGoal : "—"}</Text>
          <Text style={styles.statLabel}>CAL GOAL</Text>
        </View>
      </View>

      {/* ── Settings section ── */}
      <SectionLabel>SETTINGS</SectionLabel>
      <Card style={styles.menuCard}>
        {SETTINGS_ROWS.map((item, i) =>
          renderMenuRow(item, i, SETTINGS_ROWS.length)
        )}
      </Card>

      {/* ── Support section ── */}
      <SectionLabel>SUPPORT</SectionLabel>
      <Card style={styles.menuCard}>
        {supportRows.map((item, i) =>
          renderMenuRow(item, i, supportRows.length)
        )}
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
  },

  /* Avatar */
  avatarWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSage,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 30,
    fontFamily: `${fonts.display}_400Regular`,
    color: "#FFFFFF",
    marginTop: 2,
  },

  /* Name + location */
  name: {
    fontSize: 22,
    fontFamily: `${fonts.display}_400Regular`,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: `${fonts.body}_400Regular`,
    color: colors.textTertiary,
    textAlign: "center",
    marginBottom: 20,
  },

  /* Stat tiles row */
  statsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 6,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: `${fonts.display}_400Regular`,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: `${fonts.body}_700Bold`,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  /* Menu card */
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    fontSize: 24,
    width: 28,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: `${fonts.body}_500Medium`,
    fontWeight: "500",
    color: colors.textPrimary,
    marginLeft: 12,
  },
  menuChevron: {
    fontSize: 18,
    color: colors.textTertiary,
  },

  bottomSpacer: {
    height: 20,
  },
});

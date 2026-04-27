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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import { colors, radius, fonts } from "../../theme/tokens";
import { Card } from "../../components/ui/Card";
import { SectionLabel } from "../../components/ui/SectionLabel";
import {
  IconTarget,
  IconMapPin,
  IconDumbbell,
  IconBell,
  IconLink,
  IconHelpCircle,
  IconMessageSquare,
  IconLogIn,
  IconLogOut,
  IconChevronRight,
} from "../../components/ui/Icons";
import type { User } from "@supabase/supabase-js";

/* ── AsyncStorage keys ── */
const KEY_NAME = "pulse-user-name";
const KEY_NEIGHBORHOOD = "pulse-neighborhood";
const KEY_HEIGHT = "pulse-user-height";
const KEY_WEIGHT = "pulse-user-weight";
const KEY_NUTRITION = "pulse-nutrition-goals";

interface Neighborhood {
  name: string;
  borough: string;
}

/* ── Menu row data with icon config ── */
interface MenuRow {
  IconComp: React.FC<{ size?: number; color?: string }>;
  label: string;
  isSignOut?: boolean;
  isSignIn?: boolean;
}

const SETTINGS_ROWS: MenuRow[] = [
  { IconComp: IconTarget, label: "Goals & Targets" },
  { IconComp: IconMapPin, label: "Neighborhood" },
  { IconComp: IconDumbbell, label: "Workout Plan" },
  { IconComp: IconBell, label: "Notifications" },
  { IconComp: IconLink, label: "Connected Apps" },
];

const SUPPORT_AUTH: MenuRow[] = [
  { IconComp: IconHelpCircle, label: "Help & FAQ" },
  { IconComp: IconMessageSquare, label: "Send Feedback" },
  { IconComp: IconLogOut, label: "Sign Out", isSignOut: true },
];

const SUPPORT_GUEST: MenuRow[] = [
  { IconComp: IconHelpCircle, label: "Help & FAQ" },
  { IconComp: IconMessageSquare, label: "Send Feedback" },
  { IconComp: IconLogIn, label: "Sign In", isSignIn: true },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [calGoal, setCalGoal] = useState<string>("2,000");

  const loadProfile = useCallback(async () => {
    const [sName, sHood, sH, sW, sGoals] = await Promise.all([
      AsyncStorage.getItem(KEY_NAME),
      AsyncStorage.getItem(KEY_NEIGHBORHOOD),
      AsyncStorage.getItem(KEY_HEIGHT),
      AsyncStorage.getItem(KEY_WEIGHT),
      AsyncStorage.getItem(KEY_NUTRITION),
    ]);

    setName(sName);
    if (sHood) try { setNeighborhood(JSON.parse(sHood)); } catch {}
    setHeight(sH);
    setWeight(sW);

    if (sGoals) {
      try {
        const p = JSON.parse(sGoals);
        setCalGoal(Number(p.calories ?? p.cal ?? 2000).toLocaleString());
      } catch {
        setCalGoal("2,000");
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
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

  const displayName = user ? name ?? "User" : name ?? "Guest";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "?";
  const locationText = neighborhood
    ? `${neighborhood.name}, ${neighborhood.borough}`
    : "Set your neighborhood";
  const supportRows = user ? SUPPORT_AUTH : SUPPORT_GUEST;

  const renderMenuRow = (item: MenuRow, index: number, total: number) => {
    const isLast = index === total - 1;
    const onPress = () => {
      if (item.isSignOut) handleSignOut();
      else if (item.isSignIn) router.push("/signin");
    };

    const iconColor = item.isSignOut ? colors.alert : colors.textSecondary;

    return (
      <TouchableOpacity
        key={item.label}
        style={[styles.menuRow, !isLast && styles.menuRowBorder]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View style={styles.menuIconWrap}>
          <item.IconComp size={20} color={iconColor} />
        </View>
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
          <IconChevronRight size={16} color={colors.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 32 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentSage} />}
    >
      {/* ── Avatar (gradient approximation — solid sage with lighter tint) ── */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <View style={styles.avatarGradient} />
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
      </View>

      <Text style={styles.name}>{displayName}</Text>
      <View style={styles.locationRow}>
        <IconMapPin size={12} color={colors.textTertiary} />
        <Text style={styles.location}>{locationText}</Text>
      </View>

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
          <Text style={styles.statValue}>{user || name ? calGoal : "—"}</Text>
          <Text style={styles.statLabel}>CAL GOAL</Text>
        </View>
      </View>

      {/* ── Settings ── */}
      <SectionLabel>SETTINGS</SectionLabel>
      <Card style={styles.menuCard}>
        {SETTINGS_ROWS.map((item, i) => renderMenuRow(item, i, SETTINGS_ROWS.length))}
      </Card>

      {/* ── Support ── */}
      <SectionLabel>SUPPORT</SectionLabel>
      <Card style={styles.menuCard}>
        {supportRows.map((item, i) => renderMenuRow(item, i, supportRows.length))}
      </Card>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  /* Avatar */
  avatarWrap: { alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentSage,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#6B9E7A",
    opacity: 0.5,
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 20,
  },
  location: {
    fontSize: 12,
    fontFamily: `${fonts.body}_400Regular`,
    color: colors.textTertiary,
  },

  /* Stat tiles */
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

  /* Menu */
  menuCard: { padding: 0, overflow: "hidden" },
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
  menuIconWrap: { width: 24, alignItems: "center" },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: `${fonts.body}_500Medium`,
    fontWeight: "500",
    color: colors.textPrimary,
    marginLeft: 12,
  },
});

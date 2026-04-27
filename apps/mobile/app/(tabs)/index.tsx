import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";
import { colors, radius, fonts } from "../../theme/tokens";
import { Card } from "../../components/ui/Card";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Chip } from "../../components/ui/Chip";
import { MacroBar } from "../../components/ui/MacroBar";
import { ButtonPrimary } from "../../components/ui/ButtonPrimary";
import { ButtonOutline } from "../../components/ui/ButtonOutline";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateHeader(): string {
  const d = new Date();
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function aqiColor(v: number): string {
  if (v > 100) return "#C45A4A";
  if (v > 50) return "#C4964A";
  return colors.accentSage;
}

/* ------------------------------------------------------------------ */
/*  Mini ring components                                               */
/* ------------------------------------------------------------------ */

function AQIRing({ value, size = 64 }: { value: number; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(value / 200, 1);
  const offset = circ * (1 - fill);
  const c = aqiColor(value);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.borderLight} strokeWidth={sw} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth={sw} fill="none"
          strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={offset}
          rotation={-90} origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontFamily: `${fonts.display}_400Regular`, fontSize: 18, color: c }}>{value}</Text>
        <Text style={{ fontSize: 8, fontWeight: "700", color: colors.textTertiary, marginTop: -2 }}>AQI</Text>
      </View>
    </View>
  );
}

function CalRing({ cal, goal, size = 72 }: { cal: number; goal: number; size?: number }) {
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const fill = goal > 0 ? Math.min(cal / goal, 1) : 0;
  const offset = circ * (1 - fill);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.borderLight} strokeWidth={sw} fill="none" />
        {cal > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r} stroke={colors.accentSage} strokeWidth={sw} fill="none"
            strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={offset}
            rotation={-90} origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontFamily: `${fonts.display}_400Regular`, fontSize: 18, color: colors.textPrimary }}>
          {cal.toLocaleString()}
        </Text>
        <Text style={{ fontSize: 8, fontWeight: "700", color: colors.textTertiary, marginTop: -2 }}>
          /{goal.toLocaleString()} CAL
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WorkoutRoutine {
  name: string;
  exercises: { name: string; sets: number; reps: number }[];
  lastWorkout?: string;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Neighborhood {
  name: string;
  borough: string;
}

const DEFAULT_GOALS: NutritionGoals = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

const HEALTH_STATUS: { label: string; variant: "good" | "warn" | "alert" }[] = [
  { label: "COVID Low", variant: "good" },
  { label: "Flu Declining", variant: "good" },
  { label: "Water Safe", variant: "good" },
  { label: "Pollen Moderate", variant: "warn" },
  { label: "Rats High", variant: "alert" },
];

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function HealthTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const [userName, setUserName] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [workout, setWorkout] = useState<WorkoutRoutine | null>(null);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [todayCal, setTodayCal] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [aqi, setAqi] = useState(43);

  const loadData = useCallback(async () => {
    const [sName, sHood, sWorkout, sGoals, sLog] = await Promise.all([
      AsyncStorage.getItem("pulse-user-name"),
      AsyncStorage.getItem("pulse-neighborhood"),
      AsyncStorage.getItem("pulse-workout-routine"),
      AsyncStorage.getItem("pulse-nutrition-goals"),
      AsyncStorage.getItem(`pulse-log-${todayKey()}`),
    ]);

    setUserName(sName);
    if (sHood) try { setNeighborhood(JSON.parse(sHood)); } catch {}
    if (sWorkout) try { setWorkout(JSON.parse(sWorkout)); } catch {}
    if (sGoals) try { const g = JSON.parse(sGoals); setGoals({ ...DEFAULT_GOALS, ...g }); } catch {}

    if (sLog) {
      try {
        const parsed = JSON.parse(sLog);
        const items: any[] = Array.isArray(parsed) ? parsed : parsed.entries ?? [];
        const totals = items.reduce(
          (a, e) => ({
            calories: a.calories + (e.calories || 0),
            protein: a.protein + (e.protein || 0),
            carbs: a.carbs + (e.carbs || 0),
            fat: a.fat + (e.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );
        setTodayCal(totals.calories);
        setTodayProtein(totals.protein);
        setTodayCarbs(totals.carbs);
        setTodayFat(totals.fat);
      } catch {}
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const greetingName = userName ? `, ${userName}` : "";
  const proteinPct = goals.protein > 0 ? Math.round((todayProtein / goals.protein) * 100) : 0;
  const carbsPct = goals.carbs > 0 ? Math.round((todayCarbs / goals.carbs) * 100) : 0;
  const fatPct = goals.fat > 0 ? Math.round((todayFat / goals.fat) * 100) : 0;

  const workoutDaysAgo = (() => {
    if (!workout?.lastWorkout) return null;
    const d = Math.floor((Date.now() - new Date(workout.lastWorkout).getTime()) / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d} days ago`;
  })();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentSage} />}
    >
      {/* ── 1. TODAY TICKER ── */}
      <View style={styles.ticker}>
        <View style={styles.tickerLive}>
          <View style={styles.tickerDot} />
          <Text style={styles.tickerLiveText}>LIVE</Text>
        </View>
        <Text style={styles.tickerBody} numberOfLines={1}>
          COVID Low · Flu Declining · Water Safe ✓ · Pollen Moderate
        </Text>
      </View>

      {/* ── 2. GREETING HERO ── */}
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroDate}>{formatDateHeader()}</Text>
          <Text style={styles.heroGreeting}>{getGreeting()}{greetingName}</Text>
          <Text style={styles.heroSub}>
            {neighborhood ? `📍 ${neighborhood.name} · ` : ""}53° Partly Cloudy
          </Text>
        </View>
        <AQIRing value={aqi} />
      </View>

      {/* ── 3. TODAY'S WORKOUT ── */}
      <SectionLabel icon="🏋️">TODAY'S WORKOUT</SectionLabel>
      {workout ? (
        <Card accent>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          {workout.exercises.slice(0, 4).map((ex, i) => (
            <Text key={i} style={styles.workoutExercise}>
              • {ex.name} — {ex.sets}×{ex.reps}
            </Text>
          ))}
          <ButtonPrimary label="▶ Start Workout" onPress={() => Alert.alert("Coming Soon", "Workout tracking is being built!")} style={{ marginTop: 14 }} />
          {workoutDaysAgo && (
            <Text style={styles.workoutLast}>Last workout: {workoutDaysAgo}</Text>
          )}
        </Card>
      ) : (
        <Card>
          <Text style={styles.emptyText}>Choose a routine to get started</Text>
          <ButtonOutline label="Choose a routine →" onPress={() => router.push("/profile" as any)} style={{ marginTop: 10 }} />
        </Card>
      )}

      {/* ── 4. TODAY'S NUTRITION ── */}
      <SectionLabel icon="🍽">TODAY'S NUTRITION</SectionLabel>
      <Card>
        <View style={styles.nutritionRow}>
          <CalRing cal={todayCal} goal={goals.calories} />
          <View style={styles.macroStack}>
            <View style={styles.macroItem}>
              <View style={styles.macroLabelRow}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroGrams}>{todayProtein}g</Text>
                <Text style={[styles.macroPct, proteinPct > 0 && { color: colors.accentSage }]}>{proteinPct}%</Text>
              </View>
              <MacroBar value={todayProtein} max={goals.protein} />
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroLabelRow}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroGrams}>{todayCarbs}g</Text>
                <Text style={[styles.macroPct, carbsPct > 0 && { color: colors.accentSage }]}>{carbsPct}%</Text>
              </View>
              <MacroBar value={todayCarbs} max={goals.carbs} />
            </View>
            <View style={styles.macroItem}>
              <View style={styles.macroLabelRow}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroGrams}>{todayFat}g</Text>
                <Text style={[styles.macroPct, fatPct > 0 && { color: colors.accentSage }]}>{fatPct}%</Text>
              </View>
              <MacroBar value={todayFat} max={goals.fat} />
            </View>
          </View>
        </View>
        <ButtonOutline label="+ Log Food" onPress={() => router.push("/log" as any)} style={{ marginTop: 14 }} />
      </Card>

      {/* ── 5. YOUR NEIGHBORHOOD ── */}
      {neighborhood && (
        <>
          <SectionLabel icon="📍">YOUR NEIGHBORHOOD</SectionLabel>
          <TouchableOpacity
            style={styles.hoodCard}
            activeOpacity={0.8}
            onPress={() => router.push("/neighborhood" as any)}
          >
            <Text style={styles.hoodName}>{neighborhood.name}</Text>
            <Text style={styles.hoodBorough}>{neighborhood.borough}</Text>
            <View style={styles.hoodDivider} />
            <View style={styles.hoodStats}>
              <View style={styles.hoodStat}>
                <Text style={styles.hoodStatVal}>{aqi}</Text>
                <Text style={styles.hoodStatLabel}>AQI</Text>
              </View>
              <View style={styles.hoodStat}>
                <Text style={styles.hoodStatVal}>83.8</Text>
                <Text style={styles.hoodStatLabel}>LIFE EXP</Text>
              </View>
              <View style={styles.hoodStat}>
                <Text style={styles.hoodStatVal}>92</Text>
                <Text style={styles.hoodStatLabel}>WALK</Text>
              </View>
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* ── 6. NYC HEALTH STATUS ── */}
      <SectionLabel icon="📊">NYC HEALTH STATUS</SectionLabel>
      <View style={styles.chipGrid}>
        {HEALTH_STATUS.map((s) => (
          <Chip key={s.label} label={s.label} variant={s.variant} />
        ))}
      </View>

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

  /* Ticker */
  ticker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  tickerLive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSage,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 8,
  },
  tickerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  tickerLiveText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: `${fonts.body}_700Bold`,
  },
  tickerBody: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_500Medium`,
  },

  /* Hero */
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroGreeting: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
  },
  heroSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 4,
  },

  /* Workout */
  workoutTitle: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
    marginBottom: 8,
  },
  workoutExercise: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    lineHeight: 20,
  },
  workoutLast: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    textAlign: "center",
    marginTop: 10,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    textAlign: "center",
    paddingVertical: 8,
  },

  /* Nutrition */
  nutritionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroStack: {
    flex: 1,
    marginLeft: 16,
    gap: 10,
  },
  macroItem: {},
  macroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_600SemiBold`,
    marginRight: 6,
  },
  macroGrams: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    flex: 1,
  },
  macroPct: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_500Medium`,
  },

  /* Neighborhood card */
  hoodCard: {
    backgroundColor: colors.accentSage,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 4,
  },
  hoodName: {
    fontSize: 22,
    color: "#FFFFFF",
    fontFamily: `${fonts.display}_400Regular`,
  },
  hoodBorough: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 2,
  },
  hoodDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 14,
  },
  hoodStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  hoodStat: {
    alignItems: "center",
  },
  hoodStatVal: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: `${fonts.display}_400Regular`,
  },
  hoodStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    fontFamily: `${fonts.body}_700Bold`,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  /* Chip grid */
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
});

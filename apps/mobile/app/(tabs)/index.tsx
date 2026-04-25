import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, radius, fonts } from "../../theme/tokens";
import { Card } from "../../components/ui/Card";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Chip } from "../../components/ui/Chip";
import { RingGauge } from "../../components/ui/RingGauge";
import { MacroBar } from "../../components/ui/MacroBar";
import { ButtonPrimary } from "../../components/ui/ButtonPrimary";
import { ButtonOutline } from "../../components/ui/ButtonOutline";

// ---------- types ----------

interface WorkoutRoutine {
  name: string;
  exercises: string[];
  lastWorkout?: string; // ISO date string
}

interface NutritionEntry {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SavedNeighborhood {
  name: string;
  borough: string;
  aqi?: number;
  lifeExp?: number;
  walkScore?: number;
}

// ---------- helpers ----------

const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const MONTHS = [
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function aqiColor(val: number): string {
  if (val <= 50) return colors.accentSage;
  if (val <= 100) return colors.caution;
  return colors.alert;
}

function daysAgoText(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const diff = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

// ---------- component ----------

export default function HealthScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [nutritionTotals, setNutritionTotals] = useState<NutritionEntry>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [nutritionGoals, setNutritionGoals] =
    useState<NutritionGoals>(DEFAULT_GOALS);
  const [neighborhood, setNeighborhood] = useState<SavedNeighborhood | null>(
    null
  );

  const loadData = useCallback(async () => {
    try {
      const [name, routineRaw, logRaw, goalsRaw, hoodRaw] = await Promise.all([
        AsyncStorage.getItem("pulse-user-name"),
        AsyncStorage.getItem("pulse-workout-routine"),
        AsyncStorage.getItem("pulse-nutrition-log"),
        AsyncStorage.getItem("pulse-nutrition-goals"),
        AsyncStorage.getItem("pulse-neighborhood"),
      ]);

      setUserName(name ?? "");

      if (routineRaw) {
        setRoutine(JSON.parse(routineRaw));
      } else {
        setRoutine(null);
      }

      // Sum today's nutrition entries
      if (logRaw) {
        const entries: NutritionEntry[] = JSON.parse(logRaw);
        const totals = entries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein: acc.protein + e.protein,
            carbs: acc.carbs + e.carbs,
            fat: acc.fat + e.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setNutritionTotals(totals);
      } else {
        setNutritionTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      }

      if (goalsRaw) {
        setNutritionGoals(JSON.parse(goalsRaw));
      }

      if (hoodRaw) {
        setNeighborhood(JSON.parse(hoodRaw));
      }
    } catch {
      // silently fail — defaults are fine
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const aqiValue = 43;
  const greeting = getGreeting();
  const dateStr = getFormattedDate();
  const greetingLine = userName ? `${greeting}, ${userName}` : greeting;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ==================== 1. STATUS TICKER ==================== */}
      <View style={styles.tickerContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tickerScroll}
        >
          <Chip label="COVID Low" variant="good" />
          <View style={styles.tickerGap} />
          <Chip label="Flu Declining" variant="good" />
          <View style={styles.tickerGap} />
          <Chip label="Water Safe" variant="good" />
          <View style={styles.tickerGap} />
          <Chip label="Pollen Moderate" variant="warn" />
        </ScrollView>
      </View>

      {/* ==================== 2. GREETING HERO + AQI ==================== */}
      <View style={styles.heroRow}>
        <View style={styles.heroText}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.greetingText}>{greetingLine}</Text>
          <Text style={styles.locationText}>
            {"📍"} Long Island City {"·"} 53{"°"} Partly
            Cloudy
          </Text>
        </View>
        <RingGauge
          value={aqiValue}
          max={200}
          color={aqiColor(aqiValue)}
          size={64}
          label="AQI"
        />
      </View>

      {/* ==================== 3. TODAY'S WORKOUT ==================== */}
      <Card accent style={styles.sectionCard}>
        <SectionLabel icon={"🏋️"}>
          TODAY&apos;S WORKOUT
        </SectionLabel>

        {routine ? (
          <>
            <Text style={styles.workoutTitle}>{routine.name}</Text>
            {routine.exercises.map((ex, i) => (
              <Text key={i} style={styles.exerciseItem}>
                {"•"} {ex}
              </Text>
            ))}
            <ButtonPrimary
              label={"▶  Start Workout"}
              onPress={() => {}}
              style={styles.workoutButton}
            />
            {routine.lastWorkout ? (
              <Text style={styles.lastWorkoutText}>
                Last workout: {daysAgoText(routine.lastWorkout)}
              </Text>
            ) : null}
          </>
        ) : (
          <ButtonOutline
            label="Choose a routine →"
            onPress={() => {}}
            style={styles.workoutButton}
          />
        )}
      </Card>

      {/* ==================== 4. TODAY'S NUTRITION ==================== */}
      <Card style={styles.sectionCard}>
        <SectionLabel icon={"🍽"}>TODAY&apos;S NUTRITION</SectionLabel>

        <View style={styles.nutritionRow}>
          <View style={styles.nutritionRing}>
            <RingGauge
              value={nutritionTotals.calories}
              max={nutritionGoals.calories}
              color={colors.accentSage}
              size={72}
              unit="CAL"
            />
            <Text style={styles.calGoalText}>
              /{nutritionGoals.calories.toLocaleString()}
            </Text>
          </View>

          <View style={styles.macroBars}>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{nutritionTotals.protein}g</Text>
              <View style={styles.macroBarWrap}>
                <MacroBar
                  value={nutritionTotals.protein}
                  max={nutritionGoals.protein}
                />
              </View>
              <Text style={styles.macroPct}>
                {nutritionGoals.protein > 0
                  ? Math.round(
                      (nutritionTotals.protein / nutritionGoals.protein) * 100
                    )
                  : 0}
                %
              </Text>
            </View>

            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{nutritionTotals.carbs}g</Text>
              <View style={styles.macroBarWrap}>
                <MacroBar
                  value={nutritionTotals.carbs}
                  max={nutritionGoals.carbs}
                />
              </View>
              <Text style={styles.macroPct}>
                {nutritionGoals.carbs > 0
                  ? Math.round(
                      (nutritionTotals.carbs / nutritionGoals.carbs) * 100
                    )
                  : 0}
                %
              </Text>
            </View>

            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{nutritionTotals.fat}g</Text>
              <View style={styles.macroBarWrap}>
                <MacroBar
                  value={nutritionTotals.fat}
                  max={nutritionGoals.fat}
                />
              </View>
              <Text style={styles.macroPct}>
                {nutritionGoals.fat > 0
                  ? Math.round(
                      (nutritionTotals.fat / nutritionGoals.fat) * 100
                    )
                  : 0}
                %
              </Text>
            </View>
          </View>
        </View>

        <ButtonOutline
          label="+ Log Food"
          onPress={() => {}}
          style={styles.logFoodButton}
        />
      </Card>

      {/* ==================== 5. YOUR NEIGHBORHOOD ==================== */}
      <View style={styles.neighborhoodCard}>
        <SectionLabel icon={"📍"}>YOUR NEIGHBORHOOD</SectionLabel>

        {neighborhood ? (
          <>
            <Text style={styles.hoodName}>{neighborhood.name}</Text>
            <Text style={styles.hoodBorough}>{neighborhood.borough}</Text>

            <View style={styles.hoodDivider} />

            <View style={styles.hoodStatsRow}>
              <View style={styles.hoodStat}>
                <Text style={styles.hoodStatValue}>
                  {neighborhood.aqi ?? "--"}
                </Text>
                <Text style={styles.hoodStatLabel}>AQI</Text>
              </View>
              <View style={styles.hoodStat}>
                <Text style={styles.hoodStatValue}>
                  {neighborhood.lifeExp ?? "--"}
                </Text>
                <Text style={styles.hoodStatLabel}>LIFE EXP</Text>
              </View>
              <View style={styles.hoodStat}>
                <Text style={styles.hoodStatValue}>
                  {neighborhood.walkScore ?? "--"}
                </Text>
                <Text style={styles.hoodStatLabel}>WALK</Text>
              </View>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={() => {}} activeOpacity={0.8}>
            <Text style={styles.hoodPrompt}>
              Set your neighborhood {"→"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ==================== 6. NYC HEALTH STATUS ==================== */}
      <Card style={styles.sectionCard}>
        <SectionLabel icon={"📊"}>NYC HEALTH STATUS</SectionLabel>

        <View style={styles.chipWrap}>
          <View style={styles.chipItem}>
            <Chip label="COVID Low" variant="good" />
          </View>
          <View style={styles.chipItem}>
            <Chip label="Flu Declining" variant="good" />
          </View>
          <View style={styles.chipItem}>
            <Chip label="Water Safe" variant="good" />
          </View>
          <View style={styles.chipItem}>
            <Chip label="Pollen Moderate" variant="warn" />
          </View>
          <View style={styles.chipItem}>
            <Chip label="Rats High" variant="alert" />
          </View>
        </View>
      </Card>

      {/* bottom spacer for tab bar */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ---------- styles ----------

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 32,
  },

  // -- 1. ticker --
  tickerContainer: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 999,
    marginHorizontal: 20,
    padding: 6,
    marginBottom: 20,
  },
  tickerScroll: {
    flexDirection: "row",
    alignItems: "center",
  },
  tickerGap: {
    width: 6,
  },

  // -- 2. hero --
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroText: {
    flex: 1,
    marginRight: 16,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "PlusJakartaSans_400Regular",
  },

  // -- 3. workout --
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  workoutTitle: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 8,
  },
  exerciseItem: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 22,
    paddingLeft: 4,
  },
  workoutButton: {
    marginTop: 14,
  },
  lastWorkoutText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    marginTop: 8,
  },

  // -- 4. nutrition --
  nutritionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  nutritionRing: {
    alignItems: "center",
    marginRight: 18,
  },
  calGoalText: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: "PlusJakartaSans_400Regular",
    marginTop: 2,
  },
  macroBars: {
    flex: 1,
    justifyContent: "center",
    gap: 10,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroLabel: {
    width: 50,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  macroValue: {
    width: 36,
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: "PlusJakartaSans_600SemiBold",
    textAlign: "right",
    marginRight: 8,
  },
  macroBarWrap: {
    flex: 1,
  },
  macroPct: {
    width: 32,
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "right",
    marginLeft: 6,
  },
  logFoodButton: {
    marginTop: 14,
  },

  // -- 5. neighborhood --
  neighborhoodCard: {
    backgroundColor: colors.accentSage,
    borderRadius: radius.md,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  hoodName: {
    fontSize: 22,
    color: "#FFFFFF",
    fontFamily: "DMSerifDisplay_400Regular",
    marginBottom: 2,
  },
  hoodBorough: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "PlusJakartaSans_500Medium",
    marginBottom: 12,
  },
  hoodDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  hoodStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  hoodStat: {
    alignItems: "center",
  },
  hoodStatValue: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "DMSerifDisplay_400Regular",
  },
  hoodStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  hoodPrompt: {
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSans_600SemiBold",
    marginTop: 4,
  },

  // -- 6. health status --
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chipItem: {
    // chip already has alignSelf flex-start
  },

  // -- bottom --
  bottomSpacer: {
    height: 24,
  },
});

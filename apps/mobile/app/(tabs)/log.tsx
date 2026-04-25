import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts, radius } from "../../theme/tokens";
import { PageTitle } from "../../components/ui/PageTitle";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Card } from "../../components/ui/Card";
import { RingGauge } from "../../components/ui/RingGauge";
import { MacroBar } from "../../components/ui/MacroBar";
import { ButtonPrimary } from "../../components/ui/ButtonPrimary";
import { ButtonOutline } from "../../components/ui/ButtonOutline";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface LogEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealSlot: "breakfast" | "lunch" | "dinner" | "snack";
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(): string {
  const d = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function LogScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [goals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [refreshing, setRefreshing] = useState(false);

  /* Load log from AsyncStorage */
  const loadLog = useCallback(async () => {
    try {
      const key = `pulse-log-${todayKey()}`;
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Support both old shape { entries: [...] } and plain array
        const items: LogEntry[] = Array.isArray(parsed) ? parsed : parsed.entries ?? [];
        setEntries(items);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLog();
    setRefreshing(false);
  }, [loadLog]);

  /* Compute totals */
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const proteinPct = goals.protein > 0 ? Math.round((totals.protein / goals.protein) * 100) : 0;
  const carbsPct = goals.carbs > 0 ? Math.round((totals.carbs / goals.carbs) * 100) : 0;
  const fatPct = goals.fat > 0 ? Math.round((totals.fat / goals.fat) * 100) : 0;

  /* Partition entries by meal */
  const breakfast = entries.filter((e) => e.mealSlot === "breakfast");
  const lunch = entries.filter((e) => e.mealSlot === "lunch");
  const dinnerSnacks = entries.filter((e) => e.mealSlot === "dinner" || e.mealSlot === "snack");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentSage} />
      }
    >
      {/* Header */}
      <PageTitle>Today's Log</PageTitle>
      <Text style={styles.subtitle}>
        {formatDate()} {"·"} {totals.calories} / {goals.calories.toLocaleString()} cal
      </Text>

      {/* Macro summary card */}
      <Card tone="sage" style={styles.macroCard}>
        <View style={styles.macroRow}>
          {/* Left: calorie ring */}
          <View style={styles.ringWrap}>
            <RingGauge
              value={totals.calories}
              max={goals.calories}
              color={colors.accentSage}
              size={72}
              label="Cal"
            />
            <Text style={styles.ringGoal}>
              {totals.calories}/{goals.calories.toLocaleString()}
            </Text>
          </View>

          {/* Right: macro bars */}
          <View style={styles.macroBars}>
            {/* Protein */}
            <View style={styles.macroBarRow}>
              <View style={styles.macroLabelRow}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValues}>{totals.protein}/{goals.protein}g</Text>
                <Text style={styles.macroPct}>{proteinPct}%</Text>
              </View>
              <MacroBar value={totals.protein} max={goals.protein} />
            </View>

            {/* Carbs */}
            <View style={styles.macroBarRow}>
              <View style={styles.macroLabelRow}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValues}>{totals.carbs}/{goals.carbs}g</Text>
                <Text style={styles.macroPct}>{carbsPct}%</Text>
              </View>
              <MacroBar value={totals.carbs} max={goals.carbs} />
            </View>

            {/* Fat */}
            <View style={styles.macroBarRow}>
              <View style={styles.macroLabelRow}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValues}>{totals.fat}/{goals.fat}g</Text>
                <Text style={styles.macroPct}>{fatPct}%</Text>
              </View>
              <MacroBar value={totals.fat} max={goals.fat} />
            </View>
          </View>
        </View>
      </Card>

      {/* BREAKFAST */}
      <SectionLabel icon={"☀"}>BREAKFAST</SectionLabel>
      <MealCard entries={breakfast} />

      {/* LUNCH */}
      <SectionLabel icon={"🌤"}>LUNCH</SectionLabel>
      <MealCard entries={lunch} />

      {/* DINNER & SNACKS */}
      <SectionLabel icon={"🌙"}>DINNER & SNACKS</SectionLabel>
      <MealCard entries={dinnerSnacks} />

      {/* Action buttons */}
      <View style={styles.buttonsWrap}>
        <ButtonPrimary
          label="+ Log Food"
          onPress={() => router.push("/scan")}
        />
        <ButtonOutline
          label="+ Log Workout"
          onPress={() => router.push("/scan")}
          style={{ marginTop: 10 }}
        />
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Meal card sub-component                                            */
/* ------------------------------------------------------------------ */

function MealCard({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyText}>Nothing logged yet</Text>
      </Card>
    );
  }

  return (
    <Card>
      {entries.map((entry, idx) => (
        <View key={entry.id}>
          {idx > 0 && <View style={styles.entryDivider} />}
          <View style={styles.entryRow}>
            <Text style={styles.entryName}>{entry.name}</Text>
            <Text style={styles.entryCal}>{entry.calories}</Text>
          </View>
          <Text style={styles.entryMacros}>
            {entry.protein}g P {"·"} {entry.carbs}g C {"·"} {entry.fat}g F
          </Text>
        </View>
      ))}
    </Card>
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

  /* Macro summary card */
  macroCard: {
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ringWrap: {
    alignItems: "center",
    marginRight: 18,
  },
  ringGoal: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 4,
  },
  macroBars: {
    flex: 1,
    gap: 10,
  },
  macroBarRow: {
    width: "100%",
  },
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
  macroValues: {
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

  /* Empty state */
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    textAlign: "center",
    paddingVertical: 12,
  },

  /* Entry rows */
  entryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`,
    flex: 1,
  },
  entryCal: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
  },
  entryMacros: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 3,
  },

  /* Buttons */
  buttonsWrap: {
    marginTop: 24,
  },
});

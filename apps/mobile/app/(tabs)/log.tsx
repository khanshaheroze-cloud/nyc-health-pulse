import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts, radius } from "../../theme/tokens";
import { PageTitle } from "../../components/ui/PageTitle";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Card } from "../../components/ui/Card";
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

const DEFAULT_GOALS: NutritionGoals = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

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
/*  Calorie ring with DM Serif center                                  */
/* ------------------------------------------------------------------ */

function CalorieRing({ cal, goal }: { cal: number; goal: number }) {
  const size = 80;
  const sw = 7;
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
            cx={size / 2} cy={size / 2} r={r}
            stroke={colors.accentSage} strokeWidth={sw} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ}`} strokeDashoffset={offset}
            rotation={-90} origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={s.ringValue}>{cal.toLocaleString()}</Text>
        <Text style={s.ringUnit}>CAL</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function LogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [goals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [refreshing, setRefreshing] = useState(false);

  const loadLog = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(`pulse-log-${todayKey()}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setEntries(Array.isArray(parsed) ? parsed : parsed.entries ?? []);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => { loadLog(); }, [loadLog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLog();
    setRefreshing(false);
  }, [loadLog]);

  const totals = entries.reduce(
    (a, e) => ({
      calories: a.calories + e.calories,
      protein: a.protein + e.protein,
      carbs: a.carbs + e.carbs,
      fat: a.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const proteinPct = goals.protein > 0 ? Math.round((totals.protein / goals.protein) * 100) : 0;
  const carbsPct = goals.carbs > 0 ? Math.round((totals.carbs / goals.carbs) * 100) : 0;
  const fatPct = goals.fat > 0 ? Math.round((totals.fat / goals.fat) * 100) : 0;

  const breakfast = entries.filter((e) => e.mealSlot === "breakfast");
  const lunch = entries.filter((e) => e.mealSlot === "lunch");
  const dinnerSnacks = entries.filter((e) => e.mealSlot === "dinner" || e.mealSlot === "snack");

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentSage} />}
    >
      <PageTitle>Today's Log</PageTitle>
      <Text style={s.subtitle}>
        {formatDate()} · {totals.calories} / {goals.calories.toLocaleString()} cal
      </Text>

      {/* ── Macro summary ── */}
      <Card tone="sage" style={{ marginBottom: 4 }}>
        <View style={s.macroRow}>
          <CalorieRing cal={totals.calories} goal={goals.calories} />
          <View style={s.macroStack}>
            {/* Protein */}
            <View>
              <View style={s.macroLabelRow}>
                <Text style={s.macroLabel}>Protein</Text>
                <Text style={s.macroGrams}>{totals.protein}/{goals.protein}g</Text>
                <Text style={[s.macroPct, proteinPct > 0 && { color: colors.accentSage }]}>{proteinPct}%</Text>
              </View>
              <MacroBar value={totals.protein} max={goals.protein} />
            </View>
            {/* Carbs */}
            <View>
              <View style={s.macroLabelRow}>
                <Text style={s.macroLabel}>Carbs</Text>
                <Text style={s.macroGrams}>{totals.carbs}/{goals.carbs}g</Text>
                <Text style={[s.macroPct, carbsPct > 0 && { color: colors.accentSage }]}>{carbsPct}%</Text>
              </View>
              <MacroBar value={totals.carbs} max={goals.carbs} />
            </View>
            {/* Fat */}
            <View>
              <View style={s.macroLabelRow}>
                <Text style={s.macroLabel}>Fat</Text>
                <Text style={s.macroGrams}>{totals.fat}/{goals.fat}g</Text>
                <Text style={[s.macroPct, fatPct > 0 && { color: colors.accentSage }]}>{fatPct}%</Text>
              </View>
              <MacroBar value={totals.fat} max={goals.fat} />
            </View>
          </View>
        </View>
      </Card>

      {/* ── Meals ── */}
      <SectionLabel icon="☀">BREAKFAST</SectionLabel>
      <MealCard entries={breakfast} />

      <SectionLabel icon="🌤">LUNCH</SectionLabel>
      <MealCard entries={lunch} />

      <SectionLabel icon="🌙">DINNER & SNACKS</SectionLabel>
      <MealCard entries={dinnerSnacks} />

      {/* ── Buttons ── */}
      <View style={{ marginTop: 24 }}>
        <ButtonPrimary label="+ Log Food" onPress={() => router.push("/scan")} />
        <ButtonOutline label="+ Log Workout" onPress={() => router.push("/scan")} style={{ marginTop: 10 }} />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ */
/*  Meal card                                                          */
/* ------------------------------------------------------------------ */

function MealCard({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <Text style={s.emptyText}>Nothing logged yet</Text>
      </Card>
    );
  }

  return (
    <Card>
      {entries.map((entry, idx) => (
        <View key={entry.id}>
          {idx > 0 && <View style={s.entryDiv} />}
          <View style={s.entryRow}>
            <Text style={s.entryName}>{entry.name}</Text>
            <Text style={s.entryCal}>{entry.calories}</Text>
          </View>
          <Text style={s.entryMacros}>
            {entry.protein}g P · {entry.carbs}g C · {entry.fat}g F
          </Text>
        </View>
      ))}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  subtitle: {
    fontSize: 13, color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`, marginTop: 4, marginBottom: 18,
  },

  /* Ring */
  ringValue: {
    fontSize: 22, color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
  },
  ringUnit: {
    fontSize: 9, fontWeight: "700", color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`, marginTop: -2,
  },

  /* Macro summary */
  macroRow: { flexDirection: "row", alignItems: "center" },
  macroStack: { flex: 1, marginLeft: 18, gap: 10 },
  macroLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  macroLabel: {
    fontSize: 12, fontWeight: "600", color: colors.textSecondary,
    fontFamily: `${fonts.body}_600SemiBold`, marginRight: 6,
  },
  macroGrams: {
    fontSize: 11, color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`, flex: 1,
  },
  macroPct: {
    fontSize: 11, color: colors.textTertiary,
    fontFamily: `${fonts.body}_500Medium`,
  },

  /* Entries */
  emptyText: {
    fontSize: 13, color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`, textAlign: "center", paddingVertical: 12,
  },
  entryDiv: { height: 1, backgroundColor: colors.borderLight, marginVertical: 10 },
  entryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryName: {
    fontSize: 14, fontWeight: "600", color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`, flex: 1,
  },
  entryCal: {
    fontSize: 16, color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
  },
  entryMacros: {
    fontSize: 11, color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`, marginTop: 3,
  },
});

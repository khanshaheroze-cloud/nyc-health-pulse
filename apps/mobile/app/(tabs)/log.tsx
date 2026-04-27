import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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

type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [goals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [refreshing, setRefreshing] = useState(false);

  /* ── Food log modal state ── */
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [foodCal, setFoodCal] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [foodSlot, setFoodSlot] = useState<MealSlot>("breakfast");

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

  const openFoodModal = () => {
    setFoodName("");
    setFoodCal("");
    setFoodProtein("");
    setFoodCarbs("");
    setFoodFat("");
    const h = new Date().getHours();
    if (h < 11) setFoodSlot("breakfast");
    else if (h < 15) setFoodSlot("lunch");
    else if (h < 20) setFoodSlot("dinner");
    else setFoodSlot("snack");
    setShowFoodModal(true);
  };

  const saveFoodEntry = async () => {
    if (!foodName.trim()) {
      Alert.alert("Required", "Please enter a food name.");
      return;
    }
    const entry: LogEntry = {
      id: Date.now().toString(),
      name: foodName.trim(),
      calories: Number(foodCal) || 0,
      protein: Number(foodProtein) || 0,
      carbs: Number(foodCarbs) || 0,
      fat: Number(foodFat) || 0,
      mealSlot: foodSlot,
    };
    const key = `pulse-log-${todayKey()}`;
    try {
      const raw = await AsyncStorage.getItem(key);
      const existing: LogEntry[] = raw
        ? (() => { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : p.entries ?? []; } catch { return []; } })()
        : [];
      existing.push(entry);
      await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch {}
    setShowFoodModal(false);
    await loadLog();
  };

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
        <ButtonPrimary label="+ Log Food" onPress={openFoodModal} />
        <ButtonOutline
          label="+ Log Workout"
          onPress={() => Alert.alert("Coming Soon", "Workout logging coming soon!")}
          style={{ marginTop: 10 }}
        />
      </View>

      <View style={{ height: 100 }} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  FOOD LOG MODAL                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFoodModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFoodModal(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={s.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFoodModal(false)}
          />
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Log Food</Text>

            <Text style={s.inputLabel}>Food Name</Text>
            <TextInput
              style={s.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g. Grilled Chicken Bowl"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={s.inputLabel}>Calories</Text>
            <TextInput
              style={s.input}
              value={foodCal}
              onChangeText={setFoodCal}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
            />

            <View style={s.macroInputRow}>
              <View style={s.macroInputCol}>
                <Text style={s.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={s.input}
                  value={foodProtein}
                  onChangeText={setFoodProtein}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={s.macroInputCol}>
                <Text style={s.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={s.input}
                  value={foodCarbs}
                  onChangeText={setFoodCarbs}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={s.macroInputCol}>
                <Text style={s.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={s.input}
                  value={foodFat}
                  onChangeText={setFoodFat}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <Text style={s.inputLabel}>Meal</Text>
            <View style={s.slotRow}>
              {MEAL_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[s.slotBtn, foodSlot === slot && s.slotBtnActive]}
                  onPress={() => setFoodSlot(slot)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.slotBtnText, foodSlot === slot && s.slotBtnTextActive]}>
                    {MEAL_LABELS[slot]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={saveFoodEntry} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.cancelBtn}
              onPress={() => setShowFoodModal(false)}
              activeOpacity={0.7}
            >
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end" as const,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: "center" as const,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: `${fonts.display}_400Regular`,
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: `${fonts.body}_600SemiBold`,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: `${fonts.body}_400Regular`,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  macroInputRow: {
    flexDirection: "row" as const,
    gap: 10,
  },
  macroInputCol: {
    flex: 1,
  },
  slotRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 18,
  },
  slotBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bg,
    alignItems: "center" as const,
  },
  slotBtnActive: {
    backgroundColor: colors.accentSage,
    borderColor: colors.accentSage,
  },
  slotBtnText: {
    fontSize: 12,
    fontFamily: `${fonts.body}_600SemiBold`,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  slotBtnTextActive: {
    color: "#FFFFFF",
  },
  saveBtn: {
    backgroundColor: colors.accentSage,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center" as const,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: `${fonts.body}_700Bold`,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center" as const,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: `${fonts.body}_500Medium`,
    fontWeight: "500" as const,
    color: colors.textTertiary,
  },
});

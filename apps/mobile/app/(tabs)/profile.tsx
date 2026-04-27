import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

interface WorkoutExercise {
  name: string;
  sets: string;
  reps: string;
}

interface WorkoutRoutine {
  name: string;
  exercises: WorkoutExercise[];
}

type ActiveModal = "goals" | "neighborhood" | "workout" | null;

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

  /* ── Modal state ── */
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [goalCalories, setGoalCalories] = useState("2000");
  const [goalProtein, setGoalProtein] = useState("150");
  const [goalCarbs, setGoalCarbs] = useState("200");
  const [goalFat, setGoalFat] = useState("65");
  const [hoodName, setHoodName] = useState("");
  const [hoodBorough, setHoodBorough] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([
    { name: "", sets: "", reps: "" },
  ]);

  const openModal = async (modal: ActiveModal) => {
    if (modal === "goals") {
      const raw = await AsyncStorage.getItem(KEY_NUTRITION);
      if (raw) {
        try {
          const p = JSON.parse(raw);
          setGoalCalories(String(p.calories ?? 2000));
          setGoalProtein(String(p.protein ?? 150));
          setGoalCarbs(String(p.carbs ?? 200));
          setGoalFat(String(p.fat ?? 65));
        } catch {}
      }
    } else if (modal === "neighborhood") {
      const raw = await AsyncStorage.getItem(KEY_NEIGHBORHOOD);
      if (raw) {
        try {
          const p = JSON.parse(raw);
          setHoodName(p.name ?? "");
          setHoodBorough(p.borough ?? "");
        } catch {}
      }
    } else if (modal === "workout") {
      const raw = await AsyncStorage.getItem("pulse-workout-routine");
      if (raw) {
        try {
          const p = JSON.parse(raw);
          setWorkoutName(p.name ?? "");
          setWorkoutExercises(
            p.exercises?.length
              ? p.exercises.map((e: any) => ({
                  name: e.name ?? "",
                  sets: String(e.sets ?? ""),
                  reps: String(e.reps ?? ""),
                }))
              : [{ name: "", sets: "", reps: "" }]
          );
        } catch {}
      }
    }
    setActiveModal(modal);
  };

  const saveGoals = async () => {
    const data = {
      calories: Number(goalCalories) || 2000,
      protein: Number(goalProtein) || 150,
      carbs: Number(goalCarbs) || 200,
      fat: Number(goalFat) || 65,
    };
    await AsyncStorage.setItem(KEY_NUTRITION, JSON.stringify(data));
    setCalGoal(data.calories.toLocaleString());
    setActiveModal(null);
  };

  const saveNeighborhood = async () => {
    if (!hoodName.trim()) {
      Alert.alert("Required", "Please enter a neighborhood name.");
      return;
    }
    const data = { name: hoodName.trim(), borough: hoodBorough.trim() };
    await AsyncStorage.setItem(KEY_NEIGHBORHOOD, JSON.stringify(data));
    setNeighborhood(data);
    setActiveModal(null);
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Required", "Please enter a routine name.");
      return;
    }
    const validExercises = workoutExercises
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        sets: Number(e.sets) || 3,
        reps: Number(e.reps) || 10,
      }));
    const data = { name: workoutName.trim(), exercises: validExercises };
    await AsyncStorage.setItem("pulse-workout-routine", JSON.stringify(data));
    setActiveModal(null);
  };

  const addExerciseRow = () => {
    setWorkoutExercises([...workoutExercises, { name: "", sets: "", reps: "" }]);
  };

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: string) => {
    const updated = [...workoutExercises];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutExercises(updated);
  };

  const removeExercise = (index: number) => {
    if (workoutExercises.length <= 1) return;
    setWorkoutExercises(workoutExercises.filter((_, i) => i !== index));
  };

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
      else if (item.label === "Goals & Targets") openModal("goals");
      else if (item.label === "Neighborhood") openModal("neighborhood");
      else if (item.label === "Workout Plan") openModal("workout");
      else if (item.label === "Notifications")
        Alert.alert("Coming Soon", "Push notifications coming soon!");
      else if (item.label === "Connected Apps")
        Alert.alert("Coming Soon", "Health Connect integration coming soon!");
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

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MODALS                                                       */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── Goals & Targets ── */}
      <Modal
        visible={activeModal === "goals"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActiveModal(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Goals & Targets</Text>

            <Text style={styles.inputLabel}>Daily Calories</Text>
            <TextInput
              style={styles.input}
              value={goalCalories}
              onChangeText={setGoalCalories}
              keyboardType="numeric"
              placeholder="2000"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              value={goalProtein}
              onChangeText={setGoalProtein}
              keyboardType="numeric"
              placeholder="150"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              value={goalCarbs}
              onChangeText={setGoalCarbs}
              keyboardType="numeric"
              placeholder="200"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>Fat (g)</Text>
            <TextInput
              style={styles.input}
              value={goalFat}
              onChangeText={setGoalFat}
              keyboardType="numeric"
              placeholder="65"
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveGoals} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setActiveModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Neighborhood ── */}
      <Modal
        visible={activeModal === "neighborhood"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActiveModal(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Neighborhood</Text>

            <Text style={styles.inputLabel}>Neighborhood Name</Text>
            <TextInput
              style={styles.input}
              value={hoodName}
              onChangeText={setHoodName}
              placeholder="e.g. Astoria"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>Borough</Text>
            <TextInput
              style={styles.input}
              value={hoodBorough}
              onChangeText={setHoodBorough}
              placeholder="e.g. Queens"
              placeholderTextColor={colors.textTertiary}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveNeighborhood} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setActiveModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Workout Plan ── */}
      <Modal
        visible={activeModal === "workout"}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActiveModal(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Workout Plan</Text>

            <Text style={styles.inputLabel}>Routine Name</Text>
            <TextInput
              style={styles.input}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g. Push Day"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.inputLabel, { marginTop: 8 }]}>Exercises</Text>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {workoutExercises.map((ex, i) => (
                <View key={i} style={styles.exerciseRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={ex.name}
                    onChangeText={(v) => updateExercise(i, "name", v)}
                    placeholder="Exercise"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    value={ex.sets}
                    onChangeText={(v) => updateExercise(i, "sets", v)}
                    keyboardType="numeric"
                    placeholder="Sets"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, styles.smallInput]}
                    value={ex.reps}
                    onChangeText={(v) => updateExercise(i, "reps", v)}
                    keyboardType="numeric"
                    placeholder="Reps"
                    placeholderTextColor={colors.textTertiary}
                  />
                  {workoutExercises.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeExercise(i)}
                      style={styles.removeExBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.removeExText}>x</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={addExerciseRow} activeOpacity={0.7} style={styles.addExBtn}>
              <Text style={styles.addExText}>+ Add Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={saveWorkout} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setActiveModal(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  /* ── Modals ── */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
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
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: `${fonts.display}_400Regular`,
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: `${fonts.body}_600SemiBold`,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
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
  saveBtn: {
    backgroundColor: colors.accentSage,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: `${fonts.body}_700Bold`,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: `${fonts.body}_500Medium`,
    fontWeight: "500",
    color: colors.textTertiary,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  smallInput: {
    width: 56,
    flex: 0,
    textAlign: "center",
    marginBottom: 0,
  },
  removeExBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  removeExText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  addExBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 4,
  },
  addExText: {
    fontSize: 13,
    fontFamily: `${fonts.body}_600SemiBold`,
    fontWeight: "600",
    color: colors.accentSage,
  },
});

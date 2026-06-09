import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts, radius } from "../theme/tokens";
import { Card } from "./ui/Card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CompletedSet {
  exerciseIdx: number;
  set: number;
  weight: number;
  reps: number;
}

export interface WorkoutState {
  templateName: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    restSec: number;
  }[];
  currentExerciseIdx: number;
  currentSet: number;
  completedSets: CompletedSet[];
  startedAt: number;
  resting: boolean;
  restEndAt: number;
}

interface Props {
  state: WorkoutState;
  onChange: (state: WorkoutState) => void;
  onFinish: () => void;
}

const STORAGE_KEY = "pulse-active-workout";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTargetReps(repsStr: string): number {
  // "6-8" -> 8, "5" -> 5, "12 each" -> 12, "to failure" -> 0, "5/3/1+" -> 5
  const match = repsStr.match(/(\d+)/g);
  if (!match) return 0;
  return parseInt(match[match.length - 1], 10);
}

/* ------------------------------------------------------------------ */
/*  Rest Timer Ring                                                    */
/* ------------------------------------------------------------------ */

function RestTimerRing({
  remaining,
  total,
  size = 140,
}: {
  remaining: number;
  total: number;
  size?: number;
}) {
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const fill = total > 0 ? Math.max(0, remaining / total) : 0;
  const offset = circ * (1 - fill);

  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.borderLight}
          strokeWidth={sw}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accentSage}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={restStyles.timerSec}>{Math.ceil(remaining)}</Text>
        <Text style={restStyles.timerLabel}>seconds</Text>
      </View>
    </View>
  );
}

const restStyles = StyleSheet.create({
  timerSec: {
    fontSize: 40,
    color: colors.accentSage,
    fontFamily: `${fonts.display}_400Regular`,
  },
  timerLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_500Medium`,
    marginTop: -2,
  },
});

/* ------------------------------------------------------------------ */
/*  Workout Summary                                                    */
/* ------------------------------------------------------------------ */

function WorkoutSummary({
  state,
  onFinish,
}: {
  state: WorkoutState;
  onFinish: () => void;
}) {
  const duration = Date.now() - state.startedAt;
  const totalSets = state.completedSets.length;
  const totalVolume = state.completedSets.reduce(
    (sum, s) => sum + s.weight * s.reps,
    0
  );
  const exercisesDone = new Set(state.completedSets.map((s) => s.exerciseIdx))
    .size;

  const handleFinish = async () => {
    // Save workout log
    const today = new Date().toISOString().split("T")[0];
    const logKey = `pulse-workout-log-${today}`;
    const log = {
      templateName: state.templateName,
      startedAt: state.startedAt,
      finishedAt: Date.now(),
      duration,
      totalSets,
      totalVolume,
      exercisesDone,
      sets: state.completedSets,
    };

    try {
      await AsyncStorage.setItem(logKey, JSON.stringify(log));
    } catch {}

    // Update routine's lastWorkout
    try {
      const raw = await AsyncStorage.getItem("pulse-workout-routine");
      if (raw) {
        const routine = JSON.parse(raw);
        routine.lastWorkout = today;
        await AsyncStorage.setItem(
          "pulse-workout-routine",
          JSON.stringify(routine)
        );
      }
    } catch {}

    // Clear active workout
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}

    onFinish();
  };

  return (
    <Card accent>
      <Text style={s.summaryTitle}>Workout Complete!</Text>
      <Text style={s.summaryTemplateName}>{state.templateName}</Text>

      <View style={s.summaryGrid}>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{formatTime(duration)}</Text>
          <Text style={s.summaryLabel}>Duration</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{totalSets}</Text>
          <Text style={s.summaryLabel}>Sets</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>
            {totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : totalVolume.toLocaleString()}
          </Text>
          <Text style={s.summaryLabel}>Volume (lb)</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{exercisesDone}</Text>
          <Text style={s.summaryLabel}>Exercises</Text>
        </View>
      </View>

      <TouchableOpacity
        style={s.finishBtn}
        onPress={handleFinish}
        activeOpacity={0.8}
      >
        <Text style={s.finishBtnText}>Finish Workout</Text>
      </TouchableOpacity>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  ActiveWorkout Component                                            */
/* ------------------------------------------------------------------ */

export function ActiveWorkout({ state, onChange, onFinish }: Props) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = state.exercises[state.currentExerciseIdx];
  const isWorkoutDone =
    state.currentExerciseIdx >= state.exercises.length;

  // Persist state to AsyncStorage on every change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - state.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.startedAt]);

  // Rest timer
  useEffect(() => {
    if (state.resting && state.restEndAt > 0) {
      timerRef.current = setInterval(() => {
        const rem = (state.restEndAt - Date.now()) / 1000;
        if (rem <= 0) {
          setRestRemaining(0);
          // Auto-advance out of rest
          onChange({ ...state, resting: false, restEndAt: 0 });
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setRestRemaining(rem);
        }
      }, 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setRestRemaining(0);
    }
  }, [state.resting, state.restEndAt]);

  // Pre-fill target reps when exercise changes
  useEffect(() => {
    if (currentExercise) {
      const target = parseTargetReps(currentExercise.reps);
      if (target > 0) setReps(String(target));
      else setReps("");
    }
  }, [state.currentExerciseIdx, state.currentSet]);

  const handleCompleteSet = useCallback(() => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 0;

    if (r === 0) {
      Alert.alert("Enter reps", "How many reps did you complete?");
      return;
    }

    const newCompleted: CompletedSet = {
      exerciseIdx: state.currentExerciseIdx,
      set: state.currentSet,
      weight: w,
      reps: r,
    };

    const completedSets = [...state.completedSets, newCompleted];
    const isLastSet = state.currentSet >= currentExercise.sets;
    const isLastExercise =
      state.currentExerciseIdx >= state.exercises.length - 1;

    if (isLastSet && isLastExercise) {
      // Workout complete
      onChange({
        ...state,
        completedSets,
        currentExerciseIdx: state.exercises.length, // signals done
        resting: false,
        restEndAt: 0,
      });
    } else if (isLastSet) {
      // Move to next exercise, start rest
      onChange({
        ...state,
        completedSets,
        currentExerciseIdx: state.currentExerciseIdx + 1,
        currentSet: 1,
        resting: true,
        restEndAt: Date.now() + currentExercise.restSec * 1000,
      });
      setWeight("");
    } else {
      // Next set, start rest
      onChange({
        ...state,
        completedSets,
        currentSet: state.currentSet + 1,
        resting: true,
        restEndAt: Date.now() + currentExercise.restSec * 1000,
      });
    }
  }, [state, weight, reps, currentExercise, onChange]);

  const handleSkipRest = useCallback(() => {
    onChange({ ...state, resting: false, restEndAt: 0 });
  }, [state, onChange]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      "Cancel Workout?",
      "Your progress will be lost.",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "Cancel Workout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
            onFinish();
          },
        },
      ]
    );
  }, [onFinish]);

  // ── Workout complete screen ──
  if (isWorkoutDone) {
    return <WorkoutSummary state={state} onFinish={onFinish} />;
  }

  // ── Exercise progress bar ──
  const totalExSets = currentExercise.sets;
  const completedInExercise = state.completedSets.filter(
    (cs) => cs.exerciseIdx === state.currentExerciseIdx
  ).length;

  // ── Rest screen ──
  if (state.resting) {
    const nextExercise =
      state.currentSet <= currentExercise.sets
        ? currentExercise
        : state.exercises[state.currentExerciseIdx] ?? null;

    return (
      <Card accent>
        <View style={s.restHeader}>
          <Text style={s.restLabel}>REST</Text>
          <Text style={s.elapsedSmall}>{formatTime(elapsed)}</Text>
        </View>

        <View style={s.restCenter}>
          <RestTimerRing
            remaining={restRemaining}
            total={currentExercise.restSec}
          />
        </View>

        {nextExercise && (
          <Text style={s.nextUp}>
            Next: {currentExercise.name} - Set {state.currentSet} of{" "}
            {currentExercise.sets}
          </Text>
        )}

        <TouchableOpacity
          style={s.skipRestBtn}
          onPress={handleSkipRest}
          activeOpacity={0.7}
        >
          <Text style={s.skipRestText}>Skip Rest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.cancelBtn}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={s.cancelText}>Cancel Workout</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  // ── Active set screen ──
  return (
    <Card accent>
      {/* Header */}
      <View style={s.activeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.templateNameSmall}>{state.templateName}</Text>
          <Text style={s.exerciseName}>{currentExercise.name}</Text>
        </View>
        <View style={s.elapsedBadge}>
          <Text style={s.elapsedText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* Set counter */}
      <View style={s.setCounterRow}>
        <Text style={s.setCounter}>
          Set {state.currentSet} of {totalExSets}
        </Text>
        <Text style={s.targetReps}>Target: {currentExercise.reps}</Text>
      </View>

      {/* Set progress dots */}
      <View style={s.dotsRow}>
        {Array.from({ length: totalExSets }).map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i < completedInExercise && s.dotDone,
              i === completedInExercise && s.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Exercise progress */}
      <View style={s.progressRow}>
        <Text style={s.progressText}>
          Exercise {state.currentExerciseIdx + 1} of {state.exercises.length}
        </Text>
      </View>

      {/* Weight + Reps inputs */}
      <View style={s.inputRow}>
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Weight (lb)</Text>
          <TextInput
            style={s.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        <View style={s.inputDivider} />
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Reps</Text>
          <TextInput
            style={s.input}
            value={reps}
            onChangeText={setReps}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
      </View>

      {/* Complete Set */}
      <TouchableOpacity
        style={s.completeBtn}
        onPress={handleCompleteSet}
        activeOpacity={0.8}
      >
        <Text style={s.completeBtnText}>Complete Set</Text>
      </TouchableOpacity>

      {/* Upcoming exercises */}
      {state.currentExerciseIdx < state.exercises.length - 1 && (
        <View style={s.upcoming}>
          <Text style={s.upcomingLabel}>Coming up:</Text>
          {state.exercises
            .slice(state.currentExerciseIdx + 1, state.currentExerciseIdx + 3)
            .map((ex, i) => (
              <Text key={i} style={s.upcomingItem}>
                {ex.name} — {ex.sets}x{ex.reps}
              </Text>
            ))}
        </View>
      )}

      {/* Cancel */}
      <TouchableOpacity
        style={s.cancelBtn}
        onPress={handleCancel}
        activeOpacity={0.7}
      >
        <Text style={s.cancelText}>Cancel Workout</Text>
      </TouchableOpacity>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  /* Rest screen */
  restHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  restLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.accentSage,
    fontFamily: `${fonts.body}_700Bold`,
  },
  restCenter: {
    alignItems: "center",
    marginVertical: 8,
  },
  nextUp: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_500Medium`,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 16,
  },
  skipRestBtn: {
    backgroundColor: colors.surfaceSage,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  skipRestText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_600SemiBold`,
  },

  /* Active header */
  activeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  templateNameSmall: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
  },
  elapsedBadge: {
    backgroundColor: colors.surfaceSage,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  elapsedText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_600SemiBold`,
  },
  elapsedSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },

  /* Set counter */
  setCounterRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  setCounter: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accentSage,
    fontFamily: `${fonts.body}_700Bold`,
  },
  targetReps: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderLight,
  },
  dotDone: {
    backgroundColor: colors.accentSage,
  },
  dotActive: {
    backgroundColor: colors.accentSageLight,
    borderWidth: 2,
    borderColor: colors.accentSage,
  },

  /* Progress */
  progressRow: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
  },

  /* Inputs */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_600SemiBold`,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surfaceSage,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: `${fonts.body}_700Bold`,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },

  /* Complete set button */
  completeBtn: {
    backgroundColor: colors.accentSage,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  completeBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: `${fonts.body}_700Bold`,
  },

  /* Upcoming */
  upcoming: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
    marginBottom: 8,
  },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  upcomingItem: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    lineHeight: 20,
  },

  /* Cancel */
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_500Medium`,
  },

  /* Summary */
  summaryTitle: {
    fontSize: 24,
    color: colors.accentSage,
    fontFamily: `${fonts.display}_400Regular`,
    textAlign: "center",
    marginBottom: 4,
  },
  summaryTemplateName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_500Medium`,
    textAlign: "center",
    marginBottom: 18,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: "center",
    minWidth: "40%",
    marginBottom: 14,
  },
  summaryVal: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_700Bold`,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: colors.accentSage,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: "center",
  },
  finishBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: `${fonts.body}_700Bold`,
  },
});

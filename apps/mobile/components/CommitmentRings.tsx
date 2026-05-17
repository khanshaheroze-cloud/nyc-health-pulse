import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius } from "../theme/tokens";

/* ── Ring config ────────────────────────────────────────── */

const RING_SIZE = 130;
const CENTER = RING_SIZE / 2;
const STROKE = 10;

const RINGS = [
  { key: "eat", label: "Eat", r: 52, color: "#4A7C59", track: "rgba(74,124,89,0.15)" },
  { key: "move", label: "Move", r: 40, color: "#FF8C42", track: "rgba(255,140,66,0.15)" },
  { key: "routes", label: "Routes", r: 28, color: "#4FC3F7", track: "rgba(79,195,247,0.15)" },
] as const;

/* ── Microcopy helper ───────────────────────────────────── */

function getDefaultMicrocopy(
  hour: number,
  calories: number,
  calorieGoal: number,
  workoutMin: number,
  outdoorMin: number,
  outdoorGoal: number,
): string {
  const eatPct = calorieGoal > 0 ? calories / calorieGoal : 0;
  const movePct = workoutMin / 30;
  const routePct = outdoorGoal > 0 ? outdoorMin / outdoorGoal : 0;
  const allAbove80 = eatPct > 0.8 && movePct > 0.8 && routePct > 0.8;

  if (hour >= 5 && hour < 10 && calories === 0) return "Good morning. What's for breakfast?";
  if (hour >= 10 && hour < 14 && eatPct < 0.3) return "Lunch window open. Log your meal.";
  if (hour >= 14 && hour < 18 && workoutMin === 0) return "Afternoon push — move ring waiting.";
  if (hour >= 18 && hour < 22 && allAbove80) return "Strong day. Close those rings.";
  if (hour >= 18 && hour < 22) return "Evening wind-down. Log dinner.";
  if (hour >= 22 || hour < 5) return "Rest well. Rings reset at midnight.";
  return "Keep going — you're building momentum.";
}

/* ── Props ──────────────────────────────────────────────── */

interface Props {
  calories: number;
  calorieGoal: number;
  workoutMin: number;
  workoutGoal?: number;
  outdoorMin: number;
  outdoorGoal?: number;
  streak: number;
  bestStreak: number;
  microcopy?: string;
}

/* ── Component ──────────────────────────────────────────── */

export function CommitmentRings({
  calories,
  calorieGoal,
  workoutMin,
  workoutGoal = 30,
  outdoorMin,
  outdoorGoal = 20,
  streak,
  bestStreak,
  microcopy,
}: Props) {
  const fractions = [
    calorieGoal > 0 ? Math.min(calories / calorieGoal, 1) : 0,
    workoutGoal > 0 ? Math.min(workoutMin / workoutGoal, 1) : 0,
    outdoorGoal > 0 ? Math.min(outdoorMin / outdoorGoal, 1) : 0,
  ];

  const [animated, setAnimated] = useState([0, 0, 0]);
  const ringScale = useSharedValue(0.9);

  useEffect(() => {
    ringScale.value = withSpring(1, { damping: 12, stiffness: 120 });

    let frame: number;
    const start = Date.now();
    const duration = 800;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimated(fractions.map((f) => f * ease));
      if (t < 1) frame = requestAnimationFrame(tick);
      else {
        const allClosed = fractions.every((f) => f >= 0.95);
        if (allClosed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [fractions[0], fractions[1], fractions[2]]);

  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const displayCopy =
    microcopy ??
    getDefaultMicrocopy(new Date().getHours(), calories, calorieGoal, workoutMin, outdoorMin, outdoorGoal);

  const legends = [
    { color: RINGS[0].color, label: "Eat", value: `${calories}/${calorieGoal} cal` },
    { color: RINGS[1].color, label: "Move", value: `${workoutMin}/${workoutGoal} min` },
    { color: RINGS[2].color, label: "Routes", value: `${outdoorMin}/${outdoorGoal} min` },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* ── Rings ─────────────── */}
        <Animated.View style={[styles.ringContainer, ringAnimStyle]}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {RINGS.map((ring, i) => {
              const circumference = 2 * Math.PI * ring.r;
              const offset = circumference * (1 - animated[i]);

              return (
                <React.Fragment key={ring.key}>
                  <Circle
                    cx={CENTER} cy={CENTER} r={ring.r}
                    stroke={ring.track} strokeWidth={STROKE} fill="none"
                  />
                  <Circle
                    cx={CENTER} cy={CENTER} r={ring.r}
                    stroke={ring.color} strokeWidth={STROKE} fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={offset}
                    rotation={-90} origin={`${CENTER}, ${CENTER}`}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </Animated.View>

        {/* ── Right column ──────── */}
        <View style={styles.info}>
          <Text style={styles.microcopy} numberOfLines={2}>{displayCopy}</Text>

          <View style={styles.legendGroup}>
            {legends.map((l) => (
              <View key={l.label} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
                <Text style={styles.legendValue}>{l.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.streakPill}>
            <Text style={styles.streakText}>
              {streak}-day streak · best {bestStreak}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  row: { flexDirection: "row", alignItems: "center" },
  ringContainer: { width: RING_SIZE, height: RING_SIZE, flexShrink: 0 },
  info: { flex: 1, marginLeft: 14, justifyContent: "center" },
  microcopy: {
    fontSize: 12, fontStyle: "italic", color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`, lineHeight: 16, marginBottom: 8,
  },
  legendGroup: { gap: 4, marginBottom: 10 },
  legendRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendLabel: {
    fontSize: 12, fontWeight: "600", color: colors.textPrimary,
    fontFamily: `${fonts.body}_600SemiBold`, width: 48,
  },
  legendValue: {
    fontSize: 12, color: colors.textSecondary, fontFamily: `${fonts.body}_400Regular`,
  },
  streakPill: {
    alignSelf: "flex-start", backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  streakText: {
    fontSize: 11, fontWeight: "600", color: colors.textSecondary,
    fontFamily: `${fonts.body}_600SemiBold`,
  },
});

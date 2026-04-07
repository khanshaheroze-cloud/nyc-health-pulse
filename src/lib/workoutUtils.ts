// ============================================================
// PulseNYC Workout Redesign — Utility Functions
// ============================================================

import type { WorkoutSession, DayTemplate, WeekPlan, DayOfWeek, LoggedExercise } from "./workoutTypes";
import { STORAGE_KEYS, loadFromStorage, getTodayDayOfWeek } from "./workoutTypes";
import { getExerciseById, type MuscleGroup } from "./exerciseDatabase";

// ── Muscle Group Color Palette ─────────────────────────────

export const MUSCLE_COLORS: Record<string, string> = {
  chest: "#c0392b",
  back: "#3f51b5",
  legs: "#9c27b0",
  quads: "#9c27b0",
  hamstrings: "#9c27b0",
  glutes: "#9c27b0",
  calves: "#9c27b0",
  shoulders: "#4A7C59",
  triceps: "#e67e22",
  biceps: "#f57c00",
  forearms: "#f57c00",
  core: "#00897b",
  cardio: "#e91e63",
  "full-body": "#6B9E7A",
  "hip-flexors": "#9c27b0",
  traps: "#3f51b5",
  lats: "#3f51b5",
  neck: "#4A7C59",
};

/** Map granular muscle groups to display categories for dots */
export function getMuscleCategory(muscle: MuscleGroup): string {
  switch (muscle) {
    case "chest": return "Chest";
    case "back": case "lats": case "traps": return "Back";
    case "quads": case "hamstrings": case "glutes": case "calves": case "hip-flexors": return "Legs";
    case "shoulders": case "neck": return "Shoulders";
    case "triceps": return "Triceps";
    case "biceps": case "forearms": return "Biceps";
    case "core": return "Core";
    case "cardio": return "Cardio";
    case "full-body": return "Full Body";
    default: return "Other";
  }
}

export function getMuscleColor(muscle: string): string {
  return MUSCLE_COLORS[muscle] ?? "#8A918A";
}

// ── Streak Calculator ──────────────────────────────────────

/** Calculate current workout streak (consecutive days with ≥1 workout). */
export function calculateStreak(log: WorkoutSession[]): number {
  if (log.length === 0) return 0;

  // Get unique workout dates (local time, YYYY-MM-DD)
  const dates = new Set<string>();
  for (const w of log) {
    const d = w.completedAt || w.startedAt;
    if (d) dates.add(toLocalDateStr(new Date(d)));
  }

  const sorted = [...dates].sort().reverse(); // most recent first
  if (sorted.length === 0) return 0;

  const today = toLocalDateStr(new Date());
  const yesterday = toLocalDateStr(addDays(new Date(), -1));

  // Streak must include today or yesterday to be "active"
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i] + "T00:00:00");
    const prev = new Date(sorted[i + 1] + "T00:00:00");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Heatmap Intensity ──────────────────────────────────────

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

/** Get heatmap intensity level from exercise count on a given day. */
export function getHeatmapLevel(exerciseCount: number): HeatmapLevel {
  if (exerciseCount === 0) return 0;
  if (exerciseCount <= 3) return 1;
  if (exerciseCount <= 6) return 2;
  if (exerciseCount <= 9) return 3;
  return 4;
}

/** Heatmap color based on intensity level. */
export function getHeatmapColor(level: HeatmapLevel): string {
  switch (level) {
    case 0: return "transparent";
    case 1: return "rgba(74,124,89,0.20)";
    case 2: return "rgba(74,124,89,0.40)";
    case 3: return "rgba(74,124,89,0.65)";
    case 4: return "rgba(74,124,89,0.90)";
  }
}

// ── Day Data Aggregation ───────────────────────────────────

export interface DayWorkoutData {
  date: string; // YYYY-MM-DD
  workouts: WorkoutSession[];
  totalExercises: number;
  muscleGroups: string[]; // unique display categories
  heatmapLevel: HeatmapLevel;
}

/** Build a map of date → workout data from the log. */
export function buildDayMap(log: WorkoutSession[]): Map<string, DayWorkoutData> {
  const map = new Map<string, DayWorkoutData>();

  for (const w of log) {
    const d = w.completedAt || w.startedAt;
    if (!d) continue;
    const dateStr = toLocalDateStr(new Date(d));

    const existing = map.get(dateStr) ?? {
      date: dateStr,
      workouts: [],
      totalExercises: 0,
      muscleGroups: [],
      heatmapLevel: 0 as HeatmapLevel,
    };

    existing.workouts.push(w);
    existing.totalExercises += w.exercises.length;

    // Collect unique muscle categories
    const muscles = new Set(existing.muscleGroups);
    for (const ex of w.exercises) {
      const exercise = getExerciseById(ex.exerciseId);
      if (exercise) {
        muscles.add(getMuscleCategory(exercise.muscle));
      }
    }
    existing.muscleGroups = [...muscles];
    existing.heatmapLevel = getHeatmapLevel(existing.totalExercises);

    map.set(dateStr, existing);
  }

  return map;
}

// ── "Your Workouts" Smart Grid Algorithm ───────────────────

export interface SmartWorkoutSuggestion {
  name: string;
  lastDate: string | null;
  muscleGroups: string[];
  exercises: LoggedExercise[];
  templateId?: string;
}

/**
 * Build smart workout suggestions for the no-split today card.
 * Priority: (1) workouts done on this weekday in past 4 weeks,
 * (2) most frequent, (3) most recent. Returns up to 4 unique suggestions.
 */
export function getSmartWorkoutSuggestions(log: WorkoutSession[]): SmartWorkoutSuggestion[] {
  if (log.length === 0) return [];

  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  const fourWeeksAgo = addDays(today, -28);

  // Group workouts by name (case-insensitive)
  const byName = new Map<string, WorkoutSession[]>();
  for (const w of log) {
    if (!w.completedAt) continue;
    const key = w.name.toLowerCase().trim();
    const arr = byName.get(key) ?? [];
    arr.push(w);
    byName.set(key, arr);
  }

  // Score each unique workout
  const scored: { name: string; score: number; sessions: WorkoutSession[] }[] = [];

  for (const [, sessions] of byName) {
    const latest = sessions.sort((a, b) =>
      new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );
    const canonical = latest[0].name;

    let score = 0;

    // (1) Done on this weekday in past 4 weeks
    const sameDay = sessions.filter(s => {
      const d = new Date(s.completedAt!);
      return d.getDay() === todayDay && d >= fourWeeksAgo;
    });
    score += sameDay.length * 30;

    // (2) Frequency (total count)
    score += Math.min(sessions.length, 10) * 5;

    // (3) Recency bonus (last 7 days)
    const sevenDaysAgo = addDays(today, -7);
    if (new Date(latest[0].completedAt!) >= sevenDaysAgo) {
      score += 15;
    }

    scored.push({ name: canonical, score, sessions: latest });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 4).map(({ name, sessions }) => {
    const latest = sessions[0];
    const muscles = new Set<string>();
    for (const ex of latest.exercises) {
      const exercise = getExerciseById(ex.exerciseId);
      if (exercise) muscles.add(getMuscleCategory(exercise.muscle));
    }
    return {
      name,
      lastDate: latest.completedAt ?? null,
      muscleGroups: [...muscles],
      exercises: latest.exercises,
      templateId: latest.templateId,
    };
  });
}

// ── Previous Session Lookup ────────────────────────────────

export interface PreviousSetData {
  weight: number;
  reps: number;
  date: string;
}

/** Get the most recent weight/reps for a given exercise from the log. */
export function getPreviousSession(exerciseId: string, log: WorkoutSession[]): PreviousSetData | null {
  // Walk log from most recent to oldest
  const sorted = [...log]
    .filter(w => w.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  for (const w of sorted) {
    for (const ex of w.exercises) {
      if (ex.exerciseId === exerciseId) {
        // Find the heaviest working set
        const workingSets = ex.sets.filter(s => s.type === "working" && s.weight && s.reps);
        if (workingSets.length > 0) {
          const best = workingSets.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0];
          return {
            weight: best.weight!,
            reps: best.reps!,
            date: w.completedAt!,
          };
        }
      }
    }
  }
  return null;
}

// ── Stats Helpers ──────────────────────────────────────────

/** Count workouts this calendar week (Mon-Sun). */
export function getThisWeekCount(log: WorkoutSession[]): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return log.filter(w => {
    if (!w.completedAt) return false;
    return new Date(w.completedAt) >= monday;
  }).length;
}

/** Count workouts this calendar month. */
export function getThisMonthCount(log: WorkoutSession[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return log.filter(w => {
    if (!w.completedAt) return false;
    return new Date(w.completedAt) >= monthStart;
  }).length;
}

// ── Today's Template Lookup ────────────────────────────────

/** Get today's assigned template (if split user). */
export function getTodayTemplate(
  weekPlan: WeekPlan,
  templates: DayTemplate[]
): DayTemplate | null {
  const day = getTodayDayOfWeek();
  const templateId = weekPlan[day];
  if (!templateId) return null;
  return templates.find(t => t.id === templateId) ?? null;
}

/** Check if user has a weekly plan set up (at least one day assigned). */
export function hasSplit(weekPlan: WeekPlan): boolean {
  const days: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return days.some(d => weekPlan[d] !== null);
}

/** Check if today already has a logged workout. */
export function hasLoggedToday(log: WorkoutSession[]): boolean {
  const today = toLocalDateStr(new Date());
  return log.some(w => {
    const d = w.completedAt || w.startedAt;
    return d && toLocalDateStr(new Date(d)) === today;
  });
}

// ── Default Body Part Templates ────────────────────────────

export const BODY_PART_DEFAULTS: { name: string; emoji: string; muscle: string }[] = [
  { name: "Chest", emoji: "🫁", muscle: "chest" },
  { name: "Back", emoji: "🔙", muscle: "back" },
  { name: "Shoulders", emoji: "💪", muscle: "shoulders" },
  { name: "Arms", emoji: "💪", muscle: "biceps" },
  { name: "Legs", emoji: "🦵", muscle: "quads" },
  { name: "Core", emoji: "🧘", muscle: "core" },
  { name: "Cardio", emoji: "🏃", muscle: "cardio" },
  { name: "Full Body", emoji: "🏋️", muscle: "full-body" },
];

// ── Date Helpers ───────────────────────────────────────────

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toLocalDateStr(a) === toLocalDateStr(b);
}

/** Get the Monday of the week containing a given date. */
export function getMonday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay(); // 0=Sun
  result.setDate(result.getDate() - ((day + 6) % 7));
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Format relative date label. */
export function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = toLocalDateStr(now);
  const yesterday = toLocalDateStr(addDays(now, -1));
  const ds = toLocalDateStr(d);

  if (ds === today) return "Today";
  if (ds === yesterday) return "Yesterday";

  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Short day label (M, T, W...). */
export const SHORT_DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** Full day names for DayOfWeek mapping. */
export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
];

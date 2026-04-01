// ============================================================
// PulseNYC Workout Tracker — Type Definitions
// ============================================================

import type { ExerciseCategory, MuscleGroup, Equipment, TrackingType } from "./exerciseDatabase";

// ── Workout Session (logged workout) ────────────────────────

export interface LoggedSet {
  setNumber: number;
  type: "working" | "warmup" | "dropset" | "failure";
  weight?: number;
  reps?: number;
  duration?: number;       // seconds, for timed exercises
  distance?: number;       // miles or km
  calories?: number;
  rpe?: number;            // 1-10
  rir?: number;            // reps in reserve
  isPersonalRecord: boolean;
  completedAt: string;     // ISO timestamp
}

export interface LoggedExercise {
  exerciseId: string;
  sets: LoggedSet[];
  supersetGroup?: string;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  duration: number;        // minutes
  exercises: LoggedExercise[];
  notes: string;
  totalVolume: number;     // sum of weight × reps for all working sets
}

// ── Personal Records ────────────────────────────────────────

export type PRType = "1rm" | "weight" | "reps" | "volume" | "duration" | "distance";

export interface PersonalRecord {
  exerciseId: string;
  type: PRType;
  value: number;
  unit: string;
  date: string;
  workoutId: string;
  setDetails?: string;     // e.g. "225 × 5"
}

// ── Day Templates & Weekly Plan ─────────────────────────────

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface PlannedExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: string;       // "8-10" or "12" or "30s" or "to failure"
  targetWeight?: number;
  restTime: number;         // seconds
  supersetGroup?: string;
  notes?: string;
  order: number;
}

export interface DayTemplate {
  id: string;
  name: string;
  emoji: string;
  assignedDays: DayOfWeek[];
  exercises: PlannedExercise[];
  estimatedDuration: number;  // minutes
  notes: string;
  createdAt: string;
  lastUsed?: string;
  isDefault?: boolean;
  basedOn?: string | null;        // ID of the default this was derived from
  lastCompletedAt?: string | null;
  timesCompleted?: number;
}

export interface WeekPlan {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
  splitName?: string | null;
  programDurationWeeks?: number | null;
  currentWeek?: number;
  startedAt?: string | null;
  planNotes?: string;
}

// ── Settings ────────────────────────────────────────────────

export interface WorkoutSettings {
  units: "lbs" | "kg";
  distanceUnit: "miles" | "km";
  defaultRestTime: number;   // seconds
  showRPE: boolean;
  showRIR: boolean;
  showWarmupSets: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

export const DEFAULT_SETTINGS: WorkoutSettings = {
  units: "lbs",
  distanceUnit: "miles",
  defaultRestTime: 90,
  showRPE: false,
  showRIR: false,
  showWarmupSets: true,
  soundEnabled: true,
  vibrateEnabled: true,
};

// ── localStorage Helpers ────────────────────────────────────

const PREFIX = "pulse-workout-";

export const STORAGE_KEYS = {
  log: `${PREFIX}log`,
  prs: `${PREFIX}prs`,
  templates: `${PREFIX}templates`,
  week: `${PREFIX}week`,
  settings: `${PREFIX}settings`,
  customExercises: `${PREFIX}custom-exercises`,
  activeWorkout: `${PREFIX}active`,      // current in-progress workout
  todayOverride: `${PREFIX}today-override`, // "Edit Today Only" exercises
  favorites: `${PREFIX}favorites`,        // favorited exercise IDs
  recentExercises: `${PREFIX}recent`,     // recently used exercise IDs
} as const;

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function saveToStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded */ }
}

// ── Utility functions ───────────────────────────────────────

/** Epley formula: estimated 1RM from weight × reps */
export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/** Calculate total volume for a set of logged exercises */
export function calculateTotalVolume(exercises: LoggedExercise[]): number {
  let total = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.type === "warmup") continue;
      if (set.weight && set.reps) {
        total += set.weight * set.reps;
      }
    }
  }
  return Math.round(total);
}

/** Get default rest time by exercise tracking type */
export function getDefaultRestTime(trackingType: TrackingType): number {
  switch (trackingType) {
    case "weight-reps": return 120;
    case "weight-reps-each": return 120;
    case "bodyweight-reps": return 90;
    case "reps-only": return 60;
    case "weight-duration": return 90;
    case "duration": return 60;
    case "distance": return 60;
    case "calories-duration": return 60;
    case "rounds-reps": return 90;
    default: return 90;
  }
}

/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Get today's day of week */
export function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Pre-built Split Templates ───────────────────────────────

export type SplitLevel = "beginner" | "intermediate" | "advanced" | "all";

export interface SplitTemplate {
  id: string;
  name: string;
  description: string;
  level: SplitLevel;
  daysPerWeek: number;
  days: {
    name: string;
    emoji: string;
    exercises: { exerciseId: string; sets: number; reps: string; rest: number }[];
  }[];
}

// Helper for compact template exercise entries
function te(exerciseId: string, sets: number, reps: string, rest: number) {
  return { exerciseId, sets, reps, rest };
}

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  // ═══════════════════════════════════════════════════════════
  // BEGINNER PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "beginner-full-body-3",
    name: "Beginner Full Body (3-Day)",
    description: "Best starting point. Machine + dumbbell exercises, 3 sets, learn proper form.",
    level: "beginner",
    daysPerWeek: 3,
    days: [
      { name: "Full Body A", emoji: "🏋️", exercises: [
        te("goblet-squat", 3, "10-12", 90), te("db-bench", 3, "10-12", 90), te("lat-pulldown", 3, "10-12", 90),
        te("db-shoulder-press", 3, "10-12", 90), te("db-rdl", 3, "10", 90), te("plank", 3, "30s", 60), te("db-curl", 2, "12", 60),
      ]},
      { name: "Full Body B", emoji: "🏋️", exercises: [
        te("leg-press", 3, "12", 90), te("machine-chest-press", 3, "10-12", 90), te("cable-row", 3, "10-12", 90),
        te("db-lateral-raise", 3, "12-15", 60), te("lying-leg-curl", 3, "12", 60), te("dead-bug", 3, "8 each", 60), te("cable-pushdown", 2, "12", 60),
      ]},
      { name: "Full Body C", emoji: "🏋️", exercises: [
        te("db-lunge", 3, "10 each", 90), te("db-incline-bench", 3, "10-12", 90), te("db-row", 3, "10-12 each", 90),
        te("machine-shoulder-press", 3, "12", 60), te("leg-extension", 3, "12", 60), te("standing-calf-raise", 3, "15", 60), te("ab-machine", 3, "15", 60),
      ]},
    ],
  },
  {
    id: "beginner-upper-lower-4",
    name: "Beginner Upper / Lower (4-Day)",
    description: "Step up from full body. 4 days, more volume per muscle group.",
    level: "beginner",
    daysPerWeek: 4,
    days: [
      { name: "Upper A", emoji: "💪", exercises: [
        te("db-bench", 3, "10-12", 90), te("cable-row", 3, "10-12", 90), te("db-shoulder-press", 3, "10-12", 90),
        te("lat-pulldown", 3, "10-12", 90), te("db-curl", 2, "12-15", 60), te("cable-pushdown", 2, "12-15", 60), te("face-pull", 3, "15", 60),
      ]},
      { name: "Lower A", emoji: "🦵", exercises: [
        te("goblet-squat", 3, "10-12", 90), te("db-rdl", 3, "10-12", 90), te("leg-press", 3, "12", 90),
        te("lying-leg-curl", 3, "12", 60), te("standing-calf-raise", 3, "15", 60), te("plank", 3, "30-45s", 60),
      ]},
      { name: "Upper B", emoji: "💪", exercises: [
        te("machine-chest-press", 3, "10-12", 90), te("db-row", 3, "10-12 each", 90), te("machine-shoulder-press", 3, "12", 90),
        te("cable-fly", 3, "12-15", 60), te("db-hammer-curl", 2, "12-15", 60), te("db-overhead-ext", 2, "12-15", 60), te("db-rear-delt-fly", 3, "15", 60),
      ]},
      { name: "Lower B", emoji: "🦵", exercises: [
        te("db-lunge", 3, "10 each", 90), te("leg-press", 3, "12", 90), te("leg-extension", 3, "12-15", 60),
        te("lying-leg-curl", 3, "12", 60), te("glute-bridge", 3, "15", 60), te("seated-calf-raise", 3, "15", 60), te("dead-bug", 3, "8 each", 60),
      ]},
    ],
  },
  {
    id: "beginner-ppl-3",
    name: "Beginner PPL (3-Day)",
    description: "Push/Pull/Legs for beginners. Machine-friendly, 3 days per week.",
    level: "beginner",
    daysPerWeek: 3,
    days: [
      { name: "Push", emoji: "🏋️", exercises: [
        te("db-bench", 3, "10-12", 90), te("machine-chest-press", 3, "10-12", 90), te("machine-shoulder-press", 3, "10-12", 90),
        te("db-lateral-raise", 3, "12-15", 60), te("cable-pushdown", 3, "10-12", 60), te("db-overhead-ext", 2, "12", 60),
      ]},
      { name: "Pull", emoji: "🏋️", exercises: [
        te("lat-pulldown", 3, "10-12", 90), te("cable-row", 3, "10-12", 90), te("machine-row", 3, "10-12", 90),
        te("face-pull", 3, "15", 60), te("db-curl", 3, "10-12", 60), te("db-hammer-curl", 2, "12", 60),
      ]},
      { name: "Legs", emoji: "🦵", exercises: [
        te("leg-press", 3, "12", 90), te("goblet-squat", 3, "10-12", 90), te("leg-extension", 3, "12", 60),
        te("lying-leg-curl", 3, "12", 60), te("standing-calf-raise", 3, "15", 60), te("plank", 3, "30-45s", 60),
      ]},
    ],
  },
  {
    id: "beginner-dumbbell-only-3",
    name: "Dumbbell-Only Home (3-Day)",
    description: "No gym needed. Just dumbbells and a bench. Perfect for home workouts.",
    level: "beginner",
    daysPerWeek: 3,
    days: [
      { name: "Upper Push + Core", emoji: "💪", exercises: [
        te("db-bench", 3, "10-12", 90), te("db-incline-bench", 3, "10-12", 90), te("db-shoulder-press", 3, "10-12", 90),
        te("db-lateral-raise", 3, "12-15", 60), te("db-kickback", 3, "12", 60), te("plank", 3, "30-45s", 60), te("dead-bug", 3, "8 each", 60),
      ]},
      { name: "Upper Pull + Core", emoji: "💪", exercises: [
        te("db-row", 3, "10-12 each", 90), te("db-rdl", 3, "10-12", 90), te("db-rear-delt-fly", 3, "12-15", 60),
        te("db-shrug", 3, "12", 60), te("db-curl", 3, "10-12", 60), te("db-hammer-curl", 3, "10-12", 60), te("russian-twist", 3, "20", 60),
      ]},
      { name: "Lower Body", emoji: "🦵", exercises: [
        te("goblet-squat", 3, "12", 90), te("db-lunge", 3, "10 each", 90), te("db-rdl", 3, "10-12", 90),
        te("db-hip-thrust", 3, "12", 60), te("db-calf-raise", 3, "15 each", 60), te("step-up", 3, "10 each", 60), te("leg-raise-lying", 3, "15", 60),
      ]},
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // INTERMEDIATE PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "ppl-3",
    name: "Push / Pull / Legs",
    description: "Classic 3-day split. Hit each muscle group once per week with high volume.",
    level: "intermediate",
    daysPerWeek: 3,
    days: [
      { name: "Push — Chest, Shoulders & Triceps", emoji: "🏋️", exercises: [
        te("bb-bench", 4, "6-8", 180), te("db-incline-bench", 3, "8-10", 120), te("cable-fly-low", 3, "12-15", 90),
        te("db-shoulder-press", 3, "8-10", 120), te("db-lateral-raise", 3, "12-15", 60), te("cable-pushdown", 3, "10-12", 60), te("overhead-cable-ext", 3, "10-12", 60),
      ]},
      { name: "Pull — Back & Biceps", emoji: "🏋️", exercises: [
        te("deadlift", 3, "5", 180), te("lat-pulldown-wide", 3, "8-10", 120), te("cable-row", 3, "10-12", 90),
        te("face-pull", 3, "15-20", 60), te("db-rear-delt-fly", 3, "12-15", 60), te("bb-curl", 3, "8-10", 60), te("db-hammer-curl", 3, "10-12", 60),
      ]},
      { name: "Legs — Quads, Hams & Calves", emoji: "🦵", exercises: [
        te("bb-squat", 4, "6-8", 180), te("rdl", 3, "8-10", 120), te("leg-press", 3, "10-12", 120),
        te("leg-extension", 3, "12-15", 60), te("lying-leg-curl", 3, "10-12", 60), te("standing-calf-raise", 4, "12-15", 60), te("leg-raise-hanging", 3, "15", 60),
      ]},
    ],
  },
  {
    id: "upper-lower-4",
    name: "Upper / Lower (4-Day)",
    description: "4-day split with strength + hypertrophy days. Great balance.",
    level: "intermediate",
    daysPerWeek: 4,
    days: [
      { name: "Upper A — Strength", emoji: "💪", exercises: [
        te("bb-bench", 4, "5", 180), te("bb-row", 4, "5", 180), te("ohp", 3, "6-8", 120),
        te("lat-pulldown", 3, "8-10", 90), te("db-curl", 2, "10-12", 60), te("skull-crusher", 2, "10-12", 60), te("face-pull", 3, "15", 60),
      ]},
      { name: "Lower A — Strength", emoji: "🦵", exercises: [
        te("bb-squat", 4, "5", 180), te("rdl", 3, "8", 120), te("leg-press", 3, "10", 120),
        te("lying-leg-curl", 3, "10-12", 90), te("standing-calf-raise", 3, "12-15", 60), te("plank", 3, "45-60s", 60),
      ]},
      { name: "Upper B — Hypertrophy", emoji: "💪", exercises: [
        te("db-incline-bench", 4, "8-10", 120), te("chest-supported-row", 4, "10-12", 90), te("arnold-press", 3, "10-12", 90),
        te("cable-fly", 3, "12-15", 60), te("cable-curl", 3, "12-15", 60), te("cable-pushdown", 3, "12-15", 60), te("db-lateral-raise", 3, "15", 60),
      ]},
      { name: "Lower B — Hypertrophy", emoji: "🦵", exercises: [
        te("goblet-squat", 3, "8-10", 120), te("bulgarian-split-squat", 3, "10 each", 90), te("lying-leg-curl", 3, "10-12", 90),
        te("leg-extension", 3, "12-15", 60), te("bb-hip-thrust", 3, "10-12", 90), te("seated-calf-raise", 3, "15", 60), te("cable-woodchop", 3, "12 each", 60),
      ]},
    ],
  },
  {
    id: "full-body-3",
    name: "Full Body (3-Day)",
    description: "3-day full body with barbell compounds. Efficient and effective.",
    level: "intermediate",
    daysPerWeek: 3,
    days: [
      { name: "Full Body A", emoji: "🏋️", exercises: [
        te("bb-squat", 4, "6", 180), te("bb-bench", 4, "6", 180), te("bb-row", 4, "8", 120),
        te("db-lateral-raise", 3, "12", 60), te("db-curl", 2, "10", 60), te("plank", 3, "45s", 60),
      ]},
      { name: "Full Body B", emoji: "🏋️", exercises: [
        te("deadlift", 3, "5", 180), te("ohp", 4, "6-8", 120), te("lat-pulldown", 3, "10", 90),
        te("leg-press", 3, "10", 120), te("cable-pushdown", 2, "12", 60), te("leg-raise-hanging", 3, "12", 60),
      ]},
      { name: "Full Body C", emoji: "🏋️", exercises: [
        te("front-squat", 3, "8", 150), te("db-incline-bench", 3, "10", 120), te("cable-row", 3, "10", 90),
        te("bulgarian-split-squat", 3, "10 each", 90), te("db-fly", 3, "12", 60), te("db-hammer-curl", 2, "12", 60), te("ab-wheel", 3, "10", 60),
      ]},
    ],
  },
  {
    id: "bro-split-5",
    name: "Bro Split (5-Day)",
    description: "Classic body part split. One muscle group per day, max volume.",
    level: "intermediate",
    daysPerWeek: 5,
    days: [
      { name: "Chest", emoji: "🏋️", exercises: [
        te("bb-bench", 4, "6-8", 180), te("db-incline-bench", 3, "8-10", 120), te("cable-fly", 3, "12", 60),
        te("pec-deck", 3, "12", 60), te("dip-chest", 3, "max", 90),
      ]},
      { name: "Back", emoji: "🏋️", exercises: [
        te("deadlift", 3, "5", 180), te("bb-row", 4, "8", 120), te("lat-pulldown", 3, "10", 90),
        te("cable-row", 3, "10", 90), te("face-pull", 3, "15", 60), te("straight-arm-pulldown", 3, "12", 60),
      ]},
      { name: "Shoulders", emoji: "🏋️", exercises: [
        te("ohp", 4, "6-8", 150), te("arnold-press", 3, "10", 90), te("db-lateral-raise", 4, "12-15", 60),
        te("db-rear-delt-fly", 3, "15", 60), te("cable-front-raise", 3, "12", 60), te("bb-shrug", 3, "12", 60),
      ]},
      { name: "Arms", emoji: "💪", exercises: [
        te("bb-curl", 3, "8", 90), te("skull-crusher", 3, "8", 90), te("db-hammer-curl", 3, "10", 60),
        te("cable-pushdown", 3, "10", 60), te("preacher-curl", 3, "10", 60), te("db-overhead-ext", 3, "10", 60), te("reverse-curl-bb", 2, "12", 60),
      ]},
      { name: "Legs", emoji: "🦵", exercises: [
        te("bb-squat", 4, "6", 180), te("leg-press", 3, "10", 120), te("rdl", 3, "10", 120),
        te("leg-extension", 3, "12", 60), te("lying-leg-curl", 3, "12", 60), te("standing-calf-raise", 4, "15", 60), te("leg-raise-hanging", 3, "15", 60),
      ]},
    ],
  },
  {
    id: "pplul-5",
    name: "PPLUL Hybrid (5-Day)",
    description: "Push/Pull/Legs + Upper/Lower. 5 days, balanced strength and hypertrophy.",
    level: "intermediate",
    daysPerWeek: 5,
    days: [
      { name: "Push", emoji: "🏋️", exercises: [
        te("bb-bench", 4, "6-8", 180), te("db-incline-bench", 3, "8-10", 120), te("cable-fly-low", 3, "12-15", 90),
        te("db-shoulder-press", 3, "8-10", 120), te("db-lateral-raise", 3, "12-15", 60), te("cable-pushdown", 3, "10-12", 60), te("overhead-cable-ext", 3, "10-12", 60),
      ]},
      { name: "Pull", emoji: "🏋️", exercises: [
        te("bb-row", 4, "6-8", 180), te("lat-pulldown-wide", 3, "8-10", 120), te("cable-row", 3, "10-12", 90),
        te("face-pull", 3, "15-20", 60), te("db-rear-delt-fly", 3, "12-15", 60), te("bb-curl", 3, "8-10", 60), te("db-hammer-curl", 3, "10-12", 60),
      ]},
      { name: "Legs", emoji: "🦵", exercises: [
        te("bb-squat", 4, "6-8", 180), te("rdl", 3, "8-10", 120), te("leg-press", 3, "10-12", 120),
        te("leg-extension", 3, "12-15", 60), te("lying-leg-curl", 3, "10-12", 60), te("standing-calf-raise", 4, "12-15", 60), te("leg-raise-hanging", 3, "15", 60),
      ]},
      { name: "Upper (Hypertrophy)", emoji: "💪", exercises: [
        te("db-incline-bench", 4, "8-10", 120), te("chest-supported-row", 4, "10-12", 90), te("arnold-press", 3, "10-12", 90),
        te("cable-fly", 3, "12-15", 60), te("db-lateral-raise", 3, "15", 60), te("cable-curl", 3, "12-15", 60), te("cable-pushdown", 3, "12-15", 60), te("face-pull", 3, "15", 60),
      ]},
      { name: "Lower (Hypertrophy)", emoji: "🦵", exercises: [
        te("front-squat", 3, "8-10", 120), te("bulgarian-split-squat", 3, "10 each", 90), te("lying-leg-curl", 3, "10-12", 90),
        te("leg-extension", 3, "12-15", 60), te("bb-hip-thrust", 3, "10-12", 90), te("seated-calf-raise", 3, "15", 60), te("cable-woodchop", 3, "12 each", 60),
      ]},
    ],
  },
  {
    id: "arnold-6",
    name: "Arnold Split (6-Day)",
    description: "Chest+Back / Shoulders+Arms / Legs, twice per week. High volume classic.",
    level: "intermediate",
    daysPerWeek: 6,
    days: [
      { name: "Chest & Back", emoji: "🏋️", exercises: [
        te("bb-bench", 4, "6-8", 180), te("db-incline-bench", 3, "8-10", 120), te("db-fly", 3, "12", 60),
        te("lat-pulldown-wide", 4, "8-10", 120), te("bb-row", 4, "6-8", 180), te("cable-row", 3, "10-12", 90), te("db-pullover", 3, "12", 60),
      ]},
      { name: "Shoulders & Arms", emoji: "💪", exercises: [
        te("ohp", 4, "6-8", 150), te("arnold-press", 3, "10-12", 90), te("db-lateral-raise", 4, "12-15", 60), te("db-rear-delt-fly", 3, "15", 60),
        te("bb-curl", 3, "8-10", 60), te("db-incline-curl", 3, "10-12", 60), te("skull-crusher", 3, "8-10", 60), te("cable-pushdown", 3, "10-12", 60), te("bb-shrug", 3, "12", 60),
      ]},
      { name: "Legs", emoji: "🦵", exercises: [
        te("bb-squat", 4, "6-8", 180), te("leg-press", 3, "10-12", 120), te("leg-extension", 3, "12-15", 60),
        te("rdl", 3, "8-10", 120), te("lying-leg-curl", 3, "10-12", 60), te("standing-calf-raise", 4, "12-15", 60), te("seated-calf-raise", 3, "15", 60),
      ]},
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ADVANCED PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "advanced-ppl-6",
    name: "Advanced PPL (6-Day)",
    description: "Strength A + Hypertrophy B for push/pull/legs. Maximum growth.",
    level: "advanced",
    daysPerWeek: 6,
    days: [
      { name: "Push A (Strength)", emoji: "🏋️", exercises: [
        te("bb-bench", 4, "4-6", 180), te("ohp", 4, "4-6", 180), te("db-incline-bench", 3, "8-10", 120),
        te("cable-fly", 3, "12-15", 60), te("db-lateral-raise", 4, "12-15", 60), te("cable-pushdown", 3, "10-12", 60), te("overhead-cable-ext", 3, "10-12", 60),
      ]},
      { name: "Pull A (Strength)", emoji: "🏋️", exercises: [
        te("deadlift", 3, "3-5", 180), te("bb-row", 4, "4-6", 180), te("lat-pulldown", 3, "8-10", 120),
        te("face-pull", 3, "15-20", 60), te("db-rear-delt-fly", 3, "12-15", 60), te("bb-curl", 3, "6-8", 90), te("db-hammer-curl", 3, "8-10", 60),
      ]},
      { name: "Legs A (Strength)", emoji: "🦵", exercises: [
        te("bb-squat", 4, "4-6", 180), te("rdl", 3, "6-8", 150), te("leg-press", 3, "8-10", 120),
        te("lying-leg-curl", 3, "8-10", 90), te("leg-extension", 3, "10-12", 60), te("standing-calf-raise", 4, "10-12", 60), te("leg-raise-hanging", 3, "15", 60),
      ]},
      { name: "Push B (Hypertrophy)", emoji: "🏋️", exercises: [
        te("db-incline-bench", 4, "8-10", 120), te("machine-chest-press", 3, "10-12", 90), te("cable-fly", 3, "12-15", 60),
        te("arnold-press", 3, "10-12", 90), te("db-lateral-raise", 4, "15-20", 60), te("cable-pushdown", 3, "12-15", 60), te("dip-tricep", 3, "max", 60),
      ]},
      { name: "Pull B (Hypertrophy)", emoji: "🏋️", exercises: [
        te("bb-row", 4, "8-10", 120), te("chest-supported-row", 3, "10-12", 90), te("lat-pulldown-close", 3, "10-12", 90),
        te("cable-row", 3, "12-15", 60), te("db-rear-delt-fly", 3, "15", 60), te("db-incline-curl", 3, "10-12", 60), te("bayesian-curl", 3, "12-15", 60), te("face-pull", 3, "15", 60),
      ]},
      { name: "Legs B (Hypertrophy)", emoji: "🦵", exercises: [
        te("front-squat", 3, "8-10", 150), te("bulgarian-split-squat", 3, "10 each", 90), te("leg-press", 3, "12-15", 90),
        te("leg-extension", 3, "12-15", 60), te("lying-leg-curl", 3, "12-15", 60), te("bb-hip-thrust", 3, "10-12", 90), te("seated-calf-raise", 4, "15", 60), te("ab-wheel", 3, "10", 60),
      ]},
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SPECIALTY DAYS
  // ═══════════════════════════════════════════════════════════
  {
    id: "shoulder-day",
    name: "Dedicated Shoulder Day",
    description: "All delts, all angles. Add to any split for extra shoulder work.",
    level: "intermediate",
    daysPerWeek: 1,
    days: [
      { name: "Shoulders", emoji: "🏋️", exercises: [
        te("ohp", 4, "6-8", 150), te("arnold-press", 3, "10-12", 90), te("db-lateral-raise", 4, "12-15", 60), te("cable-lateral-raise", 3, "12-15", 60),
        te("db-rear-delt-fly", 3, "15", 60), te("rear-delt-machine", 3, "12-15", 60), te("face-pull", 3, "15-20", 60), te("db-front-raise", 3, "12", 60), te("bb-shrug", 4, "10-12", 60),
      ]},
    ],
  },
  {
    id: "arms-day",
    name: "Dedicated Arms Day",
    description: "Biceps + triceps superset style. Arm pump guaranteed.",
    level: "intermediate",
    daysPerWeek: 1,
    days: [
      { name: "Arms", emoji: "💪", exercises: [
        te("bb-curl", 3, "8-10", 90), te("skull-crusher", 3, "8-10", 90), te("db-incline-curl", 3, "10-12", 60),
        te("overhead-cable-ext", 3, "10-12", 60), te("preacher-curl", 3, "10-12", 60), te("cable-pushdown", 3, "10-12", 60),
        te("db-hammer-curl", 3, "10-12", 60), te("dip-tricep", 3, "max", 60), te("wrist-curl", 3, "15", 45),
      ]},
    ],
  },
  {
    id: "core-abs-day",
    name: "Core / Abs Day",
    description: "Complete core work: abs, obliques, anti-rotation, stability.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Core & Abs", emoji: "🔥", exercises: [
        te("cable-crunch", 3, "15", 60), te("leg-raise-hanging", 3, "12-15", 60), te("ab-wheel", 3, "10-12", 60),
        te("pallof-press", 3, "12 each", 60), te("cable-woodchop", 3, "12 each", 60), te("russian-twist", 3, "20", 60),
        te("side-plank", 3, "30-45s each", 60), te("plank", 3, "45-60s", 60), te("dead-bug", 3, "10 each", 45), te("decline-sit-up", 3, "15", 60),
      ]},
    ],
  },
  {
    id: "glute-lower-day",
    name: "Glute-Focused Lower Day",
    description: "Emphasis on glute activation and growth. Hip thrusts, RDLs, kickbacks.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Glute-Focused Lower", emoji: "🍑", exercises: [
        te("bb-hip-thrust", 4, "8-10", 120), te("bulgarian-split-squat", 3, "10 each", 90), te("rdl", 3, "10-12", 120),
        te("cable-glute-kickback", 3, "12-15 each", 60), te("sumo-squat", 3, "10-12", 90), te("hip-abduction-machine", 3, "15", 60),
        te("band-walk", 3, "15 each", 45), te("single-leg-bridge", 3, "12 each", 45), te("frog-pump", 3, "20", 45),
      ]},
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // COMBO / LIFESTYLE PROGRAMS
  // ═══════════════════════════════════════════════════════════
  {
    id: "yoga-strength-4",
    name: "Yoga + Strength (4-Day)",
    description: "Upper + Lower strength days with yoga recovery. Balanced fitness.",
    level: "all",
    daysPerWeek: 4,
    days: [
      { name: "Upper Body Strength", emoji: "💪", exercises: [
        te("db-bench", 3, "10-12", 90), te("db-row", 3, "10-12 each", 90), te("db-shoulder-press", 3, "10-12", 90),
        te("cable-fly", 3, "12-15", 60), te("db-curl", 2, "12", 60), te("cable-pushdown", 2, "12", 60), te("face-pull", 3, "15", 60),
      ]},
      { name: "Yoga Flow", emoji: "🧘", exercises: [
        te("yoga-childs-pose", 1, "60s", 0), te("cat-cow", 1, "60s", 0), te("yoga-downward-dog", 1, "60s", 0),
        te("sun-salutation-a", 3, "1 round", 0), te("yoga-warrior-1", 1, "30s each", 0), te("yoga-warrior-2", 1, "30s each", 0),
        te("yoga-triangle", 1, "30s each", 0), te("yoga-tree", 1, "30s each", 0), te("yoga-bridge", 3, "30s", 0), te("yoga-savasana", 1, "3 min", 0),
      ]},
      { name: "Lower Body Strength", emoji: "🦵", exercises: [
        te("goblet-squat", 3, "10-12", 90), te("db-rdl", 3, "10-12", 90), te("leg-press", 3, "12", 90),
        te("lying-leg-curl", 3, "12", 60), te("db-hip-thrust", 3, "12", 60), te("standing-calf-raise", 3, "15", 60), te("plank", 3, "45s", 60),
      ]},
      { name: "Yoga Flow", emoji: "🧘", exercises: [
        te("yoga-childs-pose", 1, "60s", 0), te("yoga-downward-dog", 1, "60s", 0), te("sun-salutation-b", 3, "1 round", 0),
        te("yoga-pigeon", 1, "60s each", 0), te("yoga-half-splits", 1, "30s each", 0), te("yoga-boat", 3, "30s", 0),
        te("yoga-happy-baby", 1, "60s", 0), te("yoga-savasana", 1, "3 min", 0),
      ]},
    ],
  },
  // ═══════════════════════════════════════════════════════════
  // QUICK-START ROUTINES (1-day, tap & go)
  // ═══════════════════════════════════════════════════════════
  {
    id: "quick-upper",
    name: "Quick Upper Body",
    description: "30-minute upper body blast. No fuss, just work.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Quick Upper", emoji: "💪", exercises: [
        te("db-bench", 3, "10", 90), te("db-row", 3, "10 each", 90), te("db-shoulder-press", 3, "10", 90),
        te("db-curl", 2, "12", 60), te("cable-pushdown", 2, "12", 60),
      ]},
    ],
  },
  {
    id: "quick-lower",
    name: "Quick Lower Body",
    description: "30-minute leg day essentials.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Quick Lower", emoji: "🦵", exercises: [
        te("goblet-squat", 3, "12", 90), te("db-rdl", 3, "10", 90), te("leg-press", 3, "12", 90),
        te("leg-extension", 3, "12", 60), te("standing-calf-raise", 3, "15", 60),
      ]},
    ],
  },
  {
    id: "quick-full-body",
    name: "Quick Full Body",
    description: "Hit everything in 30 minutes. Great when short on time.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Quick Full Body", emoji: "🏋️", exercises: [
        te("goblet-squat", 3, "10", 90), te("db-bench", 3, "10", 90), te("db-row", 3, "10 each", 90),
        te("db-shoulder-press", 2, "10", 60), te("plank", 2, "45s", 45),
      ]},
    ],
  },
  {
    id: "quick-push",
    name: "Quick Push",
    description: "Chest, shoulders, triceps in 25 minutes.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Quick Push", emoji: "🏋️", exercises: [
        te("db-bench", 3, "10", 90), te("db-incline-bench", 3, "10", 90), te("db-shoulder-press", 3, "10", 90),
        te("db-lateral-raise", 3, "12", 60), te("cable-pushdown", 3, "12", 60),
      ]},
    ],
  },
  {
    id: "quick-pull",
    name: "Quick Pull",
    description: "Back and biceps in 25 minutes.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Quick Pull", emoji: "🏋️", exercises: [
        te("lat-pulldown", 3, "10", 90), te("cable-row", 3, "10", 90), te("db-row", 3, "10 each", 90),
        te("face-pull", 3, "15", 60), te("db-curl", 3, "10", 60),
      ]},
    ],
  },
  {
    id: "quick-core",
    name: "Quick Core Blast",
    description: "15-minute ab circuit. No equipment needed.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Core Blast", emoji: "🔥", exercises: [
        te("plank", 3, "45s", 30), te("bicycle-crunch", 3, "20", 30), te("leg-raise-lying", 3, "15", 30),
        te("russian-twist", 3, "20", 30), te("mountain-climber", 3, "20", 30), te("dead-bug", 3, "10 each", 30),
      ]},
    ],
  },
  {
    id: "quick-glutes",
    name: "Quick Glute Pump",
    description: "Targeted glute activation and growth. 25 minutes.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Glute Pump", emoji: "🍑", exercises: [
        te("bb-hip-thrust", 3, "10", 90), te("bulgarian-split-squat", 3, "10 each", 90), te("cable-glute-kickback", 3, "12 each", 60),
        te("sumo-squat", 3, "12", 60), te("band-walk", 3, "15 each", 45),
      ]},
    ],
  },
  {
    id: "quick-arms",
    name: "Quick Arm Pump",
    description: "Biceps + triceps superset style. 20 minutes.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Arm Pump", emoji: "💪", exercises: [
        te("bb-curl", 3, "10", 60), te("cable-pushdown", 3, "10", 60), te("db-hammer-curl", 3, "10", 60),
        te("overhead-cable-ext", 3, "10", 60), te("db-concentration-curl", 2, "12", 45), te("bench-dip", 2, "max", 45),
      ]},
    ],
  },
  {
    id: "quick-yoga-flow",
    name: "Quick Yoga Flow",
    description: "20-minute vinyasa flow. Great for recovery days.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Yoga Flow", emoji: "🧘", exercises: [
        te("yoga-childs-pose", 1, "60s", 0), te("cat-cow", 1, "60s", 0), te("yoga-downward-dog", 1, "45s", 0),
        te("sun-salutation-a", 3, "1 round", 0), te("yoga-warrior-1", 1, "30s each", 0), te("yoga-warrior-2", 1, "30s each", 0),
        te("yoga-pigeon", 1, "45s each", 0), te("yoga-happy-baby", 1, "45s", 0), te("yoga-savasana", 1, "2 min", 0),
      ]},
    ],
  },
  {
    id: "quick-hiit",
    name: "Quick HIIT Circuit",
    description: "15-minute high-intensity interval training. No equipment.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "HIIT Circuit", emoji: "🔥", exercises: [
        te("burpee", 4, "30s on / 15s off", 15), te("mountain-climber", 4, "30s on / 15s off", 15),
        te("jump-squat", 4, "30s on / 15s off", 15), te("push-up", 4, "30s on / 15s off", 15),
        te("high-knees", 4, "30s on / 15s off", 15),
      ]},
    ],
  },
  {
    id: "quick-stretch",
    name: "Quick Stretch & Mobility",
    description: "15-minute full-body stretch routine. Great post-workout.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Stretch & Mobility", emoji: "🧘", exercises: [
        te("hip-flexor-stretch", 1, "30s each", 0), te("hamstring-stretch", 1, "30s each", 0), te("quad-stretch", 1, "30s each", 0),
        te("shoulder-stretch", 1, "30s each", 0), te("pigeon-stretch", 1, "45s each", 0), te("cat-cow", 1, "60s", 0),
        te("worlds-greatest-stretch", 1, "30s each", 0), te("chest-stretch", 1, "30s", 0),
      ]},
    ],
  },
  {
    id: "quick-boxing",
    name: "Quick Boxing Cardio",
    description: "20-minute boxing-style cardio workout.",
    level: "all",
    daysPerWeek: 1,
    days: [
      { name: "Boxing Cardio", emoji: "🥊", exercises: [
        te("boxing-shadow", 1, "3 min", 60), te("boxing-jab-cross", 4, "45s rounds", 15),
        te("boxing-combo-6", 4, "45s rounds", 15), te("boxing-uppercut", 3, "30s rounds", 15),
        te("boxing-slip-counter", 3, "30s rounds", 15), te("jump-rope", 1, "3 min", 0),
      ]},
    ],
  },

  {
    id: "cardio-strength-4",
    name: "Cardio + Strength (4-Day)",
    description: "Strength training with dedicated cardio days. Fat loss and fitness.",
    level: "all",
    daysPerWeek: 4,
    days: [
      { name: "Upper Body Strength", emoji: "💪", exercises: [
        te("bb-bench", 4, "6-8", 150), te("bb-row", 4, "6-8", 150), te("ohp", 3, "8-10", 120),
        te("lat-pulldown", 3, "10-12", 90), te("db-curl", 2, "12", 60), te("cable-pushdown", 2, "12", 60),
      ]},
      { name: "Cardio + Core", emoji: "🏃", exercises: [
        te("treadmill-run", 1, "25 min", 0), te("cable-crunch", 3, "15", 60), te("leg-raise-hanging", 3, "12", 60),
        te("plank", 3, "45s", 60), te("mountain-climber", 3, "20", 45),
      ]},
      { name: "Lower Body Strength", emoji: "🦵", exercises: [
        te("bb-squat", 4, "6-8", 180), te("rdl", 3, "8-10", 120), te("leg-press", 3, "10-12", 120),
        te("lying-leg-curl", 3, "10-12", 60), te("standing-calf-raise", 3, "12-15", 60), te("pallof-press", 3, "12 each", 60),
      ]},
      { name: "Cardio HIIT", emoji: "🔥", exercises: [
        te("jump-rope", 1, "2 min", 30), te("burpee", 4, "45s on / 15s off", 15), te("mountain-climber", 4, "45s on / 15s off", 15),
        te("box-jump", 4, "45s on / 15s off", 15), te("outdoor-walk", 1, "2 min cooldown", 0),
      ]},
    ],
  },
];

/** IDs of quick-start routines (1-day programs, tap-and-go) */
export const QUICK_START_IDS = [
  "quick-full-body", "quick-upper", "quick-lower", "quick-push", "quick-pull",
  "quick-core", "quick-glutes", "quick-arms", "quick-yoga-flow", "quick-hiit",
  "quick-stretch", "quick-boxing",
] as const;

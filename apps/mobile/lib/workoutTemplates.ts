/* ------------------------------------------------------------------ */
/*  Workout Templates — Real gym programming                           */
/* ------------------------------------------------------------------ */

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string; // "6-8", "8-10", "12-15", "5", etc.
  restSec: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: "split" | "single";
  splitDays?: string[]; // for multi-day splits, the day names
  currentDay?: number; // for tracking which day in the split
  exercises: WorkoutExercise[];
}

export interface SplitProgram {
  id: string;
  name: string;
  description: string;
  days: WorkoutTemplate[];
}

/* ------------------------------------------------------------------ */
/*  Push / Pull / Legs (6-day)                                         */
/* ------------------------------------------------------------------ */

const PPL_PUSH: WorkoutTemplate = {
  id: "ppl-push",
  name: "Push Day",
  category: "split",
  splitDays: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
  exercises: [
    { name: "Barbell Bench Press", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Overhead Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Lateral Raises", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Tricep Pushdowns", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Overhead Tricep Extension", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Cable Flyes", sets: 3, reps: "12-15", restSec: 60 },
  ],
};

const PPL_PULL: WorkoutTemplate = {
  id: "ppl-pull",
  name: "Pull Day",
  category: "split",
  splitDays: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
  exercises: [
    { name: "Deadlift", sets: 4, reps: "5", restSec: 180 },
    { name: "Barbell Row", sets: 4, reps: "6-8", restSec: 120 },
    { name: "Pull-ups", sets: 3, reps: "8-12", restSec: 90 },
    { name: "Face Pulls", sets: 3, reps: "15-20", restSec: 60 },
    { name: "Barbell Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Hammer Curls", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Rear Delt Flyes", sets: 3, reps: "15-20", restSec: 60 },
  ],
};

const PPL_LEGS: WorkoutTemplate = {
  id: "ppl-legs",
  name: "Leg Day",
  category: "split",
  splitDays: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
  exercises: [
    { name: "Barbell Back Squat", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Romanian Deadlift", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Leg Press", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Walking Lunges", sets: 3, reps: "12 each", restSec: 90 },
    { name: "Leg Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Leg Extension", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSec: 45 },
  ],
};

/* ------------------------------------------------------------------ */
/*  Upper / Lower (4-day)                                              */
/* ------------------------------------------------------------------ */

const UL_UPPER: WorkoutTemplate = {
  id: "ul-upper",
  name: "Upper Body",
  category: "split",
  splitDays: ["Upper", "Lower", "Upper", "Lower"],
  exercises: [
    { name: "Barbell Bench Press", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Barbell Row", sets: 4, reps: "6-8", restSec: 120 },
    { name: "Overhead Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Lat Pulldown", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Dumbbell Lateral Raises", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Barbell Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Tricep Pushdowns", sets: 3, reps: "10-12", restSec: 60 },
  ],
};

const UL_LOWER: WorkoutTemplate = {
  id: "ul-lower",
  name: "Lower Body",
  category: "split",
  splitDays: ["Upper", "Lower", "Upper", "Lower"],
  exercises: [
    { name: "Barbell Back Squat", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Romanian Deadlift", sets: 4, reps: "8-10", restSec: 120 },
    { name: "Leg Press", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Walking Lunges", sets: 3, reps: "12 each", restSec: 90 },
    { name: "Leg Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSec: 45 },
    { name: "Hanging Leg Raises", sets: 3, reps: "12-15", restSec: 60 },
  ],
};

/* ------------------------------------------------------------------ */
/*  Bro Split (5-day)                                                  */
/* ------------------------------------------------------------------ */

const BRO_CHEST: WorkoutTemplate = {
  id: "bro-chest",
  name: "Chest Day",
  category: "split",
  splitDays: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  exercises: [
    { name: "Barbell Bench Press", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Incline Dumbbell Press", sets: 4, reps: "8-10", restSec: 120 },
    { name: "Cable Flyes", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Decline Bench Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Dumbbell Pullover", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Push-ups", sets: 3, reps: "to failure", restSec: 60 },
  ],
};

const BRO_BACK: WorkoutTemplate = {
  id: "bro-back",
  name: "Back Day",
  category: "split",
  splitDays: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  exercises: [
    { name: "Deadlift", sets: 4, reps: "5", restSec: 180 },
    { name: "Barbell Row", sets: 4, reps: "6-8", restSec: 120 },
    { name: "Pull-ups", sets: 3, reps: "8-12", restSec: 90 },
    { name: "Seated Cable Row", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Lat Pulldown", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Straight Arm Pulldown", sets: 3, reps: "12-15", restSec: 60 },
  ],
};

const BRO_SHOULDERS: WorkoutTemplate = {
  id: "bro-shoulders",
  name: "Shoulders Day",
  category: "split",
  splitDays: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  exercises: [
    { name: "Overhead Press", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Arnold Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Lateral Raises", sets: 4, reps: "12-15", restSec: 60 },
    { name: "Face Pulls", sets: 3, reps: "15-20", restSec: 60 },
    { name: "Rear Delt Flyes", sets: 3, reps: "15-20", restSec: 60 },
    { name: "Dumbbell Shrugs", sets: 3, reps: "12-15", restSec: 60 },
  ],
};

const BRO_ARMS: WorkoutTemplate = {
  id: "bro-arms",
  name: "Arms Day",
  category: "split",
  splitDays: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  exercises: [
    { name: "Barbell Curl", sets: 4, reps: "8-10", restSec: 90 },
    { name: "Close-Grip Bench Press", sets: 4, reps: "8-10", restSec: 120 },
    { name: "Hammer Curls", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Overhead Tricep Extension", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Concentration Curls", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Tricep Kickbacks", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Wrist Curls", sets: 3, reps: "15-20", restSec: 45 },
  ],
};

const BRO_LEGS: WorkoutTemplate = {
  id: "bro-legs",
  name: "Legs Day",
  category: "split",
  splitDays: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
  exercises: [
    { name: "Barbell Back Squat", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Leg Press", sets: 4, reps: "8-10", restSec: 120 },
    { name: "Romanian Deadlift", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Leg Extension", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Leg Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Bulgarian Split Squats", sets: 3, reps: "10 each", restSec: 90 },
    { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSec: 45 },
  ],
};

/* ------------------------------------------------------------------ */
/*  5/3/1 Wendler (4-day)                                              */
/* ------------------------------------------------------------------ */

const W531_SQUAT: WorkoutTemplate = {
  id: "531-squat",
  name: "Squat Day",
  category: "split",
  splitDays: ["Squat", "Bench", "Deadlift", "OHP"],
  exercises: [
    { name: "Barbell Back Squat", sets: 4, reps: "5/3/1+", restSec: 180 },
    { name: "Front Squat", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Leg Press", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Leg Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Hanging Leg Raises", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSec: 45 },
  ],
};

const W531_BENCH: WorkoutTemplate = {
  id: "531-bench",
  name: "Bench Day",
  category: "split",
  splitDays: ["Squat", "Bench", "Deadlift", "OHP"],
  exercises: [
    { name: "Barbell Bench Press", sets: 4, reps: "5/3/1+", restSec: 180 },
    { name: "Dumbbell Bench Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Barbell Row", sets: 4, reps: "8-10", restSec: 120 },
    { name: "Dumbbell Flyes", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Tricep Pushdowns", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Face Pulls", sets: 3, reps: "15-20", restSec: 60 },
  ],
};

const W531_DEADLIFT: WorkoutTemplate = {
  id: "531-deadlift",
  name: "Deadlift Day",
  category: "split",
  splitDays: ["Squat", "Bench", "Deadlift", "OHP"],
  exercises: [
    { name: "Deadlift", sets: 4, reps: "5/3/1+", restSec: 180 },
    { name: "Romanian Deadlift", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Pull-ups", sets: 3, reps: "8-12", restSec: 90 },
    { name: "Barbell Row", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Barbell Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Ab Wheel Rollouts", sets: 3, reps: "10-15", restSec: 60 },
  ],
};

const W531_OHP: WorkoutTemplate = {
  id: "531-ohp",
  name: "OHP Day",
  category: "split",
  splitDays: ["Squat", "Bench", "Deadlift", "OHP"],
  exercises: [
    { name: "Overhead Press", sets: 4, reps: "5/3/1+", restSec: 180 },
    { name: "Incline Bench Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Lat Pulldown", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Lateral Raises", sets: 4, reps: "12-15", restSec: 60 },
    { name: "Tricep Dips", sets: 3, reps: "8-12", restSec: 90 },
    { name: "Rear Delt Flyes", sets: 3, reps: "15-20", restSec: 60 },
  ],
};

/* ------------------------------------------------------------------ */
/*  Single-day workouts                                                */
/* ------------------------------------------------------------------ */

const SINGLE_PUSH: WorkoutTemplate = {
  id: "single-push",
  name: "Push Day",
  category: "single",
  exercises: [
    { name: "Barbell Bench Press", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Overhead Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Lateral Raises", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Tricep Pushdowns", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Overhead Tricep Extension", sets: 3, reps: "12-15", restSec: 60 },
  ],
};

const SINGLE_PULL: WorkoutTemplate = {
  id: "single-pull",
  name: "Pull Day",
  category: "single",
  exercises: [
    { name: "Deadlift", sets: 4, reps: "5", restSec: 180 },
    { name: "Barbell Row", sets: 4, reps: "6-8", restSec: 120 },
    { name: "Pull-ups", sets: 3, reps: "8-12", restSec: 90 },
    { name: "Face Pulls", sets: 3, reps: "15-20", restSec: 60 },
    { name: "Barbell Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Hammer Curls", sets: 3, reps: "12-15", restSec: 60 },
  ],
};

const SINGLE_LEGS: WorkoutTemplate = {
  id: "single-legs",
  name: "Leg Day",
  category: "single",
  exercises: [
    { name: "Barbell Back Squat", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Romanian Deadlift", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Leg Press", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Walking Lunges", sets: 3, reps: "12 each", restSec: 90 },
    { name: "Leg Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSec: 45 },
  ],
};

const SINGLE_UPPER: WorkoutTemplate = {
  id: "single-upper",
  name: "Upper Body",
  category: "single",
  exercises: [
    { name: "Barbell Bench Press", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Barbell Row", sets: 4, reps: "6-8", restSec: 120 },
    { name: "Overhead Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Lat Pulldown", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Lateral Raises", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Barbell Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Tricep Pushdowns", sets: 3, reps: "10-12", restSec: 60 },
  ],
};

const SINGLE_LOWER: WorkoutTemplate = {
  id: "single-lower",
  name: "Lower Body",
  category: "single",
  exercises: [
    { name: "Barbell Back Squat", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Romanian Deadlift", sets: 4, reps: "8-10", restSec: 120 },
    { name: "Leg Press", sets: 3, reps: "10-12", restSec: 90 },
    { name: "Bulgarian Split Squats", sets: 3, reps: "10 each", restSec: 90 },
    { name: "Leg Curl", sets: 3, reps: "10-12", restSec: 60 },
    { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSec: 45 },
    { name: "Hanging Leg Raises", sets: 3, reps: "12-15", restSec: 60 },
  ],
};

const SINGLE_FULL: WorkoutTemplate = {
  id: "single-full",
  name: "Full Body",
  category: "single",
  exercises: [
    { name: "Barbell Back Squat", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Barbell Bench Press", sets: 4, reps: "6-8", restSec: 180 },
    { name: "Barbell Row", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Overhead Press", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Romanian Deadlift", sets: 3, reps: "8-10", restSec: 120 },
    { name: "Pull-ups", sets: 3, reps: "8-12", restSec: 90 },
    { name: "Lateral Raises", sets: 3, reps: "12-15", restSec: 60 },
    { name: "Barbell Curl", sets: 2, reps: "10-12", restSec: 60 },
  ],
};

/* ------------------------------------------------------------------ */
/*  Split programs (multi-day)                                         */
/* ------------------------------------------------------------------ */

export const SPLIT_PROGRAMS: SplitProgram[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    description: "6-day split. Push, Pull, Legs repeated twice per week.",
    days: [PPL_PUSH, PPL_PULL, PPL_LEGS],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    description: "4-day split. Upper and lower body alternating.",
    days: [UL_UPPER, UL_LOWER],
  },
  {
    id: "bro-split",
    name: "Bro Split",
    description: "5-day split. One muscle group per day.",
    days: [BRO_CHEST, BRO_BACK, BRO_SHOULDERS, BRO_ARMS, BRO_LEGS],
  },
  {
    id: "531",
    name: "5/3/1 Wendler",
    description: "4-day strength program. One main lift per day.",
    days: [W531_SQUAT, W531_BENCH, W531_DEADLIFT, W531_OHP],
  },
];

/* ------------------------------------------------------------------ */
/*  All single-day workouts                                            */
/* ------------------------------------------------------------------ */

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  SINGLE_PUSH,
  SINGLE_PULL,
  SINGLE_LEGS,
  SINGLE_UPPER,
  SINGLE_LOWER,
  SINGLE_FULL,
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Estimate total workout duration in minutes */
export function estimateDuration(exercises: WorkoutExercise[]): number {
  let totalSec = 0;
  for (const ex of exercises) {
    const liftTimePerSet = 30; // ~30s of actual lifting per set
    totalSec += ex.sets * (liftTimePerSet + ex.restSec);
  }
  return Math.round(totalSec / 60);
}

/** Count total sets in a workout */
export function totalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets, 0);
}

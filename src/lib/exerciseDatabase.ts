export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "quads" | "hamstrings" | "glutes" | "calves" | "core" | "full-body"
  | "cardio" | "hip-flexors" | "traps" | "lats" | "neck";

export type Equipment =
  | "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight"
  | "kettlebell" | "band" | "smith-machine" | "ez-bar" | "trap-bar"
  | "medicine-ball" | "suspension" | "foam-roller" | "cardio-machine" | "other";

export type ExerciseCategory =
  | "strength" | "cardio" | "flexibility" | "plyometric" | "olympic" | "calisthenics"
  | "yoga" | "pilates" | "boxing" | "barre";

export type TrackingType =
  | "weight-reps"        // barbell/dumbbell: weight + reps
  | "bodyweight-reps"    // pull-ups, push-ups: reps only (optional +weight)
  | "weight-reps-each"   // unilateral: weight + reps each side
  | "reps-only"          // jumping jacks, burpees: just reps
  | "duration"           // planks, holds: seconds
  | "distance"           // running, rowing: distance + optional time
  | "calories-duration"  // cardio machines: calories + time
  | "weight-duration"    // farmer walks: weight + time
  | "rounds-reps";       // AMRAP/circuit: rounds + reps

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  secondary?: MuscleGroup[];
  equipment: Equipment;
  category: ExerciseCategory;
  tracking: TrackingType;
  aliases?: string[];
}

function ex(
  id: string, name: string, muscle: MuscleGroup, equipment: Equipment,
  category: ExerciseCategory, tracking: TrackingType,
  secondary?: MuscleGroup[], aliases?: string[]
): Exercise {
  const e: Exercise = { id, name, muscle, equipment, category, tracking };
  if (secondary?.length) e.secondary = secondary;
  if (aliases?.length) e.aliases = aliases;
  return e;
}

export const EXERCISES: Exercise[] = [
  /* ── CHEST ─────────────────────────────────────────────────── */
  ex("bb-bench", "Barbell Bench Press", "chest", "barbell", "strength", "weight-reps", ["triceps", "shoulders"], ["flat bench", "bench press"]),
  ex("bb-incline-bench", "Incline Barbell Bench", "chest", "barbell", "strength", "weight-reps", ["shoulders", "triceps"], ["incline bench"]),
  ex("bb-decline-bench", "Decline Barbell Bench", "chest", "barbell", "strength", "weight-reps", ["triceps"]),
  ex("bb-close-grip-bench", "Close-Grip Bench Press", "chest", "barbell", "strength", "weight-reps", ["triceps"], ["CGBP"]),
  ex("db-bench", "Dumbbell Bench Press", "chest", "dumbbell", "strength", "weight-reps", ["triceps", "shoulders"]),
  ex("db-incline-bench", "Incline Dumbbell Bench", "chest", "dumbbell", "strength", "weight-reps", ["shoulders", "triceps"]),
  ex("db-decline-bench", "Decline Dumbbell Bench", "chest", "dumbbell", "strength", "weight-reps", ["triceps"]),
  ex("db-fly", "Dumbbell Fly", "chest", "dumbbell", "strength", "weight-reps", [], ["chest fly"]),
  ex("db-incline-fly", "Incline Dumbbell Fly", "chest", "dumbbell", "strength", "weight-reps", ["shoulders"]),
  ex("db-pullover", "Dumbbell Pullover", "chest", "dumbbell", "strength", "weight-reps", ["lats"]),
  ex("cable-fly", "Cable Fly", "chest", "cable", "strength", "weight-reps", [], ["cable crossover"]),
  ex("cable-fly-low", "Low-to-High Cable Fly", "chest", "cable", "strength", "weight-reps", ["shoulders"]),
  ex("cable-fly-high", "High-to-Low Cable Fly", "chest", "cable", "strength", "weight-reps"),
  ex("machine-chest-press", "Machine Chest Press", "chest", "machine", "strength", "weight-reps", ["triceps"]),
  ex("pec-deck", "Pec Deck", "chest", "machine", "strength", "weight-reps", [], ["pec fly machine"]),
  ex("push-up", "Push-Up", "chest", "bodyweight", "calisthenics", "bodyweight-reps", ["triceps", "shoulders", "core"], ["pushup"]),
  ex("diamond-push-up", "Diamond Push-Up", "chest", "bodyweight", "calisthenics", "bodyweight-reps", ["triceps"]),
  ex("decline-push-up", "Decline Push-Up", "chest", "bodyweight", "calisthenics", "bodyweight-reps", ["shoulders"]),
  ex("wide-push-up", "Wide Push-Up", "chest", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("dip-chest", "Chest Dip", "chest", "bodyweight", "calisthenics", "bodyweight-reps", ["triceps", "shoulders"], ["dips"]),
  ex("smith-bench", "Smith Machine Bench", "chest", "smith-machine", "strength", "weight-reps", ["triceps"]),
  ex("landmine-press", "Landmine Press", "chest", "barbell", "strength", "weight-reps", ["shoulders"]),
  ex("floor-press-bb", "Barbell Floor Press", "chest", "barbell", "strength", "weight-reps", ["triceps"]),
  ex("floor-press-db", "Dumbbell Floor Press", "chest", "dumbbell", "strength", "weight-reps", ["triceps"]),
  ex("svend-press", "Svend Press", "chest", "other", "strength", "weight-reps"),

  /* ── BACK ──────────────────────────────────────────────────── */
  ex("bb-row", "Barbell Row", "back", "barbell", "strength", "weight-reps", ["biceps", "lats"], ["bent-over row"]),
  ex("pendlay-row", "Pendlay Row", "back", "barbell", "strength", "weight-reps", ["biceps", "lats"]),
  ex("db-row", "Dumbbell Row", "back", "dumbbell", "strength", "weight-reps", ["biceps", "lats"], ["one-arm row"]),
  ex("cable-row", "Seated Cable Row", "back", "cable", "strength", "weight-reps", ["biceps", "lats"], ["cable row"]),
  ex("cable-row-wide", "Wide-Grip Cable Row", "back", "cable", "strength", "weight-reps", ["traps"]),
  ex("t-bar-row", "T-Bar Row", "back", "barbell", "strength", "weight-reps", ["biceps", "lats"]),
  ex("pull-up", "Pull-Up", "back", "bodyweight", "calisthenics", "bodyweight-reps", ["biceps", "lats"], ["pullup"]),
  ex("chin-up", "Chin-Up", "back", "bodyweight", "calisthenics", "bodyweight-reps", ["biceps"], ["chinup"]),
  ex("neutral-pull-up", "Neutral-Grip Pull-Up", "back", "bodyweight", "calisthenics", "bodyweight-reps", ["biceps"]),
  ex("lat-pulldown", "Lat Pulldown", "back", "cable", "strength", "weight-reps", ["biceps", "lats"], ["pulldown"]),
  ex("lat-pulldown-close", "Close-Grip Pulldown", "back", "cable", "strength", "weight-reps", ["biceps"]),
  ex("lat-pulldown-wide", "Wide-Grip Pulldown", "back", "cable", "strength", "weight-reps", ["lats"]),
  ex("straight-arm-pulldown", "Straight-Arm Pulldown", "back", "cable", "strength", "weight-reps", ["lats"]),
  ex("machine-row", "Machine Row", "back", "machine", "strength", "weight-reps", ["biceps"]),
  ex("chest-supported-row", "Chest-Supported Row", "back", "dumbbell", "strength", "weight-reps", ["biceps"]),
  ex("meadows-row", "Meadows Row", "back", "barbell", "strength", "weight-reps", ["lats"]),
  ex("seal-row", "Seal Row", "back", "barbell", "strength", "weight-reps", ["biceps"]),
  ex("inverted-row", "Inverted Row", "back", "bodyweight", "calisthenics", "bodyweight-reps", ["biceps"]),
  ex("back-extension", "Back Extension", "back", "bodyweight", "strength", "bodyweight-reps", ["hamstrings", "glutes"], ["hyperextension"]),
  ex("deadlift", "Deadlift", "back", "barbell", "strength", "weight-reps", ["hamstrings", "glutes", "traps"], ["conventional deadlift"]),
  ex("sumo-deadlift", "Sumo Deadlift", "back", "barbell", "strength", "weight-reps", ["hamstrings", "glutes", "quads"]),
  ex("rack-pull", "Rack Pull", "back", "barbell", "strength", "weight-reps", ["traps", "glutes"]),
  ex("trap-bar-deadlift", "Trap Bar Deadlift", "back", "trap-bar", "strength", "weight-reps", ["quads", "glutes"], ["hex bar deadlift"]),
  ex("renegade-row", "Renegade Row", "back", "dumbbell", "strength", "weight-reps", ["core"]),
  ex("face-pull", "Face Pull", "back", "cable", "strength", "weight-reps", ["shoulders", "traps"], ["face pulls"]),

  /* ── SHOULDERS ─────────────────────────────────────────────── */
  ex("ohp", "Overhead Press", "shoulders", "barbell", "strength", "weight-reps", ["triceps"], ["OHP", "military press", "shoulder press"]),
  ex("db-shoulder-press", "Dumbbell Shoulder Press", "shoulders", "dumbbell", "strength", "weight-reps", ["triceps"]),
  ex("arnold-press", "Arnold Press", "shoulders", "dumbbell", "strength", "weight-reps", ["triceps"]),
  ex("push-press", "Push Press", "shoulders", "barbell", "olympic", "weight-reps", ["triceps", "quads"]),
  ex("machine-shoulder-press", "Machine Shoulder Press", "shoulders", "machine", "strength", "weight-reps", ["triceps"]),
  ex("db-lateral-raise", "Lateral Raise", "shoulders", "dumbbell", "strength", "weight-reps", [], ["side raise"]),
  ex("cable-lateral-raise", "Cable Lateral Raise", "shoulders", "cable", "strength", "weight-reps"),
  ex("machine-lateral-raise", "Machine Lateral Raise", "shoulders", "machine", "strength", "weight-reps"),
  ex("db-front-raise", "Front Raise", "shoulders", "dumbbell", "strength", "weight-reps"),
  ex("cable-front-raise", "Cable Front Raise", "shoulders", "cable", "strength", "weight-reps"),
  ex("db-rear-delt-fly", "Rear Delt Fly", "shoulders", "dumbbell", "strength", "weight-reps", [], ["reverse fly"]),
  ex("cable-rear-delt-fly", "Cable Rear Delt Fly", "shoulders", "cable", "strength", "weight-reps"),
  ex("rear-delt-machine", "Rear Delt Machine", "shoulders", "machine", "strength", "weight-reps", [], ["reverse pec deck"]),
  ex("bb-upright-row", "Barbell Upright Row", "shoulders", "barbell", "strength", "weight-reps", ["traps"]),
  ex("bb-shrug", "Barbell Shrug", "traps", "barbell", "strength", "weight-reps", [], ["shrugs"]),
  ex("db-shrug", "Dumbbell Shrug", "traps", "dumbbell", "strength", "weight-reps"),
  ex("pike-push-up", "Pike Push-Up", "shoulders", "bodyweight", "calisthenics", "bodyweight-reps", ["triceps"]),
  ex("handstand-push-up", "Handstand Push-Up", "shoulders", "bodyweight", "calisthenics", "bodyweight-reps", ["triceps"]),
  ex("lu-raise", "Lu Raise", "shoulders", "dumbbell", "strength", "weight-reps"),
  ex("landmine-press-single", "Single-Arm Landmine Press", "shoulders", "barbell", "strength", "weight-reps", ["chest"]),
  ex("bus-driver", "Dumbbell Bus Driver", "shoulders", "dumbbell", "strength", "weight-reps"),
  ex("bradford-press", "Bradford Press", "shoulders", "barbell", "strength", "weight-reps", ["triceps"]),

  /* ── BICEPS ────────────────────────────────────────────────── */
  ex("bb-curl", "Barbell Curl", "biceps", "barbell", "strength", "weight-reps", [], ["bicep curl"]),
  ex("ez-curl", "EZ-Bar Curl", "biceps", "ez-bar", "strength", "weight-reps"),
  ex("db-curl", "Dumbbell Curl", "biceps", "dumbbell", "strength", "weight-reps"),
  ex("db-hammer-curl", "Hammer Curl", "biceps", "dumbbell", "strength", "weight-reps", ["forearms"]),
  ex("db-incline-curl", "Incline Dumbbell Curl", "biceps", "dumbbell", "strength", "weight-reps"),
  ex("db-concentration-curl", "Concentration Curl", "biceps", "dumbbell", "strength", "weight-reps"),
  ex("cable-curl", "Cable Curl", "biceps", "cable", "strength", "weight-reps"),
  ex("cable-hammer-curl", "Cable Rope Curl", "biceps", "cable", "strength", "weight-reps", ["forearms"]),
  ex("preacher-curl", "Preacher Curl", "biceps", "ez-bar", "strength", "weight-reps"),
  ex("machine-curl", "Machine Curl", "biceps", "machine", "strength", "weight-reps"),
  ex("spider-curl", "Spider Curl", "biceps", "dumbbell", "strength", "weight-reps"),
  ex("drag-curl", "Drag Curl", "biceps", "barbell", "strength", "weight-reps"),
  ex("bayesian-curl", "Bayesian Curl", "biceps", "cable", "strength", "weight-reps"),
  ex("zottman-curl", "Zottman Curl", "biceps", "dumbbell", "strength", "weight-reps", ["forearms"]),
  ex("twenty-ones", "21s", "biceps", "ez-bar", "strength", "weight-reps"),
  ex("reverse-curl-bb", "Barbell Reverse Curl", "forearms", "barbell", "strength", "weight-reps", ["biceps"]),
  ex("wrist-curl", "Wrist Curl", "forearms", "dumbbell", "strength", "weight-reps"),
  ex("farmer-walk", "Farmer's Walk", "forearms", "dumbbell", "strength", "duration", ["traps", "core"], ["farmer carry"]),
  ex("dead-hang", "Dead Hang", "forearms", "bodyweight", "strength", "duration"),

  /* ── TRICEPS ───────────────────────────────────────────────── */
  ex("cable-pushdown", "Cable Pushdown", "triceps", "cable", "strength", "weight-reps", [], ["tricep pushdown", "rope pushdown"]),
  ex("cable-pushdown-bar", "Cable Pushdown V-Bar", "triceps", "cable", "strength", "weight-reps"),
  ex("overhead-cable-ext", "Overhead Cable Extension", "triceps", "cable", "strength", "weight-reps"),
  ex("skull-crusher", "Skull Crusher", "triceps", "ez-bar", "strength", "weight-reps", [], ["lying tricep extension"]),
  ex("skull-crusher-db", "Dumbbell Skull Crusher", "triceps", "dumbbell", "strength", "weight-reps"),
  ex("db-overhead-ext", "Overhead Dumbbell Extension", "triceps", "dumbbell", "strength", "weight-reps"),
  ex("db-kickback", "Tricep Kickback", "triceps", "dumbbell", "strength", "weight-reps"),
  ex("dip-tricep", "Tricep Dip", "triceps", "bodyweight", "calisthenics", "bodyweight-reps", ["chest", "shoulders"]),
  ex("bench-dip", "Bench Dip", "triceps", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("machine-dip", "Machine Dip", "triceps", "machine", "strength", "weight-reps", ["chest"]),
  ex("jm-press", "JM Press", "triceps", "barbell", "strength", "weight-reps"),
  ex("cable-kickback", "Cable Kickback", "triceps", "cable", "strength", "weight-reps"),

  /* ── QUADS ─────────────────────────────────────────────────── */
  ex("bb-squat", "Barbell Squat", "quads", "barbell", "strength", "weight-reps", ["glutes", "hamstrings", "core"], ["back squat", "squat"]),
  ex("front-squat", "Front Squat", "quads", "barbell", "strength", "weight-reps", ["glutes", "core"]),
  ex("goblet-squat", "Goblet Squat", "quads", "dumbbell", "strength", "weight-reps", ["glutes", "core"]),
  ex("db-squat", "Dumbbell Squat", "quads", "dumbbell", "strength", "weight-reps", ["glutes"]),
  ex("hack-squat", "Hack Squat", "quads", "machine", "strength", "weight-reps", ["glutes"]),
  ex("smith-squat", "Smith Machine Squat", "quads", "smith-machine", "strength", "weight-reps", ["glutes"]),
  ex("leg-press", "Leg Press", "quads", "machine", "strength", "weight-reps", ["glutes", "hamstrings"]),
  ex("leg-extension", "Leg Extension", "quads", "machine", "strength", "weight-reps"),
  ex("sissy-squat", "Sissy Squat", "quads", "bodyweight", "strength", "bodyweight-reps"),
  ex("bb-lunge", "Barbell Lunge", "quads", "barbell", "strength", "weight-reps", ["glutes", "hamstrings"], ["lunges"]),
  ex("db-lunge", "Dumbbell Lunge", "quads", "dumbbell", "strength", "weight-reps", ["glutes", "hamstrings"]),
  ex("walking-lunge", "Walking Lunge", "quads", "dumbbell", "strength", "weight-reps", ["glutes"]),
  ex("reverse-lunge", "Reverse Lunge", "quads", "dumbbell", "strength", "weight-reps", ["glutes"]),
  ex("bulgarian-split-squat", "Bulgarian Split Squat", "quads", "dumbbell", "strength", "weight-reps", ["glutes"], ["BSS"]),
  ex("step-up", "Step-Up", "quads", "dumbbell", "strength", "weight-reps", ["glutes"]),
  ex("pistol-squat", "Pistol Squat", "quads", "bodyweight", "calisthenics", "bodyweight-reps", ["glutes"]),
  ex("wall-sit", "Wall Sit", "quads", "bodyweight", "strength", "duration"),
  ex("belt-squat", "Belt Squat", "quads", "machine", "strength", "weight-reps", ["glutes"]),
  ex("pendulum-squat", "Pendulum Squat", "quads", "machine", "strength", "weight-reps", ["glutes"]),
  ex("zercher-squat", "Zercher Squat", "quads", "barbell", "strength", "weight-reps", ["glutes", "core"]),
  ex("box-squat", "Box Squat", "quads", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("curtsy-lunge", "Curtsy Lunge", "quads", "dumbbell", "strength", "weight-reps", ["glutes"]),

  /* ── HAMSTRINGS ────────────────────────────────────────────── */
  ex("rdl", "Romanian Deadlift", "hamstrings", "barbell", "strength", "weight-reps", ["glutes"], ["RDL"]),
  ex("db-rdl", "Dumbbell RDL", "hamstrings", "dumbbell", "strength", "weight-reps", ["glutes"]),
  ex("single-leg-rdl", "Single-Leg RDL", "hamstrings", "dumbbell", "strength", "weight-reps", ["glutes"]),
  ex("stiff-leg-deadlift", "Stiff-Leg Deadlift", "hamstrings", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("lying-leg-curl", "Lying Leg Curl", "hamstrings", "machine", "strength", "weight-reps"),
  ex("seated-leg-curl", "Seated Leg Curl", "hamstrings", "machine", "strength", "weight-reps"),
  ex("nordic-curl", "Nordic Hamstring Curl", "hamstrings", "bodyweight", "strength", "bodyweight-reps"),
  ex("good-morning", "Good Morning", "hamstrings", "barbell", "strength", "weight-reps", ["glutes", "back"]),
  ex("glute-ham-raise", "Glute-Ham Raise", "hamstrings", "bodyweight", "strength", "bodyweight-reps", ["glutes"], ["GHR"]),
  ex("cable-pull-through", "Cable Pull-Through", "hamstrings", "cable", "strength", "weight-reps", ["glutes"]),
  ex("kb-swing", "Kettlebell Swing", "hamstrings", "kettlebell", "strength", "weight-reps", ["glutes", "core"], ["KB swing"]),
  ex("swiss-ball-curl", "Swiss Ball Hamstring Curl", "hamstrings", "other", "strength", "bodyweight-reps"),

  /* ── GLUTES ────────────────────────────────────────────────── */
  ex("bb-hip-thrust", "Barbell Hip Thrust", "glutes", "barbell", "strength", "weight-reps", ["hamstrings"], ["hip thrust"]),
  ex("db-hip-thrust", "Dumbbell Hip Thrust", "glutes", "dumbbell", "strength", "weight-reps", ["hamstrings"]),
  ex("machine-hip-thrust", "Machine Hip Thrust", "glutes", "machine", "strength", "weight-reps"),
  ex("glute-bridge", "Glute Bridge", "glutes", "bodyweight", "strength", "bodyweight-reps", ["hamstrings"]),
  ex("single-leg-bridge", "Single-Leg Bridge", "glutes", "bodyweight", "strength", "bodyweight-reps"),
  ex("cable-glute-kickback", "Cable Glute Kickback", "glutes", "cable", "strength", "weight-reps"),
  ex("hip-abduction-machine", "Hip Abduction Machine", "glutes", "machine", "strength", "weight-reps"),
  ex("hip-adduction-machine", "Hip Adduction Machine", "glutes", "machine", "strength", "weight-reps"),
  ex("sumo-squat", "Sumo Squat", "glutes", "dumbbell", "strength", "weight-reps", ["quads"]),
  ex("donkey-kick", "Donkey Kick", "glutes", "bodyweight", "strength", "bodyweight-reps"),
  ex("fire-hydrant", "Fire Hydrant", "glutes", "bodyweight", "strength", "bodyweight-reps"),
  ex("band-walk", "Banded Lateral Walk", "glutes", "band", "strength", "bodyweight-reps", [], ["monster walk"]),
  ex("clamshell", "Clamshell", "glutes", "band", "strength", "bodyweight-reps"),
  ex("reverse-hyper", "Reverse Hyper", "glutes", "machine", "strength", "weight-reps", ["hamstrings"]),
  ex("frog-pump", "Frog Pump", "glutes", "bodyweight", "strength", "bodyweight-reps"),
  ex("lateral-lunge", "Lateral Lunge", "glutes", "dumbbell", "strength", "weight-reps", ["quads"]),

  /* ── CALVES ────────────────────────────────────────────────── */
  ex("standing-calf-raise", "Standing Calf Raise", "calves", "machine", "strength", "weight-reps", [], ["calf raise"]),
  ex("seated-calf-raise", "Seated Calf Raise", "calves", "machine", "strength", "weight-reps"),
  ex("smith-calf-raise", "Smith Calf Raise", "calves", "smith-machine", "strength", "weight-reps"),
  ex("db-calf-raise", "Dumbbell Calf Raise", "calves", "dumbbell", "strength", "weight-reps"),
  ex("bw-calf-raise", "Bodyweight Calf Raise", "calves", "bodyweight", "strength", "bodyweight-reps"),
  ex("leg-press-calf", "Leg Press Calf Raise", "calves", "machine", "strength", "weight-reps"),
  ex("tibialis-raise", "Tibialis Raise", "calves", "bodyweight", "strength", "bodyweight-reps"),
  ex("donkey-calf-raise", "Donkey Calf Raise", "calves", "machine", "strength", "weight-reps"),

  /* ── CORE ──────────────────────────────────────────────────── */
  ex("crunch", "Crunch", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("sit-up", "Sit-Up", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("decline-sit-up", "Decline Sit-Up", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("plank", "Plank", "core", "bodyweight", "calisthenics", "duration"),
  ex("side-plank", "Side Plank", "core", "bodyweight", "calisthenics", "duration"),
  ex("russian-twist", "Russian Twist", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("bicycle-crunch", "Bicycle Crunch", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("leg-raise-hanging", "Hanging Leg Raise", "core", "bodyweight", "calisthenics", "bodyweight-reps", ["hip-flexors"]),
  ex("leg-raise-lying", "Lying Leg Raise", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("knee-raise-hanging", "Hanging Knee Raise", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("toes-to-bar", "Toes to Bar", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("ab-wheel", "Ab Wheel Rollout", "core", "other", "strength", "bodyweight-reps"),
  ex("cable-crunch", "Cable Crunch", "core", "cable", "strength", "weight-reps"),
  ex("cable-woodchop", "Cable Woodchop", "core", "cable", "strength", "weight-reps"),
  ex("pallof-press", "Pallof Press", "core", "cable", "strength", "weight-reps"),
  ex("mountain-climber", "Mountain Climber", "core", "bodyweight", "plyometric", "bodyweight-reps"),
  ex("dead-bug", "Dead Bug", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("bird-dog", "Bird Dog", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("flutter-kick", "Flutter Kick", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("v-up", "V-Up", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("dragon-flag", "Dragon Flag", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("ab-machine", "Ab Crunch Machine", "core", "machine", "strength", "weight-reps"),
  ex("l-sit", "L-Sit", "core", "bodyweight", "calisthenics", "duration"),
  ex("hollow-hold", "Hollow Body Hold", "core", "bodyweight", "calisthenics", "duration"),
  ex("suitcase-carry", "Suitcase Carry", "core", "dumbbell", "strength", "duration", ["forearms"]),

  /* ── OLYMPIC ───────────────────────────────────────────────── */
  ex("clean", "Power Clean", "full-body", "barbell", "olympic", "weight-reps", ["quads", "hamstrings", "traps"]),
  ex("clean-and-jerk", "Clean and Jerk", "full-body", "barbell", "olympic", "weight-reps", ["quads", "shoulders"]),
  ex("snatch", "Snatch", "full-body", "barbell", "olympic", "weight-reps", ["shoulders", "quads"]),
  ex("hang-clean", "Hang Clean", "full-body", "barbell", "olympic", "weight-reps", ["traps", "quads"]),
  ex("hang-snatch", "Hang Snatch", "full-body", "barbell", "olympic", "weight-reps", ["shoulders"]),
  ex("thruster", "Thruster", "full-body", "barbell", "strength", "weight-reps", ["quads", "shoulders"]),
  ex("db-thruster", "Dumbbell Thruster", "full-body", "dumbbell", "strength", "weight-reps", ["quads", "shoulders"]),
  ex("wall-ball", "Wall Ball", "full-body", "medicine-ball", "strength", "bodyweight-reps", ["quads", "shoulders"]),
  ex("clean-pull", "Clean Pull", "full-body", "barbell", "olympic", "weight-reps", ["traps", "back"]),

  /* ── FULL-BODY / CALISTHENICS ──────────────────────────────── */
  ex("burpee", "Burpee", "full-body", "bodyweight", "plyometric", "bodyweight-reps", ["chest", "quads", "core"]),
  ex("turkish-get-up", "Turkish Get-Up", "full-body", "kettlebell", "strength", "weight-reps", ["core", "shoulders"]),
  ex("bear-crawl", "Bear Crawl", "full-body", "bodyweight", "calisthenics", "duration"),
  ex("battle-rope", "Battle Rope", "full-body", "other", "cardio", "duration", ["shoulders", "core"]),
  ex("muscle-up", "Muscle-Up", "full-body", "bodyweight", "calisthenics", "bodyweight-reps", ["back", "chest", "triceps"]),
  ex("man-maker", "Man Maker", "full-body", "dumbbell", "strength", "weight-reps"),
  ex("front-lever", "Front Lever Hold", "full-body", "bodyweight", "calisthenics", "duration", ["back", "core"]),
  ex("back-lever", "Back Lever Hold", "full-body", "bodyweight", "calisthenics", "duration", ["shoulders", "core"]),
  ex("human-flag", "Human Flag", "full-body", "bodyweight", "calisthenics", "duration", ["core", "shoulders"]),
  ex("planche-push-up", "Planche Push-Up", "full-body", "bodyweight", "calisthenics", "bodyweight-reps", ["shoulders", "chest"]),
  ex("rope-climb", "Rope Climb", "full-body", "bodyweight", "calisthenics", "bodyweight-reps", ["back", "forearms"]),
  ex("skin-the-cat", "Skin the Cat", "full-body", "bodyweight", "calisthenics", "bodyweight-reps", ["shoulders", "core"]),

  /* ── PLYOMETRICS ───────────────────────────────────────────── */
  ex("box-jump", "Box Jump", "quads", "bodyweight", "plyometric", "bodyweight-reps", ["glutes", "calves"]),
  ex("jump-squat", "Jump Squat", "quads", "bodyweight", "plyometric", "bodyweight-reps", ["glutes"]),
  ex("jump-lunge", "Jump Lunge", "quads", "bodyweight", "plyometric", "bodyweight-reps"),
  ex("broad-jump", "Broad Jump", "quads", "bodyweight", "plyometric", "bodyweight-reps", ["glutes"]),
  ex("depth-jump", "Depth Jump", "quads", "bodyweight", "plyometric", "bodyweight-reps"),
  ex("clap-push-up", "Clap Push-Up", "chest", "bodyweight", "plyometric", "bodyweight-reps"),
  ex("tuck-jump", "Tuck Jump", "quads", "bodyweight", "plyometric", "bodyweight-reps"),
  ex("skater-jump", "Skater Jump", "glutes", "bodyweight", "plyometric", "bodyweight-reps"),
  ex("med-ball-slam", "Medicine Ball Slam", "full-body", "medicine-ball", "plyometric", "bodyweight-reps", ["core"]),
  ex("box-step-over", "Box Step-Over", "quads", "bodyweight", "plyometric", "bodyweight-reps", ["glutes"]),

  /* ── CARDIO ────────────────────────────────────────────────── */
  ex("treadmill-run", "Treadmill Run", "cardio", "cardio-machine", "cardio", "distance", [], ["running"]),
  ex("treadmill-walk", "Treadmill Walk", "cardio", "cardio-machine", "cardio", "distance", [], ["walking"]),
  ex("treadmill-incline", "Incline Walk", "cardio", "cardio-machine", "cardio", "duration", [], ["12-3-30"]),
  ex("outdoor-run", "Outdoor Run", "cardio", "bodyweight", "cardio", "distance", [], ["run", "jog", "running"]),
  ex("outdoor-walk", "Outdoor Walk", "cardio", "bodyweight", "cardio", "distance", [], ["walk"]),
  ex("outdoor-sprint", "Sprint", "cardio", "bodyweight", "cardio", "distance", [], ["sprints"]),
  ex("cycling", "Cycling", "cardio", "bodyweight", "cardio", "distance", [], ["biking"]),
  ex("stationary-bike", "Stationary Bike", "cardio", "cardio-machine", "cardio", "distance", [], ["bike"]),
  ex("spin-bike", "Spin Class", "cardio", "cardio-machine", "cardio", "duration", [], ["SoulCycle"]),
  ex("rowing-machine", "Rowing Machine", "cardio", "cardio-machine", "cardio", "distance", [], ["erg", "rower"]),
  ex("elliptical", "Elliptical", "cardio", "cardio-machine", "cardio", "duration"),
  ex("stair-climber", "Stair Climber", "cardio", "cardio-machine", "cardio", "duration", [], ["StairMaster"]),
  ex("jump-rope", "Jump Rope", "cardio", "other", "cardio", "duration", ["calves"], ["skipping"]),
  ex("double-under", "Double Unders", "cardio", "other", "cardio", "bodyweight-reps", ["calves"]),
  ex("swimming", "Swimming", "cardio", "bodyweight", "cardio", "distance"),
  ex("hiking", "Hiking", "cardio", "bodyweight", "cardio", "distance"),
  ex("assault-bike", "Assault Bike", "cardio", "cardio-machine", "cardio", "duration", [], ["air bike", "echo bike"]),
  ex("ski-erg", "Ski Erg", "cardio", "cardio-machine", "cardio", "duration"),
  ex("sled-push", "Sled Push", "cardio", "other", "cardio", "duration", ["quads", "glutes"]),
  ex("sled-pull", "Sled Pull", "cardio", "other", "cardio", "duration", ["back", "hamstrings"]),

  /* ── YOGA ──────────────────────────────────────────────────── */
  ex("yoga-mountain", "Mountain Pose", "core", "bodyweight", "yoga", "duration"),
  ex("yoga-chair", "Chair Pose", "quads", "bodyweight", "yoga", "duration", ["glutes"]),
  ex("yoga-warrior-1", "Warrior I", "quads", "bodyweight", "yoga", "duration", ["hip-flexors"], ["Virabhadrasana I"]),
  ex("yoga-warrior-2", "Warrior II", "quads", "bodyweight", "yoga", "duration", ["hip-flexors"], ["Virabhadrasana II"]),
  ex("yoga-warrior-3", "Warrior III", "hamstrings", "bodyweight", "yoga", "duration", ["core", "glutes"], ["Virabhadrasana III"]),
  ex("yoga-triangle", "Triangle Pose", "hamstrings", "bodyweight", "yoga", "duration", ["core"], ["Trikonasana"]),
  ex("yoga-side-angle", "Extended Side Angle", "quads", "bodyweight", "yoga", "duration", ["core"]),
  ex("yoga-half-moon", "Half Moon", "glutes", "bodyweight", "yoga", "duration", ["core"], ["Ardha Chandrasana"]),
  ex("yoga-tree", "Tree Pose", "quads", "bodyweight", "yoga", "duration", ["core"], ["Vrksasana"]),
  ex("yoga-eagle", "Eagle Pose", "quads", "bodyweight", "yoga", "duration", ["shoulders"], ["Garudasana"]),
  ex("yoga-dancer", "Dancer Pose", "quads", "bodyweight", "yoga", "duration", ["back"], ["Natarajasana"]),
  ex("yoga-high-lunge", "High Lunge", "quads", "bodyweight", "yoga", "duration", ["hip-flexors"]),
  ex("yoga-crescent-lunge", "Crescent Lunge", "quads", "bodyweight", "yoga", "duration", ["hip-flexors"]),
  ex("yoga-forward-fold", "Standing Forward Fold", "hamstrings", "bodyweight", "yoga", "duration", [], ["Uttanasana"]),
  ex("yoga-downward-dog", "Downward Dog", "hamstrings", "bodyweight", "yoga", "duration", ["calves", "shoulders"], ["Adho Mukha Svanasana"]),
  ex("yoga-dolphin", "Dolphin Pose", "shoulders", "bodyweight", "yoga", "duration", ["core"]),
  ex("yoga-cobra", "Cobra Pose", "back", "bodyweight", "yoga", "duration", ["core"], ["Bhujangasana"]),
  ex("yoga-upward-dog", "Upward-Facing Dog", "back", "bodyweight", "yoga", "duration", ["shoulders"]),
  ex("yoga-locust", "Locust Pose", "back", "bodyweight", "yoga", "duration", ["glutes"]),
  ex("yoga-bridge", "Bridge Pose", "glutes", "bodyweight", "yoga", "duration", ["hamstrings"], ["Setu Bandhasana"]),
  ex("yoga-wheel", "Wheel Pose", "back", "bodyweight", "yoga", "duration", ["shoulders", "glutes"], ["Urdhva Dhanurasana"]),
  ex("yoga-boat", "Boat Pose", "core", "bodyweight", "yoga", "duration", [], ["Navasana"]),
  ex("yoga-crow", "Crow Pose", "core", "bodyweight", "yoga", "duration", ["shoulders"], ["Bakasana"]),
  ex("yoga-headstand", "Headstand", "shoulders", "bodyweight", "yoga", "duration", ["core"], ["Sirsasana"]),
  ex("yoga-shoulder-stand", "Shoulder Stand", "core", "bodyweight", "yoga", "duration", ["shoulders"], ["Sarvangasana"]),
  ex("yoga-pigeon", "Pigeon Pose", "glutes", "bodyweight", "yoga", "duration", ["hip-flexors"], ["Eka Pada Rajakapotasana"]),
  ex("yoga-lizard", "Lizard Pose", "hip-flexors", "bodyweight", "yoga", "duration", ["glutes"]),
  ex("yoga-frog", "Frog Pose", "hip-flexors", "bodyweight", "yoga", "duration", ["glutes"]),
  ex("yoga-malasana", "Malasana", "hip-flexors", "bodyweight", "yoga", "duration", ["glutes"], ["Yogi Squat"]),
  ex("yoga-half-splits", "Half Splits", "hamstrings", "bodyweight", "yoga", "duration", ["hip-flexors"]),
  ex("yoga-full-splits", "Full Splits", "hamstrings", "bodyweight", "yoga", "duration", ["hip-flexors"], ["Hanumanasana"]),
  ex("yoga-happy-baby", "Happy Baby", "hip-flexors", "bodyweight", "yoga", "duration", ["glutes"]),
  ex("yoga-childs-pose", "Child's Pose", "back", "bodyweight", "yoga", "duration"),
  ex("yoga-savasana", "Savasana", "full-body", "bodyweight", "yoga", "duration", [], ["Corpse Pose"]),
  ex("sun-salutation-a", "Sun Salutation A", "full-body", "bodyweight", "yoga", "duration", [], ["Surya Namaskar A"]),
  ex("sun-salutation-b", "Sun Salutation B", "full-body", "bodyweight", "yoga", "duration", [], ["Surya Namaskar B"]),

  /* ── PILATES ───────────────────────────────────────────────── */
  ex("pilates-hundred", "The Hundred", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-roll-up", "Roll-Up", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-single-leg-circle", "Single Leg Circle", "core", "bodyweight", "pilates", "bodyweight-reps", ["hip-flexors"]),
  ex("pilates-rolling-ball", "Rolling Like a Ball", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-single-leg-stretch", "Single Leg Stretch", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-double-leg-stretch", "Double Leg Stretch", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-spine-stretch", "Spine Stretch Forward", "back", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-saw", "Saw", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-swan", "Swan Dive", "back", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-swimming", "Swimming", "back", "bodyweight", "pilates", "duration"),
  ex("pilates-teaser", "Teaser", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-side-kick", "Side Kick Series", "glutes", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-mermaid", "Mermaid Stretch", "core", "bodyweight", "pilates", "duration"),
  ex("pilates-pelvic-curl", "Pelvic Curl", "glutes", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-open-leg-rocker", "Open Leg Rocker", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-corkscrew", "Corkscrew", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-bicycle", "Bicycle", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-jackknife", "Jackknife", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-seal", "Seal", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-reformer-footwork", "Reformer Footwork", "quads", "other", "pilates", "bodyweight-reps", ["glutes"]),

  /* ── BARRE ─────────────────────────────────────────────────── */
  ex("barre-plie-first", "First Position Plié", "quads", "bodyweight", "barre", "bodyweight-reps", ["calves"]),
  ex("barre-plie-second", "Second Position Plié", "quads", "bodyweight", "barre", "bodyweight-reps", ["glutes"]),
  ex("barre-releve", "Relevé", "calves", "bodyweight", "barre", "bodyweight-reps"),
  ex("barre-arabesque", "Arabesque Pulses", "glutes", "bodyweight", "barre", "bodyweight-reps"),
  ex("barre-attitude", "Attitude Lifts", "glutes", "bodyweight", "barre", "bodyweight-reps"),
  ex("barre-standing-leg-lift", "Standing Leg Lift", "glutes", "bodyweight", "barre", "bodyweight-reps"),
  ex("barre-thigh-work", "Parallel Thigh", "quads", "bodyweight", "barre", "duration"),
  ex("barre-pretzel", "Pretzel", "glutes", "bodyweight", "barre", "bodyweight-reps"),
  ex("barre-fold-over", "Fold-Over", "hamstrings", "bodyweight", "barre", "bodyweight-reps", ["glutes"]),
  ex("barre-wide-second-pulse", "Wide Second Plié Pulse", "quads", "bodyweight", "barre", "bodyweight-reps", ["glutes"]),
  ex("barre-arm-series", "Barre Arm Series", "shoulders", "dumbbell", "barre", "bodyweight-reps", ["triceps"]),
  ex("barre-curtsy", "Barre Curtsy Lunge", "quads", "bodyweight", "barre", "bodyweight-reps", ["glutes"]),

  /* ── BOXING ────────────────────────────────────────────────── */
  ex("boxing-jab", "Jab", "shoulders", "bodyweight", "boxing", "bodyweight-reps", ["core"]),
  ex("boxing-cross", "Cross", "shoulders", "bodyweight", "boxing", "bodyweight-reps", ["core"]),
  ex("boxing-hook", "Hook", "core", "bodyweight", "boxing", "bodyweight-reps", ["shoulders"]),
  ex("boxing-uppercut", "Uppercut", "shoulders", "bodyweight", "boxing", "bodyweight-reps", ["core"]),
  ex("boxing-jab-cross", "Jab-Cross Combo", "shoulders", "bodyweight", "boxing", "bodyweight-reps", ["core"]),
  ex("boxing-combo-6", "6-Punch Combo", "full-body", "bodyweight", "boxing", "bodyweight-reps", ["core", "shoulders"]),
  ex("boxing-heavy-bag", "Heavy Bag Rounds", "cardio", "other", "boxing", "duration", ["shoulders", "core"]),
  ex("boxing-speed-bag", "Speed Bag", "shoulders", "other", "boxing", "duration", ["forearms"]),
  ex("boxing-shadow", "Shadow Boxing", "cardio", "bodyweight", "boxing", "duration", ["shoulders"]),
  ex("boxing-slip-counter", "Slip & Counter", "core", "bodyweight", "boxing", "bodyweight-reps", ["shoulders"]),
  ex("boxing-kick-roundhouse", "Roundhouse Kick", "quads", "bodyweight", "boxing", "bodyweight-reps", ["core", "glutes"]),
  ex("boxing-knee-strike", "Knee Strike", "quads", "bodyweight", "boxing", "bodyweight-reps", ["core", "hip-flexors"]),

  /* ── FLEXIBILITY ───────────────────────────────────────────── */
  ex("foam-roll-quads", "Foam Roll Quads", "quads", "foam-roller", "flexibility", "duration"),
  ex("foam-roll-back", "Foam Roll Back", "back", "foam-roller", "flexibility", "duration"),
  ex("foam-roll-it-band", "Foam Roll IT Band", "quads", "foam-roller", "flexibility", "duration"),
  ex("foam-roll-hamstrings", "Foam Roll Hamstrings", "hamstrings", "foam-roller", "flexibility", "duration"),
  ex("foam-roll-calves", "Foam Roll Calves", "calves", "foam-roller", "flexibility", "duration"),
  ex("foam-roll-lats", "Foam Roll Lats", "lats", "foam-roller", "flexibility", "duration"),
  ex("hip-flexor-stretch", "Hip Flexor Stretch", "hip-flexors", "bodyweight", "flexibility", "duration"),
  ex("pigeon-stretch", "Pigeon Stretch", "glutes", "bodyweight", "flexibility", "duration"),
  ex("hamstring-stretch", "Hamstring Stretch", "hamstrings", "bodyweight", "flexibility", "duration"),
  ex("quad-stretch", "Quad Stretch", "quads", "bodyweight", "flexibility", "duration"),
  ex("shoulder-stretch", "Shoulder Stretch", "shoulders", "bodyweight", "flexibility", "duration"),
  ex("chest-stretch", "Chest Stretch", "chest", "bodyweight", "flexibility", "duration"),
  ex("cat-cow", "Cat-Cow", "back", "bodyweight", "flexibility", "duration"),
  ex("worlds-greatest-stretch", "World's Greatest Stretch", "hip-flexors", "bodyweight", "flexibility", "duration", ["hamstrings"]),
  ex("ninety-ninety-stretch", "90/90 Hip Stretch", "glutes", "bodyweight", "flexibility", "duration"),
  ex("couch-stretch", "Couch Stretch", "hip-flexors", "bodyweight", "flexibility", "duration"),
  ex("thread-the-needle", "Thread the Needle", "back", "bodyweight", "flexibility", "duration", ["shoulders"]),
  ex("scorpion-stretch", "Scorpion Stretch", "hip-flexors", "bodyweight", "flexibility", "duration", ["back"]),

  /* ── KETTLEBELL ─────────────────────────────────────────────── */
  ex("kb-goblet-squat", "KB Goblet Squat", "quads", "kettlebell", "strength", "weight-reps", ["glutes"]),
  ex("kb-clean", "KB Clean", "full-body", "kettlebell", "olympic", "weight-reps"),
  ex("kb-snatch", "KB Snatch", "full-body", "kettlebell", "olympic", "weight-reps", ["shoulders"]),
  ex("kb-press", "KB Press", "shoulders", "kettlebell", "strength", "weight-reps"),
  ex("kb-windmill", "KB Windmill", "core", "kettlebell", "strength", "weight-reps", ["shoulders"]),
  ex("kb-row", "KB Row", "back", "kettlebell", "strength", "weight-reps", ["biceps"]),
  ex("kb-deadlift", "KB Deadlift", "hamstrings", "kettlebell", "strength", "weight-reps", ["glutes"]),
  ex("kb-lunge", "KB Lunge", "quads", "kettlebell", "strength", "weight-reps", ["glutes"]),
  ex("kb-thruster", "KB Thruster", "full-body", "kettlebell", "strength", "weight-reps"),
  ex("kb-halo", "KB Halo", "shoulders", "kettlebell", "strength", "weight-reps", ["core"]),
  ex("kb-bottoms-up-press", "KB Bottoms-Up Press", "shoulders", "kettlebell", "strength", "weight-reps", ["forearms"]),

  /* ── SUSPENSION / BANDS ────────────────────────────────────── */
  ex("trx-row", "TRX Row", "back", "suspension", "strength", "bodyweight-reps", ["biceps"]),
  ex("trx-chest-press", "TRX Chest Press", "chest", "suspension", "strength", "bodyweight-reps", ["triceps"]),
  ex("trx-pike", "TRX Pike", "core", "suspension", "calisthenics", "bodyweight-reps", ["shoulders"]),
  ex("trx-hamstring-curl", "TRX Hamstring Curl", "hamstrings", "suspension", "strength", "bodyweight-reps"),
  ex("trx-squat", "TRX Squat", "quads", "suspension", "strength", "bodyweight-reps"),
  ex("band-pull-apart", "Band Pull-Apart", "shoulders", "band", "strength", "bodyweight-reps", ["traps"]),
  ex("band-row", "Band Row", "back", "band", "strength", "bodyweight-reps"),
  ex("band-curl", "Band Curl", "biceps", "band", "strength", "bodyweight-reps"),
  ex("band-squat", "Band Squat", "quads", "band", "strength", "bodyweight-reps"),
  ex("band-deadlift", "Band Deadlift", "hamstrings", "band", "strength", "bodyweight-reps"),

  /* ── ADDITIONAL STRENGTH ───────────────────────────────────── */
  ex("bb-floor-press-cg", "Close-Grip Floor Press", "triceps", "barbell", "strength", "weight-reps", ["chest"]),
  ex("db-around-the-world", "Around the World", "chest", "dumbbell", "strength", "weight-reps"),
  ex("cable-crossover-mid", "Mid Cable Crossover", "chest", "cable", "strength", "weight-reps"),
  ex("smith-incline-bench", "Smith Incline Bench", "chest", "smith-machine", "strength", "weight-reps", ["shoulders"]),
  ex("db-lateral-raise-lean", "Lean-Away Lateral Raise", "shoulders", "dumbbell", "strength", "weight-reps"),
  ex("behind-neck-press", "Behind-the-Neck Press", "shoulders", "barbell", "strength", "weight-reps"),
  ex("smith-ohp", "Smith Machine OHP", "shoulders", "smith-machine", "strength", "weight-reps"),
  ex("cable-upright-row", "Cable Upright Row", "shoulders", "cable", "strength", "weight-reps", ["traps"]),
  ex("trap-bar-shrug", "Trap Bar Shrug", "traps", "trap-bar", "strength", "weight-reps"),
  ex("cable-shrug", "Cable Shrug", "traps", "cable", "strength", "weight-reps"),
  ex("db-pullover-across", "Cross-Bench Pullover", "chest", "dumbbell", "strength", "weight-reps", ["lats"]),
  ex("lat-prayer", "Lat Prayer", "lats", "cable", "strength", "weight-reps"),
  ex("single-arm-lat-pulldown", "Single-Arm Pulldown", "lats", "cable", "strength", "weight-reps-each"),
  ex("single-arm-cable-row", "Single-Arm Cable Row", "back", "cable", "strength", "weight-reps-each", ["biceps"]),
  ex("db-concentration-row", "Concentration Row", "back", "dumbbell", "strength", "weight-reps-each"),
  ex("reverse-grip-pulldown", "Reverse-Grip Pulldown", "back", "cable", "strength", "weight-reps", ["biceps"]),
  ex("iso-lat-row", "Iso-Lateral Row", "back", "machine", "strength", "weight-reps-each"),
  ex("bb-hack-squat", "Barbell Hack Squat", "quads", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("smith-lunge", "Smith Machine Lunge", "quads", "smith-machine", "strength", "weight-reps", ["glutes"]),
  ex("leg-press-single", "Single-Leg Press", "quads", "machine", "strength", "weight-reps-each", ["glutes"]),
  ex("sissy-squat-weighted", "Weighted Sissy Squat", "quads", "dumbbell", "strength", "weight-reps"),
  ex("seated-ham-curl-single", "Single-Leg Seated Curl", "hamstrings", "machine", "strength", "weight-reps-each"),
  ex("cable-pull-through-single", "Single-Leg Pull-Through", "glutes", "cable", "strength", "weight-reps-each"),
  ex("smith-hip-thrust", "Smith Machine Hip Thrust", "glutes", "smith-machine", "strength", "weight-reps"),
  ex("bb-glute-bridge", "Barbell Glute Bridge", "glutes", "barbell", "strength", "weight-reps", ["hamstrings"]),
  ex("cable-abduction", "Cable Hip Abduction", "glutes", "cable", "strength", "weight-reps-each"),
  ex("single-leg-calf-raise", "Single-Leg Calf Raise", "calves", "bodyweight", "strength", "bodyweight-reps"),
  ex("smith-calf-raise-single", "Smith Single-Leg Calf Raise", "calves", "smith-machine", "strength", "weight-reps-each"),
  ex("ez-curl-reverse", "Reverse EZ Curl", "forearms", "ez-bar", "strength", "weight-reps"),
  ex("wrist-roller", "Wrist Roller", "forearms", "other", "strength", "reps-only"),
  ex("plate-pinch", "Plate Pinch Hold", "forearms", "other", "strength", "duration"),
  ex("db-tate-press", "Tate Press", "triceps", "dumbbell", "strength", "weight-reps"),
  ex("cable-overhead-ext-single", "Single-Arm Overhead Extension", "triceps", "cable", "strength", "weight-reps-each"),
  ex("cross-body-curl", "Cross-Body Hammer Curl", "biceps", "dumbbell", "strength", "weight-reps-each"),
  ex("waiter-curl", "Waiter Curl", "biceps", "dumbbell", "strength", "weight-reps"),
  ex("incline-hammer-curl", "Incline Hammer Curl", "biceps", "dumbbell", "strength", "weight-reps", ["forearms"]),

  /* ── ADDITIONAL CORE ───────────────────────────────────────── */
  ex("hanging-windshield-wiper", "Hanging Windshield Wiper", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("copenhagen-plank", "Copenhagen Plank", "core", "bodyweight", "calisthenics", "duration"),
  ex("stomach-vacuum", "Stomach Vacuum", "core", "bodyweight", "calisthenics", "duration"),
  ex("landmine-rotation", "Landmine Rotation", "core", "barbell", "strength", "weight-reps"),
  ex("farmers-walk-single", "Single-Arm Farmer Walk", "core", "dumbbell", "strength", "duration", ["forearms"]),
  ex("plank-shoulder-tap", "Plank Shoulder Tap", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("plank-to-pushup", "Plank to Push-Up", "core", "bodyweight", "calisthenics", "bodyweight-reps", ["triceps"]),
  ex("reverse-crunch", "Reverse Crunch", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("toe-touch-crunch", "Toe Touch Crunch", "core", "bodyweight", "calisthenics", "bodyweight-reps"),

  /* ── ADDITIONAL CARDIO ─────────────────────────────────────── */
  ex("incline-treadmill-run", "Incline Treadmill Run", "cardio", "cardio-machine", "cardio", "calories-duration"),
  ex("versa-climber", "VersaClimber", "cardio", "cardio-machine", "cardio", "calories-duration"),
  ex("jacob-ladder", "Jacob's Ladder", "cardio", "cardio-machine", "cardio", "calories-duration"),
  ex("peloton-ride", "Peloton Ride", "cardio", "cardio-machine", "cardio", "calories-duration", [], ["peloton"]),
  ex("rowing-intervals", "Rowing Intervals", "cardio", "cardio-machine", "cardio", "rounds-reps"),
  ex("bike-sprints", "Bike Sprints", "cardio", "cardio-machine", "cardio", "rounds-reps"),
  ex("trail-run", "Trail Run", "cardio", "bodyweight", "cardio", "distance"),
  ex("stair-run", "Stair Run", "cardio", "bodyweight", "cardio", "duration"),
  ex("jumping-jack", "Jumping Jacks", "cardio", "bodyweight", "cardio", "reps-only"),
  ex("high-knees", "High Knees", "cardio", "bodyweight", "cardio", "reps-only"),
  ex("butt-kicks", "Butt Kicks", "cardio", "bodyweight", "cardio", "reps-only"),

  /* ── ADDITIONAL PLYOMETRICS ────────────────────────────────── */
  ex("lateral-box-jump", "Lateral Box Jump", "quads", "bodyweight", "plyometric", "reps-only", ["glutes"]),
  ex("single-leg-box-jump", "Single-Leg Box Jump", "quads", "bodyweight", "plyometric", "reps-only"),
  ex("plyo-push-up", "Plyometric Push-Up", "chest", "bodyweight", "plyometric", "reps-only", ["triceps"]),
  ex("hurdle-hop", "Hurdle Hop", "quads", "bodyweight", "plyometric", "reps-only", ["calves"]),
  ex("med-ball-chest-pass", "Medicine Ball Chest Pass", "chest", "medicine-ball", "plyometric", "reps-only"),
  ex("med-ball-rotational-throw", "Rotational Med Ball Throw", "core", "medicine-ball", "plyometric", "reps-only"),

  /* ── ADDITIONAL YOGA ───────────────────────────────────────── */
  ex("yoga-camel", "Camel Pose", "back", "bodyweight", "yoga", "duration", ["hip-flexors"], ["Ustrasana"]),
  ex("yoga-king-pigeon", "King Pigeon", "hip-flexors", "bodyweight", "yoga", "duration", ["back"]),
  ex("yoga-fish", "Fish Pose", "chest", "bodyweight", "yoga", "duration", ["neck"], ["Matsyasana"]),
  ex("yoga-plow", "Plow Pose", "hamstrings", "bodyweight", "yoga", "duration", ["back"], ["Halasana"]),
  ex("yoga-seated-twist", "Seated Spinal Twist", "core", "bodyweight", "yoga", "duration"),
  ex("yoga-low-lunge", "Low Lunge", "hip-flexors", "bodyweight", "yoga", "duration", ["quads"]),
  ex("yoga-gate", "Gate Pose", "core", "bodyweight", "yoga", "duration"),
  ex("yoga-side-crow", "Side Crow", "core", "bodyweight", "yoga", "duration", ["shoulders"]),

  /* ── ADDITIONAL PILATES ────────────────────────────────────── */
  ex("pilates-boomerang", "Boomerang", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-control-balance", "Control Balance", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-hip-circle", "Hip Circle", "core", "bodyweight", "pilates", "bodyweight-reps"),
  ex("pilates-leg-pull-front", "Leg Pull Front", "core", "bodyweight", "pilates", "bodyweight-reps", ["shoulders"]),
  ex("pilates-leg-pull-back", "Leg Pull Back", "glutes", "bodyweight", "pilates", "bodyweight-reps", ["triceps"]),
  ex("pilates-reformer-long-stretch", "Reformer Long Stretch", "core", "other", "pilates", "bodyweight-reps"),

  /* ── ADDITIONAL FLEXIBILITY ────────────────────────────────── */
  ex("foam-roll-glutes", "Foam Roll Glutes", "glutes", "foam-roller", "flexibility", "duration"),
  ex("foam-roll-chest", "Foam Roll Chest", "chest", "foam-roller", "flexibility", "duration"),
  ex("ankle-circles", "Ankle Circles", "calves", "bodyweight", "flexibility", "reps-only"),
  ex("neck-stretch", "Neck Stretch", "neck", "bodyweight", "flexibility", "duration"),
  ex("wrist-circles", "Wrist Circles", "forearms", "bodyweight", "flexibility", "reps-only"),
  ex("thoracic-rotation", "Thoracic Spine Rotation", "back", "bodyweight", "flexibility", "duration"),
  ex("banded-shoulder-distraction", "Banded Shoulder Distraction", "shoulders", "band", "flexibility", "duration"),
  ex("figure-four-stretch", "Figure-Four Stretch", "glutes", "bodyweight", "flexibility", "duration"),
  ex("calf-stretch-wall", "Wall Calf Stretch", "calves", "bodyweight", "flexibility", "duration"),
  ex("lat-stretch-doorway", "Doorway Lat Stretch", "lats", "bodyweight", "flexibility", "duration"),

  /* ── ADDITIONAL STRENGTH (Round 2) ─────────────────────────── */
  ex("hex-press", "Hex Press", "chest", "dumbbell", "strength", "weight-reps", ["triceps"]),
  ex("squeeze-press", "Squeeze Press", "chest", "dumbbell", "strength", "weight-reps"),
  ex("cable-fly-incline", "Incline Cable Fly", "chest", "cable", "strength", "weight-reps", ["shoulders"]),
  ex("smith-decline-bench", "Smith Decline Bench", "chest", "smith-machine", "strength", "weight-reps"),
  ex("db-z-press", "Z-Press", "shoulders", "dumbbell", "strength", "weight-reps", ["core"]),
  ex("plate-front-raise", "Plate Front Raise", "shoulders", "other", "strength", "weight-reps"),
  ex("six-way-raise", "6-Way Raise", "shoulders", "dumbbell", "strength", "weight-reps"),
  ex("cable-y-raise", "Cable Y-Raise", "shoulders", "cable", "strength", "weight-reps", ["traps"]),
  ex("db-upright-row", "Dumbbell Upright Row", "shoulders", "dumbbell", "strength", "weight-reps", ["traps"]),
  ex("snatch-grip-deadlift", "Snatch-Grip Deadlift", "back", "barbell", "strength", "weight-reps", ["traps", "hamstrings"]),
  ex("deficit-deadlift", "Deficit Deadlift", "back", "barbell", "strength", "weight-reps", ["hamstrings", "glutes"]),
  ex("stiff-arm-db-pullover", "Stiff-Arm DB Pullover", "lats", "dumbbell", "strength", "weight-reps"),
  ex("kayak-row", "Kayak Row", "back", "cable", "strength", "weight-reps", ["biceps"]),
  ex("helms-row", "Helms Row", "back", "dumbbell", "strength", "weight-reps", ["biceps"]),
  ex("pause-squat", "Pause Squat", "quads", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("anderson-squat", "Anderson Squat", "quads", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("safety-bar-squat", "Safety Bar Squat", "quads", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("barbell-step-up", "Barbell Step-Up", "quads", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("landmine-squat", "Landmine Squat", "quads", "barbell", "strength", "weight-reps", ["glutes"]),
  ex("kneeling-leg-curl", "Kneeling Leg Curl", "hamstrings", "machine", "strength", "weight-reps"),
  ex("single-leg-deadlift-bb", "Single-Leg Barbell Deadlift", "hamstrings", "barbell", "strength", "weight-reps-each", ["glutes"]),
  ex("seated-good-morning", "Seated Good Morning", "hamstrings", "barbell", "strength", "weight-reps"),
  ex("cable-hip-thrust", "Cable Hip Thrust", "glutes", "cable", "strength", "weight-reps"),
  ex("pendulum-kickback", "Pendulum Kickback", "glutes", "machine", "strength", "weight-reps-each"),
  ex("deficit-reverse-lunge", "Deficit Reverse Lunge", "quads", "dumbbell", "strength", "weight-reps-each", ["glutes"]),
  ex("hack-calf-raise", "Hack Squat Calf Raise", "calves", "machine", "strength", "weight-reps"),
  ex("barbell-calf-raise", "Barbell Calf Raise", "calves", "barbell", "strength", "weight-reps"),
  ex("cable-bicep-curl-21s", "Cable 21s", "biceps", "cable", "strength", "weight-reps"),
  ex("scott-curl", "Scott Curl", "biceps", "ez-bar", "strength", "weight-reps"),
  ex("behind-back-curl", "Behind-the-Back Cable Curl", "biceps", "cable", "strength", "weight-reps"),
  ex("close-grip-pushdown", "Close-Grip Pushdown", "triceps", "cable", "strength", "weight-reps"),
  ex("french-press", "French Press", "triceps", "ez-bar", "strength", "weight-reps"),
  ex("diamond-press", "Diamond Press", "triceps", "dumbbell", "strength", "weight-reps", ["chest"]),
  ex("db-wrist-extension", "Wrist Extension", "forearms", "dumbbell", "strength", "weight-reps"),
  ex("gripper", "Hand Gripper", "forearms", "other", "strength", "reps-only"),
  ex("neck-curl", "Neck Curl", "neck", "other", "strength", "weight-reps"),
  ex("neck-extension-plate", "Plate Neck Extension", "neck", "other", "strength", "weight-reps"),
  ex("neck-lateral-flexion", "Neck Lateral Flexion", "neck", "other", "strength", "weight-reps"),

  /* ── ADDITIONAL CORE (Round 2) ─────────────────────────────── */
  ex("garhammer-raise", "Garhammer Raise", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("cable-lift", "Cable Lift", "core", "cable", "strength", "weight-reps"),
  ex("stir-the-pot", "Stir the Pot", "core", "other", "calisthenics", "bodyweight-reps"),
  ex("body-saw", "Body Saw Plank", "core", "bodyweight", "calisthenics", "bodyweight-reps"),
  ex("pallof-hold", "Pallof Hold", "core", "cable", "strength", "duration"),
  ex("half-kneeling-chop", "Half-Kneeling Chop", "core", "cable", "strength", "weight-reps"),
  ex("weighted-plank", "Weighted Plank", "core", "other", "strength", "duration"),

  /* ── ADDITIONAL CARDIO (Round 2) ───────────────────────────── */
  ex("battle-rope-alt", "Alternating Battle Rope", "cardio", "other", "cardio", "duration", ["shoulders"]),
  ex("bear-crawl-sprint", "Bear Crawl Sprint", "full-body", "bodyweight", "cardio", "duration"),
  ex("crab-walk", "Crab Walk", "full-body", "bodyweight", "cardio", "duration", ["triceps"]),
  ex("airdyne-intervals", "Airdyne Intervals", "cardio", "cardio-machine", "cardio", "rounds-reps"),
  ex("tire-flip", "Tire Flip", "full-body", "other", "strength", "reps-only", ["back", "quads"]),
  ex("sledgehammer-slam", "Sledgehammer Slam", "full-body", "other", "cardio", "reps-only", ["core"]),
  ex("farmers-walk-trap-bar", "Trap Bar Farmer Walk", "full-body", "trap-bar", "strength", "duration", ["forearms", "traps"]),
  ex("pool-swim-laps", "Pool Laps", "cardio", "bodyweight", "cardio", "distance"),
  ex("kayaking", "Kayaking", "back", "bodyweight", "cardio", "distance", ["shoulders"]),
  ex("ice-skating", "Ice Skating", "cardio", "bodyweight", "cardio", "duration"),
  ex("roller-blading", "Roller Blading", "cardio", "bodyweight", "cardio", "duration"),
  ex("dance-cardio", "Dance Cardio", "cardio", "bodyweight", "cardio", "calories-duration"),
  ex("rock-climbing", "Rock Climbing", "back", "bodyweight", "cardio", "duration", ["forearms", "core"]),

  /* ── ADDITIONAL KETTLEBELL ─────────────────────────────────── */
  ex("kb-high-pull", "KB High Pull", "full-body", "kettlebell", "strength", "weight-reps", ["traps"]),
  ex("kb-swing-single", "Single-Arm KB Swing", "hamstrings", "kettlebell", "strength", "weight-reps-each", ["glutes"]),
  ex("kb-renegade-row", "KB Renegade Row", "back", "kettlebell", "strength", "weight-reps-each", ["core"]),
  ex("kb-turkish-getup", "KB Turkish Get-Up", "full-body", "kettlebell", "strength", "weight-reps-each", ["core", "shoulders"]),
  ex("kb-arm-bar", "KB Arm Bar", "shoulders", "kettlebell", "strength", "duration"),
  ex("kb-figure-eight", "KB Figure Eight", "core", "kettlebell", "strength", "weight-reps"),

  /* ── ADDITIONAL YOGA ───────────────────────────────────────── */
  ex("yoga-wild-thing", "Wild Thing", "chest", "bodyweight", "yoga", "duration", ["shoulders"]),
  ex("yoga-scorpion", "Scorpion Pose", "back", "bodyweight", "yoga", "duration", ["hip-flexors"]),
  ex("yoga-standing-split", "Standing Split", "hamstrings", "bodyweight", "yoga", "duration"),
  ex("yoga-compass", "Compass Pose", "hamstrings", "bodyweight", "yoga", "duration"),
  ex("yoga-firefly", "Firefly Pose", "core", "bodyweight", "yoga", "duration", ["shoulders"]),
  ex("yoga-eight-angle", "Eight-Angle Pose", "core", "bodyweight", "yoga", "duration", ["shoulders"]),
];

/* ── Index + Search */
const byId = new Map<string, Exercise>();
EXERCISES.forEach(e => byId.set(e.id, e));

export function getExerciseById(id: string): Exercise | undefined {
  return byId.get(id);
}

export function getExercisesByMuscle(muscle: MuscleGroup): Exercise[] {
  return EXERCISES.filter(e => e.muscle === muscle || e.secondary?.includes(muscle));
}

export function getExercisesByEquipment(eq: Equipment): Exercise[] {
  return EXERCISES.filter(e => e.equipment === eq);
}

export function searchExercises(
  query: string,
  filters?: { muscle?: MuscleGroup; equipment?: Equipment; category?: ExerciseCategory }
): Exercise[] {
  let pool = EXERCISES;
  if (filters?.muscle) pool = pool.filter(e => e.muscle === filters.muscle || e.secondary?.includes(filters.muscle!));
  if (filters?.equipment) pool = pool.filter(e => e.equipment === filters.equipment);
  if (filters?.category) pool = pool.filter(e => e.category === filters.category);
  if (!query.trim()) return pool;

  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/);

  const scored = pool.map(e => {
    const name = e.name.toLowerCase();
    const aliasStr = (e.aliases || []).join(" ").toLowerCase();
    const all = name + " " + aliasStr + " " + e.muscle + " " + e.equipment;
    if (name === q) return { e, score: 100 };
    if (e.aliases?.some(a => a.toLowerCase() === q)) return { e, score: 95 };
    if (name.startsWith(q)) return { e, score: 90 };
    const allPresent = terms.every(t => all.includes(t));
    if (allPresent) {
      const nameHits = terms.filter(t => name.includes(t)).length;
      return { e, score: 60 + nameHits * 10 };
    }
    const hits = terms.filter(t => all.includes(t)).length;
    if (hits > 0) return { e, score: 20 + hits * 10 };
    return { e, score: 0 };
  });

  return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.e);
}

/** Smart alternatives: same muscle group, prefer similar equipment + tracking type */
export function getSmartAlternatives(exerciseId: string, limit = 4): Exercise[] {
  const source = getExerciseById(exerciseId);
  if (!source) return [];

  const SIMILAR_EQUIPMENT: Record<string, Equipment[]> = {
    barbell: ["dumbbell", "smith-machine", "ez-bar", "trap-bar"],
    dumbbell: ["barbell", "cable", "kettlebell"],
    cable: ["machine", "band", "dumbbell"],
    machine: ["cable", "smith-machine"],
    bodyweight: ["band", "suspension"],
    kettlebell: ["dumbbell"],
    "smith-machine": ["barbell", "machine"],
    "ez-bar": ["barbell", "dumbbell", "cable"],
    band: ["cable", "bodyweight"],
  };

  const candidates = EXERCISES.filter(e =>
    e.id !== exerciseId &&
    e.muscle === source.muscle
  );

  const scored = candidates.map(e => {
    let score = 0;
    if (e.equipment === source.equipment) score += 10;
    else if (SIMILAR_EQUIPMENT[source.equipment]?.includes(e.equipment)) score += 5;
    if (e.tracking === source.tracking) score += 8;
    if (e.category === source.category) score += 3;
    return { e, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.e);
}

/* ── Label maps */
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", forearms: "Forearms", quads: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves", core: "Core", "full-body": "Full Body",
  cardio: "Cardio", "hip-flexors": "Hip Flexors", traps: "Traps", lats: "Lats", neck: "Neck",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell", dumbbell: "Dumbbell", cable: "Cable", machine: "Machine",
  bodyweight: "Bodyweight", kettlebell: "Kettlebell", band: "Resistance Band",
  "smith-machine": "Smith Machine", "ez-bar": "EZ Bar", "trap-bar": "Trap Bar",
  "medicine-ball": "Medicine Ball", suspension: "Suspension/TRX", "foam-roller": "Foam Roller",
  "cardio-machine": "Cardio Machine", other: "Other",
};

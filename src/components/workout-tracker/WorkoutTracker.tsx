"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  type WorkoutSession,
  type LoggedExercise,
  type LoggedSet,
  type PersonalRecord,
  type DayTemplate,
  type PlannedExercise,
  type WeekPlan,
  type WorkoutSettings,
  type DayOfWeek,
  type SplitLevel,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  SPLIT_TEMPLATES,
  QUICK_START_IDS,
  loadFromStorage,
  saveToStorage,
  estimated1RM,
  calculateTotalVolume,
  getDefaultRestTime,
  formatTime,
  getTodayDayOfWeek,
  generateId,
} from "@/lib/workoutTypes";
import {
  type Exercise,
  type ExerciseCategory,
  type MuscleGroup,
  searchExercises,
  getExerciseById,
  getSmartAlternatives,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from "@/lib/exerciseDatabase";

// ── Tab types ────────────────────────────────────────────────
type Tab = "today" | "plan" | "exercises" | "history" | "stats";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "today", label: "Today", icon: "🏋️" },
  { key: "plan", label: "My Plan", icon: "📋" },
  { key: "exercises", label: "Exercises", icon: "📖" },
  { key: "history", label: "History", icon: "📅" },
  { key: "stats", label: "Stats", icon: "📊" },
];

// ── Main Component ───────────────────────────────────────────
export function WorkoutTracker() {
  const [tab, setTab] = useState<Tab>("today");
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({
    monday: null, tuesday: null, wednesday: null,
    thursday: null, friday: null, saturday: null, sunday: null,
  });
  const [workoutLog, setWorkoutLog] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentExercises, setRecentExercises] = useState<string[]>([]);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTarget, setRestTarget] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);
    setSettings(loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
    setTemplates(loadFromStorage(STORAGE_KEYS.templates, []));
    setWeekPlan(loadFromStorage(STORAGE_KEYS.week, {
      monday: null, tuesday: null, wednesday: null,
      thursday: null, friday: null, saturday: null, sunday: null,
    }));
    setWorkoutLog(loadFromStorage(STORAGE_KEYS.log, []));
    setPrs(loadFromStorage(STORAGE_KEYS.prs, []));
    setFavorites(loadFromStorage(STORAGE_KEYS.favorites, []));
    setRecentExercises(loadFromStorage(STORAGE_KEYS.recentExercises, []));
    setActiveWorkout(loadFromStorage(STORAGE_KEYS.activeWorkout, null));
  }, []);

  // Persist helpers
  const persistSettings = useCallback((s: WorkoutSettings) => { setSettings(s); saveToStorage(STORAGE_KEYS.settings, s); }, []);
  const persistTemplates = useCallback((t: DayTemplate[]) => { setTemplates(t); saveToStorage(STORAGE_KEYS.templates, t); }, []);
  const persistWeek = useCallback((w: WeekPlan) => { setWeekPlan(w); saveToStorage(STORAGE_KEYS.week, w); }, []);
  const persistLog = useCallback((l: WorkoutSession[]) => { setWorkoutLog(l); saveToStorage(STORAGE_KEYS.log, l); }, []);
  const persistPrs = useCallback((p: PersonalRecord[]) => { setPrs(p); saveToStorage(STORAGE_KEYS.prs, p); }, []);
  const persistActive = useCallback((w: WorkoutSession | null) => { setActiveWorkout(w); saveToStorage(STORAGE_KEYS.activeWorkout, w); }, []);

  // Rest timer logic
  const startRest = useCallback((seconds: number) => {
    if (restInterval.current) clearInterval(restInterval.current);
    setRestTarget(seconds);
    setRestSeconds(seconds);
    setRestActive(true);
    restInterval.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          clearInterval(restInterval.current!);
          setRestActive(false);
          if (settings.soundEnabled) {
            try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczGjmIxN/cjFQwJ3e31OG5dEQmX6zN4cNuMhpNm8Pg0IhDIk6Uw+HVjj4YQY+96NuSPBdCkLvp4Jc7").play(); } catch {}
          }
          if (settings.vibrateEnabled && navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings]);

  const skipRest = useCallback(() => {
    if (restInterval.current) clearInterval(restInterval.current);
    setRestActive(false);
    setRestSeconds(0);
  }, []);

  // PR detection
  const checkForPR = useCallback((exerciseId: string, set: LoggedSet, workoutId: string): boolean => {
    if (!set.weight || !set.reps || set.type === "warmup") return false;
    const est = estimated1RM(set.weight, set.reps);
    const existing = prs.find(p => p.exerciseId === exerciseId && p.type === "1rm");
    if (!existing || est > existing.value) {
      const newPR: PersonalRecord = {
        exerciseId,
        type: "1rm",
        value: est,
        unit: settings.units,
        date: new Date().toISOString(),
        workoutId,
        setDetails: `${set.weight} × ${set.reps}`,
      };
      const updated = [...prs.filter(p => !(p.exerciseId === exerciseId && p.type === "1rm")), newPR];
      persistPrs(updated);
      return true;
    }
    return false;
  }, [prs, settings.units, persistPrs]);

  // Start a new workout
  const startWorkout = useCallback((templateId?: string, name?: string) => {
    const template = templateId ? templates.find(t => t.id === templateId) : null;
    const workout: WorkoutSession = {
      id: generateId(),
      templateId: templateId || undefined,
      name: name || template?.name || `Workout — ${new Date().toLocaleDateString()}`,
      startedAt: new Date().toISOString(),
      duration: 0,
      exercises: template ? template.exercises.map(pe => ({
        exerciseId: pe.exerciseId,
        sets: [],
        supersetGroup: pe.supersetGroup,
      })) : [],
      notes: "",
      totalVolume: 0,
    };
    persistActive(workout);
    setTab("today");
  }, [templates, persistActive]);

  // Complete workout
  const completeWorkout = useCallback(() => {
    if (!activeWorkout) return;
    const completed: WorkoutSession = {
      ...activeWorkout,
      completedAt: new Date().toISOString(),
      duration: Math.round((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 60000),
      totalVolume: calculateTotalVolume(activeWorkout.exercises),
    };
    persistLog([completed, ...workoutLog]);
    persistActive(null);
    skipRest();
  }, [activeWorkout, workoutLog, persistLog, persistActive, skipRest]);

  // Add exercise to active workout
  const addExerciseToWorkout = useCallback((exerciseId: string) => {
    if (!activeWorkout) return;
    const updated = {
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, { exerciseId, sets: [] }],
    };
    persistActive(updated);

    // Track recent
    const newRecent = [exerciseId, ...recentExercises.filter(id => id !== exerciseId)].slice(0, 20);
    setRecentExercises(newRecent);
    saveToStorage(STORAGE_KEYS.recentExercises, newRecent);
  }, [activeWorkout, recentExercises, persistActive]);

  // Log a set
  const logSet = useCallback((exerciseIndex: number, set: LoggedSet) => {
    if (!activeWorkout) return;
    const exercises = [...activeWorkout.exercises];
    const ex = { ...exercises[exerciseIndex] };
    ex.sets = [...ex.sets, set];
    exercises[exerciseIndex] = ex;

    const isPR = checkForPR(ex.exerciseId, set, activeWorkout.id);
    if (isPR) {
      ex.sets[ex.sets.length - 1] = { ...set, isPersonalRecord: true };
      exercises[exerciseIndex] = ex;
    }

    const updated = { ...activeWorkout, exercises };
    persistActive(updated);

    // Start rest timer
    const exercise = getExerciseById(ex.exerciseId);
    if (exercise) {
      startRest(getDefaultRestTime(exercise.tracking));
    }
  }, [activeWorkout, persistActive, checkForPR, startRest]);

  // Remove set
  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const exercises = [...activeWorkout.exercises];
    const ex = { ...exercises[exerciseIndex] };
    ex.sets = ex.sets.filter((_, i) => i !== setIndex);
    exercises[exerciseIndex] = ex;
    persistActive({ ...activeWorkout, exercises });
  }, [activeWorkout, persistActive]);

  // Remove exercise from workout
  const removeExercise = useCallback((index: number) => {
    if (!activeWorkout) return;
    const exercises = activeWorkout.exercises.filter((_, i) => i !== index);
    persistActive({ ...activeWorkout, exercises });
  }, [activeWorkout, persistActive]);

  // Quick-start from a split template (pre-populate exercises)
  const quickStart = useCallback((splitId: string) => {
    const split = SPLIT_TEMPLATES.find(s => s.id === splitId);
    if (!split || !split.days[0]) return;
    const day = split.days[0];
    const workout: WorkoutSession = {
      id: generateId(),
      name: day.name,
      startedAt: new Date().toISOString(),
      duration: 0,
      exercises: day.exercises.map(e => ({
        exerciseId: e.exerciseId,
        sets: [],
      })),
      notes: "",
      totalVolume: 0,
    };
    persistActive(workout);
    setTab("today");
  }, [persistActive]);

  // Get today's template
  const todayDay = getTodayDayOfWeek();
  const todayTemplateId = weekPlan[todayDay];
  const todayTemplate = todayTemplateId ? (templates.find(t => t.id === todayTemplateId) ?? null) : null;

  // Streak calculation
  const getStreak = useCallback(() => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const hasWorkout = workoutLog.some(w => w.completedAt?.startsWith(dayStr));
      if (hasWorkout || (i === 0 && activeWorkout)) {
        streak++;
      } else if (i > 0) break;
    }
    return streak;
  }, [workoutLog, activeWorkout]);

  // Get previous data for an exercise
  const getPreviousSets = useCallback((exerciseId: string): LoggedSet[] => {
    for (const session of workoutLog) {
      const ex = session.exercises.find(e => e.exerciseId === exerciseId);
      if (ex && ex.sets.length > 0) return ex.sets;
    }
    return [];
  }, [workoutLog]);

  // Get exercise PR
  const getExercisePR = useCallback((exerciseId: string): PersonalRecord | undefined => {
    return prs.find(p => p.exerciseId === exerciseId && p.type === "1rm");
  }, [prs]);

  // Last workout time
  const lastWorkoutAgo = useCallback(() => {
    if (workoutLog.length === 0) return "No workouts yet";
    const last = new Date(workoutLog[0].completedAt || workoutLog[0].startedAt);
    const hrs = Math.round((Date.now() - last.getTime()) / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  }, [workoutLog]);

  if (!mounted) return null;

  // ── ACTIVE WORKOUT VIEW ─────────────────────────────────
  if (activeWorkout) {
    const elapsed = Math.round((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 60000);
    return (
      <div className="space-y-4">
        {/* Workout Header */}
        <div className="bg-surface rounded-2xl border border-border-light p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-xl text-text">{activeWorkout.name}</h1>
            <div className="flex gap-2">
              <button onClick={() => persistActive(null)} className="text-[12px] text-muted hover:text-hp-red transition-colors">Discard</button>
              <button onClick={completeWorkout} className="px-4 py-1.5 bg-accent text-white rounded-full text-[13px] font-semibold hover:bg-accent/90 transition-colors">Finish</button>
            </div>
          </div>
          <div className="flex gap-4 text-[12px] text-muted">
            <span>⏱ {elapsed} min</span>
            <span>🏋️ {activeWorkout.exercises.length} exercises</span>
            <span>📊 {calculateTotalVolume(activeWorkout.exercises).toLocaleString()} {settings.units} volume</span>
          </div>
        </div>

        {/* Rest Timer */}
        {restActive && (
          <div className="bg-surface rounded-2xl border border-accent/30 p-4 shadow-sm">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Rest Time</p>
              <p className="text-[32px] font-display font-bold text-text">{formatTime(restSeconds)}</p>
              <div className="w-full h-2 bg-border-light rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-1000"
                  style={{ width: `${restTarget > 0 ? (restSeconds / restTarget) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-center gap-3 mt-3">
                <button onClick={() => setRestSeconds(s => Math.max(0, s - 15))} className="px-3 py-1 rounded-full border border-border text-[12px] text-muted hover:bg-surface-sage">-15s</button>
                <button onClick={skipRest} className="px-4 py-1 rounded-full bg-accent/10 text-accent text-[12px] font-semibold hover:bg-accent/20">Skip</button>
                <button onClick={() => setRestSeconds(s => s + 15)} className="px-3 py-1 rounded-full border border-border text-[12px] text-muted hover:bg-surface-sage">+15s</button>
              </div>
            </div>
          </div>
        )}

        {/* Logged Exercises */}
        {activeWorkout.exercises.map((loggedEx, exIdx) => (
          <ExerciseLogCard
            key={`${loggedEx.exerciseId}-${exIdx}`}
            loggedEx={loggedEx}
            exIdx={exIdx}
            settings={settings}
            previousSets={getPreviousSets(loggedEx.exerciseId)}
            pr={getExercisePR(loggedEx.exerciseId)}
            onLogSet={(set) => logSet(exIdx, set)}
            onRemoveSet={(setIdx) => removeSet(exIdx, setIdx)}
            onRemoveExercise={() => removeExercise(exIdx)}
          />
        ))}

        {/* Add Exercise Button */}
        <AddExercisePanel
          onAdd={addExerciseToWorkout}
          recentExercises={recentExercises}
          favorites={favorites}
        />
      </div>
    );
  }

  // ── TAB VIEWS ───────────────────────────────────────────
  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-accent text-white"
                : "bg-surface border border-border-light text-muted hover:text-text hover:border-border"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <TodayTab
          todayTemplate={todayTemplate}
          activeWorkout={activeWorkout}
          streak={getStreak()}
          lastWorkout={lastWorkoutAgo()}
          onStart={(tid, name) => startWorkout(tid, name)}
          onQuickStart={quickStart}
        />
      )}

      {tab === "plan" && (
        <PlanTab
          weekPlan={weekPlan}
          templates={templates}
          onUpdateWeek={persistWeek}
          onUpdateTemplates={persistTemplates}
          onStart={startWorkout}
        />
      )}

      {tab === "exercises" && (
        <ExerciseBrowser
          favorites={favorites}
          onToggleFavorite={(id) => {
            const updated = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
            setFavorites(updated);
            saveToStorage(STORAGE_KEYS.favorites, updated);
          }}
          prs={prs}
        />
      )}

      {tab === "history" && (
        <HistoryTab
          workoutLog={workoutLog}
          settings={settings}
          onDelete={(id) => persistLog(workoutLog.filter(w => w.id !== id))}
        />
      )}

      {tab === "stats" && (
        <StatsTab
          workoutLog={workoutLog}
          prs={prs}
          streak={getStreak()}
          settings={settings}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

// ── Exercise Log Card ─────────────────────────────────────
function ExerciseLogCard({
  loggedEx, exIdx, settings, previousSets, pr, onLogSet, onRemoveSet, onRemoveExercise,
}: {
  loggedEx: LoggedExercise;
  exIdx: number;
  settings: WorkoutSettings;
  previousSets: LoggedSet[];
  pr?: PersonalRecord;
  onLogSet: (set: LoggedSet) => void;
  onRemoveSet: (setIdx: number) => void;
  onRemoveExercise: () => void;
}) {
  const exercise = getExerciseById(loggedEx.exerciseId);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [duration, setDuration] = useState("");
  const [rpe, setRpe] = useState("");
  const [rir, setRir] = useState("");
  const [setType, setSetType] = useState<"working" | "warmup">("working");

  if (!exercise) return null;

  const isWeightReps = ["weight-reps", "weight-reps-each", "bodyweight-reps"].includes(exercise.tracking);
  const isTimed = exercise.tracking === "duration" || exercise.tracking === "weight-duration";
  const isRepsOnly = exercise.tracking === "reps-only";
  const isDistDur = exercise.tracking === "distance";
  const isCalDur = exercise.tracking === "calories-duration";
  const isRoundsReps = exercise.tracking === "rounds-reps";

  const handleAddSet = () => {
    const set: LoggedSet = {
      setNumber: loggedEx.sets.length + 1,
      type: setType,
      weight: weight ? parseFloat(weight) : undefined,
      reps: reps ? parseInt(reps) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      rpe: rpe ? parseFloat(rpe) : undefined,
      rir: rir ? parseInt(rir) : undefined,
      isPersonalRecord: false,
      completedAt: new Date().toISOString(),
    };
    onLogSet(set);
    // Don't clear fields — user likely does same weight/reps next set
  };

  const handlePrefill = (prev: LoggedSet) => {
    if (prev.weight) setWeight(String(prev.weight));
    if (prev.reps) setReps(String(prev.reps));
    if (prev.duration) setDuration(String(prev.duration));
  };

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <div>
          <h3 className="text-[14px] font-bold text-text">{exercise.name}</h3>
          {pr && (
            <p className="text-[11px] text-muted mt-0.5">
              Best: {pr.setDetails} (est. 1RM: {Math.round(pr.value)} {pr.unit})
            </p>
          )}
        </div>
        <button onClick={onRemoveExercise} className="text-[11px] text-muted hover:text-hp-red transition-colors p-1">✕</button>
      </div>

      {/* Set Table */}
      <div className="px-4 py-2">
        {/* Header row */}
        <div className="grid gap-2 text-[10px] font-bold uppercase tracking-wider text-muted mb-1" style={{ gridTemplateColumns: "32px 1fr 1fr 1fr 36px" }}>
          <span>SET</span>
          <span>PREV</span>
          {isWeightReps && <span>{exercise.tracking === "bodyweight-reps" ? "+WT" : settings.units.toUpperCase()}</span>}
          {isTimed && <span>SEC</span>}
          {isRepsOnly && <span>—</span>}
          {isDistDur && <span>DIST</span>}
          {isCalDur && <span>CAL</span>}
          {isRoundsReps && <span>RNDS</span>}
          {(isWeightReps || isRepsOnly) && <span>REPS</span>}
          {isTimed && <span>—</span>}
          {(isDistDur || isCalDur) && <span>TIME</span>}
          {isRoundsReps && <span>REPS</span>}
          <span>✓</span>
        </div>

        {/* Logged sets */}
        {loggedEx.sets.map((set, si) => {
          const prev = previousSets[si];
          const isOverload = prev && set.weight && prev.weight && set.weight > prev.weight;
          return (
            <div
              key={si}
              className={`grid gap-2 items-center py-1.5 border-b border-border-light/50 text-[13px] ${
                set.type === "warmup" ? "opacity-60" : ""
              } ${isOverload ? "bg-hp-green/5" : ""}`}
              style={{ gridTemplateColumns: "32px 1fr 1fr 1fr 36px" }}
            >
              <span className="text-muted text-[12px] font-medium">
                {set.type === "warmup" ? "W" : si + 1 - loggedEx.sets.filter((s, i) => i < si && s.type === "warmup").length}
              </span>
              <span className="text-[11px] text-dim">
                {prev ? `${prev.weight || "—"} × ${prev.reps || prev.duration || "—"}` : "—"}
              </span>
              <span className="font-semibold text-text tabular-nums">{set.weight || set.duration || "—"}</span>
              <span className="font-semibold text-text tabular-nums">{set.reps || "—"}</span>
              <div className="flex items-center gap-1">
                {set.isPersonalRecord && <span title="Personal Record">🏆</span>}
                <button onClick={() => onRemoveSet(si)} className="text-[10px] text-muted hover:text-hp-red">✕</button>
              </div>
            </div>
          );
        })}

        {/* Input row */}
        <div className="grid gap-2 items-center py-2" style={{ gridTemplateColumns: "32px 1fr 1fr 1fr 36px" }}>
          <button
            onClick={() => setSetType(t => t === "working" ? "warmup" : "working")}
            className={`text-[10px] font-bold rounded px-1 py-0.5 ${setType === "warmup" ? "bg-hp-yellow/20 text-hp-yellow" : "text-muted"}`}
            title={setType === "warmup" ? "Warm-up set" : "Working set"}
          >
            {setType === "warmup" ? "W" : loggedEx.sets.filter(s => s.type !== "warmup").length + 1}
          </button>
          <button
            onClick={() => {
              const prev = previousSets[loggedEx.sets.length];
              if (prev) handlePrefill(prev);
            }}
            className="text-[11px] text-dim hover:text-accent truncate text-left"
            title="Tap to copy previous"
          >
            {previousSets[loggedEx.sets.length] ?
              `${previousSets[loggedEx.sets.length].weight || "—"} × ${previousSets[loggedEx.sets.length].reps || previousSets[loggedEx.sets.length].duration || "—"}` : "—"
            }
          </button>
          {/* Column 3: Weight / Duration / Distance / Calories / Rounds */}
          {isWeightReps && (
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder={exercise.tracking === "bodyweight-reps" ? "+wt" : settings.units}
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
            />
          )}
          {isTimed && (
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="sec"
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
            />
          )}
          {isDistDur && (
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="dist"
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
            />
          )}
          {isCalDur && (
            <input
              type="number"
              inputMode="numeric"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="cal"
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
            />
          )}
          {isRoundsReps && (
            <input
              type="number"
              inputMode="numeric"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="rnds"
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
            />
          )}
          {isRepsOnly && <span />}

          {/* Column 4: Reps / Time */}
          {(isWeightReps || isRepsOnly) && (
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="reps"
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
            />
          )}
          {isTimed && <span />}
          {(isDistDur || isCalDur) && (
            <input
              type="text"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="mm:ss"
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center focus:border-accent focus:outline-none"
            />
          )}
          {isRoundsReps && (
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={e => setReps(e.target.value)}
              placeholder="reps"
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
            />
          )}
          <button
            onClick={handleAddSet}
            disabled={isWeightReps ? !reps : isTimed ? !duration : (isCalDur || isDistDur) ? !weight && !duration : isRoundsReps ? !weight && !reps : !reps}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white text-[14px] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
          >
            ✓
          </button>
        </div>
      </div>

      {/* RPE / RIR row */}
      {(settings.showRPE || settings.showRIR) && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border-light">
          {settings.showRPE && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">RPE</span>
              <input
                type="number"
                inputMode="decimal"
                min="1" max="10" step="0.5"
                value={rpe}
                onChange={e => setRpe(e.target.value)}
                placeholder="—"
                className="w-14 bg-surface-sage border border-border-light rounded-lg px-2 py-1 text-[12px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
              />
            </div>
          )}
          {settings.showRIR && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">RIR</span>
              <input
                type="number"
                inputMode="numeric"
                min="0" max="10"
                value={rir}
                onChange={e => setRir(e.target.value)}
                placeholder="—"
                className="w-14 bg-surface-sage border border-border-light rounded-lg px-2 py-1 text-[12px] text-text text-center tabular-nums focus:border-accent focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border-light bg-surface-sage/30">
        <button
          onClick={() => {
            const lastSet = loggedEx.sets[loggedEx.sets.length - 1];
            if (lastSet?.weight) {
              setWeight(String(Math.round(lastSet.weight * 0.8)));
              setReps(String((lastSet.reps || 8) + 4));
            }
          }}
          className="text-[11px] text-muted hover:text-accent font-medium"
        >
          🔥 Drop Set
        </button>
        {loggedEx.notes !== undefined && (
          <span className="text-[11px] text-dim">📝 {loggedEx.notes || "Add note"}</span>
        )}
      </div>
    </div>
  );
}

// ── Add Exercise Panel ─────────────────────────────────────
function AddExercisePanel({
  onAdd, recentExercises, favorites,
}: {
  onAdd: (exerciseId: string) => void;
  recentExercises: string[];
  favorites: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<ExerciseCategory | "">("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");

  const results = query.length >= 2
    ? searchExercises(query, {
        category: catFilter || undefined,
        muscle: muscleFilter || undefined,
      }).slice(0, 20)
    : [];

  const recentList = recentExercises.slice(0, 5).map(getExerciseById).filter(Boolean) as Exercise[];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-[14px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors"
      >
        + Add Exercise
      </button>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-text">Add Exercise</h3>
        <button onClick={() => { setOpen(false); setQuery(""); }} className="text-[12px] text-muted hover:text-text">Close</button>
      </div>

      <input
        autoFocus
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search exercises..."
        className="w-full bg-surface-sage border border-border-light rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {/* Muscle Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "core"] as MuscleGroup[]).map(m => (
          <button
            key={m}
            onClick={() => setMuscleFilter(muscleFilter === m ? "" : m)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              muscleFilter === m ? "bg-accent text-white" : "bg-surface-sage text-muted hover:text-text"
            }`}
          >
            {MUSCLE_GROUP_LABELS[m] || m}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {(["strength", "cardio", "yoga", "pilates", "boxing", "barre", "calisthenics"] as ExerciseCategory[]).map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(catFilter === c ? "" : c)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize transition-colors ${
              catFilter === c ? "bg-accent text-white" : "bg-surface-sage text-muted hover:text-text"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.length >= 2 && (
        <div className="max-h-[300px] overflow-y-auto space-y-0.5">
          {results.length === 0 && <p className="text-[12px] text-muted py-2">No exercises found</p>}
          {results.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onAdd(ex.id); setOpen(false); setQuery(""); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-sage transition-colors text-left"
            >
              <div>
                <p className="text-[13px] font-medium text-text">{ex.name}</p>
                <p className="text-[11px] text-muted">
                  {MUSCLE_GROUP_LABELS[ex.muscle] || ex.muscle} · {ex.category}
                </p>
              </div>
              <span className="text-accent text-[12px]">+</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent */}
      {query.length < 2 && recentList.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Recent</p>
          {recentList.map(ex => (
            <button
              key={ex.id}
              onClick={() => { onAdd(ex.id); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-sage transition-colors text-left"
            >
              <p className="text-[13px] font-medium text-text">{ex.name}</p>
              <span className="text-accent text-[12px]">+</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Today Tab ──────────────────────────────────────────────
function TodayTab({
  todayTemplate, activeWorkout, streak, lastWorkout, onStart, onQuickStart,
}: {
  todayTemplate: DayTemplate | null;
  activeWorkout: WorkoutSession | null;
  streak: number;
  lastWorkout: string;
  onStart: (templateId?: string, name?: string) => void;
  onQuickStart: (splitId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Today's Workout Card */}
      <div className="bg-surface rounded-2xl border border-border-light p-5 shadow-sm">
        {todayTemplate ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{todayTemplate.emoji}</span>
              <h2 className="font-display text-lg text-text">{todayTemplate.name}</h2>
            </div>
            <p className="text-[13px] text-muted mb-3">
              {todayTemplate.exercises.length} exercises · ~{todayTemplate.estimatedDuration || Math.round(todayTemplate.exercises.length * 7)} min
            </p>
            <div className="space-y-1 mb-4">
              {todayTemplate.exercises.slice(0, 5).map((pe, i) => {
                const ex = getExerciseById(pe.exerciseId);
                return (
                  <p key={i} className="text-[12px] text-dim">
                    {i + 1}. {ex?.name || pe.exerciseId} — {pe.targetSets}×{pe.targetReps}
                  </p>
                );
              })}
              {todayTemplate.exercises.length > 5 && (
                <p className="text-[12px] text-muted">+{todayTemplate.exercises.length - 5} more</p>
              )}
            </div>
            <button
              onClick={() => onStart(todayTemplate.id)}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-[14px] hover:bg-accent/90 transition-colors"
            >
              Start Workout
            </button>
          </>
        ) : (
          <>
            <p className="text-[14px] text-muted mb-3">No workout planned for today</p>
            <button
              onClick={() => onStart(undefined, `Workout — ${new Date().toLocaleDateString()}`)}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-[13px] hover:bg-accent/90 transition-colors"
            >
              Start Empty Workout
            </button>
          </>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-xl border border-border-light p-3">
          <p className="text-[11px] text-muted uppercase tracking-wider">Streak</p>
          <p className="text-[22px] font-display font-bold text-text">
            {streak > 0 ? `🔥 ${streak}d` : "—"}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border-light p-3">
          <p className="text-[11px] text-muted uppercase tracking-wider">Last Workout</p>
          <p className="text-[14px] font-semibold text-text mt-1">{lastWorkout}</p>
        </div>
      </div>

      {/* Quick-Start Routines */}
      <QuickStartSection onQuickStart={onQuickStart} />
    </div>
  );
}

// ── Quick-Start Routines ─────────────────────────────────────
function QuickStartSection({ onQuickStart }: { onQuickStart: (splitId: string) => void }) {
  const quickStarts = QUICK_START_IDS
    .map(id => SPLIT_TEMPLATES.find(s => s.id === id))
    .filter(Boolean) as (typeof SPLIT_TEMPLATES)[number][];

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
      <h3 className="text-[13px] font-bold text-text mb-3">Quick Start</h3>
      <div className="grid grid-cols-2 gap-2">
        {quickStarts.map(qs => (
          <button
            key={qs.id}
            onClick={() => onQuickStart(qs.id)}
            className="text-left p-3 rounded-xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <p className="text-[13px] font-semibold text-text truncate">{qs.days[0].emoji} {qs.days[0].name}</p>
            <p className="text-[11px] text-muted">{qs.days[0].exercises.length} exercises · ~{Math.round(qs.days[0].exercises.length * 4)} min</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Plan Tab ───────────────────────────────────────────────
// ── Onboarding Flow ─────────────────────────────────────────
function OnboardingFlow({ onComplete }: { onComplete: (splitId: string) => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [level, setLevel] = useState<SplitLevel | "">("");
  const [daysPerWeek, setDaysPerWeek] = useState(0);
  const [goal, setGoal] = useState("");

  const getRecommendation = (): string => {
    const lvl = level || "beginner";
    const d = daysPerWeek || 3;

    if (lvl === "beginner") {
      if (d <= 3) return "beginner-full-body-3";
      return "beginner-upper-lower-4";
    }
    if (lvl === "intermediate") {
      if (d <= 3) return goal === "strength" ? "full-body-3" : "ppl-3";
      if (d === 4) return "upper-lower-4";
      if (d === 5) return "pplul-5";
      return "arnold-6";
    }
    // advanced
    if (d <= 3) return "ppl-3";
    if (d <= 5) return goal === "hypertrophy" ? "bro-split-5" : "pplul-5";
    return "advanced-ppl-6";
  };

  const recommended = step === 4 ? SPLIT_TEMPLATES.find(s => s.id === getRecommendation()) : null;

  return (
    <div className="bg-surface rounded-2xl border border-accent/20 shadow-sm p-6 space-y-5">
      <div className="text-center mb-2">
        <p className="text-[28px] mb-1">🏋️</p>
        <h2 className="font-display text-xl text-text">Build Your Training Plan</h2>
        <p className="text-[13px] text-muted mt-1">Answer 3 quick questions and we&apos;ll recommend a program</p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s <= step ? "bg-accent" : "bg-border-light"}`} />
        ))}
      </div>

      {/* Step 1: Experience Level */}
      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-[14px] font-bold text-text text-center">What&apos;s your experience level?</h3>
          {([
            { value: "beginner", label: "Beginner", desc: "New to lifting or <6 months" },
            { value: "intermediate", label: "Intermediate", desc: "6 months to 2 years consistent" },
            { value: "advanced", label: "Advanced", desc: "2+ years, comfortable with all lifts" },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => { setLevel(opt.value); setStep(2); }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                level === opt.value ? "border-accent bg-accent/5" : "border-border-light hover:border-accent/40"
              }`}
            >
              <p className="text-[13px] font-semibold text-text">{opt.label}</p>
              <p className="text-[11px] text-muted">{opt.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Days Per Week */}
      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-[14px] font-bold text-text text-center">How many days can you train?</h3>
          <div className="grid grid-cols-5 gap-2">
            {[3, 4, 5, 6].map(d => (
              <button
                key={d}
                onClick={() => { setDaysPerWeek(d); setStep(3); }}
                className={`py-3 rounded-xl border text-center transition-colors ${
                  daysPerWeek === d ? "border-accent bg-accent/5 text-accent" : "border-border-light hover:border-accent/40 text-text"
                }`}
              >
                <p className="text-[18px] font-bold">{d}</p>
                <p className="text-[10px] text-muted">days</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Goal */}
      {step === 3 && (
        <div className="space-y-3">
          <h3 className="text-[14px] font-bold text-text text-center">What&apos;s your primary goal?</h3>
          {([
            { value: "strength", label: "Get Stronger", desc: "Focus on compound lifts and progressive overload" },
            { value: "hypertrophy", label: "Build Muscle", desc: "Higher volume, targeted muscle groups" },
            { value: "general", label: "General Fitness", desc: "Balanced mix of strength and conditioning" },
          ]).map(opt => (
            <button
              key={opt.value}
              onClick={() => { setGoal(opt.value); setStep(4); }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                goal === opt.value ? "border-accent bg-accent/5" : "border-border-light hover:border-accent/40"
              }`}
            >
              <p className="text-[13px] font-semibold text-text">{opt.label}</p>
              <p className="text-[11px] text-muted">{opt.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 4: Recommendation */}
      {step === 4 && recommended && (
        <div className="space-y-4">
          <h3 className="text-[14px] font-bold text-text text-center">We recommend:</h3>
          <div className="p-4 rounded-xl border-2 border-accent bg-accent/5">
            <p className="text-[15px] font-bold text-text">{recommended.name}</p>
            <p className="text-[12px] text-muted mt-1">{recommended.description}</p>
            <div className="flex gap-3 mt-2">
              <span className="text-[11px] text-accent font-semibold">{recommended.daysPerWeek} days/week</span>
              <span className="text-[11px] text-muted capitalize">{recommended.level} level</span>
            </div>
            <div className="mt-3 space-y-1">
              {recommended.days.map((d, i) => (
                <p key={i} className="text-[11px] text-dim">
                  {d.emoji} {d.name} — {d.exercises.length} exercises
                </p>
              ))}
            </div>
          </div>
          <button
            onClick={() => onComplete(recommended.id)}
            className="w-full py-3 rounded-xl bg-accent text-white text-[14px] font-bold hover:bg-accent/90 transition-colors"
          >
            Start This Program
          </button>
          <button
            onClick={() => setStep(1)}
            className="w-full text-[12px] text-muted hover:text-text text-center"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}

// ── Split Level Badge ───────────────────────────────────────
const LEVEL_COLORS: Record<SplitLevel, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
  all: "bg-gray-100 text-gray-600",
};

function PlanTab({
  weekPlan, templates, onUpdateWeek, onUpdateTemplates, onStart,
}: {
  weekPlan: WeekPlan;
  templates: DayTemplate[];
  onUpdateWeek: (w: WeekPlan) => void;
  onUpdateTemplates: (t: DayTemplate[]) => void;
  onStart: (templateId?: string) => void;
}) {
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editWeekMode, setEditWeekMode] = useState(false);
  const [showSwapFor, setShowSwapFor] = useState<DayOfWeek | null>(null);
  const [showDuplicateFor, setShowDuplicateFor] = useState<DayOfWeek | null>(null);
  const [levelFilter, setLevelFilter] = useState<SplitLevel | "all">("all");
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showLoadDefault, setShowLoadDefault] = useState<DayOfWeek | null>(null);

  const isFirstTime = templates.length === 0;

  const DAYS: { key: DayOfWeek; label: string; short: string; letter: string }[] = [
    { key: "monday", label: "Monday", short: "MON", letter: "M" },
    { key: "tuesday", label: "Tuesday", short: "TUE", letter: "T" },
    { key: "wednesday", label: "Wednesday", short: "WED", letter: "W" },
    { key: "thursday", label: "Thursday", short: "THU", letter: "T" },
    { key: "friday", label: "Friday", short: "FRI", letter: "F" },
    { key: "saturday", label: "Saturday", short: "SAT", letter: "S" },
    { key: "sunday", label: "Sunday", short: "SUN", letter: "S" },
  ];

  const getTemplate = (day: DayOfWeek) => {
    const tid = weekPlan[day];
    return tid ? templates.find(t => t.id === tid) ?? null : null;
  };

  const adoptSplit = (splitId: string) => {
    const split = SPLIT_TEMPLATES.find(s => s.id === splitId);
    if (!split) return;
    const newTemplates: DayTemplate[] = split.days.map((d) => ({
      id: generateId(),
      name: d.name,
      emoji: d.emoji,
      assignedDays: [],
      exercises: d.exercises.map((e, j) => ({
        exerciseId: e.exerciseId,
        targetSets: e.sets,
        targetReps: e.reps,
        restTime: e.rest,
        order: j,
      })),
      estimatedDuration: d.exercises.length * 7,
      notes: "",
      createdAt: new Date().toISOString(),
      basedOn: splitId,
    }));
    const newWeek: WeekPlan = { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null, saturday: null, sunday: null, splitName: split.name };
    const dayKeys: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const schedules: Record<number, number[]> = { 1: [0], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
    const sched = schedules[split.daysPerWeek] || schedules[3];
    sched.forEach((dayIdx, i) => { if (i < newTemplates.length) newWeek[dayKeys[dayIdx]] = newTemplates[i].id; });
    onUpdateTemplates([...templates, ...newTemplates]);
    onUpdateWeek(newWeek);
    setShowSplitPicker(false);
  };

  const swapDays = (a: DayOfWeek, b: DayOfWeek) => {
    const newWeek = { ...weekPlan, [a]: weekPlan[b], [b]: weekPlan[a] };
    onUpdateWeek(newWeek);
    setShowSwapFor(null);
  };

  const duplicateDay = (from: DayOfWeek, to: DayOfWeek) => {
    const tmpl = getTemplate(from);
    if (!tmpl) return;
    const copy: DayTemplate = { ...tmpl, id: generateId(), name: tmpl.name + " (copy)", createdAt: new Date().toISOString(), exercises: tmpl.exercises.map(e => ({ ...e })) };
    onUpdateTemplates([...templates, copy]);
    onUpdateWeek({ ...weekPlan, [to]: copy.id });
    setShowDuplicateFor(null);
  };

  const clearDay = (day: DayOfWeek) => {
    onUpdateWeek({ ...weekPlan, [day]: null });
  };

  const clearAllDays = () => {
    if (!confirm("Clear all workouts from your week?")) return;
    onUpdateWeek({ monday: null, tuesday: null, wednesday: null, thursday: null, friday: null, saturday: null, sunday: null });
  };

  const updateTemplate = (updated: DayTemplate) => {
    onUpdateTemplates(templates.map(t => t.id === updated.id ? updated : t));
  };

  const assignDefaultToDay = (day: DayOfWeek, splitId: string) => {
    const split = SPLIT_TEMPLATES.find(s => s.id === splitId);
    if (!split || !split.days[0]) return;
    const d = split.days[0];
    const newTmpl: DayTemplate = {
      id: generateId(), name: d.name, emoji: d.emoji, assignedDays: [],
      exercises: d.exercises.map((e, j) => ({ exerciseId: e.exerciseId, targetSets: e.sets, targetReps: e.reps, restTime: e.rest, order: j })),
      estimatedDuration: d.exercises.length * 7, notes: "", createdAt: new Date().toISOString(), basedOn: splitId,
    };
    onUpdateTemplates([...templates, newTmpl]);
    onUpdateWeek({ ...weekPlan, [day]: newTmpl.id });
    setShowLoadDefault(null);
  };

  // Show onboarding for first-time users
  if (isFirstTime && !showSplitPicker) {
    return (
      <div className="space-y-4">
        <OnboardingFlow onComplete={(splitId) => adoptSplit(splitId)} />
        <button onClick={() => setShowSplitPicker(true)} className="w-full text-[12px] text-muted hover:text-accent text-center py-2">
          Or browse all programs manually
        </button>
      </div>
    );
  }

  // ── DAY EDITOR VIEW ──────────────────────────────────────
  if (editingDay) {
    const tmpl = getTemplate(editingDay);
    return (
      <DayEditorView
        day={editingDay}
        template={tmpl}
        allDays={DAYS}
        weekPlan={weekPlan}
        templates={templates}
        onChangeDay={(d) => setEditingDay(d)}
        onUpdateTemplate={updateTemplate}
        onUpdateTemplates={onUpdateTemplates}
        onUpdateWeek={onUpdateWeek}
        onSwap={(target) => { setShowSwapFor(editingDay); }}
        onDuplicate={(target) => { setShowDuplicateFor(editingDay); }}
        onClear={() => { clearDay(editingDay); setEditingDay(null); }}
        onBack={() => setEditingDay(null)}
        onLoadDefault={(splitId) => assignDefaultToDay(editingDay, splitId)}
        onCreateTemplate={(tmpl) => {
          onUpdateTemplates([...templates, tmpl]);
          onUpdateWeek({ ...weekPlan, [editingDay]: tmpl.id });
        }}
      />
    );
  }

  const filteredSplits = levelFilter === "all" ? SPLIT_TEMPLATES : SPLIT_TEMPLATES.filter(s => s.level === levelFilter || s.level === "all");

  // ── WEEKLY OVERVIEW ──────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg text-text">
          📋 My Plan {weekPlan.splitName ? <span className="text-[12px] text-muted font-normal ml-1">— {weekPlan.splitName}</span> : null}
        </h2>
        <div className="flex gap-2">
          {!editWeekMode && (
            <button onClick={() => setEditWeekMode(true)} className="text-[11px] font-semibold text-muted hover:text-accent">Edit Week</button>
          )}
          <button onClick={() => setShowSplitPicker(!showSplitPicker)} className="text-[11px] font-semibold text-accent hover:underline">
            {showSplitPicker ? "Close" : "📥 Split"}
          </button>
        </div>
      </div>

      {/* Edit Week Mode */}
      {editWeekMode && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl px-3 py-2 flex items-center justify-between">
          <p className="text-[11px] text-accent font-semibold">Editing week — tap ⋯ for day options</p>
          <button onClick={() => setEditWeekMode(false)} className="px-3 py-1 bg-accent text-white rounded-full text-[11px] font-semibold">Done</button>
        </div>
      )}

      {/* Weekly Calendar */}
      {!showSplitPicker && !showTemplateCreator && (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
          {DAYS.map(d => {
            const tmpl = getTemplate(d.key);
            const isToday = d.key === getTodayDayOfWeek();
            const exercisePreview = tmpl
              ? tmpl.exercises.slice(0, 5).map(e => getExerciseById(e.exerciseId)?.name.split(" ").slice(0, 2).join(" ") || "?").join(" · ")
              : "";
            return (
              <div key={d.key}>
                <button
                  onClick={() => editWeekMode ? undefined : setEditingDay(d.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-b-0 text-left transition-colors hover:bg-surface-sage/30 ${isToday ? "bg-accent/5" : ""}`}
                >
                  <span className={`text-[12px] font-bold w-9 ${isToday ? "text-accent" : "text-muted"}`}>{d.short}</span>
                  {tmpl ? (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-text truncate">{tmpl.emoji} {tmpl.name}</p>
                        <span className="text-[11px] text-muted ml-2 shrink-0">{tmpl.exercises.length} ex · ~{tmpl.estimatedDuration}m</span>
                      </div>
                      {exercisePreview && <p className="text-[11px] text-dim truncate mt-0.5">{exercisePreview}</p>}
                    </div>
                  ) : (
                    <p className="flex-1 text-[13px] text-muted">😴 Rest Day</p>
                  )}
                  {editWeekMode && (
                    <EditWeekDayMenu
                      day={d.key}
                      hasWorkout={!!tmpl}
                      onEdit={() => { setEditWeekMode(false); setEditingDay(d.key); }}
                      onSwap={() => setShowSwapFor(d.key)}
                      onDuplicate={() => setShowDuplicateFor(d.key)}
                      onClear={() => { if (confirm(`Clear ${d.label}?`)) clearDay(d.key); }}
                      onLoadDefault={() => setShowLoadDefault(d.key)}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Week bottom actions */}
      {editWeekMode && !showSplitPicker && (
        <div className="flex gap-2">
          <button onClick={() => setShowSplitPicker(true)} className="flex-1 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">📥 Load Split</button>
          <button onClick={clearAllDays} className="flex-1 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-hp-red hover:text-hp-red transition-colors">🗑 Clear All</button>
        </div>
      )}

      {/* Swap Day Picker */}
      {showSwapFor && (
        <SwapDayPicker
          sourceDay={showSwapFor}
          days={DAYS}
          weekPlan={weekPlan}
          templates={templates}
          onSwap={(target) => swapDays(showSwapFor, target)}
          onClose={() => setShowSwapFor(null)}
        />
      )}

      {/* Duplicate Day Picker */}
      {showDuplicateFor && (
        <DuplicateDayPicker
          sourceDay={showDuplicateFor}
          days={DAYS}
          weekPlan={weekPlan}
          templates={templates}
          onDuplicate={(target) => duplicateDay(showDuplicateFor, target)}
          onClose={() => setShowDuplicateFor(null)}
        />
      )}

      {/* Load Default for a day */}
      {showLoadDefault && (
        <LoadDefaultPanel
          day={showLoadDefault}
          onSelect={(splitId) => assignDefaultToDay(showLoadDefault, splitId)}
          onClose={() => setShowLoadDefault(null)}
        />
      )}

      {/* Split Picker */}
      {showSplitPicker && (
        <SplitPickerPanel
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
          filteredSplits={filteredSplits}
          onAdopt={adoptSplit}
          onClose={() => setShowSplitPicker(false)}
        />
      )}

      {/* Template Creator */}
      {showTemplateCreator && (
        <TemplateCreator
          onSave={(template) => { onUpdateTemplates([...templates, template]); setShowTemplateCreator(false); }}
          onClose={() => setShowTemplateCreator(false)}
        />
      )}

      {/* Bottom actions (non-edit mode) */}
      {!showSplitPicker && !showTemplateCreator && !editWeekMode && (
        <div className="flex gap-2">
          <button onClick={() => setShowTemplateCreator(true)} className="flex-1 py-3 rounded-2xl border-2 border-dashed border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">+ Custom Workout</button>
          <button onClick={() => setShowSplitPicker(true)} className="flex-1 py-3 rounded-2xl border border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">📥 Pre-Built Split</button>
        </div>
      )}
    </div>
  );
}

// ── Split Picker Panel ────────────────────────────────────
function SplitPickerPanel({ levelFilter, setLevelFilter, filteredSplits, onAdopt, onClose }: {
  levelFilter: SplitLevel | "all";
  setLevelFilter: (l: SplitLevel | "all") => void;
  filteredSplits: (typeof SPLIT_TEMPLATES);
  onAdopt: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4 space-y-3">
      <h3 className="text-[14px] font-bold text-text">Choose a Program</h3>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {(["all", "beginner", "intermediate", "advanced"] as const).map(lvl => (
          <button key={lvl} onClick={() => setLevelFilter(lvl)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap transition-colors ${levelFilter === lvl ? "bg-accent text-white" : "bg-surface-sage text-muted hover:text-text"}`}>
            {lvl === "all" ? "All Levels" : lvl}
          </button>
        ))}
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filteredSplits.map(s => (
          <button key={s.id} onClick={() => onAdopt(s.id)} className="w-full text-left p-3 rounded-xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-text">{s.name}</p>
                <p className="text-[11px] text-muted mt-0.5">{s.description}</p>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${LEVEL_COLORS[s.level]}`}>{s.level}</span>
            </div>
            <div className="flex gap-3 mt-1.5">
              <span className="text-[11px] text-accent font-semibold">{s.daysPerWeek} days/week</span>
              <span className="text-[11px] text-dim">{s.days.length} workout days</span>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="text-[12px] text-muted hover:text-text">Cancel</button>
    </div>
  );
}

// ── Edit Week Day Menu ────────────────────────────────────
function EditWeekDayMenu({ day, hasWorkout, onEdit, onSwap, onDuplicate, onClear, onLoadDefault }: {
  day: DayOfWeek; hasWorkout: boolean;
  onEdit: () => void; onSwap: () => void; onDuplicate: () => void; onClear: () => void; onLoadDefault: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-sage text-muted text-[14px]">⋯</button>
      {open && (
        <div className="absolute right-0 top-9 z-50 bg-surface rounded-xl border border-border-light shadow-lg py-1 w-48">
          <button onClick={() => { setOpen(false); onEdit(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">✏️ Edit Day</button>
          <button onClick={() => { setOpen(false); onSwap(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">↔️ Swap With Another Day</button>
          {hasWorkout && <button onClick={() => { setOpen(false); onDuplicate(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">📋 Duplicate to Another Day</button>}
          <button onClick={() => { setOpen(false); onLoadDefault(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">📥 Load a Default</button>
          {hasWorkout && <button onClick={() => { setOpen(false); onClear(); }} className="w-full text-left px-3 py-2 text-[12px] text-hp-red hover:bg-surface-sage">🗑 Clear (Rest Day)</button>}
        </div>
      )}
    </div>
  );
}

// ── Swap Day Picker ───────────────────────────────────────
function SwapDayPicker({ sourceDay, days, weekPlan, templates, onSwap, onClose }: {
  sourceDay: DayOfWeek;
  days: { key: DayOfWeek; label: string; short: string }[];
  weekPlan: WeekPlan; templates: DayTemplate[];
  onSwap: (target: DayOfWeek) => void; onClose: () => void;
}) {
  const srcTmpl = weekPlan[sourceDay] ? templates.find(t => t.id === weekPlan[sourceDay]) : null;
  return (
    <div className="bg-surface rounded-2xl border border-accent/30 shadow-sm p-4 space-y-2">
      <h3 className="text-[14px] font-bold text-text">↔ Swap {days.find(d => d.key === sourceDay)?.label} {srcTmpl ? `— ${srcTmpl.name}` : "— Rest"} with:</h3>
      {days.filter(d => d.key !== sourceDay).map(d => {
        const tmpl = weekPlan[d.key] ? templates.find(t => t.id === weekPlan[d.key]) : null;
        return (
          <button key={d.key} onClick={() => onSwap(d.key)} className="w-full text-left p-3 rounded-xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
            <p className="text-[13px] font-medium text-text">{d.short} — {tmpl ? `${tmpl.emoji} ${tmpl.name}` : "😴 Rest Day"}</p>
          </button>
        );
      })}
      <button onClick={onClose} className="text-[12px] text-muted hover:text-text">Cancel</button>
    </div>
  );
}

// ── Duplicate Day Picker ──────────────────────────────────
function DuplicateDayPicker({ sourceDay, days, weekPlan, templates, onDuplicate, onClose }: {
  sourceDay: DayOfWeek;
  days: { key: DayOfWeek; label: string; short: string }[];
  weekPlan: WeekPlan; templates: DayTemplate[];
  onDuplicate: (target: DayOfWeek) => void; onClose: () => void;
}) {
  const srcTmpl = weekPlan[sourceDay] ? templates.find(t => t.id === weekPlan[sourceDay]) : null;
  return (
    <div className="bg-surface rounded-2xl border border-accent/30 shadow-sm p-4 space-y-2">
      <h3 className="text-[14px] font-bold text-text">📋 Duplicate {srcTmpl?.name || "workout"} to:</h3>
      <p className="text-[11px] text-muted">This will replace whatever is on that day.</p>
      {days.filter(d => d.key !== sourceDay).map(d => {
        const tmpl = weekPlan[d.key] ? templates.find(t => t.id === weekPlan[d.key]) : null;
        return (
          <button key={d.key} onClick={() => onDuplicate(d.key)} className="w-full text-left p-3 rounded-xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
            <p className="text-[13px] font-medium text-text">{d.short} — {tmpl ? `${tmpl.emoji} ${tmpl.name}` : "😴 Rest Day"}</p>
          </button>
        );
      })}
      <button onClick={onClose} className="text-[12px] text-muted hover:text-text">Cancel</button>
    </div>
  );
}

// ── Load Default Panel ────────────────────────────────────
function LoadDefaultPanel({ day, onSelect, onClose }: {
  day: DayOfWeek; onSelect: (splitId: string) => void; onClose: () => void;
}) {
  const quickIds = QUICK_START_IDS;
  const quicks = quickIds.map(id => SPLIT_TEMPLATES.find(s => s.id === id)).filter(Boolean) as (typeof SPLIT_TEMPLATES)[number][];
  return (
    <div className="bg-surface rounded-2xl border border-accent/30 shadow-sm p-4 space-y-3">
      <h3 className="text-[14px] font-bold text-text">📥 Load a default routine</h3>
      <p className="text-[11px] text-muted">This will replace exercises on this day.</p>
      <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
        {quicks.map(q => (
          <button key={q.id} onClick={() => onSelect(q.id)} className="text-left p-3 rounded-xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
            <p className="text-[12px] font-semibold text-text">{q.days[0].emoji} {q.days[0].name}</p>
            <p className="text-[10px] text-muted">{q.days[0].exercises.length} exercises</p>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="text-[12px] text-muted hover:text-text">Cancel</button>
    </div>
  );
}

// ── Day Editor View (Full-Screen) ─────────────────────────
function DayEditorView({ day, template, allDays, weekPlan, templates, onChangeDay, onUpdateTemplate, onUpdateTemplates, onUpdateWeek, onSwap, onDuplicate, onClear, onBack, onLoadDefault, onCreateTemplate }: {
  day: DayOfWeek;
  template: DayTemplate | null;
  allDays: { key: DayOfWeek; label: string; short: string; letter: string }[];
  weekPlan: WeekPlan;
  templates: DayTemplate[];
  onChangeDay: (d: DayOfWeek) => void;
  onUpdateTemplate: (t: DayTemplate) => void;
  onUpdateTemplates: (t: DayTemplate[]) => void;
  onUpdateWeek: (w: WeekPlan) => void;
  onSwap: (target: DayOfWeek) => void;
  onDuplicate: (target: DayOfWeek) => void;
  onClear: () => void;
  onBack: () => void;
  onLoadDefault: (splitId: string) => void;
  onCreateTemplate: (t: DayTemplate) => void;
}) {
  const [editingExIdx, setEditingExIdx] = useState<number | null>(null);
  const [replacingExIdx, setReplacingExIdx] = useState<number | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(template?.name || "");
  const [showDayOps, setShowDayOps] = useState(false);
  const [showLoadDefault, setShowLoadDefault] = useState(false);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [showDupPicker, setShowDupPicker] = useState(false);

  const dayInfo = allDays.find(d => d.key === day)!;

  // Create a mutable copy of template if user edits a default
  const ensureUserCopy = (): DayTemplate => {
    if (template && !template.isDefault) return template;
    if (template) {
      const copy: DayTemplate = { ...template, id: generateId(), isDefault: false, basedOn: template.id, createdAt: new Date().toISOString(), exercises: template.exercises.map(e => ({ ...e })) };
      onCreateTemplate(copy);
      return copy;
    }
    // No template — create blank
    const blank: DayTemplate = {
      id: generateId(), name: dayInfo.label + " Workout", emoji: "🏋️", assignedDays: [],
      exercises: [], estimatedDuration: 0, notes: "", createdAt: new Date().toISOString(),
    };
    onCreateTemplate(blank);
    return blank;
  };

  const moveExercise = (idx: number, dir: -1 | 1) => {
    if (!template) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= template.exercises.length) return;
    const exercises = [...template.exercises];
    [exercises[idx], exercises[newIdx]] = [exercises[newIdx], exercises[idx]];
    exercises.forEach((e, i) => e.order = i);
    onUpdateTemplate({ ...template, exercises, estimatedDuration: exercises.length * 7 });
  };

  const removeExercise = (idx: number) => {
    if (!template) return;
    const exercises = template.exercises.filter((_, i) => i !== idx);
    exercises.forEach((e, i) => e.order = i);
    onUpdateTemplate({ ...template, exercises, estimatedDuration: exercises.length * 7 });
  };

  const updateExercise = (idx: number, updates: Partial<PlannedExercise>) => {
    if (!template) return;
    const exercises = [...template.exercises];
    exercises[idx] = { ...exercises[idx], ...updates };
    onUpdateTemplate({ ...template, exercises });
  };

  const replaceExercise = (idx: number, newExId: string) => {
    if (!template) return;
    const oldEx = template.exercises[idx];
    const exercises = [...template.exercises];
    exercises[idx] = { ...oldEx, exerciseId: newExId };
    onUpdateTemplate({ ...template, exercises });
    setReplacingExIdx(null);
  };

  const addExercise = (exerciseId: string) => {
    const t = template || ensureUserCopy();
    const ex = getExerciseById(exerciseId);
    if (!ex) return;
    const pe: PlannedExercise = {
      exerciseId, targetSets: 3,
      targetReps: ex.tracking === "duration" ? "30s" : "10",
      restTime: getDefaultRestTime(ex.tracking), order: t.exercises.length,
    };
    onUpdateTemplate({ ...t, exercises: [...t.exercises, pe], estimatedDuration: (t.exercises.length + 1) * 7 });
    setShowAddExercise(false);
  };

  const doRename = () => {
    if (!template || !renameValue.trim()) return;
    onUpdateTemplate({ ...template, name: renameValue.trim() });
    setIsRenaming(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[13px] text-accent font-semibold hover:underline">← My Plan</button>
        <p className="text-[13px] font-bold text-text capitalize">{dayInfo.label}</p>
        <div className="w-16" />
      </div>

      {/* Day Picker Strip */}
      <div className="flex justify-between bg-surface rounded-xl border border-border-light p-1.5">
        {allDays.map((d, i) => {
          const isActive = d.key === day;
          const hasTmpl = !!weekPlan[d.key];
          return (
            <button
              key={d.key}
              onClick={() => onChangeDay(d.key)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                isActive ? "bg-accent text-white" : hasTmpl ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-sage"
              }`}
            >
              {d.letter}
            </button>
          );
        })}
      </div>

      {/* Workout Name + Meta */}
      {template ? (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
          {isRenaming ? (
            <div className="flex gap-2">
              <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && doRename()}
                className="flex-1 bg-surface-sage border border-border-light rounded-lg px-3 py-1.5 text-[14px] text-text focus:border-accent focus:outline-none" />
              <button onClick={doRename} className="px-3 py-1.5 bg-accent text-white rounded-lg text-[12px] font-semibold">Save</button>
              <button onClick={() => setIsRenaming(false)} className="text-[12px] text-muted">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[16px] font-display font-bold text-text">{template.emoji} {template.name}</p>
                <p className="text-[12px] text-muted mt-0.5">{template.exercises.length} exercises · ~{template.estimatedDuration} min</p>
              </div>
              <button onClick={() => { setRenameValue(template.name); setIsRenaming(true); }} className="text-[11px] text-muted hover:text-accent">✏️ Rename</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4 text-center">
          <p className="text-[14px] text-muted mb-2">😴 Rest Day</p>
          <p className="text-[11px] text-dim">Tap below to assign a workout</p>
        </div>
      )}

      {/* Exercise List */}
      {template && template.exercises.length > 0 && (
        <div className="space-y-1">
          {template.exercises.map((pe, i) => {
            const ex = getExerciseById(pe.exerciseId);
            if (!ex) return null;
            const isEditing = editingExIdx === i;
            const isReplacing = replacingExIdx === i;

            return (
              <div key={`${pe.exerciseId}-${i}`} className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden">
                {/* Exercise row */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveExercise(i, -1)} disabled={i === 0} className="text-[9px] text-muted hover:text-accent disabled:opacity-20 leading-none">▲</button>
                    <button onClick={() => moveExercise(i, 1)} disabled={i === template.exercises.length - 1} className="text-[9px] text-muted hover:text-accent disabled:opacity-20 leading-none">▼</button>
                  </div>
                  <span className="text-[11px] text-muted font-bold w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text truncate">{ex.name}</p>
                    <p className="text-[11px] text-dim">{pe.targetSets} × {pe.targetReps}{pe.notes ? ` · 📝` : ""}</p>
                  </div>
                  <ExerciseOverflowMenu
                    onEdit={() => { setEditingExIdx(isEditing ? null : i); setReplacingExIdx(null); }}
                    onReplace={() => { setReplacingExIdx(isReplacing ? null : i); setEditingExIdx(null); }}
                    onRemove={() => removeExercise(i)}
                    onAddNote={() => {
                      const note = prompt("Exercise note:", pe.notes || "");
                      if (note !== null) updateExercise(i, { notes: note || undefined });
                    }}
                    onSetRest={() => {
                      const rest = prompt("Rest time (seconds):", String(pe.restTime));
                      if (rest) updateExercise(i, { restTime: parseInt(rest) || 60 });
                    }}
                  />
                </div>

                {/* Inline Editor */}
                {isEditing && (
                  <div className="px-3 pb-3 pt-1 border-t border-border-light bg-surface-sage/30 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Sets</label>
                        <input type="number" value={pe.targetSets} onChange={e => updateExercise(i, { targetSets: parseInt(e.target.value) || 1 })}
                          className="w-full bg-surface border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center mt-0.5" min="1" max="10" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Reps</label>
                        <input type="text" value={pe.targetReps} onChange={e => updateExercise(i, { targetReps: e.target.value })}
                          className="w-full bg-surface border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center mt-0.5" placeholder="8-10" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Target Weight</label>
                        <input type="number" value={pe.targetWeight || ""} onChange={e => updateExercise(i, { targetWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-full bg-surface border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center mt-0.5" placeholder="optional" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Rest (sec)</label>
                        <input type="number" value={pe.restTime} onChange={e => updateExercise(i, { restTime: parseInt(e.target.value) || 60 })}
                          className="w-full bg-surface border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center mt-0.5" step="15" min="0" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Notes</label>
                      <input type="text" value={pe.notes || ""} onChange={e => updateExercise(i, { notes: e.target.value || undefined })}
                        className="w-full bg-surface border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text mt-0.5" placeholder="e.g. pause at bottom" />
                    </div>
                    <button onClick={() => setEditingExIdx(null)} className="w-full py-2 bg-accent text-white rounded-lg text-[12px] font-semibold">Done</button>
                  </div>
                )}

                {/* Replace Exercise */}
                {isReplacing && (
                  <ReplaceExercisePanel exerciseId={pe.exerciseId} onSelect={(newId) => replaceExercise(i, newId)} onClose={() => setReplacingExIdx(null)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Exercise */}
      {showAddExercise ? (
        <ExerciseSearchPanel onSelect={addExercise} onClose={() => setShowAddExercise(false)} />
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setShowAddExercise(true)} className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">+ Add Exercise</button>
          <button onClick={() => setShowLoadDefault(true)} className="flex-1 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">📥 Load Default</button>
        </div>
      )}

      {/* Load Default for this day */}
      {showLoadDefault && (
        <LoadDefaultPanel day={day} onSelect={(splitId) => { onLoadDefault(splitId); setShowLoadDefault(false); }} onClose={() => setShowLoadDefault(false)} />
      )}

      {/* Day Operations */}
      <div className="bg-surface rounded-xl border border-border-light p-3 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">Day Options</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setShowSwapPicker(true)} className="py-2 px-3 rounded-lg border border-border-light text-[11px] font-medium text-muted hover:border-accent hover:text-accent transition-colors text-left">↔️ Swap Day</button>
          {template && <button onClick={() => setShowDupPicker(true)} className="py-2 px-3 rounded-lg border border-border-light text-[11px] font-medium text-muted hover:border-accent hover:text-accent transition-colors text-left">📋 Duplicate Day</button>}
          {template && <button onClick={() => { if (confirm(`Clear ${dayInfo.label}?`)) onClear(); }} className="py-2 px-3 rounded-lg border border-border-light text-[11px] font-medium text-muted hover:border-hp-red hover:text-hp-red transition-colors text-left">🗑 Clear Day</button>}
        </div>
      </div>

      {/* Swap Picker */}
      {showSwapPicker && (
        <SwapDayPicker sourceDay={day} days={allDays} weekPlan={weekPlan} templates={templates}
          onSwap={(target) => { const wp = { ...weekPlan, [day]: weekPlan[target], [target]: weekPlan[day] }; onUpdateWeek(wp); setShowSwapPicker(false); }}
          onClose={() => setShowSwapPicker(false)} />
      )}

      {/* Duplicate Picker */}
      {showDupPicker && template && (
        <DuplicateDayPicker sourceDay={day} days={allDays} weekPlan={weekPlan} templates={templates}
          onDuplicate={(target) => {
            const copy: DayTemplate = { ...template, id: generateId(), name: template.name + " (copy)", createdAt: new Date().toISOString(), exercises: template.exercises.map(e => ({ ...e })) };
            onUpdateTemplates([...templates, copy]);
            onUpdateWeek({ ...weekPlan, [target]: copy.id });
            setShowDupPicker(false);
          }}
          onClose={() => setShowDupPicker(false)} />
      )}
    </div>
  );
}

// ── Exercise Overflow Menu ─────────────────────────────────
function ExerciseOverflowMenu({ onEdit, onReplace, onRemove, onAddNote, onSetRest }: {
  onEdit: () => void; onReplace: () => void; onRemove: () => void; onAddNote: () => void; onSetRest: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-sage text-muted text-[13px]">⋯</button>
      {open && (
        <div className="absolute right-0 top-9 z-50 bg-surface rounded-xl border border-border-light shadow-lg py-1 w-52">
          <button onClick={() => { setOpen(false); onEdit(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">✏️ Edit Sets & Reps</button>
          <button onClick={() => { setOpen(false); onReplace(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">🔄 Replace Exercise</button>
          <button onClick={() => { setOpen(false); onAddNote(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">📝 Add Note</button>
          <button onClick={() => { setOpen(false); onSetRest(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">⏱ Set Rest Time</button>
          <button onClick={() => { setOpen(false); onRemove(); }} className="w-full text-left px-3 py-2 text-[12px] text-hp-red hover:bg-surface-sage">🗑 Remove Exercise</button>
        </div>
      )}
    </div>
  );
}

// ── Replace Exercise Panel ─────────────────────────────────
function ReplaceExercisePanel({ exerciseId, onSelect, onClose }: {
  exerciseId: string; onSelect: (newId: string) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");
  const source = getExerciseById(exerciseId);
  const alternatives = getSmartAlternatives(exerciseId, 4);
  const searchResults = query.length >= 2
    ? searchExercises(query, { muscle: muscleFilter || undefined }).filter(e => e.id !== exerciseId).slice(0, 12)
    : [];

  return (
    <div className="px-3 pb-3 pt-2 border-t border-border-light bg-surface-sage/20 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">🔄 Replace: {source?.name}</p>

      {/* Smart Alternatives */}
      {alternatives.length > 0 && (
        <div>
          <p className="text-[10px] text-dim font-semibold uppercase mb-1">Suggested Alternatives</p>
          {alternatives.map(alt => (
            <button key={alt.id} onClick={() => onSelect(alt.id)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-sage transition-colors text-left">
              <div>
                <p className="text-[12px] font-medium text-text">{alt.name}</p>
                <p className="text-[10px] text-muted">{MUSCLE_GROUP_LABELS[alt.muscle]} · {alt.equipment}</p>
              </div>
              <span className="text-accent text-[11px]">↵</span>
            </button>
          ))}
        </div>
      )}

      {/* Full Search */}
      <div className="border-t border-border-light pt-2">
        <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search all exercises..."
          className="w-full bg-surface border border-border-light rounded-lg px-2 py-1.5 text-[12px] text-text placeholder:text-muted focus:border-accent focus:outline-none" />
        <div className="flex flex-wrap gap-1 mt-1.5">
          {(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "core"] as MuscleGroup[]).map(m => (
            <button key={m} onClick={() => setMuscleFilter(muscleFilter === m ? "" : m)}
              className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-colors ${muscleFilter === m ? "bg-accent text-white" : "bg-surface text-muted hover:text-text"}`}>
              {MUSCLE_GROUP_LABELS[m]}
            </button>
          ))}
        </div>
        {searchResults.length > 0 && (
          <div className="max-h-[150px] overflow-y-auto mt-1">
            {searchResults.map(ex => (
              <button key={ex.id} onClick={() => onSelect(ex.id)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-sage transition-colors text-left">
                <div>
                  <p className="text-[12px] font-medium text-text">{ex.name}</p>
                  <p className="text-[10px] text-muted">{MUSCLE_GROUP_LABELS[ex.muscle]} · {ex.equipment}</p>
                </div>
                <span className="text-accent text-[11px]">↵</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={onClose} className="text-[11px] text-muted hover:text-text">Cancel</button>
    </div>
  );
}

// ── Exercise Search Panel (reusable) ──────────────────────
function ExerciseSearchPanel({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");
  const results = query.length >= 2 ? searchExercises(query, { muscle: muscleFilter || undefined }).slice(0, 15) : [];

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-text">Add Exercise</h3>
        <button onClick={onClose} className="text-[11px] text-muted hover:text-text">Close</button>
      </div>
      <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exercises..."
        className="w-full bg-surface-sage border border-border-light rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-muted focus:border-accent focus:outline-none" />
      <div className="flex flex-wrap gap-1">
        {(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "core", "cardio"] as MuscleGroup[]).map(m => (
          <button key={m} onClick={() => setMuscleFilter(muscleFilter === m ? "" : m)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${muscleFilter === m ? "bg-accent text-white" : "bg-surface-sage text-muted hover:text-text"}`}>
            {MUSCLE_GROUP_LABELS[m]}
          </button>
        ))}
      </div>
      {query.length >= 2 && (
        <div className="max-h-[200px] overflow-y-auto space-y-0.5">
          {results.map(ex => (
            <button key={ex.id} onClick={() => onSelect(ex.id)} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-sage transition-colors text-left">
              <div>
                <p className="text-[12px] font-medium text-text">{ex.name}</p>
                <p className="text-[10px] text-muted">{MUSCLE_GROUP_LABELS[ex.muscle]} · {ex.equipment}</p>
              </div>
              <span className="text-accent text-[11px]">+</span>
            </button>
          ))}
          {results.length === 0 && <p className="text-[11px] text-muted py-2">No exercises found</p>}
        </div>
      )}
    </div>
  );
}

// ── Template Creator ──────────────────────────────────────
function TemplateCreator({ onSave, onClose }: { onSave: (template: DayTemplate) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏋️");
  const [exercises, setExercises] = useState<PlannedExercise[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const addExercise = (exerciseId: string) => {
    const ex = getExerciseById(exerciseId);
    if (!ex) return;
    setExercises([...exercises, { exerciseId, targetSets: 3, targetReps: ex.tracking === "duration" ? "30s" : "10", restTime: getDefaultRestTime(ex.tracking), order: exercises.length }]);
    setShowAddExercise(false);
  };

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return;
    onSave({ id: generateId(), name: name.trim(), emoji, assignedDays: [], exercises, estimatedDuration: exercises.length * 7, notes: "", createdAt: new Date().toISOString() });
  };

  const EMOJI_OPTIONS = ["🏋️", "💪", "🦵", "🔥", "🍑", "🧘", "🥊", "🏃", "⚡", "🎯"];

  return (
    <div className="bg-surface rounded-2xl border border-accent/20 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-text">Create Custom Workout</h3>
        <button onClick={onClose} className="text-[12px] text-muted hover:text-text">Cancel</button>
      </div>
      <div className="flex gap-2">
        <select value={emoji} onChange={e => setEmoji(e.target.value)} className="appearance-none w-10 h-10 text-center text-lg bg-surface-sage rounded-lg border border-border-light cursor-pointer">
          {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Workout name..."
          className="flex-1 bg-surface-sage border border-border-light rounded-lg px-3 py-2 text-[14px] text-text placeholder:text-muted focus:border-accent focus:outline-none" />
      </div>
      {exercises.length > 0 && (
        <div className="space-y-1">
          {exercises.map((pe, i) => {
            const ex = getExerciseById(pe.exerciseId);
            if (!ex) return null;
            return (
              <div key={`${pe.exerciseId}-${i}`} className="flex items-center gap-2 p-2 rounded-lg bg-surface-sage/50 border border-border-light">
                <span className="text-[11px] text-muted font-bold w-5">{i + 1}.</span>
                <p className="flex-1 text-[12px] font-semibold text-text truncate">{ex.name}</p>
                <span className="text-[11px] text-dim">{pe.targetSets} × {pe.targetReps}</span>
                <button onClick={() => setExercises(exercises.filter((_, j) => j !== i))} className="text-[10px] text-muted hover:text-hp-red p-1">✕</button>
              </div>
            );
          })}
        </div>
      )}
      {showAddExercise ? (
        <ExerciseSearchPanel onSelect={addExercise} onClose={() => setShowAddExercise(false)} />
      ) : (
        <button onClick={() => setShowAddExercise(true)} className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">+ Add Exercise</button>
      )}
      <button onClick={handleSave} disabled={!name.trim() || exercises.length === 0}
        className="w-full py-3 rounded-xl bg-accent text-white text-[14px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        Save Workout ({exercises.length} exercises)
      </button>
    </div>
  );
}

// ── Exercise Browser ───────────────────────────────────────
function ExerciseBrowser({
  favorites, onToggleFavorite, prs,
}: {
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  prs: PersonalRecord[];
}) {
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<ExerciseCategory | "">("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);

  const results = query.length >= 2
    ? searchExercises(query, { category: catFilter || undefined, muscle: muscleFilter || undefined }).slice(0, 30)
    : searchExercises("", { category: catFilter || undefined, muscle: muscleFilter || undefined }).slice(0, 30);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search exercises..."
        className="w-full bg-surface border border-border-light rounded-xl px-4 py-3 text-[14px] text-text placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {/* Muscle Filter */}
      <div className="flex flex-wrap gap-1.5">
        {(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "core", "cardio"] as MuscleGroup[]).map(m => (
          <button
            key={m}
            onClick={() => setMuscleFilter(muscleFilter === m ? "" : m)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              muscleFilter === m ? "bg-accent text-white" : "bg-surface border border-border-light text-muted hover:text-text"
            }`}
          >
            {MUSCLE_GROUP_LABELS[m] || m}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {(["strength", "cardio", "yoga", "pilates", "boxing", "barre", "calisthenics", "flexibility"] as ExerciseCategory[]).map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(catFilter === c ? "" : c)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize transition-colors ${
              catFilter === c ? "bg-accent text-white" : "bg-surface border border-border-light text-muted hover:text-text"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Exercise Detail */}
      {selectedEx && (
        <div className="bg-surface rounded-2xl border border-accent/30 shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-text">{selectedEx.name}</h3>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => onToggleFavorite(selectedEx.id)}
                className="text-lg"
              >
                {favorites.includes(selectedEx.id) ? "⭐" : "☆"}
              </button>
              <button onClick={() => setSelectedEx(null)} className="text-[12px] text-muted hover:text-text">Close</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-[11px] font-medium capitalize">{selectedEx.category}</span>
            <span className="px-2 py-0.5 bg-surface-sage text-dim rounded-full text-[11px] font-medium capitalize">{selectedEx.equipment}</span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Primary</p>
            <p className="text-[12px] text-text">{MUSCLE_GROUP_LABELS[selectedEx.muscle] || selectedEx.muscle}</p>
          </div>
          {(selectedEx.secondary?.length ?? 0) > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Secondary</p>
              <p className="text-[12px] text-text">{(selectedEx.secondary || []).map(m => MUSCLE_GROUP_LABELS[m] || m).join(", ")}</p>
            </div>
          )}
          {prs.filter(p => p.exerciseId === selectedEx.id).length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Your PRs</p>
              {prs.filter(p => p.exerciseId === selectedEx.id).map((pr, i) => (
                <p key={i} className="text-[12px] text-text">🏆 {pr.setDetails} (est. 1RM: {Math.round(pr.value)} {pr.unit})</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results List */}
      <div className="space-y-0.5">
        {results.map(ex => (
          <button
            key={ex.id}
            onClick={() => setSelectedEx(ex)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-sage transition-colors text-left"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-text truncate">
                {favorites.includes(ex.id) ? "⭐ " : ""}{ex.name}
              </p>
              <p className="text-[11px] text-muted">
                {MUSCLE_GROUP_LABELS[ex.muscle] || ex.muscle} · {ex.category}
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize bg-surface-sage text-dim">
              {ex.equipment}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────
function HistoryTab({
  workoutLog, settings, onDelete,
}: {
  workoutLog: WorkoutSession[];
  settings: WorkoutSettings;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (workoutLog.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[40px] mb-2">📅</p>
        <p className="text-[14px] text-muted">No workouts yet. Start your first workout!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {workoutLog.map(w => (
        <div key={w.id} className="bg-surface rounded-xl border border-border-light shadow-sm overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === w.id ? null : w.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="text-[13px] font-semibold text-text">{w.name}</p>
              <p className="text-[11px] text-muted">
                {w.completedAt ? new Date(w.completedAt).toLocaleDateString() : "In Progress"} · {w.duration} min · {w.totalVolume.toLocaleString()} {settings.units}
              </p>
            </div>
            <span className="text-muted">{expanded === w.id ? "▲" : "▼"}</span>
          </button>
          {expanded === w.id && (
            <div className="px-4 pb-3 border-t border-border-light pt-2 space-y-2">
              {w.exercises.map((ex, i) => {
                const exercise = getExerciseById(ex.exerciseId);
                return (
                  <div key={i}>
                    <p className="text-[12px] font-semibold text-text">{exercise?.name || ex.exerciseId}</p>
                    {ex.sets.map((s, si) => (
                      <p key={si} className="text-[11px] text-dim ml-3">
                        Set {s.setNumber}: {s.weight || "—"} {settings.units} × {s.reps || s.duration || "—"} {s.isPersonalRecord ? "🏆" : ""}
                      </p>
                    ))}
                  </div>
                );
              })}
              <button
                onClick={() => { if (confirm("Delete this workout?")) onDelete(w.id); }}
                className="text-[11px] text-hp-red hover:underline mt-2"
              >
                Delete Workout
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Stats Tab ──────────────────────────────────────────────
function StatsTab({
  workoutLog, prs, streak, settings,
}: {
  workoutLog: WorkoutSession[];
  prs: PersonalRecord[];
  streak: number;
  settings: WorkoutSettings;
}) {
  const thisWeek = workoutLog.filter(w => {
    if (!w.completedAt) return false;
    const d = new Date(w.completedAt);
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const avgDuration = thisWeek.length > 0
    ? Math.round(thisWeek.reduce((s, w) => s + w.duration, 0) / thisWeek.length)
    : 0;

  const weekVolume = thisWeek.reduce((s, w) => s + w.totalVolume, 0);

  // Muscle group distribution (this week)
  const muscleVolume: Record<string, number> = {};
  for (const w of thisWeek) {
    for (const ex of w.exercises) {
      const exercise = getExerciseById(ex.exerciseId);
      if (!exercise) continue;
      const vol = ex.sets.reduce((s, set) => s + (set.type !== "warmup" && set.weight && set.reps ? set.weight * set.reps : 0), 0);
      muscleVolume[exercise.muscle] = (muscleVolume[exercise.muscle] || 0) + vol;
      for (const m of (exercise.secondary || [])) {
        muscleVolume[m] = (muscleVolume[m] || 0) + Math.round(vol * 0.5);
      }
    }
  }

  const recentPRs = [...prs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-xl border border-border-light p-3">
          <p className="text-[11px] text-muted uppercase tracking-wider">Streak</p>
          <p className="text-[22px] font-display font-bold text-text">{streak > 0 ? `🔥 ${streak}d` : "—"}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border-light p-3">
          <p className="text-[11px] text-muted uppercase tracking-wider">This Week</p>
          <p className="text-[22px] font-display font-bold text-text">{thisWeek.length} workouts</p>
        </div>
        <div className="bg-surface rounded-xl border border-border-light p-3">
          <p className="text-[11px] text-muted uppercase tracking-wider">Avg Duration</p>
          <p className="text-[22px] font-display font-bold text-text">{avgDuration > 0 ? `${avgDuration} min` : "—"}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border-light p-3">
          <p className="text-[11px] text-muted uppercase tracking-wider">Week Volume</p>
          <p className="text-[22px] font-display font-bold text-text">{weekVolume > 0 ? `${(weekVolume / 1000).toFixed(1)}k` : "—"}</p>
        </div>
      </div>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
          <h3 className="text-[13px] font-bold text-text mb-2">Recent PRs</h3>
          {recentPRs.map((pr, i) => {
            const exercise = getExerciseById(pr.exerciseId);
            return (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border-light/50 last:border-b-0">
                <div>
                  <p className="text-[12px] font-semibold text-text">🏆 {exercise?.name || pr.exerciseId}</p>
                  <p className="text-[11px] text-muted">{pr.setDetails} (est. 1RM: {Math.round(pr.value)} {pr.unit})</p>
                </div>
                <p className="text-[11px] text-dim">{new Date(pr.date).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Muscle Volume Distribution */}
      {Object.keys(muscleVolume).length > 0 && (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
          <h3 className="text-[13px] font-bold text-text mb-2">Muscle Volume This Week</h3>
          {Object.entries(muscleVolume)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([muscle, vol]) => {
              const maxVol = Math.max(...Object.values(muscleVolume));
              const pct = maxVol > 0 ? (vol / maxVol) * 100 : 0;
              return (
                <div key={muscle} className="flex items-center gap-2 py-1">
                  <span className="text-[11px] text-muted w-20 flex-shrink-0 capitalize">
                    {MUSCLE_GROUP_LABELS[muscle as MuscleGroup] || muscle}
                  </span>
                  <div className="flex-1 h-3 bg-border-light rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-dim tabular-nums w-16 text-right">
                    {(vol / 1000).toFixed(1)}k {settings.units}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* All-Time Stats */}
      <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
        <h3 className="text-[13px] font-bold text-text mb-2">All-Time</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-[20px] font-display font-bold text-text">{workoutLog.length}</p>
            <p className="text-[11px] text-muted">Total Workouts</p>
          </div>
          <div>
            <p className="text-[20px] font-display font-bold text-text">{prs.length}</p>
            <p className="text-[11px] text-muted">Personal Records</p>
          </div>
          <div>
            <p className="text-[20px] font-display font-bold text-text">
              {workoutLog.length > 0 ? Math.round(workoutLog.reduce((s, w) => s + w.duration, 0) / 60) : 0}h
            </p>
            <p className="text-[11px] text-muted">Total Hours</p>
          </div>
          <div>
            <p className="text-[20px] font-display font-bold text-text">
              {(workoutLog.reduce((s, w) => s + w.totalVolume, 0) / 1000).toFixed(0)}k
            </p>
            <p className="text-[11px] text-muted">Total Volume ({settings.units})</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
} from "@/lib/exerciseDatabase";

// ── Constants ────────────────────────────────────────────────
const DAYS_META: { key: DayOfWeek; label: string; short: string; letter: string }[] = [
  { key: "monday", label: "Monday", short: "MON", letter: "M" },
  { key: "tuesday", label: "Tuesday", short: "TUE", letter: "T" },
  { key: "wednesday", label: "Wednesday", short: "WED", letter: "W" },
  { key: "thursday", label: "Thursday", short: "THU", letter: "T" },
  { key: "friday", label: "Friday", short: "FRI", letter: "F" },
  { key: "saturday", label: "Saturday", short: "SAT", letter: "S" },
  { key: "sunday", label: "Sunday", short: "SUN", letter: "S" },
];

const DOW_NAMES: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DOW_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const LEVEL_COLORS: Record<SplitLevel, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
  all: "bg-gray-100 text-gray-600",
};

/** Shorten a workout name for the 7-col weekly strip (max ~6 chars) */
function shortenName(name: string): string {
  // Remove "Quick " prefix
  const n = name.replace(/^Quick\s+/i, "");
  // Take first word, max 7 chars
  const first = n.split(/[\s—/]+/)[0];
  return first.length > 7 ? first.slice(0, 6) + "…" : first;
}

// ── Click-outside hook ──────────────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handlerRef.current();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, enabled]);
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
type ViewMode = "calendar" | "routineSetup" | "editDay" | "stats";

export function WorkoutTracker() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_SETTINGS);

  // Core data
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

  // View state
  const [view, setView] = useState<ViewMode>("calendar");
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [pastWorkoutDate, setPastWorkoutDate] = useState<string | null>(null);
  const [completedSummary, setCompletedSummary] = useState<WorkoutSession | null>(null);

  // Edit Today Only
  const [todayOverride, setTodayOverride] = useState<PlannedExercise[] | null>(null);
  const [editingTodayOnly, setEditingTodayOnly] = useState(false);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTarget, setRestTarget] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load from localStorage ────────────────────────────────
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

  // ── Persist helpers ────────────────────────────────────────
  const persistSettings = useCallback((s: WorkoutSettings) => { setSettings(s); saveToStorage(STORAGE_KEYS.settings, s); }, []);
  const persistTemplates = useCallback((t: DayTemplate[]) => { setTemplates(t); saveToStorage(STORAGE_KEYS.templates, t); }, []);
  const persistWeek = useCallback((w: WeekPlan) => { setWeekPlan(w); saveToStorage(STORAGE_KEYS.week, w); }, []);
  const persistLog = useCallback((l: WorkoutSession[]) => { setWorkoutLog(l); saveToStorage(STORAGE_KEYS.log, l); }, []);
  const persistPrs = useCallback((p: PersonalRecord[]) => { setPrs(p); saveToStorage(STORAGE_KEYS.prs, p); }, []);
  const persistActive = useCallback((w: WorkoutSession | null) => { setActiveWorkout(w); saveToStorage(STORAGE_KEYS.activeWorkout, w); }, []);

  // ── Rest timer logic ──────────────────────────────────────
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
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const skipRest = useCallback(() => {
    if (restInterval.current) clearInterval(restInterval.current);
    setRestActive(false);
    setRestSeconds(0);
  }, []);

  // ── PR detection ──────────────────────────────────────────
  const checkForPR = useCallback((exerciseId: string, set: LoggedSet, workoutId: string): boolean => {
    if (!set.weight || !set.reps || set.type === "warmup") return false;
    const est = estimated1RM(set.weight, set.reps);
    const existing = prs.find(p => p.exerciseId === exerciseId && p.type === "1rm");
    if (!existing || est > existing.value) {
      const newPR: PersonalRecord = {
        exerciseId, type: "1rm", value: est, unit: settings.units,
        date: new Date().toISOString(), workoutId,
        setDetails: `${set.weight} × ${set.reps}`,
      };
      const updated = [...prs.filter(p => !(p.exerciseId === exerciseId && p.type === "1rm")), newPR];
      persistPrs(updated);
      return true;
    }
    return false;
  }, [prs, settings.units, persistPrs]);

  // ── Start a workout ───────────────────────────────────────
  const startWorkout = useCallback((exercises?: PlannedExercise[], name?: string, templateId?: string) => {
    const workout: WorkoutSession = {
      id: generateId(),
      templateId,
      name: name || `Workout — ${new Date().toLocaleDateString()}`,
      startedAt: new Date().toISOString(),
      duration: 0,
      exercises: (exercises || []).map(pe => ({
        exerciseId: pe.exerciseId,
        sets: [],
        supersetGroup: pe.supersetGroup,
      })),
      notes: "",
      totalVolume: 0,
    };
    persistActive(workout);
    setTodayOverride(null);
    setEditingTodayOnly(false);
  }, [persistActive]);

  const startFromTemplate = useCallback((template: DayTemplate) => {
    startWorkout(template.exercises, template.name, template.id);
  }, [startWorkout]);

  // ── Complete workout ──────────────────────────────────────
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
    setCompletedSummary(completed);
  }, [activeWorkout, workoutLog, persistLog, persistActive, skipRest]);

  // ── Workout exercise management ────────────────────────────
  const addExerciseToWorkout = useCallback((exerciseId: string) => {
    if (!activeWorkout) return;
    persistActive({ ...activeWorkout, exercises: [...activeWorkout.exercises, { exerciseId, sets: [] }] });
    const newRecent = [exerciseId, ...recentExercises.filter(id => id !== exerciseId)].slice(0, 20);
    setRecentExercises(newRecent);
    saveToStorage(STORAGE_KEYS.recentExercises, newRecent);
  }, [activeWorkout, recentExercises, persistActive]);

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
    persistActive({ ...activeWorkout, exercises });
    const exercise = getExerciseById(ex.exerciseId);
    if (exercise) startRest(getDefaultRestTime(exercise.tracking));
  }, [activeWorkout, persistActive, checkForPR, startRest]);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const exercises = [...activeWorkout.exercises];
    const ex = { ...exercises[exerciseIndex] };
    ex.sets = ex.sets.filter((_, i) => i !== setIndex);
    exercises[exerciseIndex] = ex;
    persistActive({ ...activeWorkout, exercises });
  }, [activeWorkout, persistActive]);

  const removeExercise = useCallback((index: number) => {
    if (!activeWorkout) return;
    persistActive({ ...activeWorkout, exercises: activeWorkout.exercises.filter((_, i) => i !== index) });
  }, [activeWorkout, persistActive]);

  // ── Helpers ───────────────────────────────────────────────
  const todayDay = getTodayDayOfWeek();
  const todayTemplateId = weekPlan[todayDay];
  const todayTemplate = todayTemplateId ? (templates.find(t => t.id === todayTemplateId) ?? null) : null;
  const hasRoutine = templates.length > 0;

  const getTemplate = useCallback((day: DayOfWeek) => {
    const tid = weekPlan[day];
    return tid ? templates.find(t => t.id === tid) ?? null : null;
  }, [weekPlan, templates]);

  const getStreak = useCallback(() => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const hasWorkout = workoutLog.some(w => w.completedAt?.startsWith(dayStr));
      if (hasWorkout || (i === 0 && activeWorkout)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [workoutLog, activeWorkout]);

  const getPreviousSets = useCallback((exerciseId: string): LoggedSet[] => {
    for (const session of workoutLog) {
      const ex = session.exercises.find(e => e.exerciseId === exerciseId);
      if (ex && ex.sets.length > 0) return ex.sets;
    }
    return [];
  }, [workoutLog]);

  const getExercisePR = useCallback((exerciseId: string): PersonalRecord | undefined => {
    return prs.find(p => p.exerciseId === exerciseId && p.type === "1rm");
  }, [prs]);

  // ── Adopt a split template ─────────────────────────────────
  const adoptSplit = useCallback((splitId: string) => {
    const split = SPLIT_TEMPLATES.find(s => s.id === splitId);
    if (!split) return;
    const newTemplates: DayTemplate[] = split.days.map(d => ({
      id: generateId(), name: d.name, emoji: d.emoji, assignedDays: [],
      exercises: d.exercises.map((e, j) => ({
        exerciseId: e.exerciseId, targetSets: e.sets, targetReps: e.reps,
        restTime: e.rest, order: j,
      })),
      estimatedDuration: d.exercises.length * 7, notes: "", createdAt: new Date().toISOString(), basedOn: splitId,
    }));
    const newWeek: WeekPlan = { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null, saturday: null, sunday: null, splitName: split.name };
    const dayKeys: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const schedules: Record<number, number[]> = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
    const sched = schedules[split.daysPerWeek] || schedules[3];
    sched.forEach((dayIdx, i) => { if (i < newTemplates.length) newWeek[dayKeys[dayIdx]] = newTemplates[i].id; });
    persistTemplates([...templates, ...newTemplates]);
    persistWeek(newWeek);
  }, [templates, persistTemplates, persistWeek]);

  // Quick-start (one-off workout from template)
  const quickStart = useCallback((splitId: string) => {
    const split = SPLIT_TEMPLATES.find(s => s.id === splitId);
    if (!split?.days[0]) return;
    const d = split.days[0];
    const exercises = d.exercises.map((e, j) => ({
      exerciseId: e.exerciseId, targetSets: e.sets, targetReps: e.reps, restTime: e.rest, order: j,
    }));
    startWorkout(exercises, d.name);
  }, [startWorkout]);

  // Assign a quick-start default to a day
  const assignDefaultToDay = useCallback((day: DayOfWeek, splitId: string) => {
    const split = SPLIT_TEMPLATES.find(s => s.id === splitId);
    if (!split?.days[0]) return;
    const d = split.days[0];
    const newTmpl: DayTemplate = {
      id: generateId(), name: d.name, emoji: d.emoji, assignedDays: [],
      exercises: d.exercises.map((e, j) => ({ exerciseId: e.exerciseId, targetSets: e.sets, targetReps: e.reps, restTime: e.rest, order: j })),
      estimatedDuration: d.exercises.length * 7, notes: "", createdAt: new Date().toISOString(), basedOn: splitId,
    };
    persistTemplates([...templates, newTmpl]);
    persistWeek({ ...weekPlan, [day]: newTmpl.id });
  }, [templates, weekPlan, persistTemplates, persistWeek]);

  if (!mounted) return null;

  // ── COMPLETED WORKOUT SUMMARY ─────────────────────────────
  if (completedSummary) {
    const prsHit = completedSummary.exercises.flatMap(ex =>
      ex.sets.filter(s => s.isPersonalRecord).map(s => ({ exerciseId: ex.exerciseId, set: s }))
    );
    return (
      <div className="max-w-lg mx-auto space-y-5 py-6">
        <div className="text-center">
          <p className="text-[48px] mb-2">✅</p>
          <h1 className="font-display text-2xl text-text font-bold">Workout Complete!</h1>
        </div>
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-5 space-y-3">
          <p className="text-[15px] font-bold text-text">{completedSummary.name} — {completedSummary.duration} min</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-surface-sage rounded-xl">
              <p className="text-[20px] font-display font-bold text-text">{completedSummary.totalVolume.toLocaleString()}</p>
              <p className="text-[10px] text-muted uppercase">Total Volume (lbs)</p>
            </div>
            <div className="text-center p-2 bg-surface-sage rounded-xl">
              <p className="text-[20px] font-display font-bold text-text">{completedSummary.exercises.length}</p>
              <p className="text-[10px] text-muted uppercase">Exercises</p>
            </div>
          </div>
          {/* Exercises summary */}
          <div className="space-y-1 pt-2 border-t border-border-light">
            {completedSummary.exercises.map((ex, i) => {
              const exercise = getExerciseById(ex.exerciseId);
              const setsStr = ex.sets.filter(s => s.type !== "warmup").map(s =>
                `${s.weight || "—"}×${s.reps || s.duration || "—"}`
              ).join(", ");
              const hasPR = ex.sets.some(s => s.isPersonalRecord);
              return (
                <p key={i} className="text-[12px] text-dim">
                  {exercise?.name || ex.exerciseId} — {setsStr} {hasPR ? "🏆" : ""}
                </p>
              );
            })}
          </div>
          {prsHit.length > 0 && (
            <div className="bg-hp-yellow/10 rounded-xl p-3">
              <p className="text-[13px] font-bold text-text">🏆 New PRs!</p>
              {prsHit.map((pr, i) => {
                const ex = getExerciseById(pr.exerciseId);
                const est = pr.set.weight && pr.set.reps ? estimated1RM(pr.set.weight, pr.set.reps) : 0;
                return (
                  <p key={i} className="text-[12px] text-dim mt-1">
                    {ex?.name} — {pr.set.weight} × {pr.set.reps} (est 1RM: {Math.round(est)} lbs)
                  </p>
                );
              })}
            </div>
          )}
          <p className="text-center text-[14px] font-semibold text-accent">
            🔥 Streak: {getStreak()} days!
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCompletedSummary(null)} className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold text-[14px] hover:bg-accent/90 transition-colors">
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE WORKOUT VIEW ───────────────────────────────────
  if (activeWorkout) {
    const elapsed = Math.round((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 60000);
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-surface rounded-2xl border border-border-light p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-xl text-text">{activeWorkout.name}</h1>
            <div className="flex gap-2">
              <button onClick={() => { if (confirm("Discard this workout?")) persistActive(null); }} className="text-[12px] text-muted hover:text-hp-red transition-colors">Discard</button>
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
                <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${restTarget > 0 ? (restSeconds / restTarget) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-center gap-3 mt-3">
                <button onClick={() => setRestSeconds(s => Math.max(0, s - 15))} className="px-3 py-1 rounded-full border border-border text-[12px] text-muted hover:bg-surface-sage">-15s</button>
                <button onClick={skipRest} className="px-4 py-1 rounded-full bg-accent/10 text-accent text-[12px] font-semibold hover:bg-accent/20">Skip</button>
                <button onClick={() => setRestSeconds(s => s + 15)} className="px-3 py-1 rounded-full border border-border text-[12px] text-muted hover:bg-surface-sage">+15s</button>
              </div>
            </div>
          </div>
        )}

        {/* Exercises */}
        {activeWorkout.exercises.map((loggedEx, exIdx) => {
          const plannedExList = todayOverride || (activeWorkout.templateId ? templates.find(t => t.id === activeWorkout.templateId)?.exercises : null) || [];
          const plannedEx = plannedExList.find(pe => pe.exerciseId === loggedEx.exerciseId);
          return (
            <ExerciseLogCard
              key={`${loggedEx.exerciseId}-${exIdx}`}
              loggedEx={loggedEx}
              exIdx={exIdx}
              settings={settings}
              previousSets={getPreviousSets(loggedEx.exerciseId)}
              pr={getExercisePR(loggedEx.exerciseId)}
              targetWeight={plannedEx?.targetWeight}
              targetSets={plannedEx?.targetSets}
              targetReps={plannedEx?.targetReps}
              onLogSet={(set) => logSet(exIdx, set)}
              onRemoveSet={(setIdx) => removeSet(exIdx, setIdx)}
              onRemoveExercise={() => removeExercise(exIdx)}
            />
          );
        })}

        <AddExercisePanel onAdd={addExerciseToWorkout} recentExercises={recentExercises} favorites={favorites} />
      </div>
    );
  }

  // ── PAST WORKOUT VIEWER ───────────────────────────────────
  const pastWorkout = pastWorkoutDate ? workoutLog.find(w => w.completedAt?.startsWith(pastWorkoutDate)) : null;

  // ── CALENDAR VIEW (main view) ─────────────────────────────
  return (
    <div className="space-y-5">
      {/* Past Workout Modal */}
      {pastWorkout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setPastWorkoutDate(null)}>
          <div className="bg-surface rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-text">
                📋 {new Date(pastWorkout.completedAt!).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} — {pastWorkout.name}
              </h2>
              <button onClick={() => setPastWorkoutDate(null)} className="text-[12px] text-muted hover:text-text">Close</button>
            </div>
            <div className="flex gap-3 text-[12px] text-muted mb-3">
              <span>Duration: {pastWorkout.duration} min</span>
              <span>Volume: {pastWorkout.totalVolume.toLocaleString()} lbs</span>
            </div>
            <div className="space-y-2">
              {pastWorkout.exercises.map((ex, i) => {
                const exercise = getExerciseById(ex.exerciseId);
                const setsStr = ex.sets.filter(s => s.type !== "warmup").map(s =>
                  `${s.weight || "—"}×${s.reps || s.duration || "—"}`
                ).join(", ");
                const hasPR = ex.sets.some(s => s.isPersonalRecord);
                return (
                  <p key={i} className="text-[13px] text-dim">
                    <span className="font-semibold text-text">{exercise?.name || ex.exerciseId}</span> — {setsStr} {hasPR ? "🏆" : ""}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ROUTINE SETUP FLOW */}
      {view === "routineSetup" && (
        <RoutineSetupFlow
          templates={templates}
          weekPlan={weekPlan}
          onAdoptSplit={adoptSplit}
          onAssignDefault={assignDefaultToDay}
          onUpdateTemplates={persistTemplates}
          onUpdateWeek={persistWeek}
          onBack={() => setView("calendar")}
        />
      )}

      {/* DAY EDITOR */}
      {view === "editDay" && editingDay && (
        <DayEditorView
          day={editingDay}
          template={getTemplate(editingDay)}
          weekPlan={weekPlan}
          templates={templates}
          isTodayOnlyEdit={editingTodayOnly}
          onChangeDay={setEditingDay}
          onUpdateTemplate={(t) => persistTemplates(templates.map(x => x.id === t.id ? t : x))}
          onUpdateTemplates={persistTemplates}
          onUpdateWeek={persistWeek}
          onBack={() => {
            setView("calendar");
            setEditingDay(null);
            setEditingTodayOnly(false);
          }}
          onSaveTodayOnly={(exercises) => {
            setTodayOverride(exercises);
            setView("calendar");
            setEditingDay(null);
            setEditingTodayOnly(false);
          }}
          onCreateTemplate={(tmpl) => {
            persistTemplates([...templates, tmpl]);
            persistWeek({ ...weekPlan, [editingDay]: tmpl.id });
          }}
          onAssignDefault={assignDefaultToDay}
        />
      )}

      {/* STATS VIEW */}
      {view === "stats" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-text">📊 Stats</h2>
            <button onClick={() => setView("calendar")} className="text-[13px] text-accent font-semibold hover:underline">← Back</button>
          </div>
          <StatsView workoutLog={workoutLog} prs={prs} streak={getStreak()} settings={settings} />
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === "calendar" && (
        <>
          {/* Monthly Calendar */}
          <MonthlyCalendar
            month={calMonth}
            year={calYear}
            workoutLog={workoutLog}
            weekPlan={weekPlan}
            templates={templates}
            activeWorkout={activeWorkout}
            onPrevMonth={() => {
              if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
              else setCalMonth(m => m - 1);
            }}
            onNextMonth={() => {
              if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
              else setCalMonth(m => m + 1);
            }}
            onTapDay={(dateStr) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tapped = new Date(dateStr + "T00:00:00");
              if (tapped > today) return; // future: no action (preview handled inline)
              const hasCompleted = workoutLog.some(w => w.completedAt?.startsWith(dateStr));
              if (hasCompleted) setPastWorkoutDate(dateStr);
              // if today, scroll to today section (handled by page focus)
            }}
          />

          {/* Legend + Streak */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3 text-[11px] text-dim">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> completed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-accent" /> planned</span>
            </div>
            {getStreak() > 0 && (
              <span className="text-[12px] font-semibold text-text">🔥 {getStreak()}-day streak</span>
            )}
          </div>

          {/* TODAY'S WORKOUT CARD */}
          <TodayWorkoutCard
            todayTemplate={todayTemplate}
            todayOverride={todayOverride}
            weekPlan={weekPlan}
            templates={templates}
            onStartWorkout={() => {
              if (todayOverride && todayTemplate) {
                startWorkout(todayOverride, todayTemplate.name, todayTemplate.id);
              } else if (todayTemplate) {
                startFromTemplate(todayTemplate);
              } else {
                startWorkout([], `Workout — ${new Date().toLocaleDateString()}`);
              }
            }}
            onEditTodayOnly={() => {
              if (todayTemplate) {
                setEditingDay(todayDay);
                setEditingTodayOnly(true);
                setView("editDay");
              }
            }}
            onEditRoutineDay={() => {
              setEditingDay(todayDay);
              setEditingTodayOnly(false);
              setView("editDay");
            }}
            onEditFullRoutine={() => setView("routineSetup")}
            onSwitchSplit={() => setView("routineSetup")}
            onQuickStart={quickStart}
            onAddOneTimeWorkout={quickStart}
          />

          {/* THIS WEEK STRIP */}
          {hasRoutine && (
            <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">This Week</p>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {DAYS_META.map(d => {
                  const tmpl = getTemplate(d.key);
                  const isToday = d.key === todayDay;
                  const dateForDay = getDateForDayOfWeek(d.key);
                  const completed = dateForDay ? workoutLog.some(w => w.completedAt?.startsWith(dateForDay)) : false;
                  return (
                    <div key={d.key} className={`rounded-lg py-1.5 px-0.5 ${isToday ? "bg-accent/10 ring-1 ring-accent/30" : ""}`}>
                      <p className={`text-[10px] font-bold ${isToday ? "text-accent" : "text-muted"}`}>{d.letter}</p>
                      <p className="text-[9px] mt-0.5">
                        {completed ? <span className="text-accent font-bold">●</span> :
                         tmpl ? <span className="text-muted">○</span> :
                         <span className="text-border-light">–</span>}
                      </p>
                      <p className="text-[8px] text-dim truncate mt-0.5 leading-tight">{tmpl ? shortenName(tmpl.name) : "Rest"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex gap-3">
            {hasRoutine ? (
              <button onClick={() => setView("routineSetup")} className="flex-1 py-3 rounded-xl border border-border text-[13px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">
                ✏️ Edit My Routine
              </button>
            ) : (
              <button onClick={() => setView("routineSetup")} className="flex-1 py-3 rounded-xl bg-accent text-white text-[14px] font-semibold hover:bg-accent/90 transition-colors">
                💪 Create Your Routine
              </button>
            )}
            <button onClick={() => setView("stats")} className="py-3 px-5 rounded-xl border border-border text-[13px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">
              📊
            </button>
          </div>

          {/* Quick Starts (if no routine) */}
          {!hasRoutine && (
            <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
              <h3 className="text-[13px] font-bold text-text mb-3">Quick Start — No Routine Needed</h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_START_IDS.slice(0, 8).map(id => {
                  const s = SPLIT_TEMPLATES.find(t => t.id === id);
                  if (!s) return null;
                  return (
                    <button key={id} onClick={() => quickStart(id)} className="text-left p-3 rounded-xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
                      <p className="text-[12px] font-semibold text-text truncate">{s.days[0].emoji} {s.days[0].name}</p>
                      <p className="text-[10px] text-muted">{s.days[0].exercises.length} exercises</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Get date string for a given day of current week ─────────
function getDateForDayOfWeek(day: DayOfWeek): string | null {
  const now = new Date();
  const currentDow = now.getDay(); // 0=Sun
  const targetDow = DOW_NAMES.indexOf(day);
  if (targetDow < 0) return null;
  // Monday-based week
  const mondayOffset = currentDow === 0 ? -6 : 1 - currentDow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const targetDate = new Date(monday);
  const dayIndex = DAYS_META.findIndex(d => d.key === day);
  targetDate.setDate(monday.getDate() + dayIndex);
  return targetDate.toISOString().split("T")[0];
}

// ══════════════════════════════════════════════════════════════
// MONTHLY CALENDAR
// ══════════════════════════════════════════════════════════════
function MonthlyCalendar({
  month, year, workoutLog, weekPlan, templates, activeWorkout,
  onPrevMonth, onNextMonth, onTapDay,
}: {
  month: number; year: number;
  workoutLog: WorkoutSession[];
  weekPlan: WeekPlan; templates: DayTemplate[];
  activeWorkout: WorkoutSession | null;
  onPrevMonth: () => void; onNextMonth: () => void;
  onTapDay: (dateStr: string) => void;
}) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 0=Sun

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Build calendar cells
  const cells: { date: number | null; dateStr: string }[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ date: null, dateStr: "" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: d, dateStr });
  }

  // Check if a day of week has a planned workout
  const dowHasWorkout = (dow: number): boolean => {
    const dayName = DOW_NAMES[dow];
    if (!dayName) return false;
    const tid = weekPlan[dayName as DayOfWeek];
    return tid ? templates.some(t => t.id === tid) : false;
  };

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-sage text-muted text-[16px]">◀</button>
        <h2 className="font-display text-lg text-text font-bold">{monthNames[month]} {year}</h2>
        <button onClick={onNextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-sage text-muted text-[16px]">▶</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW_SHORT.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-muted uppercase">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={`empty-${i}`} />;
          const cellDate = new Date(cell.dateStr + "T00:00:00");
          const isToday = cell.dateStr === todayStr;
          const isPast = cellDate < today;
          const isFuture = cellDate > today;
          const completed = workoutLog.some(w => w.completedAt?.startsWith(cell.dateStr));
          const todayActive = isToday && !!activeWorkout;
          const dow = cellDate.getDay();
          const planned = dowHasWorkout(dow);
          const missedPlan = isPast && planned && !completed;

          return (
            <button
              key={cell.dateStr}
              onClick={() => onTapDay(cell.dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-[13px] transition-colors ${
                isToday ? "bg-accent text-white font-bold" :
                completed ? "bg-accent/10 text-text font-semibold" :
                isFuture && planned ? "bg-accent/5 text-text" :
                "text-dim hover:bg-surface-sage"
              }`}
            >
              <span>{cell.date}</span>
              {/* Dots */}
              <span className="absolute bottom-0.5 text-[8px] leading-none">
                {(completed || todayActive) ? <span className="text-accent">●</span> :
                 missedPlan ? <span className="text-muted">○</span> :
                 null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TODAY'S WORKOUT CARD
// ══════════════════════════════════════════════════════════════
function TodayWorkoutCard({
  todayTemplate, todayOverride, weekPlan, templates,
  onStartWorkout, onEditTodayOnly, onEditRoutineDay, onEditFullRoutine, onSwitchSplit,
  onQuickStart, onAddOneTimeWorkout,
}: {
  todayTemplate: DayTemplate | null;
  todayOverride: PlannedExercise[] | null;
  weekPlan: WeekPlan; templates: DayTemplate[];
  onStartWorkout: () => void;
  onEditTodayOnly: () => void;
  onEditRoutineDay: () => void;
  onEditFullRoutine: () => void;
  onSwitchSplit: () => void;
  onQuickStart: (id: string) => void;
  onAddOneTimeWorkout: (id: string) => void;
}) {
  const [showRoutineMenu, setShowRoutineMenu] = useState(false);
  const [showOneTimeMenu, setShowOneTimeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setShowRoutineMenu(false));

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const exercises = todayOverride || todayTemplate?.exercises || [];
  const exerciseNames = exercises.slice(0, 7).map(e => {
    const ex = getExerciseById(e.exerciseId);
    return ex?.name.split(" ").slice(0, 2).join(" ") || "?";
  }).join(" · ");

  // REST DAY
  if (!todayTemplate && !todayOverride) {
    return (
      <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">TODAY: {dayName}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[32px]">😴</span>
          <div>
            <p className="text-[15px] font-bold text-text">Rest Day</p>
            <p className="text-[12px] text-muted">Recover and recharge</p>
          </div>
        </div>
        <button
          onClick={() => setShowOneTimeMenu(!showOneTimeMenu)}
          className="mt-4 w-full py-2.5 rounded-xl border border-border text-[13px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add a Workout Anyway
        </button>
        {showOneTimeMenu && (
          <div className="mt-2 bg-surface rounded-xl border border-border-light shadow-lg p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">Quick Pick</p>
            <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
              {QUICK_START_IDS.map(id => {
                const s = SPLIT_TEMPLATES.find(t => t.id === id);
                if (!s) return null;
                return (
                  <button key={id} onClick={() => { onAddOneTimeWorkout(id); setShowOneTimeMenu(false); }}
                    className="text-left p-2 rounded-lg border border-border-light hover:border-accent hover:bg-accent/5 text-[11px] font-medium text-text transition-colors">
                    {s.days[0].emoji} {s.days[0].name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // WORKOUT DAY
  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">TODAY: {dayName}</p>

      {todayOverride && (
        <div className="bg-hp-blue/10 rounded-lg px-3 py-1.5 mb-3">
          <p className="text-[11px] text-hp-blue font-medium">ℹ️ Edited for today only. Your routine stays the same for next week.</p>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[16px] font-bold text-text">
            {todayTemplate?.emoji || "🏋️"} {todayTemplate?.name || "Workout"}
          </p>
          <p className="text-[12px] text-muted mt-0.5">{exercises.length} exercises</p>
        </div>
      </div>

      {exerciseNames && (
        <p className="text-[12px] text-dim mt-2 leading-relaxed">{exerciseNames}{exercises.length > 7 ? ` +${exercises.length - 7} more` : ""}</p>
      )}

      <button
        onClick={onStartWorkout}
        className="mt-4 w-full py-3 bg-accent text-white rounded-xl font-semibold text-[14px] hover:bg-accent/90 transition-colors"
      >
        Start Workout
      </button>

      <div className="flex gap-2 mt-2">
        {todayTemplate && (
          <button onClick={onEditTodayOnly} className="flex-1 py-2 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">
            Edit Today Only
          </button>
        )}
        <div className="relative flex-1" ref={menuRef}>
          <button onClick={() => setShowRoutineMenu(!showRoutineMenu)} className="w-full py-2 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">
            Edit Routine ⋯
          </button>
          {showRoutineMenu && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface rounded-xl border border-border-light shadow-lg py-1">
              <button onClick={() => { setShowRoutineMenu(false); onEditRoutineDay(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">✏️ Edit {new Date().toLocaleDateString("en-US", { weekday: "long" })}&apos;s Routine</button>
              <button onClick={() => { setShowRoutineMenu(false); onEditFullRoutine(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">📋 Edit Full Weekly Routine</button>
              <button onClick={() => { setShowRoutineMenu(false); onSwitchSplit(); }} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">🔄 Switch to a Different Split</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROUTINE SETUP FLOW
// ══════════════════════════════════════════════════════════════
function RoutineSetupFlow({
  templates, weekPlan, onAdoptSplit, onAssignDefault, onUpdateTemplates, onUpdateWeek, onBack,
}: {
  templates: DayTemplate[];
  weekPlan: WeekPlan;
  onAdoptSplit: (splitId: string) => void;
  onAssignDefault: (day: DayOfWeek, splitId: string) => void;
  onUpdateTemplates: (t: DayTemplate[]) => void;
  onUpdateWeek: (w: WeekPlan) => void;
  onBack: () => void;
}) {
  const hasRoutine = templates.length > 0;
  const [step, setStep] = useState<"choose" | "pickDefaults" | "buildOwn" | "customize">(hasRoutine ? "customize" : "choose");
  const [daysFilter, setDaysFilter] = useState(4);
  const [selectedSplit, setSelectedSplit] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [showAllSplits, setShowAllSplits] = useState(false);
  const [levelFilter, setLevelFilter] = useState<SplitLevel | "all">("all");
  const [buildDayMenu, setBuildDayMenu] = useState<DayOfWeek | null>(null);

  const getTemplate = (day: DayOfWeek) => {
    const tid = weekPlan[day];
    return tid ? templates.find(t => t.id === tid) ?? null : null;
  };

  const updateTemplate = (updated: DayTemplate) => {
    onUpdateTemplates(templates.map(t => t.id === updated.id ? updated : t));
  };

  // Step 1: Choose path
  if (step === "choose") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-text">💪 Create Your Workout Routine</h2>
          <button onClick={onBack} className="text-[12px] text-muted hover:text-text">✕</button>
        </div>
        <p className="text-[13px] text-muted">How do you want to set up your week?</p>

        <button onClick={() => setStep("pickDefaults")} className="w-full text-left p-5 rounded-2xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
          <p className="text-[15px] font-bold text-text">📥 Pick from Defaults</p>
          <p className="text-[12px] text-muted mt-1">Choose a pre-built split and customize it</p>
        </button>

        <button onClick={() => setStep("buildOwn")} className="w-full text-left p-5 rounded-2xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
          <p className="text-[15px] font-bold text-text">🛠 Build My Own</p>
          <p className="text-[12px] text-muted mt-1">Start from scratch and pick exercises for each day</p>
        </button>
      </div>
    );
  }

  // Step 2A: Pick from Defaults
  if (step === "pickDefaults") {
    const filtered = SPLIT_TEMPLATES.filter(s => {
      if (QUICK_START_IDS.includes(s.id as typeof QUICK_START_IDS[number])) return false;
      const matchDays = s.daysPerWeek === daysFilter;
      const matchLevel = levelFilter === "all" || s.level === levelFilter || s.level === "all";
      return (showAllSplits || matchDays) && matchLevel;
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-text">📥 Pick a Split</h2>
          <button onClick={() => setStep("choose")} className="text-[13px] text-accent font-semibold hover:underline">← Back</button>
        </div>

        <div>
          <p className="text-[13px] text-muted mb-2">How many days per week can you train?</p>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(d => (
              <button key={d} onClick={() => { setDaysFilter(d); setShowAllSplits(false); }}
                className={`flex-1 py-2 rounded-xl text-center text-[14px] font-bold transition-colors ${daysFilter === d && !showAllSplits ? "bg-accent text-white" : "border border-border-light text-text hover:border-accent"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(["all", "beginner", "intermediate", "advanced"] as const).map(lvl => (
            <button key={lvl} onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize whitespace-nowrap transition-colors ${levelFilter === lvl ? "bg-accent text-white" : "bg-surface-sage text-muted hover:text-text"}`}>
              {lvl === "all" ? "All Levels" : lvl}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 && <p className="text-[12px] text-muted py-4 text-center">No splits found for this combination</p>}
          {filtered.map(s => (
            <button key={s.id} onClick={() => { onAdoptSplit(s.id); setStep("customize"); }}
              className="w-full text-left p-4 rounded-xl border border-border-light hover:border-accent hover:bg-accent/5 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-text">{s.name}</p>
                  <p className="text-[12px] text-muted mt-0.5">{s.description}</p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[11px] text-accent font-semibold">{s.daysPerWeek} days/week</span>
                    <span className="text-[11px] text-dim">{s.days.map(d => d.name.split(" ").slice(0, 2).join(" ")).join(" • ")}</span>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${LEVEL_COLORS[s.level]}`}>{s.level}</span>
              </div>
            </button>
          ))}
        </div>
        {!showAllSplits && (
          <button onClick={() => setShowAllSplits(true)} className="text-[12px] text-accent font-semibold hover:underline">Show all splits →</button>
        )}
      </div>
    );
  }

  // Step 2C: Build My Own
  if (step === "buildOwn") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-text">🛠 Build Your Week</h2>
          <button onClick={() => setStep("choose")} className="text-[13px] text-accent font-semibold hover:underline">← Back</button>
        </div>
        <p className="text-[13px] text-muted">Tap a day to assign a workout:</p>

        <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
          {DAYS_META.map(d => {
            const tmpl = getTemplate(d.key);
            return (
              <div key={d.key} className="border-b border-border-light last:border-b-0">
                <button onClick={() => setBuildDayMenu(buildDayMenu === d.key ? null : d.key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-sage/30 transition-colors">
                  <span className="text-[12px] font-bold text-muted w-9">{d.short}</span>
                  {tmpl ? (
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-text truncate">{tmpl.emoji} {tmpl.name}</p>
                      <p className="text-[11px] text-dim">{tmpl.exercises.length} exercises</p>
                    </div>
                  ) : (
                    <p className="flex-1 text-[13px] text-muted">+ Tap to assign</p>
                  )}
                </button>
                {buildDayMenu === d.key && (
                  <div className="px-4 pb-3 bg-surface-sage/20 border-t border-border-light">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted py-2">What&apos;s {d.label}?</p>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {QUICK_START_IDS.map(id => {
                        const s = SPLIT_TEMPLATES.find(t => t.id === id);
                        if (!s) return null;
                        return (
                          <button key={id} onClick={() => { onAssignDefault(d.key, id); setBuildDayMenu(null); }}
                            className="p-2 rounded-lg border border-border-light hover:border-accent hover:bg-accent/5 text-[10px] font-medium text-text transition-colors text-center">
                            {s.days[0].emoji} {s.days[0].name.replace("Quick ", "")}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => { onUpdateWeek({ ...weekPlan, [d.key]: null }); setBuildDayMenu(null); }}
                      className="text-[11px] text-muted hover:text-text">😴 Rest Day</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("customize")} className="flex-1 py-3 rounded-xl bg-accent text-white text-[14px] font-semibold hover:bg-accent/90 transition-colors">
            Save Routine →
          </button>
          <button onClick={onBack} className="py-3 px-4 rounded-xl border border-border text-[12px] text-muted hover:text-text">Cancel</button>
        </div>
      </div>
    );
  }

  // Step 2B / Customize (also the edit mode for existing routines)
  if (editingDay) {
    const tmpl = getTemplate(editingDay);
    return (
      <DayEditorView
        day={editingDay}
        template={tmpl}
        weekPlan={weekPlan}
        templates={templates}
        isTodayOnlyEdit={false}
        onChangeDay={setEditingDay}
        onUpdateTemplate={updateTemplate}
        onUpdateTemplates={onUpdateTemplates}
        onUpdateWeek={onUpdateWeek}
        onBack={() => setEditingDay(null)}
        onSaveTodayOnly={() => {}}
        onCreateTemplate={(tmpl) => {
          onUpdateTemplates([...templates, tmpl]);
          onUpdateWeek({ ...weekPlan, [editingDay]: tmpl.id });
        }}
        onAssignDefault={onAssignDefault}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-text">
          ✏️ {hasRoutine ? "Edit Your Routine" : "Customize Your Week"}
        </h2>
        <button onClick={onBack} className="px-3 py-1.5 bg-accent text-white rounded-full text-[12px] font-semibold hover:bg-accent/90">Save</button>
      </div>
      {weekPlan.splitName && <p className="text-[12px] text-muted">{weekPlan.splitName}</p>}
      <p className="text-[11px] text-dim">Changes will apply to all future workouts.</p>

      {/* Day Picker Strip */}
      <div className="flex justify-between bg-surface rounded-xl border border-border-light p-1.5">
        {DAYS_META.map(d => {
          const hasTmpl = !!weekPlan[d.key];
          return (
            <button key={d.key} onClick={() => setEditingDay(d.key)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${hasTmpl ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-sage"}`}>
              {d.letter}
            </button>
          );
        })}
      </div>

      {/* Weekly Overview */}
      <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
        {DAYS_META.map(d => {
          const tmpl = getTemplate(d.key);
          const isToday = d.key === getTodayDayOfWeek();
          const exercisePreview = tmpl ? tmpl.exercises.slice(0, 5).map(e => getExerciseById(e.exerciseId)?.name.split(" ").slice(0, 2).join(" ") || "?").join(" · ") : "";
          return (
            <button key={d.key} onClick={() => setEditingDay(d.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border-light last:border-b-0 text-left transition-colors hover:bg-surface-sage/30 ${isToday ? "bg-accent/5" : ""}`}>
              <span className={`text-[12px] font-bold w-9 ${isToday ? "text-accent" : "text-muted"}`}>{d.short}</span>
              {tmpl ? (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-text truncate">{tmpl.emoji} {tmpl.name}</p>
                    <span className="text-[11px] text-muted ml-2 shrink-0">{tmpl.exercises.length} ex</span>
                  </div>
                  {exercisePreview && <p className="text-[11px] text-dim truncate mt-0.5">{exercisePreview}</p>}
                </div>
              ) : (
                <p className="flex-1 text-[13px] text-muted">😴 Rest Day</p>
              )}
              <span className="text-muted text-[11px]">›</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-dim text-center">Tap any day to edit its exercises. Tap [Save] when done.</p>

      <div className="flex gap-2">
        <button onClick={() => setStep("pickDefaults")} className="flex-1 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">📥 Load Different Split</button>
        <button onClick={() => {
          if (confirm("Clear all workouts from your week?")) {
            onUpdateWeek({ monday: null, tuesday: null, wednesday: null, thursday: null, friday: null, saturday: null, sunday: null });
          }
        }} className="py-2.5 px-4 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-hp-red hover:text-hp-red transition-colors">📊</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DAY EDITOR VIEW
// ══════════════════════════════════════════════════════════════
function DayEditorView({
  day, template, weekPlan, templates, isTodayOnlyEdit,
  onChangeDay, onUpdateTemplate, onUpdateTemplates, onUpdateWeek,
  onBack, onSaveTodayOnly, onCreateTemplate, onAssignDefault,
}: {
  day: DayOfWeek;
  template: DayTemplate | null;
  weekPlan: WeekPlan;
  templates: DayTemplate[];
  isTodayOnlyEdit: boolean;
  onChangeDay: (d: DayOfWeek) => void;
  onUpdateTemplate: (t: DayTemplate) => void;
  onUpdateTemplates: (t: DayTemplate[]) => void;
  onUpdateWeek: (w: WeekPlan) => void;
  onBack: () => void;
  onSaveTodayOnly: (exercises: PlannedExercise[]) => void;
  onCreateTemplate: (t: DayTemplate) => void;
  onAssignDefault: (day: DayOfWeek, splitId: string) => void;
}) {
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);
  const [editingExIdx, setEditingExIdx] = useState<number | null>(null);
  const [replacingExIdx, setReplacingExIdx] = useState<number | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(template?.name || "");
  const [showLoadDefault, setShowLoadDefault] = useState(false);
  // For today-only edits, work on a deep copy so mutations don't leak to template
  const deepCopyExercises = (exs: PlannedExercise[]) => exs.map(e => ({ ...e }));
  const [localExercises, setLocalExercises] = useState<PlannedExercise[]>(() => deepCopyExercises(template?.exercises || []));

  // Reset all UI state when switching days
  useEffect(() => {
    setOpenMenuIdx(null);
    setEditingExIdx(null);
    setReplacingExIdx(null);
    setShowAddExercise(false);
    setIsRenaming(false);
    setShowLoadDefault(false);
    setLocalExercises(deepCopyExercises(template?.exercises || []));
    setRenameValue(template?.name || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  // Sync local exercises from template changes — but NEVER in today-only mode
  // (today-only mode owns its own localExercises; template sync would revert edits)
  const templateExJson = JSON.stringify(template?.exercises || []);
  useEffect(() => {
    if (!isTodayOnlyEdit) {
      setLocalExercises(deepCopyExercises(template?.exercises || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateExJson]);

  const dayInfo = DAYS_META.find(d => d.key === day)!;

  // Choose which exercises array to display/edit
  const exercises = isTodayOnlyEdit ? localExercises : (template?.exercises || []);

  const ensureTemplate = (): DayTemplate => {
    if (template) return template;
    const blank: DayTemplate = {
      id: generateId(), name: dayInfo.label + " Workout", emoji: "🏋️", assignedDays: [],
      exercises: [], estimatedDuration: 0, notes: "", createdAt: new Date().toISOString(),
    };
    onCreateTemplate(blank);
    return blank;
  };

  const doUpdate = (newExercises: PlannedExercise[]) => {
    if (isTodayOnlyEdit) {
      setLocalExercises(newExercises);
    } else if (template) {
      onUpdateTemplate({ ...template, exercises: newExercises, estimatedDuration: newExercises.length * 7 });
    }
  };

  const moveExercise = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= exercises.length) return;
    const arr = deepCopyExercises(exercises);
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    arr.forEach((e, i) => e.order = i);
    doUpdate(arr);
  };

  const removeExercise = (idx: number) => {
    const arr = deepCopyExercises(exercises.filter((_, i) => i !== idx));
    arr.forEach((e, i) => e.order = i);
    doUpdate(arr);
    setOpenMenuIdx(null);
  };

  const updateExercise = (idx: number, updates: Partial<PlannedExercise>) => {
    const arr = [...exercises];
    arr[idx] = { ...arr[idx], ...updates };
    doUpdate(arr);
  };

  const replaceExercise = (idx: number, newExId: string) => {
    const arr = [...exercises];
    arr[idx] = { ...arr[idx], exerciseId: newExId };
    doUpdate(arr);
    setReplacingExIdx(null);
    setOpenMenuIdx(null);
  };

  const addExercise = (exerciseId: string) => {
    const t = template || ensureTemplate();
    const ex = getExerciseById(exerciseId);
    if (!ex) return;
    const pe: PlannedExercise = {
      exerciseId, targetSets: 3,
      targetReps: ex.tracking === "duration" ? "30s" : "10",
      restTime: getDefaultRestTime(ex.tracking), order: exercises.length,
    };
    doUpdate([...exercises, pe]);
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
        <button onClick={onBack} className="text-[13px] text-accent font-semibold hover:underline">← Back</button>
        <p className="text-[13px] font-bold text-text capitalize">{dayInfo.label}</p>
        {isTodayOnlyEdit ? (
          <button onClick={() => onSaveTodayOnly(localExercises)} className="px-3 py-1.5 bg-accent text-white rounded-full text-[12px] font-semibold">Done</button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {isTodayOnlyEdit && (
        <div className="bg-hp-blue/10 rounded-lg px-3 py-2">
          <p className="text-[11px] text-hp-blue font-medium">ℹ️ Editing today only. Your {dayInfo.label} routine stays the same for next week.</p>
        </div>
      )}

      {/* Day Picker Strip */}
      {!isTodayOnlyEdit && (
        <div className="flex justify-between bg-surface rounded-xl border border-border-light p-1.5">
          {DAYS_META.map(d => {
            const isActive = d.key === day;
            const hasTmpl = !!weekPlan[d.key];
            return (
              <button key={d.key} onClick={() => onChangeDay(d.key)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                  isActive ? "bg-accent text-white" : hasTmpl ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-sage"
                }`}>
                {d.letter}
              </button>
            );
          })}
        </div>
      )}

      {/* Workout Name */}
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
                <p className="text-[12px] text-muted mt-0.5">{exercises.length} exercises · ~{exercises.length * 7} min</p>
              </div>
              {!isTodayOnlyEdit && (
                <button onClick={() => { setRenameValue(template.name); setIsRenaming(true); }} className="text-[11px] text-muted hover:text-accent">✏️ Rename</button>
              )}
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
      {exercises.length > 0 && (
        <div className="space-y-1">
          {exercises.map((pe, i) => {
            const ex = getExerciseById(pe.exerciseId);
            if (!ex) return null;
            const isEditing = editingExIdx === i;
            const isReplacing = replacingExIdx === i;
            const isMenuOpen = openMenuIdx === i;

            return (
              <div key={`${pe.exerciseId}-${i}`} className="bg-surface rounded-xl border border-border-light shadow-sm">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveExercise(i, -1)} disabled={i === 0} className="text-[9px] text-muted hover:text-accent disabled:opacity-20 leading-none">▲</button>
                    <button onClick={() => moveExercise(i, 1)} disabled={i === exercises.length - 1} className="text-[9px] text-muted hover:text-accent disabled:opacity-20 leading-none">▼</button>
                  </div>
                  <span className="text-[11px] text-muted font-bold w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text truncate">{ex.name}</p>
                    <p className="text-[11px] text-dim">{pe.targetSets} × {pe.targetReps}{pe.targetWeight ? ` @ ${pe.targetWeight} lbs` : ""}{pe.notes ? " · 📝" : ""}</p>
                  </div>
                  {/* Three-dot menu with click-outside fix */}
                  <ExerciseOverflowMenu
                    isOpen={isMenuOpen}
                    onToggle={() => { setOpenMenuIdx(isMenuOpen ? null : i); setEditingExIdx(null); setReplacingExIdx(null); }}
                    onClose={() => setOpenMenuIdx(null)}
                    onEdit={() => { setEditingExIdx(isEditing ? null : i); setReplacingExIdx(null); setOpenMenuIdx(null); }}
                    onReplace={() => { setReplacingExIdx(isReplacing ? null : i); setEditingExIdx(null); setOpenMenuIdx(null); }}
                    onRemove={() => removeExercise(i)}
                    onAddNote={() => {
                      const note = prompt("Exercise note:", pe.notes || "");
                      if (note !== null) updateExercise(i, { notes: note || undefined });
                      setOpenMenuIdx(null);
                    }}
                    onSetRest={() => {
                      const rest = prompt("Rest time (seconds):", String(pe.restTime));
                      if (rest) updateExercise(i, { restTime: parseInt(rest) || 60 });
                      setOpenMenuIdx(null);
                    }}
                    onMoveUp={i > 0 ? () => { moveExercise(i, -1); setOpenMenuIdx(null); } : undefined}
                    onMoveDown={i < exercises.length - 1 ? () => { moveExercise(i, 1); setOpenMenuIdx(null); } : undefined}
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

      {/* Add Exercise / Load Default */}
      {showAddExercise ? (
        <ExerciseSearchPanel onSelect={addExercise} onClose={() => setShowAddExercise(false)} />
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setShowAddExercise(true)} className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">+ Add Exercise</button>
          {!isTodayOnlyEdit && (
            <button onClick={() => setShowLoadDefault(true)} className="flex-1 py-2.5 rounded-xl border border-border text-[12px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">📥 Load Default</button>
          )}
        </div>
      )}

      {showLoadDefault && (
        <LoadDefaultPanel day={day} onSelect={(splitId) => { onAssignDefault(day, splitId); setShowLoadDefault(false); }} onClose={() => setShowLoadDefault(false)} />
      )}

      {/* Day Operations */}
      {!isTodayOnlyEdit && (
        <div className="bg-surface rounded-xl border border-border-light p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Day Options</p>
          <div className="grid grid-cols-2 gap-1.5">
            {template && (
              <button onClick={() => {
                onUpdateWeek({ ...weekPlan, [day]: null });
                onBack();
              }} className="py-2 px-3 rounded-lg border border-border-light text-[11px] font-medium text-muted hover:border-hp-red hover:text-hp-red transition-colors text-left">🗑 Clear (Rest Day)</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EXERCISE OVERFLOW MENU (fixed with click-outside)
// ══════════════════════════════════════════════════════════════
function ExerciseOverflowMenu({
  isOpen, onToggle, onClose, onEdit, onReplace, onRemove, onAddNote, onSetRest, onMoveUp, onMoveDown,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onAddNote: () => void;
  onSetRest: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  // Wrap handler to ensure menu closes and event doesn't leak
  const act = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-sage text-muted text-[13px]">⋯</button>
      {isOpen && (
        <>
          {/* Backdrop catches outside clicks — no document listeners needed */}
          <div className="fixed inset-0 z-40" onClick={act(onClose)} />
          <div className="absolute right-0 top-9 z-50 bg-surface rounded-xl border border-border-light shadow-lg py-1 w-52">
            <button onClick={act(onEdit)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">✏️ Edit Sets & Reps</button>
            <button onClick={act(onReplace)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">🔄 Replace Exercise</button>
            <button onClick={act(onAddNote)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">📝 Add Note</button>
            <button onClick={act(onSetRest)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">⏱ Set Rest Time</button>
            {onMoveUp && <button onClick={act(onMoveUp)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">⬆️ Move Up</button>}
            {onMoveDown && <button onClick={act(onMoveDown)} className="w-full text-left px-3 py-2 text-[12px] hover:bg-surface-sage">⬇️ Move Down</button>}
            <button onClick={act(onRemove)} className="w-full text-left px-3 py-2 text-[12px] text-hp-red hover:bg-surface-sage">🗑 Remove Exercise</button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EXERCISE LOG CARD (active workout)
// ══════════════════════════════════════════════════════════════
function ExerciseLogCard({
  loggedEx, exIdx, settings, previousSets, pr, targetWeight, targetSets, targetReps, onLogSet, onRemoveSet, onRemoveExercise,
}: {
  loggedEx: LoggedExercise; exIdx: number; settings: WorkoutSettings;
  previousSets: LoggedSet[]; pr?: PersonalRecord; targetWeight?: number; targetSets?: number; targetReps?: string;
  onLogSet: (set: LoggedSet) => void; onRemoveSet: (setIdx: number) => void; onRemoveExercise: () => void;
}) {
  const exercise = getExerciseById(loggedEx.exerciseId);
  const numTarget = targetSets || 3;
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [duration, setDuration] = useState("");
  const [rpe, setRpe] = useState("");
  const [rir, setRir] = useState("");
  const [setType, setSetType] = useState<LoggedSet["type"]>("working");
  const [extraSets, setExtraSets] = useState(0);

  // Auto-fill inputs from previous session (or routine targets as fallback)
  useEffect(() => {
    const nextSetIdx = loggedEx.sets.length;
    const prev = previousSets[nextSetIdx];
    if (prev) {
      if (prev.weight) setWeight(String(prev.weight));
      if (prev.reps) setReps(String(prev.reps));
      if (prev.duration) setDuration(String(prev.duration));
    } else if (nextSetIdx === 0) {
      if (targetWeight) setWeight(String(targetWeight));
      if (targetReps) {
        const ex = getExerciseById(loggedEx.exerciseId);
        const parsed = parseInt(targetReps);
        if (!isNaN(parsed)) {
          const timed = ex && (ex.tracking === "duration" || ex.tracking === "weight-duration");
          if (timed) setDuration(String(parsed));
          else setReps(String(parsed));
        }
      }
    }
  }, [loggedEx.sets.length, loggedEx.exerciseId, previousSets, targetWeight, targetReps]);

  if (!exercise) return null;

  const isWeightReps = ["weight-reps", "weight-reps-each", "bodyweight-reps"].includes(exercise.tracking);
  const isTimed = exercise.tracking === "duration" || exercise.tracking === "weight-duration";
  const isRepsOnly = exercise.tracking === "reps-only";
  const isDistDur = exercise.tracking === "distance";
  const isCalDur = exercise.tracking === "calories-duration";
  const isRoundsReps = exercise.tracking === "rounds-reps";

  const handleAddSet = () => {
    const set: LoggedSet = {
      setNumber: loggedEx.sets.length + 1, type: setType,
      weight: weight ? parseFloat(weight) : undefined,
      reps: reps ? parseInt(reps) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      rpe: rpe ? parseFloat(rpe) : undefined,
      rir: rir ? parseInt(rir) : undefined,
      isPersonalRecord: false, completedAt: new Date().toISOString(),
    };
    onLogSet(set);
  };

  const handlePrefill = (prev: LoggedSet) => {
    if (prev.weight) setWeight(String(prev.weight));
    if (prev.reps) setReps(String(prev.reps));
    if (prev.duration) setDuration(String(prev.duration));
  };

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <div>
          <h3 className="text-[14px] font-bold text-text">{exercise.name}</h3>
          {pr && <p className="text-[11px] text-muted mt-0.5">Best: {pr.setDetails} (est. 1RM: {Math.round(pr.value)} {pr.unit})</p>}
        </div>
        <button onClick={onRemoveExercise} className="text-[11px] text-muted hover:text-hp-red transition-colors p-1">✕</button>
      </div>

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
            <div key={si} className={`grid gap-2 items-center py-1.5 border-b border-border-light/50 text-[13px] ${set.type === "warmup" ? "opacity-60" : ""} ${isOverload ? "bg-hp-green/5" : ""}`}
              style={{ gridTemplateColumns: "32px 1fr 1fr 1fr 36px" }}>
              <span className={`text-[12px] font-medium ${set.type === "dropset" ? "text-hp-orange" : "text-muted"}`}>{set.type === "warmup" ? "W" : set.type === "dropset" ? "D" : si + 1 - loggedEx.sets.filter((s, j) => j < si && (s.type === "warmup" || s.type === "dropset")).length}</span>
              <span className="text-[11px] text-dim">{prev ? `${prev.weight || "—"} × ${prev.reps || prev.duration || "—"}` : "—"}</span>
              <span className="font-semibold text-text tabular-nums">{set.weight || set.duration || "—"}</span>
              <span className="font-semibold text-text tabular-nums">{set.reps || "—"}</span>
              <div className="flex items-center gap-1">
                {set.isPersonalRecord && <span title="PR">🏆</span>}
                <button onClick={() => onRemoveSet(si)} className="text-[10px] text-muted hover:text-hp-red">✕</button>
              </div>
            </div>
          );
        })}

        {/* Input row */}
        <div className="grid gap-2 items-center py-2" style={{ gridTemplateColumns: "32px 1fr 1fr 1fr 36px" }}>
          <button onClick={() => setSetType(t => t === "working" ? "warmup" : "working")}
            className={`text-[10px] font-bold rounded px-1 py-0.5 ${setType === "warmup" ? "bg-hp-yellow/20 text-hp-yellow" : setType === "dropset" ? "bg-hp-orange/20 text-hp-orange" : "text-muted"}`}
            title={setType === "warmup" ? "Warm-up set" : setType === "dropset" ? "Drop set" : "Working set"}>
            {setType === "warmup" ? "W" : setType === "dropset" ? "D" : loggedEx.sets.filter(s => s.type !== "warmup" && s.type !== "dropset").length + 1}
          </button>
          <button onClick={() => { const prev = previousSets[loggedEx.sets.length]; if (prev) handlePrefill(prev); }}
            className="text-[11px] text-dim hover:text-accent truncate text-left" title="Tap to copy previous">
            {previousSets[loggedEx.sets.length] ? `${previousSets[loggedEx.sets.length].weight || "—"} × ${previousSets[loggedEx.sets.length].reps || previousSets[loggedEx.sets.length].duration || "—"}` : "—"}
          </button>
          {isWeightReps && (
            <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder={exercise.tracking === "bodyweight-reps" ? "+wt" : settings.units}
              className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />
          )}
          {isTimed && <input type="number" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)} placeholder="sec" className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />}
          {isDistDur && <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="dist" className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />}
          {isCalDur && <input type="number" inputMode="numeric" value={weight} onChange={e => setWeight(e.target.value)} placeholder="cal" className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />}
          {isRoundsReps && <input type="number" inputMode="numeric" value={weight} onChange={e => setWeight(e.target.value)} placeholder="rnds" className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />}
          {isRepsOnly && <span />}
          {(isWeightReps || isRepsOnly) && <input type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} placeholder="reps" className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />}
          {isTimed && <span />}
          {(isDistDur || isCalDur) && <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="mm:ss" className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center focus:border-accent focus:outline-none" />}
          {isRoundsReps && <input type="number" inputMode="numeric" value={reps} onChange={e => setReps(e.target.value)} placeholder="reps" className="w-full bg-surface-sage border border-border-light rounded-lg px-2 py-1.5 text-[13px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />}
          <button onClick={handleAddSet}
            disabled={isWeightReps ? !reps : isTimed ? !duration : (isCalDur || isDistDur) ? !weight && !duration : isRoundsReps ? !weight && !reps : !reps}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white text-[14px] font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors">
            ✓
          </button>
        </div>
      </div>

      {/* RPE / RIR */}
      {(settings.showRPE || settings.showRIR) && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border-light">
          {settings.showRPE && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">RPE</span>
              <input type="number" inputMode="decimal" min="1" max="10" step="0.5" value={rpe} onChange={e => setRpe(e.target.value)} placeholder="—"
                className="w-14 bg-surface-sage border border-border-light rounded-lg px-2 py-1 text-[12px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />
            </div>
          )}
          {settings.showRIR && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">RIR</span>
              <input type="number" inputMode="numeric" min="0" max="10" value={rir} onChange={e => setRir(e.target.value)} placeholder="—"
                className="w-14 bg-surface-sage border border-border-light rounded-lg px-2 py-1 text-[12px] text-text text-center tabular-nums focus:border-accent focus:outline-none" />
            </div>
          )}
        </div>
      )}

      {/* Upcoming set preview rows */}
      {(() => {
        const totalTarget = numTarget + extraSets;
        const remaining = Math.max(0, totalTarget - loggedEx.sets.length - 1);
        if (remaining <= 0) return null;
        return (
          <div className="px-4 pb-1">
            {Array.from({length: remaining}, (_, i) => {
              const futureIdx = loggedEx.sets.length + 1 + i;
              const prev = previousSets[futureIdx];
              return (
                <div key={`upcoming-${futureIdx}`} className="grid gap-2 items-center py-1.5 opacity-35 border-t border-border-light/30"
                  style={{gridTemplateColumns: "32px 1fr 1fr 1fr 36px"}}>
                  <span className="text-[12px] text-muted">{futureIdx + 1}</span>
                  <span className="text-[11px] text-dim">{prev ? `${prev.weight || "—"} × ${prev.reps || prev.duration || "—"}` : "—"}</span>
                  <span className="text-[12px] text-dim tabular-nums">{prev?.weight || targetWeight || "—"}</span>
                  <span className="text-[12px] text-dim tabular-nums">{prev?.reps || "—"}</span>
                  <span className="w-8 h-8 flex items-center justify-center rounded-full border border-border-light/50 text-[14px] text-muted/30">✓</span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Quick actions */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-border-light bg-surface-sage/30">
        <button onClick={() => setExtraSets(n => n + 1)} className="text-[11px] text-muted hover:text-accent font-medium">+ Set</button>
        <button onClick={() => {
          const lastSet = loggedEx.sets[loggedEx.sets.length - 1];
          setSetType("dropset");
          if (lastSet?.weight) { setWeight(String(Math.round(lastSet.weight * 0.8))); setReps(String((lastSet.reps || 8) + 4)); }
        }} className="text-[11px] text-hp-orange hover:text-hp-orange/80 font-medium">🔥 Drop Set</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADD EXERCISE PANEL
// ══════════════════════════════════════════════════════════════
function AddExercisePanel({ onAdd, recentExercises, favorites }: {
  onAdd: (exerciseId: string) => void; recentExercises: string[]; favorites: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");

  const results = query.length >= 2 ? searchExercises(query, { muscle: muscleFilter || undefined }).slice(0, 20) : [];
  const recentList = recentExercises.slice(0, 5).map(getExerciseById).filter(Boolean) as Exercise[];

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-[14px] font-semibold text-muted hover:border-accent hover:text-accent transition-colors">
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
      <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exercises..."
        className="w-full bg-surface-sage border border-border-light rounded-xl px-3 py-2.5 text-[14px] text-text placeholder:text-muted focus:border-accent focus:outline-none" />
      <div className="flex flex-wrap gap-1.5">
        {(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "core"] as MuscleGroup[]).map(m => (
          <button key={m} onClick={() => setMuscleFilter(muscleFilter === m ? "" : m)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${muscleFilter === m ? "bg-accent text-white" : "bg-surface-sage text-muted hover:text-text"}`}>
            {MUSCLE_GROUP_LABELS[m] || m}
          </button>
        ))}
      </div>
      {query.length >= 2 && (
        <div className="max-h-[300px] overflow-y-auto space-y-0.5">
          {results.length === 0 && <p className="text-[12px] text-muted py-2">No exercises found</p>}
          {results.map(ex => (
            <button key={ex.id} onClick={() => { onAdd(ex.id); setOpen(false); setQuery(""); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-sage transition-colors text-left">
              <div>
                <p className="text-[13px] font-medium text-text">{ex.name}</p>
                <p className="text-[11px] text-muted">{MUSCLE_GROUP_LABELS[ex.muscle] || ex.muscle} · {ex.category}</p>
              </div>
              <span className="text-accent text-[12px]">+</span>
            </button>
          ))}
        </div>
      )}
      {query.length < 2 && recentList.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">Recent</p>
          {recentList.map(ex => (
            <button key={ex.id} onClick={() => { onAdd(ex.id); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-sage transition-colors text-left">
              <p className="text-[13px] font-medium text-text">{ex.name}</p>
              <span className="text-accent text-[12px]">+</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REPLACE EXERCISE PANEL
// ══════════════════════════════════════════════════════════════
function ReplaceExercisePanel({ exerciseId, onSelect, onClose }: {
  exerciseId: string; onSelect: (newId: string) => void; onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "">("");
  const source = getExerciseById(exerciseId);
  const alternatives = getSmartAlternatives(exerciseId, 4);
  const searchResults = query.length >= 2 ? searchExercises(query, { muscle: muscleFilter || undefined }).filter(e => e.id !== exerciseId).slice(0, 12) : [];

  return (
    <div className="px-3 pb-3 pt-2 border-t border-border-light bg-surface-sage/20 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">🔄 Replace: {source?.name}</p>
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

// ══════════════════════════════════════════════════════════════
// EXERCISE SEARCH PANEL
// ══════════════════════════════════════════════════════════════
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
            {MUSCLE_GROUP_LABELS[m] || m}
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

// ══════════════════════════════════════════════════════════════
// LOAD DEFAULT PANEL
// ══════════════════════════════════════════════════════════════
function LoadDefaultPanel({ day, onSelect, onClose }: {
  day: DayOfWeek; onSelect: (splitId: string) => void; onClose: () => void;
}) {
  const quicks = QUICK_START_IDS.map(id => SPLIT_TEMPLATES.find(s => s.id === id)).filter(Boolean) as (typeof SPLIT_TEMPLATES)[number][];
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

// ══════════════════════════════════════════════════════════════
// STATS VIEW
// ══════════════════════════════════════════════════════════════
function StatsView({
  workoutLog, prs, streak, settings,
}: {
  workoutLog: WorkoutSession[]; prs: PersonalRecord[]; streak: number; settings: WorkoutSettings;
}) {
  const thisWeek = workoutLog.filter(w => {
    if (!w.completedAt) return false;
    const d = new Date(w.completedAt);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });
  const avgDuration = thisWeek.length > 0 ? Math.round(thisWeek.reduce((s, w) => s + w.duration, 0) / thisWeek.length) : 0;
  const weekVolume = thisWeek.reduce((s, w) => s + w.totalVolume, 0);

  const muscleVolume: Record<string, number> = {};
  for (const w of thisWeek) {
    for (const ex of w.exercises) {
      const exercise = getExerciseById(ex.exerciseId);
      if (!exercise) continue;
      const vol = ex.sets.reduce((s, set) => s + (set.type !== "warmup" && set.weight && set.reps ? set.weight * set.reps : 0), 0);
      muscleVolume[exercise.muscle] = (muscleVolume[exercise.muscle] || 0) + vol;
      for (const m of (exercise.secondary || [])) muscleVolume[m] = (muscleVolume[m] || 0) + Math.round(vol * 0.5);
    }
  }

  const recentPRs = [...prs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-4">
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

      {Object.keys(muscleVolume).length > 0 && (
        <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
          <h3 className="text-[13px] font-bold text-text mb-2">Muscle Volume This Week</h3>
          {Object.entries(muscleVolume).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([muscle, vol]) => {
            const maxVol = Math.max(...Object.values(muscleVolume));
            const pct = maxVol > 0 ? (vol / maxVol) * 100 : 0;
            return (
              <div key={muscle} className="flex items-center gap-2 py-1">
                <span className="text-[11px] text-muted w-20 flex-shrink-0 capitalize">{MUSCLE_GROUP_LABELS[muscle as MuscleGroup] || muscle}</span>
                <div className="flex-1 h-3 bg-border-light rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] text-dim tabular-nums w-16 text-right">{(vol / 1000).toFixed(1)}k {settings.units}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4">
        <h3 className="text-[13px] font-bold text-text mb-2">All-Time</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><p className="text-[20px] font-display font-bold text-text">{workoutLog.length}</p><p className="text-[11px] text-muted">Total Workouts</p></div>
          <div><p className="text-[20px] font-display font-bold text-text">{prs.length}</p><p className="text-[11px] text-muted">Personal Records</p></div>
          <div><p className="text-[20px] font-display font-bold text-text">{workoutLog.length > 0 ? Math.round(workoutLog.reduce((s, w) => s + w.duration, 0) / 60) : 0}h</p><p className="text-[11px] text-muted">Total Hours</p></div>
          <div><p className="text-[20px] font-display font-bold text-text">{(workoutLog.reduce((s, w) => s + w.totalVolume, 0) / 1000).toFixed(0)}k</p><p className="text-[11px] text-muted">Total Volume ({settings.units})</p></div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { WorkoutSession, DayTemplate, WeekPlan, LoggedExercise } from "@/lib/workoutTypes";
import {
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  generateId,
  calculateTotalVolume,
  DEFAULT_SETTINGS,
  type WorkoutSettings,
} from "@/lib/workoutTypes";
import { calculateStreak } from "@/lib/workoutUtils";
import { WeekStrip } from "./WeekStrip";
import { CollapsibleCalendar } from "./CollapsibleCalendar";
import { TodayCard } from "./TodayCard";
import { ConfirmationCard } from "./ConfirmationCard";
import { InlineDetailEditor } from "./InlineDetailEditor";
import { RecentHistory } from "./RecentHistory";
import { OnboardingFlow, type OnboardingResult } from "./OnboardingFlow";
import { RoutineEditor } from "./RoutineEditor";

const ONBOARDING_KEY = "pulse-workout-onboarding-complete";

type ActiveView =
  | { type: "main" }
  | { type: "confirmation"; workout: WorkoutSession }
  | { type: "editor"; workout: WorkoutSession }
  | { type: "routine-editor" };

export function WorkoutTrackerRedesign() {
  const [mounted, setMounted] = useState(false);
  const [log, setLog] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({
    monday: null, tuesday: null, wednesday: null, thursday: null,
    friday: null, saturday: null, sunday: null,
  });
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_SETTINGS);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>({ type: "main" });

  // ── Load from localStorage ──
  useEffect(() => {
    setLog(loadFromStorage(STORAGE_KEYS.log, []));
    setTemplates(loadFromStorage(STORAGE_KEYS.templates, []));
    setWeekPlan(loadFromStorage(STORAGE_KEYS.week, {
      monday: null, tuesday: null, wednesday: null, thursday: null,
      friday: null, saturday: null, sunday: null,
    }));
    setSettings(loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
    setOnboardingComplete(loadFromStorage(ONBOARDING_KEY, false));
    setMounted(true);
  }, []);

  // ── Persist helpers ──
  const persistLog = useCallback((newLog: WorkoutSession[]) => {
    setLog(newLog);
    saveToStorage(STORAGE_KEYS.log, newLog);
  }, []);

  const persistTemplates = useCallback((newTemplates: DayTemplate[]) => {
    setTemplates(newTemplates);
    saveToStorage(STORAGE_KEYS.templates, newTemplates);
  }, []);

  const persistWeekPlan = useCallback((newPlan: WeekPlan) => {
    setWeekPlan(newPlan);
    saveToStorage(STORAGE_KEYS.week, newPlan);
  }, []);

  // ── Streak ──
  const streak = useMemo(() => calculateStreak(log), [log]);

  // ── Quick Log ──
  const handleQuickLog = useCallback(
    (name: string, exercises: LoggedExercise[], templateId?: string) => {
      const now = new Date().toISOString();
      const session: WorkoutSession = {
        id: generateId(),
        templateId,
        name,
        startedAt: now,
        completedAt: now,
        duration: 0,
        exercises,
        notes: "",
        totalVolume: calculateTotalVolume(exercises),
      };

      const newLog = [...log, session];
      persistLog(newLog);
      setActiveView({ type: "confirmation", workout: session });
    },
    [log, persistLog]
  );

  // ── Edit Before Log ──
  const handleEditBeforeLog = useCallback(
    (template: DayTemplate) => {
      const now = new Date().toISOString();
      const session: WorkoutSession = {
        id: generateId(),
        templateId: template.id,
        name: template.name,
        startedAt: now,
        completedAt: now,
        duration: 0,
        exercises: template.exercises.map((pe) => ({
          exerciseId: pe.exerciseId,
          sets: [],
        })),
        notes: "",
        totalVolume: 0,
      };
      // Don't persist yet — let the editor handle save
      setActiveView({ type: "editor", workout: session });
    },
    []
  );

  // ── Save Edited Workout ──
  const handleSaveWorkout = useCallback(
    (updated: WorkoutSession) => {
      const exists = log.some((w) => w.id === updated.id);
      let newLog: WorkoutSession[];
      if (exists) {
        newLog = log.map((w) => (w.id === updated.id ? updated : w));
      } else {
        newLog = [...log, updated];
      }
      persistLog(newLog);
      setActiveView({ type: "main" });
    },
    [log, persistLog]
  );

  // ── Delete Workout ──
  const handleDeleteWorkout = useCallback(
    (workoutId: string) => {
      persistLog(log.filter((w) => w.id !== workoutId));
      setActiveView({ type: "main" });
    },
    [log, persistLog]
  );

  // ── Undo Quick Log ──
  const handleUndo = useCallback(
    (workoutId: string) => {
      persistLog(log.filter((w) => w.id !== workoutId));
      setActiveView({ type: "main" });
    },
    [log, persistLog]
  );

  // ── Onboarding Complete ──
  const handleOnboardingComplete = useCallback(
    (result: OnboardingResult) => {
      if (result.templates) persistTemplates(result.templates);
      if (result.weekPlan) persistWeekPlan(result.weekPlan);
      setOnboardingComplete(true);
      saveToStorage(ONBOARDING_KEY, true);
      setActiveView({ type: "main" });
    },
    [persistTemplates, persistWeekPlan]
  );

  // ── Reset Onboarding ──
  const handleResetOnboarding = useCallback(() => {
    setOnboardingComplete(false);
    saveToStorage(ONBOARDING_KEY, false);
    persistTemplates([]);
    persistWeekPlan({
      monday: null, tuesday: null, wednesday: null, thursday: null,
      friday: null, saturday: null, sunday: null,
    });
    setActiveView({ type: "main" });
  }, [persistTemplates, persistWeekPlan]);

  // ── Edit from History ──
  const handleEditFromHistory = useCallback((workout: WorkoutSession) => {
    setActiveView({ type: "editor", workout });
  }, []);

  // ── Placeholder while mounting ──
  if (!mounted) {
    return <div className="space-y-4">
      <div className="h-[60px] rounded-2xl bg-surface border border-border-light" />
      <div className="h-[200px] rounded-2xl bg-surface border border-border-light" />
    </div>;
  }

  // ── Onboarding ──
  if (!onboardingComplete) {
    return (
      <div className="space-y-4">
        <TitleBar streak={streak} onGear={() => {}} />
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // ── Routine Editor ──
  if (activeView.type === "routine-editor") {
    return (
      <div className="space-y-4">
        <TitleBar streak={streak} onGear={() => setActiveView({ type: "main" })} />
        <RoutineEditor
          templates={templates}
          weekPlan={weekPlan}
          onUpdateTemplates={persistTemplates}
          onUpdateWeekPlan={persistWeekPlan}
          onResetOnboarding={handleResetOnboarding}
          onClose={() => setActiveView({ type: "main" })}
        />
      </div>
    );
  }

  // ── Inline Editor ──
  if (activeView.type === "editor") {
    return (
      <div className="space-y-4">
        <TitleBar streak={streak} onGear={() => setActiveView({ type: "routine-editor" })} />
        <InlineDetailEditor
          workout={activeView.workout}
          log={log}
          onSave={handleSaveWorkout}
          onDelete={handleDeleteWorkout}
          onClose={() => setActiveView({ type: "main" })}
        />
      </div>
    );
  }

  // ── Main View ──
  return (
    <div className="space-y-4">
      {/* Title + Streak + Gear */}
      <TitleBar
        streak={streak}
        onGear={() => setActiveView({ type: "routine-editor" })}
      />

      {/* Week Strip */}
      <div className="rounded-2xl bg-surface border border-border-light p-3">
        <WeekStrip log={log} />
        <CollapsibleCalendar log={log} />
      </div>

      {/* Today Card or Confirmation */}
      {activeView.type === "confirmation" ? (
        <ConfirmationCard
          workout={activeView.workout}
          log={log}
          onEditDetails={(w) => setActiveView({ type: "editor", workout: w })}
          onUndo={handleUndo}
        />
      ) : (
        <TodayCard
          weekPlan={weekPlan}
          templates={templates}
          log={log}
          onQuickLog={handleQuickLog}
          onEditBeforeLog={handleEditBeforeLog}
        />
      )}

      {/* Recent History */}
      <RecentHistory log={log} onEdit={handleEditFromHistory} />
    </div>
  );
}

// ── Title Bar ──────────────────────────────────────────────

function TitleBar({ streak, onGear }: { streak: number; onGear: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-[24px] font-display font-bold text-text">Workouts</h1>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold"
            style={{ background: "#fef3e2", color: "#c4704a" }}
          >
            🔥 {streak} day{streak !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <button
        onClick={onGear}
        className="p-2 rounded-lg hover:bg-bg text-muted hover:text-text transition-colors"
        title="My Routines"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M17.4 12.1a1.5 1.5 0 00.3 1.65l.05.05a1.82 1.82 0 01-1.29 3.1 1.82 1.82 0 01-1.28-.53l-.06-.05a1.5 1.5 0 00-1.65-.3 1.5 1.5 0 00-.91 1.37v.15a1.82 1.82 0 01-3.64 0v-.08a1.5 1.5 0 00-.98-1.37 1.5 1.5 0 00-1.65.3l-.05.06a1.82 1.82 0 01-2.57-2.57l.05-.06a1.5 1.5 0 00.3-1.65 1.5 1.5 0 00-1.37-.91h-.15a1.82 1.82 0 010-3.64h.08a1.5 1.5 0 001.37-.98 1.5 1.5 0 00-.3-1.65l-.06-.05a1.82 1.82 0 012.57-2.57l.06.05a1.5 1.5 0 001.65.3h.07a1.5 1.5 0 00.91-1.37v-.15a1.82 1.82 0 013.64 0v.08a1.5 1.5 0 00.91 1.37 1.5 1.5 0 001.65-.3l.05-.06a1.82 1.82 0 012.57 2.57l-.05.06a1.5 1.5 0 00-.3 1.65v.07a1.5 1.5 0 001.37.91h.15a1.82 1.82 0 010 3.64h-.08a1.5 1.5 0 00-1.37.91z" />
        </svg>
      </button>
    </div>
  );
}

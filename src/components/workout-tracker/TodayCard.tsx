"use client";

import { useMemo } from "react";
import type { WorkoutSession, DayTemplate, WeekPlan, LoggedExercise } from "@/lib/workoutTypes";
import { getExerciseById } from "@/lib/exerciseDatabase";
import {
  getTodayTemplate,
  hasSplit,
  hasLoggedToday,
  getSmartWorkoutSuggestions,
  getMuscleCategory,
  getMuscleColor,
  formatRelativeDate,
  BODY_PART_DEFAULTS,
} from "@/lib/workoutUtils";

interface TodayCardProps {
  weekPlan: WeekPlan;
  templates: DayTemplate[];
  log: WorkoutSession[];
  onQuickLog: (name: string, exercises: LoggedExercise[], templateId?: string) => void;
  onEditBeforeLog: (template: DayTemplate) => void;
}

export function TodayCard({ weekPlan, templates, log, onQuickLog, onEditBeforeLog }: TodayCardProps) {
  const isSplit = hasSplit(weekPlan);
  const todayTemplate = useMemo(() => getTodayTemplate(weekPlan, templates), [weekPlan, templates]);
  const loggedToday = hasLoggedToday(log);

  if (isSplit && todayTemplate) {
    return (
      <SplitTodayCard
        template={todayTemplate}
        log={log}
        loggedToday={loggedToday}
        onQuickLog={onQuickLog}
        onEditBeforeLog={onEditBeforeLog}
      />
    );
  }

  if (isSplit && !todayTemplate) {
    // Rest day
    return <RestDayCard log={log} onQuickLog={onQuickLog} />;
  }

  return (
    <NoSplitTodayCard
      log={log}
      loggedToday={loggedToday}
      onQuickLog={onQuickLog}
    />
  );
}

// ── Split User: Today's Workout Card ───────────────────────

function SplitTodayCard({
  template,
  log,
  loggedToday,
  onQuickLog,
  onEditBeforeLog,
}: {
  template: DayTemplate;
  log: WorkoutSession[];
  loggedToday: boolean;
  onQuickLog: (name: string, exercises: LoggedExercise[], templateId?: string) => void;
  onEditBeforeLog: (template: DayTemplate) => void;
}) {
  const muscles = useMemo(() => {
    const set = new Set<string>();
    for (const pe of template.exercises) {
      const ex = getExerciseById(pe.exerciseId);
      if (ex) set.add(getMuscleCategory(ex.muscle));
    }
    return [...set];
  }, [template]);

  const handleQuickLog = () => {
    const exercises: LoggedExercise[] = template.exercises.map((pe) => ({
      exerciseId: pe.exerciseId,
      sets: [],
    }));
    onQuickLog(template.name, exercises, template.id);
  };

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{template.emoji}</span>
        <h3 className="text-[16px] font-bold text-text">{template.name}</h3>
      </div>

      {/* Muscle groups + exercise count */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {muscles.map((mg) => (
            <span
              key={mg}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ background: getMuscleColor(mg.toLowerCase()) }}
            >
              {mg}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-muted">{template.exercises.length} exercises</span>
      </div>

      {/* Exercise pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {template.exercises.map((pe) => {
          const ex = getExerciseById(pe.exerciseId);
          return (
            <span
              key={pe.exerciseId}
              className="text-[11px] text-dim bg-bg border border-border-light px-2.5 py-1 rounded-full"
            >
              {ex?.name ?? pe.exerciseId}
            </span>
          );
        })}
      </div>

      {/* Action button */}
      <button
        onClick={handleQuickLog}
        className="w-full py-3 rounded-xl bg-accent text-white text-[14px] font-bold hover:bg-accent/90 transition-colors btn-press"
      >
        {loggedToday ? "+ Log Another Workout" : `Log ${template.name}`}
      </button>

      {/* Edit link */}
      <button
        onClick={() => onEditBeforeLog(template)}
        className="w-full mt-2 text-center text-[12px] text-accent font-semibold hover:underline"
      >
        Edit before logging →
      </button>
    </div>
  );
}

// ── Rest Day Card ──────────────────────────────────────────

function RestDayCard({
  log,
  onQuickLog,
}: {
  log: WorkoutSession[];
  onQuickLog: (name: string, exercises: LoggedExercise[], templateId?: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border-light p-5 text-center">
      <span className="text-2xl">😴</span>
      <h3 className="text-[16px] font-bold text-text mt-2">Rest Day</h3>
      <p className="text-[12px] text-dim mt-1 mb-4">No workout scheduled. Recovery is part of the plan.</p>
      <button
        onClick={() => onQuickLog("Bonus Workout", [], undefined)}
        className="text-[12px] text-accent font-semibold hover:underline"
      >
        Log a workout anyway →
      </button>
    </div>
  );
}

// ── No-Split User: What Did You Hit Today? ─────────────────

function NoSplitTodayCard({
  log,
  loggedToday,
  onQuickLog,
}: {
  log: WorkoutSession[];
  loggedToday: boolean;
  onQuickLog: (name: string, exercises: LoggedExercise[], templateId?: string) => void;
}) {
  const suggestions = useMemo(() => getSmartWorkoutSuggestions(log), [log]);

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-5">
      <h3 className="text-[16px] font-bold text-text mb-3">
        {loggedToday ? "Log another workout" : "What did you hit today?"}
      </h3>

      {/* Smart suggestions from history */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">Your Workouts</p>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => onQuickLog(s.name, s.exercises, s.templateId)}
                className="text-left p-3 rounded-xl border border-border-light bg-bg/50 hover:bg-bg hover:border-accent/20 transition-all group"
              >
                <span className="text-[13px] font-semibold text-text group-hover:text-accent transition-colors block truncate">
                  {s.name}
                </span>
                {/* Muscle dots */}
                <div className="flex gap-1 mt-1.5 mb-1">
                  {s.muscleGroups.slice(0, 3).map((mg) => (
                    <span
                      key={mg}
                      className="w-[5px] h-[5px] rounded-full"
                      style={{ background: getMuscleColor(mg.toLowerCase()) }}
                    />
                  ))}
                </div>
                {s.lastDate && (
                  <span className="text-[10px] text-muted">
                    Last: {formatRelativeDate(s.lastDate)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body part defaults */}
      <div>
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2">All Workouts</p>
        <div className="flex flex-wrap gap-1.5">
          {BODY_PART_DEFAULTS.map((bp) => (
            <button
              key={bp.name}
              onClick={() => onQuickLog(bp.name, [], undefined)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-light text-[12px] font-semibold text-dim hover:text-accent hover:border-accent/20 hover:bg-accent-bg/50 transition-all"
            >
              <span>{bp.emoji}</span>
              {bp.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

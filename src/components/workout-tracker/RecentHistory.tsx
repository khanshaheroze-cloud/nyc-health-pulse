"use client";

import { useMemo } from "react";
import type { WorkoutSession } from "@/lib/workoutTypes";
import { getExerciseById } from "@/lib/exerciseDatabase";
import { formatRelativeDate, getMuscleCategory, getMuscleColor, toLocalDateStr } from "@/lib/workoutUtils";

interface RecentHistoryProps {
  log: WorkoutSession[];
  onEdit: (workout: WorkoutSession) => void;
  limit?: number;
}

export function RecentHistory({ log, onEdit, limit = 10 }: RecentHistoryProps) {
  const recent = useMemo(() => {
    return [...log]
      .filter((w) => w.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, limit);
  }, [log, limit]);

  if (recent.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-2 px-1">
        Recent History
      </p>
      <div className="space-y-2">
        {recent.map((w) => (
          <HistoryRow key={w.id} workout={w} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function HistoryRow({ workout, onEdit }: { workout: WorkoutSession; onEdit: (w: WorkoutSession) => void }) {
  const muscles = useMemo(() => {
    const set = new Set<string>();
    for (const ex of workout.exercises) {
      const exercise = getExerciseById(ex.exerciseId);
      if (exercise) set.add(getMuscleCategory(exercise.muscle));
    }
    return [...set];
  }, [workout]);

  const exerciseCount = workout.exercises.length;
  const setCount = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const dateLabel = workout.completedAt ? formatRelativeDate(workout.completedAt) : "In progress";

  return (
    <div className="rounded-xl bg-surface border border-border-light px-4 py-3 flex items-center gap-3">
      {/* Left: muscle dots stacked */}
      <div className="flex flex-col gap-[3px] flex-shrink-0">
        {muscles.slice(0, 3).map((mg) => (
          <span
            key={mg}
            className="w-[6px] h-[6px] rounded-full"
            style={{ background: getMuscleColor(mg.toLowerCase()) }}
          />
        ))}
      </div>

      {/* Middle: info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text truncate">{workout.name}</span>
          <span className="text-[10px] text-muted flex-shrink-0">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-dim">
            {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
            {setCount > 0 && ` · ${setCount} set${setCount !== 1 ? "s" : ""}`}
          </span>
          {workout.totalVolume > 0 && (
            <span className="text-[10px] text-muted">
              {(workout.totalVolume / 1000).toFixed(1)}K lbs
            </span>
          )}
        </div>
      </div>

      {/* Right: edit button */}
      <button
        onClick={() => onEdit(workout)}
        className="p-2 rounded-lg hover:bg-bg text-muted hover:text-accent transition-colors flex-shrink-0"
        title="Edit details"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
        </svg>
      </button>
    </div>
  );
}

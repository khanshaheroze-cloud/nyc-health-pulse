"use client";

import { useState, useMemo, useCallback } from "react";
import type { WorkoutSession, LoggedExercise, LoggedSet } from "@/lib/workoutTypes";
import { generateId } from "@/lib/workoutTypes";
import { getExerciseById } from "@/lib/exerciseDatabase";
import { getPreviousSession, type PreviousSetData } from "@/lib/workoutUtils";

interface InlineDetailEditorProps {
  workout: WorkoutSession;
  log: WorkoutSession[];
  onSave: (updated: WorkoutSession) => void;
  onDelete: (workoutId: string) => void;
  onClose: () => void;
}

export function InlineDetailEditor({ workout, log, onSave, onDelete, onClose }: InlineDetailEditorProps) {
  const [exercises, setExercises] = useState<ExerciseEditRow[]>(() =>
    workout.exercises.map((ex) => {
      const prev = getPreviousSession(ex.exerciseId, log);
      const lastSet = ex.sets.find(s => s.type === "working");
      return {
        exerciseId: ex.exerciseId,
        weight: lastSet?.weight ?? prev?.weight ?? 0,
        reps: lastSet?.reps ?? prev?.reps ?? 0,
        previous: prev,
        notes: ex.notes ?? "",
      };
    })
  );
  const [notes, setNotes] = useState(workout.notes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = useCallback(() => {
    const updatedExercises: LoggedExercise[] = exercises.map((row) => {
      const set: LoggedSet = {
        setNumber: 1,
        type: "working",
        weight: row.weight || undefined,
        reps: row.reps || undefined,
        isPersonalRecord: row.previous ? row.weight > row.previous.weight : false,
        completedAt: new Date().toISOString(),
      };
      return {
        exerciseId: row.exerciseId,
        sets: (row.weight || row.reps) ? [set] : [],
        notes: row.notes || undefined,
      };
    });

    // Calculate total volume
    let totalVolume = 0;
    for (const ex of updatedExercises) {
      for (const set of ex.sets) {
        if (set.weight && set.reps) totalVolume += set.weight * set.reps;
      }
    }

    const updated: WorkoutSession = {
      ...workout,
      exercises: updatedExercises,
      notes,
      totalVolume: Math.round(totalVolume),
    };
    onSave(updated);
  }, [exercises, notes, workout, onSave]);

  const updateRow = (idx: number, field: "weight" | "reps", value: number) => {
    setExercises((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  return (
    <div className="rounded-2xl bg-surface border border-border-light overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-[15px] font-bold text-text">{workout.name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-lg hover:bg-hp-red/10 text-muted hover:text-hp-red transition-colors"
            title="Delete workout"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 4h10M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v5M10 7v5M4.5 4l.5 9a1 1 0 001 1h4a1 1 0 001-1l.5-9" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg text-muted hover:text-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Exercise rows */}
      <div className="px-5 py-2 space-y-2">
        {exercises.map((row, idx) => {
          const ex = getExerciseById(row.exerciseId);
          const isPR = row.previous && row.weight > row.previous.weight;

          return (
            <div
              key={row.exerciseId}
              className={`rounded-xl px-3 py-2.5 border transition-colors ${
                isPR
                  ? "bg-[#e8f0ea] border-accent/30"
                  : "bg-bg/50 border-border-light"
              }`}
            >
              {/* Exercise name */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-text">
                  {ex?.name ?? row.exerciseId}
                  {isPR && <span className="ml-1.5 text-[10px] text-accent font-bold">NEW PR!</span>}
                </span>
              </div>

              {/* Previous session info */}
              {row.previous && (
                <p className="text-[10px] text-muted mb-2">
                  Prev: {row.previous.weight} lbs × {row.previous.reps}
                </p>
              )}

              {/* Weight + Reps inputs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={row.weight || ""}
                    onChange={(e) => updateRow(idx, "weight", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[13px] text-text text-center focus-ring"
                  />
                  <span className="text-[11px] text-muted flex-shrink-0">lbs</span>
                </div>
                <span className="text-muted text-[11px]">×</span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={row.reps || ""}
                    onChange={(e) => updateRow(idx, "reps", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[13px] text-text text-center focus-ring"
                  />
                  <span className="text-[11px] text-muted flex-shrink-0">reps</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="px-5 py-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes..."
          className="w-full bg-bg border border-border-light rounded-lg px-3 py-2 text-[12px] text-text placeholder:text-muted focus-ring"
        />
      </div>

      {/* Save button */}
      <div className="px-5 pb-4 pt-2">
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors btn-press"
        >
          Save Details
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-surface/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 rounded-2xl z-10">
          <p className="text-[14px] font-bold text-text mb-1">Delete this workout?</p>
          <p className="text-[12px] text-dim mb-4">This can&apos;t be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded-xl border border-border text-[12px] font-semibold text-dim hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(workout.id)}
              className="px-4 py-2 rounded-xl bg-hp-red text-white text-[12px] font-semibold hover:bg-hp-red/90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ExerciseEditRow {
  exerciseId: string;
  weight: number;
  reps: number;
  previous: PreviousSetData | null;
  notes: string;
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { WorkoutSession } from "@/lib/workoutTypes";
import { calculateStreak, getThisWeekCount, getThisMonthCount } from "@/lib/workoutUtils";

interface ConfirmationCardProps {
  workout: WorkoutSession;
  log: WorkoutSession[];
  onEditDetails: (workout: WorkoutSession) => void;
  onUndo: (workoutId: string) => void;
}

export function ConfirmationCard({ workout, log, onEditDetails, onUndo }: ConfirmationCardProps) {
  const [undoVisible, setUndoVisible] = useState(true);
  const [undoCountdown, setUndoCountdown] = useState(5);

  const streak = calculateStreak(log);
  const weekCount = getThisWeekCount(log);
  const monthCount = getThisMonthCount(log);

  // 5-second undo countdown
  useEffect(() => {
    if (!undoVisible) return;
    const timer = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          setUndoVisible(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [undoVisible]);

  const handleUndo = useCallback(() => {
    onUndo(workout.id);
  }, [workout.id, onUndo]);

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-5 animate-fade-in-up">
      {/* Checkmark */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13 L9 17 L19 7" />
          </svg>
        </div>
        <h3 className="text-[18px] font-display font-bold text-text">
          {workout.name} Logged!
        </h3>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-6 mb-4 py-3 bg-bg rounded-xl">
        <StatBlock label="Day Streak" value={`🔥 ${streak}`} />
        <div className="w-px h-8 bg-border-light" />
        <StatBlock label="This Week" value={String(weekCount)} />
        <div className="w-px h-8 bg-border-light" />
        <StatBlock label="This Month" value={String(monthCount)} />
      </div>

      {/* Edit details button */}
      <button
        onClick={() => onEditDetails(workout)}
        className="w-full py-2.5 rounded-xl border border-accent/25 text-[13px] font-semibold text-accent hover:bg-accent-bg/50 transition-colors"
      >
        Edit details — add weights, reps, notes
      </button>

      {/* Undo */}
      {undoVisible && (
        <button
          onClick={handleUndo}
          className="w-full mt-2 text-center text-[12px] text-muted hover:text-hp-red transition-colors"
        >
          Undo ({undoCountdown}s)
        </button>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[16px] font-display font-bold text-text">{value}</span>
      <span className="text-[9px] text-muted uppercase tracking-wide">{label}</span>
    </div>
  );
}

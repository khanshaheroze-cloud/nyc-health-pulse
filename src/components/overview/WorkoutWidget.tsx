"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  type WorkoutSession,
  type DayTemplate,
  type WeekPlan,
  STORAGE_KEYS,
  loadFromStorage,
  getTodayDayOfWeek,
} from "@/lib/workoutTypes";
import { getExerciseById } from "@/lib/exerciseDatabase";

export function WorkoutWidget() {
  const [mounted, setMounted] = useState(false);
  const [todayTemplate, setTodayTemplate] = useState<DayTemplate | null>(null);
  const [lastWorkoutLabel, setLastWorkoutLabel] = useState("");
  const [lastWorkoutName, setLastWorkoutName] = useState("");
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setMounted(true);
    const templates: DayTemplate[] = loadFromStorage(STORAGE_KEYS.templates, []);
    const weekPlan: WeekPlan = loadFromStorage(STORAGE_KEYS.week, {
      monday: null, tuesday: null, wednesday: null,
      thursday: null, friday: null, saturday: null, sunday: null,
    });
    const log: WorkoutSession[] = loadFromStorage(STORAGE_KEYS.log, []);
    const active: WorkoutSession | null = loadFromStorage(STORAGE_KEYS.activeWorkout, null);

    setActiveWorkout(active);

    // Today's template
    const today = getTodayDayOfWeek();
    const tid = weekPlan[today];
    if (tid) {
      const tmpl = templates.find(t => t.id === tid);
      if (tmpl) setTodayTemplate(tmpl);
    }

    // Streak
    let s = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const hasW = log.some(w => w.completedAt?.startsWith(dayStr));
      if (hasW || (i === 0 && active)) s++;
      else if (i > 0) break;
    }
    setStreak(s);

    // Last workout
    if (log.length > 0) {
      const last = log[0];
      const hrs = Math.round((Date.now() - new Date(last.completedAt || last.startedAt).getTime()) / 3600000);
      setLastWorkoutLabel(hrs < 1 ? "Just now" : hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`);
      setLastWorkoutName(last.name);
    }
  }, []);

  if (!mounted) return <div className="rounded-2xl bg-surface border border-border-light p-6 h-[280px]" />;

  // Active workout in progress
  if (activeWorkout) {
    const completedSets = activeWorkout.exercises.reduce((s, ex) => s + ex.sets.length, 0);
    const totalExercises = activeWorkout.exercises.length;
    const doneExercises = activeWorkout.exercises.filter(ex => ex.sets.length > 0).length;

    return (
      <div className="rounded-2xl bg-surface border border-border-light p-6 border-l-4 border-l-accent">
        <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-3">🏋️ Workout In Progress</p>
        <p className="text-[15px] font-bold text-text">{activeWorkout.name}</p>
        <p className="text-[12px] text-dim mt-1">
          {doneExercises}/{totalExercises} exercises · {completedSets} sets logged
        </p>
        <Link
          href="/workouts"
          className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors"
        >
          Continue Workout →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-6 border-l-4 border-l-accent">
      <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted mb-3">🏋️ Today&apos;s Workout</p>

      {todayTemplate ? (
        <>
          <p className="text-[15px] font-bold text-text">
            {todayTemplate.emoji} {todayTemplate.name}
          </p>
          <div className="mt-2.5 space-y-1">
            {todayTemplate.exercises.slice(0, 5).map((pe, i) => {
              const ex = getExerciseById(pe.exerciseId);
              return (
                <p key={i} className="text-[12px] text-dim">
                  • {ex?.name || pe.exerciseId} — {pe.targetSets}×{pe.targetReps}
                </p>
              );
            })}
            {todayTemplate.exercises.length > 5 && (
              <p className="text-[11px] text-muted">+ {todayTemplate.exercises.length - 5} more</p>
            )}
          </div>

          <Link
            href="/workouts?start=today"
            className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors"
          >
            ▶ Start Workout
          </Link>
        </>
      ) : (
        <>
          {/* Check if it's a rest day (has a week plan but no template today) */}
          <div className="py-4 text-center">
            <p className="text-[22px] mb-1">🧘</p>
            <p className="text-[14px] font-semibold text-text">Rest Day</p>
            <p className="text-[12px] text-dim mt-1">Recovery is part of the process.</p>
          </div>
          <Link
            href="/workouts"
            className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border-light text-[13px] font-semibold text-dim hover:border-accent/30 hover:text-text transition-colors"
          >
            Browse Workouts →
          </Link>
        </>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
        <span className="text-[11px] text-dim">
          {streak > 0 ? `🔥 ${streak}-day streak` : "Start your streak"}
        </span>
        {lastWorkoutLabel && (
          <span className="text-[11px] text-muted">Last: {lastWorkoutLabel} — {lastWorkoutName}</span>
        )}
      </div>
    </div>
  );
}

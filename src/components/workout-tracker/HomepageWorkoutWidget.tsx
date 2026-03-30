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

export function HomepageWorkoutWidget() {
  const [mounted, setMounted] = useState(false);
  const [todayTemplate, setTodayTemplate] = useState<DayTemplate | null>(null);
  const [streak, setStreak] = useState(0);
  const [lastWorkout, setLastWorkout] = useState("");
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);

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
      const dayStr = d.toISOString().split("T")[0];
      const hasW = log.some(w => w.completedAt?.startsWith(dayStr));
      if (hasW || (i === 0 && active)) s++;
      else if (i > 0) break;
    }
    setStreak(s);

    // Last workout
    if (log.length > 0) {
      const last = new Date(log[0].completedAt || log[0].startedAt);
      const hrs = Math.round((Date.now() - last.getTime()) / 3600000);
      setLastWorkout(hrs < 1 ? "Just now" : hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`);
    }
  }, []);

  if (!mounted) return null;

  // Active workout in progress
  if (activeWorkout) {
    const completedSets = activeWorkout.exercises.reduce((s, ex) => s + ex.sets.length, 0);
    const totalExercises = activeWorkout.exercises.length;
    const doneExercises = activeWorkout.exercises.filter(ex => ex.sets.length > 0).length;

    return (
      <div className="rounded-2xl border border-accent/30 bg-surface shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🏋️</span>
            <h3 className="text-[13px] font-bold text-text">Workout In Progress</h3>
          </div>
          <Link href="/workouts" className="text-[10px] text-accent font-semibold hover:underline">
            Continue &rarr;
          </Link>
        </div>
        <p className="text-[13px] font-semibold text-text">{activeWorkout.name}</p>
        <p className="text-[11px] text-muted mt-0.5">
          {doneExercises}/{totalExercises} exercises · {completedSets} sets logged
        </p>
        <Link
          href="/workouts"
          className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-accent text-white text-[12px] font-semibold hover:bg-accent/90 transition-colors"
        >
          Open Workout
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-light bg-surface shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🏋️</span>
          <h3 className="text-[13px] font-bold text-text">
            {todayTemplate ? "Today\u2019s Workout" : "Workout Tracker"}
          </h3>
        </div>
        <Link href="/workouts" className="text-[10px] text-accent font-semibold hover:underline">
          Full Tracker &rarr;
        </Link>
      </div>

      {todayTemplate ? (
        <>
          <p className="text-[13px] font-semibold text-text">
            {todayTemplate.emoji} {todayTemplate.name}
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            {todayTemplate.exercises.length} exercises · ~{todayTemplate.estimatedDuration || Math.round(todayTemplate.exercises.length * 7)} min
          </p>
          <div className="mt-2 space-y-0.5">
            {todayTemplate.exercises.slice(0, 3).map((pe, i) => {
              const ex = getExerciseById(pe.exerciseId);
              return (
                <p key={i} className="text-[11px] text-dim truncate">
                  {ex?.name || pe.exerciseId} — {pe.targetSets}×{pe.targetReps}
                </p>
              );
            })}
            {todayTemplate.exercises.length > 3 && (
              <p className="text-[11px] text-muted">+{todayTemplate.exercises.length - 3} more</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-[12px] text-muted">No workout planned for today</p>
      )}

      {/* Stats footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-light">
        <span className="text-[11px] text-dim">
          {streak > 0 ? `🔥 ${streak}-day streak` : "Start your streak"}
        </span>
        {lastWorkout && (
          <span className="text-[11px] text-muted">Last: {lastWorkout}</span>
        )}
      </div>

      <Link
        href="/workouts"
        className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-surface-sage border border-border-light text-[12px] text-muted hover:border-accent/30 hover:text-dim transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span>{todayTemplate ? "Start Workout" : "Log a Workout"}</span>
      </Link>
    </div>
  );
}

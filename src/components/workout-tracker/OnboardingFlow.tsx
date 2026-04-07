"use client";

import { useState, useCallback } from "react";
import type { DayTemplate, WeekPlan, DayOfWeek } from "@/lib/workoutTypes";
import { SPLIT_TEMPLATES, generateId, type SplitTemplate } from "@/lib/workoutTypes";
import { DAY_OF_WEEK_ORDER } from "@/lib/workoutUtils";

interface OnboardingFlowProps {
  onComplete: (result: OnboardingResult) => void;
}

export interface OnboardingResult {
  mode: "split" | "no-split";
  templates?: DayTemplate[];
  weekPlan?: WeekPlan;
  splitName?: string;
}

type Step = "choose" | "pick-split" | "assign-days";

const SPLIT_OPTIONS = [
  { id: "ppl-3", label: "Push / Pull / Legs", sub: "3 days/week", emoji: "💪" },
  { id: "upper-lower-4", label: "Upper / Lower", sub: "4 days/week", emoji: "⬆️" },
  { id: "bro-split-5", label: "Body Part Split", sub: "5 days/week", emoji: "🏋️" },
  { id: "full-body-3", label: "Full Body", sub: "3 days/week", emoji: "🔥" },
  { id: "beginner-full-body-3", label: "Beginner Full Body", sub: "3 days/week", emoji: "🌱" },
  { id: "beginner-upper-lower-4", label: "Beginner Upper/Lower", sub: "4 days/week", emoji: "🌱" },
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("choose");
  const [selectedSplit, setSelectedSplit] = useState<SplitTemplate | null>(null);
  const [dayAssignments, setDayAssignments] = useState<Record<DayOfWeek, number | null>>({
    monday: null, tuesday: null, wednesday: null, thursday: null,
    friday: null, saturday: null, sunday: null,
  });

  const handlePickSplit = useCallback((splitId: string) => {
    const split = SPLIT_TEMPLATES.find((s) => s.id === splitId);
    if (!split) return;
    setSelectedSplit(split);

    // Auto-assign days based on split's day count
    const assignments: Record<DayOfWeek, number | null> = {
      monday: null, tuesday: null, wednesday: null, thursday: null,
      friday: null, saturday: null, sunday: null,
    };

    // Smart default: spread across the week
    const dayIndices = getDefaultDaySpread(split.daysPerWeek);
    split.days.forEach((_, i) => {
      if (dayIndices[i] !== undefined) {
        assignments[DAY_OF_WEEK_ORDER[dayIndices[i]]] = i;
      }
    });

    setDayAssignments(assignments);
    setStep("assign-days");
  }, []);

  const handleFinishSplit = useCallback(() => {
    if (!selectedSplit) return;

    // Convert to DayTemplates
    const templates: DayTemplate[] = selectedSplit.days.map((day, i) => ({
      id: generateId(),
      name: day.name,
      emoji: day.emoji,
      assignedDays: DAY_OF_WEEK_ORDER.filter((d) => dayAssignments[d] === i),
      exercises: day.exercises.map((ex, j) => ({
        exerciseId: ex.exerciseId,
        targetSets: ex.sets,
        targetReps: ex.reps,
        restTime: ex.rest,
        order: j,
      })),
      estimatedDuration: Math.round(day.exercises.length * 4),
      notes: "",
      createdAt: new Date().toISOString(),
    }));

    // Build WeekPlan
    const weekPlan: WeekPlan = {
      monday: null, tuesday: null, wednesday: null, thursday: null,
      friday: null, saturday: null, sunday: null,
      splitName: selectedSplit.name,
    };

    for (const d of DAY_OF_WEEK_ORDER) {
      const dayIdx = dayAssignments[d];
      if (dayIdx !== null) {
        weekPlan[d] = templates[dayIdx]?.id ?? null;
      }
    }

    onComplete({
      mode: "split",
      templates,
      weekPlan,
      splitName: selectedSplit.name,
    });
  }, [selectedSplit, dayAssignments, onComplete]);

  // ── Step: Choose ──
  if (step === "choose") {
    return (
      <div className="rounded-2xl bg-surface border border-border-light p-5 animate-fade-in-up">
        <h3 className="text-[18px] font-display font-bold text-text mb-1">How do you train?</h3>
        <p className="text-[12px] text-dim mb-5">This helps us personalize your experience.</p>

        <div className="space-y-2">
          <button
            onClick={() => setStep("pick-split")}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border-light hover:border-accent/25 hover:bg-accent-bg/30 transition-all text-left group"
          >
            <span className="text-xl">📅</span>
            <div>
              <span className="text-[14px] font-semibold text-text group-hover:text-accent transition-colors block">
                I follow a split
              </span>
              <span className="text-[11px] text-dim">PPL, Upper/Lower, Body Part, etc.</span>
            </div>
          </button>

          <button
            onClick={() => onComplete({ mode: "no-split" })}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border-light hover:border-accent/25 hover:bg-accent-bg/30 transition-all text-left group"
          >
            <span className="text-xl">🏃</span>
            <div>
              <span className="text-[14px] font-semibold text-text group-hover:text-accent transition-colors block">
                I just work out
              </span>
              <span className="text-[11px] text-dim">No fixed schedule — freestyle</span>
            </div>
          </button>

          <button
            onClick={() => onComplete({ mode: "no-split" })}
            className="w-full text-center mt-2 text-[12px] text-muted hover:text-dim transition-colors"
          >
            I&apos;ll set this up later
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Pick Split ──
  if (step === "pick-split") {
    return (
      <div className="rounded-2xl bg-surface border border-border-light p-5 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setStep("choose")}
            className="p-1 text-muted hover:text-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4 L6 8 L10 12" />
            </svg>
          </button>
          <h3 className="text-[16px] font-bold text-text">Pick a program</h3>
        </div>

        <div className="space-y-2">
          {SPLIT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handlePickSplit(opt.id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border-light hover:border-accent/25 hover:bg-accent-bg/30 transition-all text-left group"
            >
              <span className="text-lg">{opt.emoji}</span>
              <div className="flex-1">
                <span className="text-[13px] font-semibold text-text group-hover:text-accent transition-colors block">
                  {opt.label}
                </span>
                <span className="text-[11px] text-dim">{opt.sub}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted">
                <path d="M6 4 L10 8 L6 12" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step: Assign Days ──
  if (step === "assign-days" && selectedSplit) {
    return (
      <div className="rounded-2xl bg-surface border border-border-light p-5 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setStep("pick-split")}
            className="p-1 text-muted hover:text-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4 L6 8 L10 12" />
            </svg>
          </button>
          <h3 className="text-[16px] font-bold text-text">{selectedSplit.name}</h3>
        </div>

        <p className="text-[12px] text-dim mb-3">Assign workouts to days. Tap to cycle through options.</p>

        <div className="space-y-1.5 mb-4">
          {DAY_OF_WEEK_ORDER.map((day) => {
            const assignedIdx = dayAssignments[day];
            const assignedDay = assignedIdx !== null ? selectedSplit.days[assignedIdx] : null;

            return (
              <button
                key={day}
                onClick={() => {
                  setDayAssignments((prev) => {
                    const next = { ...prev };
                    const current = next[day];
                    // Cycle: null → 0 → 1 → ... → null
                    if (current === null) {
                      next[day] = 0;
                    } else if (current >= selectedSplit.days.length - 1) {
                      next[day] = null;
                    } else {
                      next[day] = current + 1;
                    }
                    return next;
                  });
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors ${
                  assignedDay
                    ? "border-accent/20 bg-accent-bg/30"
                    : "border-border-light bg-bg/30"
                }`}
              >
                <span className="text-[13px] font-semibold text-text w-10">{DAY_LABELS[day]}</span>
                {assignedDay ? (
                  <span className="text-[12px] text-accent font-medium">
                    {assignedDay.emoji} {assignedDay.name}
                  </span>
                ) : (
                  <span className="text-[12px] text-muted">Rest</span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleFinishSplit}
          className="w-full py-3 rounded-xl bg-accent text-white text-[14px] font-bold hover:bg-accent/90 transition-colors btn-press"
        >
          Start Training
        </button>
      </div>
    );
  }

  return null;
}

/** Get sensible default day indices for N workouts per week. */
function getDefaultDaySpread(daysPerWeek: number): number[] {
  switch (daysPerWeek) {
    case 3: return [0, 2, 4];        // Mon, Wed, Fri
    case 4: return [0, 1, 3, 4];     // Mon, Tue, Thu, Fri
    case 5: return [0, 1, 2, 3, 4];  // Mon-Fri
    case 6: return [0, 1, 2, 3, 4, 5]; // Mon-Sat
    default: return Array.from({ length: Math.min(daysPerWeek, 7) }, (_, i) => i);
  }
}

"use client";

import { useState, useCallback } from "react";
import type { DayTemplate, WeekPlan, DayOfWeek } from "@/lib/workoutTypes";
import { SPLIT_TEMPLATES, generateId, type SplitTemplate } from "@/lib/workoutTypes";
import { getExerciseById } from "@/lib/exerciseDatabase";
import { DAY_OF_WEEK_ORDER, getMuscleCategory, getMuscleColor } from "@/lib/workoutUtils";

interface RoutineEditorProps {
  templates: DayTemplate[];
  weekPlan: WeekPlan;
  onUpdateTemplates: (templates: DayTemplate[]) => void;
  onUpdateWeekPlan: (plan: WeekPlan) => void;
  onResetOnboarding: () => void;
  onClose: () => void;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

type View = "main" | "edit-template" | "browse-splits";

export function RoutineEditor({
  templates,
  weekPlan,
  onUpdateTemplates,
  onUpdateWeekPlan,
  onResetOnboarding,
  onClose,
}: RoutineEditorProps) {
  const [view, setView] = useState<View>("main");
  const [editingTemplate, setEditingTemplate] = useState<DayTemplate | null>(null);

  const handleAssignDay = useCallback(
    (day: DayOfWeek) => {
      // Cycle through templates + null (rest)
      const currentId = weekPlan[day];
      const currentIdx = currentId ? templates.findIndex((t) => t.id === currentId) : -1;
      const nextIdx = currentIdx + 1;
      const nextTemplate = nextIdx < templates.length ? templates[nextIdx] : null;

      onUpdateWeekPlan({
        ...weekPlan,
        [day]: nextTemplate?.id ?? null,
      });
    },
    [weekPlan, templates, onUpdateWeekPlan]
  );

  const handleAdoptSplit = useCallback(
    (split: SplitTemplate) => {
      const newTemplates: DayTemplate[] = split.days.map((day, i) => ({
        id: generateId(),
        name: day.name,
        emoji: day.emoji,
        assignedDays: [],
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
        basedOn: split.id,
      }));

      // Auto-assign to weekdays
      const newPlan: WeekPlan = {
        monday: null, tuesday: null, wednesday: null, thursday: null,
        friday: null, saturday: null, sunday: null,
        splitName: split.name,
      };

      const spread = getDefaultDaySpread(split.daysPerWeek);
      split.days.forEach((_, i) => {
        if (spread[i] !== undefined) {
          newPlan[DAY_OF_WEEK_ORDER[spread[i]]] = newTemplates[i].id;
        }
      });

      onUpdateTemplates(newTemplates);
      onUpdateWeekPlan(newPlan);
      setView("main");
    },
    [onUpdateTemplates, onUpdateWeekPlan]
  );

  const handleDeleteTemplate = useCallback(
    (id: string) => {
      onUpdateTemplates(templates.filter((t) => t.id !== id));
      // Remove from week plan
      const newPlan = { ...weekPlan };
      for (const d of DAY_OF_WEEK_ORDER) {
        if (newPlan[d] === id) newPlan[d] = null;
      }
      onUpdateWeekPlan(newPlan);
    },
    [templates, weekPlan, onUpdateTemplates, onUpdateWeekPlan]
  );

  // ── Browse Splits ──
  if (view === "browse-splits") {
    const grouped = {
      beginner: SPLIT_TEMPLATES.filter((s) => s.level === "beginner"),
      intermediate: SPLIT_TEMPLATES.filter((s) => s.level === "intermediate"),
      advanced: SPLIT_TEMPLATES.filter((s) => s.level === "advanced"),
    };

    return (
      <div className="rounded-2xl bg-surface border border-border-light overflow-hidden animate-fade-in-up">
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-border-light">
          <button onClick={() => setView("main")} className="p-1 text-muted hover:text-text transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 4 L6 8 L10 12" />
            </svg>
          </button>
          <h3 className="text-[15px] font-bold text-text">Pre-Built Programs</h3>
        </div>

        <div className="px-5 py-3 max-h-[60vh] overflow-y-auto space-y-4">
          {(Object.entries(grouped) as [string, SplitTemplate[]][]).map(([level, splits]) => (
            <div key={level}>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2 capitalize">{level}</p>
              <div className="space-y-1.5">
                {splits.map((split) => (
                  <button
                    key={split.id}
                    onClick={() => handleAdoptSplit(split)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border-light hover:border-accent/25 hover:bg-accent-bg/30 transition-all text-left group"
                  >
                    <div className="flex-1">
                      <span className="text-[13px] font-semibold text-text group-hover:text-accent transition-colors block">
                        {split.name}
                      </span>
                      <span className="text-[11px] text-dim">{split.description}</span>
                    </div>
                    <span className="text-[10px] text-muted">{split.daysPerWeek}d/wk</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main View ──
  return (
    <div className="rounded-2xl bg-surface border border-border-light overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border-light">
        <h3 className="text-[15px] font-bold text-text">My Routines</h3>
        <button onClick={onClose} className="p-1 text-muted hover:text-text transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-3 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Weekly view */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">Weekly Schedule</p>
          {weekPlan.splitName && (
            <p className="text-[11px] text-accent font-semibold mb-2">{weekPlan.splitName}</p>
          )}
          <div className="space-y-1">
            {DAY_OF_WEEK_ORDER.map((day) => {
              const templateId = weekPlan[day];
              const template = templateId ? templates.find((t) => t.id === templateId) : null;

              return (
                <button
                  key={day}
                  onClick={() => handleAssignDay(day)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors text-left ${
                    template ? "border-accent/15 bg-accent-bg/20" : "border-border-light"
                  }`}
                >
                  <span className="text-[12px] font-semibold text-text w-10">{DAY_LABELS[day]}</span>
                  {template ? (
                    <span className="text-[12px] text-accent font-medium">{template.emoji} {template.name}</span>
                  ) : (
                    <span className="text-[11px] text-muted">Rest</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* My Templates */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">My Templates</p>
          {templates.length === 0 ? (
            <p className="text-[12px] text-dim py-2">No templates yet. Browse pre-built programs to get started.</p>
          ) : (
            <div className="space-y-1.5">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border-light"
                >
                  <span>{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-text block truncate">{t.name}</span>
                    <span className="text-[10px] text-dim">{t.exercises.length} exercises</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="p-1 text-muted hover:text-hp-red transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-border-light">
          <button
            onClick={() => setView("browse-splits")}
            className="w-full py-2.5 rounded-xl border border-accent/25 text-[13px] font-semibold text-accent hover:bg-accent-bg/50 transition-colors"
          >
            Browse Pre-Built Programs
          </button>

          <button
            onClick={onResetOnboarding}
            className="w-full text-center text-[11px] text-muted hover:text-dim transition-colors py-2"
          >
            Reset onboarding
          </button>
        </div>
      </div>
    </div>
  );
}

function getDefaultDaySpread(daysPerWeek: number): number[] {
  switch (daysPerWeek) {
    case 3: return [0, 2, 4];
    case 4: return [0, 1, 3, 4];
    case 5: return [0, 1, 2, 3, 4];
    case 6: return [0, 1, 2, 3, 4, 5];
    default: return Array.from({ length: Math.min(daysPerWeek, 7) }, (_, i) => i);
  }
}

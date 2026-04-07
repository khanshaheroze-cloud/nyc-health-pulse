"use client";

import { useState, useCallback } from "react";
import type { DayTemplate, WeekPlan, DayOfWeek, PlannedExercise } from "@/lib/workoutTypes";
import { SPLIT_TEMPLATES, generateId, type SplitTemplate } from "@/lib/workoutTypes";
import { getExerciseById, searchExercises } from "@/lib/exerciseDatabase";
import { DAY_OF_WEEK_ORDER } from "@/lib/workoutUtils";

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
  const [expandedSplitGroup, setExpandedSplitGroup] = useState<string>("Strength Splits");

  const handleAssignDay = useCallback(
    (day: DayOfWeek) => {
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
      const newPlan = { ...weekPlan };
      for (const d of DAY_OF_WEEK_ORDER) {
        if (newPlan[d] === id) newPlan[d] = null;
      }
      onUpdateWeekPlan(newPlan);
    },
    [templates, weekPlan, onUpdateTemplates, onUpdateWeekPlan]
  );

  const handleSaveTemplate = useCallback(
    (updated: DayTemplate) => {
      onUpdateTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTemplate(null);
      setView("main");
    },
    [templates, onUpdateTemplates]
  );

  // ── Edit Template ──
  if (view === "edit-template" && editingTemplate) {
    return (
      <TemplateExerciseEditor
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onBack={() => { setEditingTemplate(null); setView("main"); }}
      />
    );
  }

  // ── Browse Splits ──
  if (view === "browse-splits") {
    const groups = [
      { label: "Beginner", splits: SPLIT_TEMPLATES.filter((s) => s.level === "beginner") },
      { label: "Strength Splits", splits: SPLIT_TEMPLATES.filter((s) => s.level === "intermediate") },
      { label: "Advanced", splits: SPLIT_TEMPLATES.filter((s) => s.level === "advanced") },
      { label: "Specialty & Lifestyle", splits: SPLIT_TEMPLATES.filter((s) => s.level === "all") },
    ];

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

        <div className="px-5 py-3 max-h-[60vh] overflow-y-auto space-y-3">
          {groups.map(({ label, splits }) => {
            if (splits.length === 0) return null;
            const isOpen = expandedSplitGroup === label;
            return (
              <div key={label}>
                <button
                  onClick={() => setExpandedSplitGroup(isOpen ? "" : label)}
                  className="w-full flex items-center justify-between px-1 py-1.5 text-left"
                >
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wide">{label}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M4 6 L8 10 L12 6" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="space-y-1.5 mt-1">
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
                        <span className="text-[10px] text-muted flex-shrink-0">{split.daysPerWeek}d/wk</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
                    onClick={() => { setEditingTemplate(t); setView("edit-template"); }}
                    className="p-1.5 text-muted hover:text-accent transition-colors"
                    title="Edit template"
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="p-1 text-muted hover:text-hp-red transition-colors"
                    title="Delete template"
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
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors btn-press"
          >
            Save & Back
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

// ── Template Exercise Editor ──────────────────────────────────

interface TemplateExerciseEditorProps {
  template: DayTemplate;
  onSave: (updated: DayTemplate) => void;
  onBack: () => void;
}

function TemplateExerciseEditor({ template, onSave, onBack }: TemplateExerciseEditorProps) {
  const [exercises, setExercises] = useState<PlannedExercise[]>(() => [...template.exercises]);
  const [templateName, setTemplateName] = useState(template.name);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = searchQuery.trim().length >= 2
    ? searchExercises(searchQuery).slice(0, 12)
    : [];

  const handleAddExercise = (exerciseId: string) => {
    const exists = exercises.some((e) => e.exerciseId === exerciseId);
    if (exists) return;
    setExercises((prev) => [
      ...prev,
      {
        exerciseId,
        targetSets: 3,
        targetReps: "10",
        restTime: 60,
        order: prev.length,
      },
    ]);
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, order: i })));
  };

  const handleMoveExercise = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= exercises.length) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next.map((e, i) => ({ ...e, order: i }));
    });
  };

  const handleUpdateExercise = (idx: number, field: "targetSets" | "targetReps" | "restTime", value: string | number) => {
    setExercises((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSave = () => {
    onSave({
      ...template,
      name: templateName.trim() || template.name,
      exercises,
      estimatedDuration: Math.round(exercises.length * 4),
    });
  };

  return (
    <div className="rounded-2xl bg-surface border border-border-light overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-border-light">
        <button onClick={onBack} className="p-1 text-muted hover:text-text transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 4 L6 8 L10 12" />
          </svg>
        </button>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="flex-1 text-[15px] font-bold text-text bg-transparent border-none outline-none focus:ring-0 p-0"
          placeholder="Template name..."
        />
      </div>

      {/* Exercise List */}
      <div className="px-5 py-3 space-y-2 max-h-[50vh] overflow-y-auto">
        {exercises.length === 0 && (
          <p className="text-[12px] text-dim py-4 text-center">No exercises yet. Add some below.</p>
        )}
        {exercises.map((ex, idx) => {
          const info = getExerciseById(ex.exerciseId);
          return (
            <div key={`${ex.exerciseId}-${idx}`} className="rounded-xl border border-border-light px-3 py-2.5">
              {/* Exercise name + controls */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveExercise(idx, -1)}
                    disabled={idx === 0}
                    className="text-muted hover:text-text disabled:opacity-20 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 10 L8 6 L12 10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveExercise(idx, 1)}
                    disabled={idx === exercises.length - 1}
                    className="text-muted hover:text-text disabled:opacity-20 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 6 L8 10 L12 6" />
                    </svg>
                  </button>
                </div>
                <span className="text-[13px] font-semibold text-text flex-1 truncate">
                  {info?.name ?? ex.exerciseId}
                </span>
                <button
                  onClick={() => handleRemoveExercise(idx)}
                  className="p-1 text-muted hover:text-hp-red transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>

              {/* Sets / Reps / Rest */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[9px] text-muted uppercase tracking-wide block mb-0.5">Sets</label>
                  <input
                    type="number"
                    value={ex.targetSets}
                    onChange={(e) => handleUpdateExercise(idx, "targetSets", parseInt(e.target.value) || 1)}
                    min={1}
                    max={20}
                    className="w-full bg-bg border border-border-light rounded-lg px-2 py-1 text-[12px] text-text text-center focus-ring"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-muted uppercase tracking-wide block mb-0.5">Reps</label>
                  <input
                    type="text"
                    value={ex.targetReps}
                    onChange={(e) => handleUpdateExercise(idx, "targetReps", e.target.value)}
                    placeholder="10"
                    className="w-full bg-bg border border-border-light rounded-lg px-2 py-1 text-[12px] text-text text-center focus-ring"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-muted uppercase tracking-wide block mb-0.5">Rest (s)</label>
                  <input
                    type="number"
                    value={ex.restTime}
                    onChange={(e) => handleUpdateExercise(idx, "restTime", parseInt(e.target.value) || 0)}
                    min={0}
                    step={15}
                    className="w-full bg-bg border border-border-light rounded-lg px-2 py-1 text-[12px] text-text text-center focus-ring"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise */}
      <div className="px-5 py-3 border-t border-border-light">
        {showSearch ? (
          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises (e.g. squat, plank, running)..."
              className="w-full bg-bg border border-border-light rounded-lg px-3 py-2 text-[12px] text-text placeholder:text-muted focus-ring"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {searchResults.map((ex) => {
                  const alreadyAdded = exercises.some((e) => e.exerciseId === ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => !alreadyAdded && handleAddExercise(ex.id)}
                      disabled={alreadyAdded}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        alreadyAdded
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-accent-bg/30 hover:border-accent/25"
                      } border border-border-light`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-semibold text-text block truncate">{ex.name}</span>
                        <span className="text-[10px] text-dim capitalize">{ex.muscle} · {ex.equipment}</span>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-[10px] text-muted">Added</span>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent flex-shrink-0">
                          <path d="M8 3v10M3 8h10" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-[11px] text-dim text-center py-2">No exercises found</p>
            )}
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(""); }}
              className="w-full text-center text-[11px] text-muted hover:text-text transition-colors py-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border-light text-[12px] text-muted hover:text-accent hover:border-accent/25 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
            Add Exercise
          </button>
        )}
      </div>

      {/* Save */}
      <div className="px-5 pb-4 pt-1">
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors btn-press"
        >
          Save Template
        </button>
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

"use client";

import { useMemo } from "react";
import type { WorkoutSession } from "@/lib/workoutTypes";
import {
  toLocalDateStr,
  getMonday,
  addDays,
  SHORT_DAY_LABELS,
  getHeatmapColor,
  getMuscleColor,
  getMuscleCategory,
  type DayWorkoutData,
  buildDayMap,
} from "@/lib/workoutUtils";
import { getExerciseById } from "@/lib/exerciseDatabase";

interface WeekStripProps {
  log: WorkoutSession[];
  onDayTap?: (dateStr: string) => void;
}

export function WeekStrip({ log, onDayTap }: WeekStripProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = toLocalDateStr(today);
  const monday = getMonday(today);
  const dayMap = useMemo(() => buildDayMap(log), [log]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      const dateStr = toLocalDateStr(d);
      const data = dayMap.get(dateStr);
      return {
        dateStr,
        dayNum: d.getDate(),
        label: SHORT_DAY_LABELS[i],
        isToday: dateStr === todayStr,
        data: data ?? null,
      };
    });
  }, [monday, todayStr, dayMap]);

  return (
    <div className="flex items-center justify-between gap-1 px-1">
      {days.map((day) => (
        <button
          key={day.dateStr}
          onClick={() => onDayTap?.(day.dateStr)}
          className="flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors hover:bg-bg/60"
        >
          {/* Day label */}
          <span className="text-[10px] font-semibold text-muted uppercase">
            {day.label}
          </span>

          {/* Heatmap circle */}
          <div
            className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              day.isToday ? "ring-[2.5px] ring-accent" : ""
            }`}
            style={{
              background: day.data
                ? getHeatmapColor(day.data.heatmapLevel)
                : "var(--color-bg)",
              border: !day.data && !day.isToday ? "1px solid var(--color-border-light)" : "none",
            }}
          >
            <span
              className={`text-[13px] font-bold ${
                day.data && day.data.heatmapLevel >= 3
                  ? "text-white"
                  : day.isToday
                  ? "text-accent"
                  : "text-dim"
              }`}
            >
              {day.dayNum}
            </span>
          </div>

          {/* Muscle group dots */}
          <div className="flex gap-[3px] h-[5px]">
            {day.data?.muscleGroups.slice(0, 4).map((mg) => (
              <span
                key={mg}
                className="w-[5px] h-[5px] rounded-full"
                style={{ background: getMuscleColor(mg.toLowerCase()) }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

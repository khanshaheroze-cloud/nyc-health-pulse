"use client";

import { useState, useMemo } from "react";
import type { WorkoutSession } from "@/lib/workoutTypes";
import {
  toLocalDateStr,
  addDays,
  buildDayMap,
  getHeatmapColor,
  getMuscleColor,
  MUSCLE_COLORS,
} from "@/lib/workoutUtils";

interface CollapsibleCalendarProps {
  log: WorkoutSession[];
  onDayTap?: (dateStr: string) => void;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CollapsibleCalendar({ log, onDayTap }: CollapsibleCalendarProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const todayStr = toLocalDateStr(new Date());
  const dayMap = useMemo(() => buildDayMap(log), [log]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0

    const days: (string | null)[] = [];

    // Leading blanks
    for (let i = 0; i < startOffset; i++) days.push(null);

    // Actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push(dateStr);
    }

    return days;
  }, [year, month]);

  // Unique muscle groups for legend
  const legendGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const [, data] of dayMap) {
      for (const mg of data.muscleGroups) groups.add(mg);
    }
    return [...groups].slice(0, 8);
  }, [dayMap]);

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-1 py-1 text-[12px] font-semibold text-dim hover:text-text transition-colors"
      >
        <span>{monthLabel}</span>
        <svg
          width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round"
          className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3 5 L6 8 L9 5" />
        </svg>
      </button>

      {/* Expandable content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? "400px" : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="pt-2 pb-3">
          {/* Month nav */}
          <div className="flex items-center justify-between px-1 mb-2">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 text-dim hover:text-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 4 L6 8 L10 12" />
              </svg>
            </button>
            <span className="text-[13px] font-bold text-text">{monthLabel}</span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 text-dim hover:text-text transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 4 L10 8 L6 12" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 px-1 mb-1">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d} className="text-center text-[9px] font-semibold text-muted uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 px-1">
            {calendarDays.map((dateStr, i) => {
              if (!dateStr) return <div key={`blank-${i}`} />;

              const dayNum = parseInt(dateStr.split("-")[2]);
              const data = dayMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => !isFuture && onDayTap?.(dateStr)}
                  disabled={isFuture}
                  className={`flex flex-col items-center py-1 rounded-lg transition-colors ${
                    isFuture ? "opacity-30" : "hover:bg-bg/60"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      isToday ? "ring-[2px] ring-accent" : ""
                    } ${
                      data && data.heatmapLevel >= 3 ? "text-white" : isToday ? "text-accent" : "text-dim"
                    }`}
                    style={{
                      background: data ? getHeatmapColor(data.heatmapLevel) : "transparent",
                    }}
                  >
                    {dayNum}
                  </div>
                  {/* Muscle dots */}
                  <div className="flex gap-[2px] mt-0.5 h-[4px]">
                    {data?.muscleGroups.slice(0, 3).map((mg) => (
                      <span
                        key={mg}
                        className="w-[4px] h-[4px] rounded-full"
                        style={{ background: getMuscleColor(mg.toLowerCase()) }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color legend */}
          {legendGroups.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 px-1">
              {legendGroups.map((mg) => (
                <span key={mg} className="flex items-center gap-1 text-[9px] text-muted">
                  <span
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ background: getMuscleColor(mg.toLowerCase()) }}
                  />
                  {mg}
                </span>
              ))}
              {/* Heatmap legend */}
              <span className="flex items-center gap-0.5 text-[9px] text-muted ml-auto">
                Less
                {[1, 2, 3, 4].map((l) => (
                  <span
                    key={l}
                    className="w-[8px] h-[8px] rounded-sm"
                    style={{ background: getHeatmapColor(l as 1 | 2 | 3 | 4) }}
                  />
                ))}
                More
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

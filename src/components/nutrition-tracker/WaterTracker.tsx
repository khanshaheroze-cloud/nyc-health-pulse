"use client";

import { useState, useEffect, useCallback } from "react";

interface WaterTrackerProps {
  date: string;
}

const GLASS_OZ = 8;
const DEFAULT_GOAL = 64;

export default function WaterTracker({ date }: WaterTrackerProps) {
  const [intake, setIntake] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [mounted, setMounted] = useState(false);

  const lsKey = `pulsenyc_water_${date}`;

  // Load data on mount / date change
  useEffect(() => {
    setMounted(true);

    // Load goal
    try {
      const goalsRaw = localStorage.getItem("pulsenyc_nutrition_goals");
      if (goalsRaw) {
        const goals = JSON.parse(goalsRaw);
        if (goals.waterGoalOz) setGoal(goals.waterGoalOz);
      }
    } catch {
      /* ignore */
    }

    // Load water data
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const data = JSON.parse(raw) as {
          total: number;
          history: number[];
        };
        setIntake(data.total);
        setHistory(data.history || []);
      } else {
        setIntake(0);
        setHistory([]);
      }
    } catch {
      setIntake(0);
      setHistory([]);
    }
  }, [lsKey]);

  const persist = useCallback(
    (total: number, hist: number[]) => {
      setIntake(total);
      setHistory(hist);
      localStorage.setItem(
        lsKey,
        JSON.stringify({ total, history: hist })
      );
    },
    [lsKey]
  );

  function addWater(oz: number) {
    const newTotal = intake + oz;
    const newHistory = [...history, oz];
    persist(newTotal, newHistory);
  }

  function undoLast() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const newTotal = Math.max(0, intake - last);
    persist(newTotal, newHistory);
  }

  if (!mounted) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-5 h-48 animate-pulse" />
    );
  }

  const pct = Math.min(Math.round((intake / goal) * 100), 100);
  const totalGlasses = Math.ceil(goal / GLASS_OZ);
  const filledGlasses = Math.floor(intake / GLASS_OZ);
  const isComplete = intake >= goal;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-[#5b9cf5]"
          >
            <path
              d="M10 2C10 2 4 8 4 12a6 6 0 1012 0c0-4-6-10-6-10z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="text-text font-semibold text-lg">Water</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={undoLast}
            className="text-xs text-muted hover:text-dim transition-colors flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 5h5a3 3 0 110 6H6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 3L3 5l2 2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Undo
          </button>
        )}
      </div>

      {/* Intake display */}
      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-text">
          {intake}
          <span className="text-muted text-lg font-normal">
            {" "}
            / {goal} oz
          </span>
        </p>
        {isComplete && (
          <p className="text-[#4A7C59] text-sm font-medium mt-1">
            Goal reached!
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-[#FAFAF7] rounded-full overflow-hidden border border-border/50 mb-4">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: isComplete
              ? "linear-gradient(90deg, #4A7C59, #2dd4a0)"
              : "linear-gradient(90deg, #5b9cf5, #22d3ee)",
          }}
        />
      </div>

      {/* Glass icons */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
        {Array.from({ length: totalGlasses }).map((_, i) => {
          const isFilled = i < filledGlasses;
          return (
            <div
              key={i}
              className={`w-6 h-8 rounded-b-lg border-2 transition-colors ${
                isFilled
                  ? "bg-[#5b9cf5]/20 border-[#5b9cf5]"
                  : "bg-[#FAFAF7] border-border"
              }`}
              title={`Glass ${i + 1}: ${isFilled ? "filled" : "empty"}`}
            >
              {isFilled && (
                <div
                  className="w-full rounded-b-md bg-[#5b9cf5]/40 mt-auto"
                  style={{ height: "70%" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2">
        {[
          { oz: 8, label: "Glass", icon: "glass" },
          { oz: 16, label: "Bottle", icon: "bottle" },
          { oz: 32, label: "Large", icon: "large" },
        ].map((btn) => (
          <button
            key={btn.oz}
            onClick={() => addWater(btn.oz)}
            className="flex-1 flex flex-col items-center gap-1 bg-[#FAFAF7] border border-border
                       rounded-xl py-2.5 px-2 hover:border-[#5b9cf5]/40 hover:bg-[#5b9cf5]/5
                       active:scale-[0.97] transition-all"
          >
            {btn.icon === "glass" && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="text-[#5b9cf5]"
              >
                <path
                  d="M5 3h8l-1 12H6L5 3z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 7h7"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </svg>
            )}
            {btn.icon === "bottle" && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="text-[#5b9cf5]"
              >
                <rect
                  x="6"
                  y="1"
                  width="6"
                  height="3"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M6 4h6l.5 2H5.5L6 4zM5.5 6h7l-.5 11H6L5.5 6z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {btn.icon === "large" && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="text-[#5b9cf5]"
              >
                <rect
                  x="4"
                  y="2"
                  width="10"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M4 7h10"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.5"
                />
                <path
                  d="M7 2V1M11 2V1"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <span className="text-dim text-xs font-medium">
              +{btn.oz}oz
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

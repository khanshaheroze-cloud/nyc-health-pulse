"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { FoodEntry, UserGoals } from "./DailySummary";

type Metric = "calories" | "protein" | "carbs" | "fat" | "fiber";

const METRIC_CONFIG: Record<
  Metric,
  { label: string; unit: string; goalKey: keyof UserGoals }
> = {
  calories: {
    label: "Calories",
    unit: "cal",
    goalKey: "dailyCalories",
  },
  protein: { label: "Protein", unit: "g", goalKey: "proteinGoal" },
  carbs: { label: "Carbs", unit: "g", goalKey: "carbGoal" },
  fat: { label: "Fat", unit: "g", goalKey: "fatGoal" },
  fiber: { label: "Fiber", unit: "g", goalKey: "fiberGoal" },
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLastSevenDays(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function WeeklyTrends() {
  const [metric, setMetric] = useState<Metric>("calories");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { chartData, goals, average } = useMemo(() => {
    if (typeof window === "undefined")
      return { chartData: [], goals: null, average: 0 };

    // Load goals
    let g: UserGoals | null = null;
    try {
      const raw = localStorage.getItem("pulsenyc_nutrition_goals");
      if (raw) g = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    const days = getLastSevenDays();
    const data: { day: string; date: string; value: number }[] = [];
    let total = 0;
    let daysWithData = 0;

    for (const dateStr of days) {
      const dayOfWeek = DAY_LABELS[new Date(dateStr + "T12:00:00").getDay()];
      let dayTotal = 0;

      try {
        const raw = localStorage.getItem(
          `pulsenyc_nutrition_${dateStr}`
        );
        if (raw) {
          const parsed = JSON.parse(raw);
          const dayData = (parsed.meals || parsed) as {
            breakfast: FoodEntry[];
            lunch: FoodEntry[];
            dinner: FoodEntry[];
            snacks: FoodEntry[];
          };
          const allEntries = [
            ...(dayData.breakfast || []),
            ...(dayData.lunch || []),
            ...(dayData.dinner || []),
            ...(dayData.snacks || []),
          ];
          for (const entry of allEntries) {
            dayTotal += entry[metric] * entry.servings;
          }
          if (allEntries.length > 0) daysWithData++;
        }
      } catch {
        /* ignore */
      }

      total += dayTotal;
      data.push({ day: dayOfWeek, date: dateStr, value: Math.round(dayTotal) });
    }

    const avg = daysWithData > 0 ? Math.round(total / daysWithData) : 0;
    return { chartData: data, goals: g, average: avg };
  }, [metric, mounted]);

  if (!mounted) {
    return (
      <div className="bg-surface rounded-2xl border border-border p-5 h-[360px] animate-pulse" />
    );
  }

  const config = METRIC_CONFIG[metric];
  const goalValue = goals ? goals[config.goalKey] : null;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text font-semibold text-lg">Weekly Trends</h3>
        {average > 0 && (
          <span className="text-muted text-xs">
            Avg: {average.toLocaleString()} {config.unit}
          </span>
        )}
      </div>

      {/* Toggle buttons */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {(Object.keys(METRIC_CONFIG) as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              metric === m
                ? "bg-[#4A7C59] text-white"
                : "bg-[#FAFAF7] text-dim border border-border hover:bg-[#f0ede6]"
            }`}
          >
            {METRIC_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8E4DE"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#8A918A" }}
              tickLine={false}
              axisLine={{ stroke: "#E8E4DE" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#8A918A" }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E4DE",
                borderRadius: "12px",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number | undefined) => [
                `${Number(value ?? 0).toLocaleString()} ${config.unit}`,
                config.label,
              ]}
              labelFormatter={(label) => String(label)}
            />

            {/* Goal reference line */}
            {goalValue != null && goalValue > 0 && (
              <ReferenceLine
                y={goalValue}
                stroke="#8A918A"
                strokeDasharray="6 4"
                label={{
                  value: `Goal: ${goalValue}`,
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "#8A918A",
                }}
              />
            )}

            {/* Average reference line */}
            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke="#4A7C59"
                strokeDasharray="2 3"
                strokeOpacity={0.5}
              />
            )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="#4A7C59"
              strokeWidth={2.5}
              dot={{
                fill: "#4A7C59",
                strokeWidth: 2,
                stroke: "#FFFFFF",
                r: 4,
              }}
              activeDot={{
                fill: "#4A7C59",
                strokeWidth: 2,
                stroke: "#FFFFFF",
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* No data hint */}
      {chartData.every((d) => d.value === 0) && (
        <p className="text-muted text-xs text-center mt-2">
          No nutrition data logged in the past 7 days
        </p>
      )}
    </div>
  );
}

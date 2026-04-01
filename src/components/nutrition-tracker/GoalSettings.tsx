"use client";

import { useState, useEffect } from "react";
import { loadProfile, saveProfile } from "./BodyProfile";
import type { UserGoals } from "./DailySummary";

interface GoalSettingsProps {
  goals: UserGoals;
  onSave: (goals: UserGoals) => void;
  onClose: () => void;
}

type Sex = "male" | "female";
type ActivityLevel =
  | "sedentary"
  | "lightly"
  | "moderately"
  | "very"
  | "extra";
type WeightGoal = "maintain" | "lose05" | "lose1" | "gain05";
type MacroSplit = "balanced" | "highProtein" | "lowCarb" | "custom";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  lightly: "Lightly Active",
  moderately: "Moderately Active",
  very: "Very Active",
  extra: "Extra Active",
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly: 1.375,
  moderately: 1.55,
  very: 1.725,
  extra: 1.9,
};

const WEIGHT_GOAL_OFFSETS: Record<WeightGoal, number> = {
  maintain: 0,
  lose05: -250,
  lose1: -500,
  gain05: 250,
};

const WEIGHT_GOAL_LABELS: Record<WeightGoal, string> = {
  maintain: "Maintain",
  lose05: "Lose 0.5 lb/wk",
  lose1: "Lose 1 lb/wk",
  gain05: "Gain 0.5 lb/wk",
};

const MACRO_SPLITS: Record<
  Exclude<MacroSplit, "custom">,
  { p: number; c: number; f: number; label: string }
> = {
  balanced: { p: 30, c: 40, f: 30, label: "Balanced (30/40/30)" },
  highProtein: { p: 40, c: 30, f: 30, label: "High Protein (40/30/30)" },
  lowCarb: { p: 35, c: 25, f: 40, label: "Low Carb (35/25/40)" },
};

const LS_KEY = "pulsenyc_nutrition_goals";

export default function GoalSettings({
  goals,
  onSave,
  onClose,
}: GoalSettingsProps) {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("30");
  const [weightLbs, setWeightLbs] = useState("160");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [activity, setActivity] = useState<ActivityLevel>("moderately");
  const [weightGoal, setWeightGoal] = useState<WeightGoal>("maintain");
  const [macroSplit, setMacroSplit] = useState<MacroSplit>("balanced");
  const [customP, setCustomP] = useState(30);
  const [customC, setCustomC] = useState(40);
  const [customF, setCustomF] = useState(30);
  const [fiberGoal, setFiberGoal] = useState(sex === "female" ? 25 : 30);
  const [waterGoal, setWaterGoal] = useState(64);

  // Sync from BodyProfile on mount
  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setHeightFt(String(Math.floor(saved.height / 12)));
      setHeightIn(String(saved.height % 12));
      setWeightLbs(String(saved.weight));
      setAge(String(saved.age));
      setSex(saved.gender);
      // Map BodyProfile activity levels to GoalSettings activity levels
      const activityMap: Record<string, ActivityLevel> = {
        sedentary: "sedentary",
        light: "lightly",
        moderate: "moderately",
        active: "very",
        "very-active": "extra",
      };
      setActivity(activityMap[saved.activityLevel] || "moderately");
      // Map goal
      if (saved.goal === "lose") setWeightGoal("lose1");
      else if (saved.goal === "gain") setWeightGoal("gain05");
      else setWeightGoal("maintain");
    }
  }, []);

  // Recalc fiber default when sex changes
  useEffect(() => {
    setFiberGoal(sex === "female" ? 25 : 30);
  }, [sex]);

  // TDEE calculation
  const weightKg = Number(weightLbs) * 0.453592;
  const heightCm =
    Number(heightFt) * 30.48 + Number(heightIn) * 2.54;
  const ageNum = Number(age);

  let bmr = 0;
  if (weightKg > 0 && heightCm > 0 && ageNum > 0) {
    if (sex === "male") {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
    }
  }

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);
  const dailyCalories = Math.max(
    1200,
    tdee + WEIGHT_GOAL_OFFSETS[weightGoal]
  );

  // Macro grams
  const split =
    macroSplit === "custom"
      ? { p: customP, c: customC, f: customF }
      : MACRO_SPLITS[macroSplit];

  const proteinG = Math.round((dailyCalories * (split.p / 100)) / 4);
  const carbG = Math.round((dailyCalories * (split.c / 100)) / 4);
  const fatG = Math.round((dailyCalories * (split.f / 100)) / 9);

  function handleSave() {
    const newGoals: UserGoals = {
      dailyCalories,
      proteinGoal: proteinG,
      carbGoal: carbG,
      fatGoal: fatG,
      fiberGoal,
      waterGoalOz: waterGoal,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(newGoals));
    onSave(newGoals);

    // Sync back to BodyProfile localStorage so both stay in sync
    const reverseActivityMap: Record<ActivityLevel, string> = {
      sedentary: "sedentary",
      lightly: "light",
      moderately: "moderate",
      very: "active",
      extra: "very-active",
    };
    saveProfile({
      height: Number(heightFt) * 12 + Number(heightIn),
      weight: Number(weightLbs),
      age: Number(age),
      gender: sex,
      activityLevel: (reverseActivityMap[activity] || "moderate") as "sedentary" | "light" | "moderate" | "active" | "very-active",
      goal: weightGoal.startsWith("lose") ? "lose" : weightGoal === "gain05" ? "gain" : "maintain",
    });
  }

  const bodyFieldsValid =
    Number(age) > 0 && Number(weightLbs) > 0 && Number(heightFt) > 0;

  const inputCls =
    "w-full rounded-xl border border-border bg-[#FAFAF7] px-3 py-2 text-text text-sm " +
    "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 " +
    "focus:border-[#4A7C59] transition-colors";

  const selectCls =
    "w-full rounded-xl border border-border bg-[#FAFAF7] px-3 py-2 text-text text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/30 focus:border-[#4A7C59] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface h-full overflow-y-auto shadow-xl animate-in slide-in-from-right">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-text font-semibold text-xl">
              Goal Calculator
            </h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-text transition-colors p-1"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Body stats */}
          <section className="space-y-3">
            <h3 className="text-dim font-medium text-sm uppercase tracking-wide">
              Your Stats
            </h3>

            {/* Sex toggle */}
            <div>
              <label className="block text-dim text-sm mb-1.5">Sex</label>
              <div className="flex gap-2">
                {(["male", "female"] as Sex[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                      sex === s
                        ? "bg-[#4A7C59] text-white"
                        : "bg-[#FAFAF7] text-dim border border-border hover:bg-[#f0ede6]"
                    }`}
                  >
                    {s === "male" ? "Male" : "Female"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-dim text-sm mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="15"
                max="100"
                className={inputCls}
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-dim text-sm mb-1">
                Weight (lbs)
              </label>
              <input
                type="number"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                min="80"
                max="500"
                className={inputCls}
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-dim text-sm mb-1">Height</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      min="4"
                      max="7"
                      className={inputCls}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                      ft
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      min="0"
                      max="11"
                      className={inputCls}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                      in
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity level */}
            <div>
              <label className="block text-dim text-sm mb-1">
                Activity Level
              </label>
              <select
                value={activity}
                onChange={(e) =>
                  setActivity(e.target.value as ActivityLevel)
                }
                className={selectCls}
              >
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Weight goal */}
          <section className="space-y-3">
            <h3 className="text-dim font-medium text-sm uppercase tracking-wide">
              Goal
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(WEIGHT_GOAL_LABELS).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setWeightGoal(k as WeightGoal)}
                  className={`rounded-xl py-2 px-3 text-sm font-medium transition-all ${
                    weightGoal === k
                      ? "bg-[#4A7C59] text-white"
                      : "bg-[#FAFAF7] text-dim border border-border hover:bg-[#f0ede6]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Calculated TDEE */}
          <div className="bg-[#4A7C59]/10 rounded-2xl p-4 text-center">
            <p className="text-dim text-sm mb-1">Daily Calorie Target</p>
            <p className="text-[#4A7C59] font-bold text-3xl">
              {dailyCalories.toLocaleString()}
            </p>
            <p className="text-muted text-xs mt-1">
              TDEE: {tdee.toLocaleString()} cal
              {WEIGHT_GOAL_OFFSETS[weightGoal] !== 0 &&
                ` ${WEIGHT_GOAL_OFFSETS[weightGoal] > 0 ? "+" : ""}${WEIGHT_GOAL_OFFSETS[weightGoal]}`}
            </p>
          </div>

          {/* Macro split */}
          <section className="space-y-3">
            <h3 className="text-dim font-medium text-sm uppercase tracking-wide">
              Macro Split
            </h3>
            <div className="space-y-2">
              {Object.entries(MACRO_SPLITS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMacroSplit(k as MacroSplit)}
                  className={`w-full text-left rounded-xl py-2.5 px-3 text-sm transition-all ${
                    macroSplit === k
                      ? "bg-[#4A7C59] text-white"
                      : "bg-[#FAFAF7] text-dim border border-border hover:bg-[#f0ede6]"
                  }`}
                >
                  {v.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMacroSplit("custom")}
                className={`w-full text-left rounded-xl py-2.5 px-3 text-sm transition-all ${
                  macroSplit === "custom"
                    ? "bg-[#4A7C59] text-white"
                    : "bg-[#FAFAF7] text-dim border border-border hover:bg-[#f0ede6]"
                }`}
              >
                Custom
              </button>
            </div>

            {macroSplit === "custom" && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Protein %",
                    value: customP,
                    set: setCustomP,
                  },
                  { label: "Carbs %", value: customC, set: setCustomC },
                  { label: "Fat %", value: customF, set: setCustomF },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-dim text-xs mb-1">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      value={f.value}
                      onChange={(e) => f.set(Number(e.target.value))}
                      min="5"
                      max="70"
                      className={inputCls}
                    />
                  </div>
                ))}
                {customP + customC + customF !== 100 && (
                  <p className="col-span-3 text-[#f07070] text-xs">
                    Percentages must add up to 100% (currently{" "}
                    {customP + customC + customF}%)
                  </p>
                )}
              </div>
            )}

            {/* Macro summary */}
            <div className="flex gap-3 text-center">
              {[
                { label: "Protein", g: proteinG, color: "#4A7C59" },
                { label: "Carbs", g: carbG, color: "#5b9cf5" },
                { label: "Fat", g: fatG, color: "#f59e42" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex-1 bg-[#FAFAF7] rounded-xl p-2.5 border border-border"
                >
                  <p
                    className="font-bold text-lg"
                    style={{ color: m.color }}
                  >
                    {m.g}g
                  </p>
                  <p className="text-muted text-xs">{m.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Fiber & Water */}
          <section className="space-y-3">
            <h3 className="text-dim font-medium text-sm uppercase tracking-wide">
              Other Goals
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-dim text-sm mb-1">
                  Fiber (g)
                </label>
                <input
                  type="number"
                  value={fiberGoal}
                  onChange={(e) => setFiberGoal(Number(e.target.value))}
                  min="10"
                  max="60"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-dim text-sm mb-1">
                  Water (oz)
                </label>
                <input
                  type="number"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(Number(e.target.value))}
                  min="32"
                  max="200"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* Save */}
          {!bodyFieldsValid && (
            <p className="text-xs text-hp-orange">
              Please fill in age, weight, and height to calculate your goals.
            </p>
          )}
          <div className="flex gap-3 pt-2 pb-6">
            <button
              onClick={handleSave}
              disabled={
                !bodyFieldsValid ||
                (macroSplit === "custom" &&
                customP + customC + customF !== 100)
              }
              className="flex-1 bg-[#4A7C59] text-white font-medium rounded-xl py-3 px-4
                         hover:bg-[#3a6347] active:scale-[0.98] transition-all text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Goals
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-[#FAFAF7] text-dim font-medium rounded-xl py-3 px-4
                         border border-border hover:bg-[#f0ede6] transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

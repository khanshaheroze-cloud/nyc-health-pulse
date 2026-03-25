"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserProfile {
  height: number;       // total inches
  weight: number;       // lbs
  age: number;
  gender: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active";
  goal: "lose" | "maintain" | "gain";
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const PROFILE_KEY = "pulse_nutrition_profile";

function calculateBMR(p: UserProfile): number {
  const kg = p.weight * 0.453592;
  const cm = p.height * 2.54;
  return p.gender === "male"
    ? 10 * kg + 6.25 * cm - 5 * p.age + 5
    : 10 * kg + 6.25 * cm - 5 * p.age - 161;
}

function calculateTDEE(p: UserProfile): number {
  const mult: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, "very-active": 1.9,
  };
  return Math.round(calculateBMR(p) * (mult[p.activityLevel] || 1.55));
}

export function calculateMacroTargets(p: UserProfile): MacroTargets {
  const tdee = calculateTDEE(p);
  let cal = p.goal === "lose" ? tdee - 500 : p.goal === "gain" ? tdee + 300 : tdee;
  cal = Math.max(cal, 1200);

  let protPct: number, fatPct: number, carbPct: number;
  if (p.goal === "lose") { protPct = 0.35; fatPct = 0.30; carbPct = 0.35; }
  else if (p.goal === "gain") { protPct = 0.25; fatPct = 0.25; carbPct = 0.50; }
  else { protPct = 0.30; fatPct = 0.25; carbPct = 0.45; }

  const minProtein = Math.round(p.weight * 0.8);
  const calcProtein = Math.round((cal * protPct) / 4);
  const protein = Math.max(minProtein, calcProtein);
  const remaining = cal - protein * 4;
  const fat = Math.round((remaining * fatPct / (fatPct + carbPct)) / 9);
  const carbs = Math.round((remaining * carbPct / (fatPct + carbPct)) / 4);

  return { calories: cal, protein, carbs, fat, fiber: p.gender === "male" ? 38 : 25 };
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function saveProfile(p: UserProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }
}

interface BodyProfileProps {
  onTargetsChange: (targets: MacroTargets) => void;
}

export default function BodyProfile({ onTargetsChange }: BodyProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form state
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(10);
  const [weight, setWeight] = useState(170);
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [activityLevel, setActivityLevel] = useState<UserProfile["activityLevel"]>("moderate");
  const [goal, setGoal] = useState<UserProfile["goal"]>("maintain");

  useEffect(() => {
    setMounted(true);
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      onTargetsChange(calculateMacroTargets(saved));
      // Pre-fill form
      setHeightFt(Math.floor(saved.height / 12));
      setHeightIn(saved.height % 12);
      setWeight(saved.weight);
      setAge(saved.age);
      setGender(saved.gender);
      setActivityLevel(saved.activityLevel);
      setGoal(saved.goal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(() => {
    const p: UserProfile = {
      height: heightFt * 12 + heightIn,
      weight, age, gender, activityLevel, goal,
    };
    saveProfile(p);
    setProfile(p);
    const targets = calculateMacroTargets(p);
    onTargetsChange(targets);
    setEditing(false);
  }, [heightFt, heightIn, weight, age, gender, activityLevel, goal, onTargetsChange]);

  if (!mounted) return null;

  // Show compact summary if profile exists and not editing
  if (profile && !editing) {
    const targets = calculateMacroTargets(profile);
    const tdee = (() => {
      const mult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, "very-active": 1.9 };
      const kg = profile.weight * 0.453592;
      const cm = profile.height * 2.54;
      const bmr = profile.gender === "male" ? 10 * kg + 6.25 * cm - 5 * profile.age + 5 : 10 * kg + 6.25 * cm - 5 * profile.age - 161;
      return Math.round(bmr * (mult[profile.activityLevel] || 1.55));
    })();
    return (
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-wide font-semibold">Daily Target</p>
          <p className="text-[22px] font-extrabold text-text">
            {targets.calories} <span className="text-[13px] font-normal text-dim">cal</span>
          </p>
          <p className="text-[10px] text-muted mt-0.5">
            {targets.protein}g protein · {targets.carbs}g carbs · {targets.fat}g fat · TDEE {tdee}
          </p>
        </div>
        <button onClick={() => setEditing(true)} className="text-[11px] text-accent font-semibold hover:underline">
          Edit
        </button>
      </div>
    );
  }

  // Show setup/edit form
  return (
    <div className="bg-accent-bg border border-hp-green/15 rounded-2xl p-5">
      <h3 className="text-[15px] font-bold text-text font-display mb-1">
        {profile ? "Edit Profile" : "Set Up Your Profile"}
      </h3>
      <p className="text-[11px] text-dim mb-4">
        Get personalized calorie and macro targets based on your body and goals.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Height */}
        <div>
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-1">Height</label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <input type="number" value={heightFt} onChange={(e) => setHeightFt(Number(e.target.value))}
                className="w-14 rounded-lg border border-border bg-bg px-2 py-2 text-[13px] text-text" min={3} max={8} />
              <span className="text-[10px] text-muted">ft</span>
            </div>
            <div className="flex items-center gap-1">
              <input type="number" value={heightIn} onChange={(e) => setHeightIn(Number(e.target.value))}
                className="w-14 rounded-lg border border-border bg-bg px-2 py-2 text-[13px] text-text" min={0} max={11} />
              <span className="text-[10px] text-muted">in</span>
            </div>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-1">Weight (lbs)</label>
          <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text" min={80} max={500} />
        </div>

        {/* Age */}
        <div>
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-1">Age</label>
          <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text" min={14} max={99} />
        </div>

        {/* Gender */}
        <div>
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-1">Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Activity Level */}
        <div className="col-span-2">
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-1">Activity Level</label>
          <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as UserProfile["activityLevel"])}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text">
            <option value="sedentary">Sedentary (desk job, no exercise)</option>
            <option value="light">Light (1-3 days/week)</option>
            <option value="moderate">Moderate (3-5 days/week)</option>
            <option value="active">Active (6-7 days/week)</option>
            <option value="very-active">Very Active (athlete/physical job)</option>
          </select>
        </div>

        {/* Goal */}
        <div className="col-span-2">
          <label className="text-[10px] font-semibold text-muted uppercase tracking-wide block mb-1">Goal</label>
          <div className="grid grid-cols-3 gap-2">
            {(["lose", "maintain", "gain"] as const).map((g) => (
              <button key={g} onClick={() => setGoal(g)}
                className={`py-2 rounded-xl text-[12px] font-semibold transition-all ${
                  goal === g ? "bg-hp-green text-white" : "bg-bg border border-border text-text hover:border-hp-green/30"
                }`}>
                {g === "lose" ? "Lose Weight" : g === "maintain" ? "Maintain" : "Build Muscle"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={handleSave}
          className="flex-1 py-3 bg-hp-green text-white rounded-xl text-[13px] font-bold hover:bg-hp-green/90 transition-colors">
          {profile ? "Update Targets" : "Calculate My Targets"}
        </button>
        {profile && (
          <button onClick={() => setEditing(false)}
            className="px-4 py-3 border border-border rounded-xl text-[13px] font-semibold text-dim hover:bg-bg transition-colors">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

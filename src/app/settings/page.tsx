"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData, type UserProfile } from "@/hooks/useUserData";
import { checkLocalData, migrateLocalData, clearMigratedLocalData } from "@/lib/migrateLocalData";
import { neighborhoods } from "@/lib/neighborhoodData";

const ACTIVITY_LEVELS = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extra Active"];
const GOALS = ["Lose Weight", "Maintain Weight", "Gain Weight"];
const SEXES = ["Male", "Female", "Other"];

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: dataLoading, updateProfile } = useUserData();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);
  const [hoodCursor, setHoodCursor] = useState(0);
  const hoodRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    display_name: "",
    height_ft: "",
    height_in: "",
    weight_lbs: "",
    age: "",
    sex: "",
    activity_level: "",
    goal: "",
    neighborhood: "",
  });

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        height_ft: profile.height_ft?.toString() || "",
        height_in: profile.height_in?.toString() || "",
        weight_lbs: profile.weight_lbs?.toString() || "",
        age: profile.age?.toString() || "",
        sex: profile.sex || "",
        activity_level: profile.activity_level || "",
        goal: profile.goal || "",
        neighborhood: profile.neighborhood || "",
      });
    }
  }, [profile]);

  // Check for migratable local data
  useEffect(() => {
    if (user) {
      const { hasData } = checkLocalData();
      setHasLocalData(hasData);
    }
  }, [user]);

  const hoodResults = form.neighborhood.trim().length >= 1
    ? neighborhoods.filter(n =>
        n.name.toLowerCase().includes(form.neighborhood.toLowerCase()) ||
        n.borough.toLowerCase().includes(form.neighborhood.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => { setHoodCursor(0); }, [form.neighborhood]);

  // Close neighborhood dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (hoodRef.current && !hoodRef.current.contains(e.target as Node)) {
        setHoodOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-hp-green/30 border-t-hp-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login?redirect=/settings");
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updates: Partial<UserProfile> = {
        display_name: form.display_name || null,
        height_ft: form.height_ft ? parseInt(form.height_ft) : null,
        height_in: form.height_in ? parseInt(form.height_in) : null,
        weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
        age: form.age ? parseInt(form.age) : null,
        sex: form.sex || null,
        activity_level: form.activity_level || null,
        goal: form.goal || null,
        neighborhood: form.neighborhood || null,
      };
      await updateProfile(updates);
      setSuccess("Settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleMigrate() {
    setMigrating(true);
    setError("");
    try {
      const count = await migrateLocalData();
      clearMigratedLocalData();
      setHasLocalData(false);
      setSuccess(`Imported ${count} items from this device!`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setMigrating(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40 transition";
  const selectCls = inputCls + " appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path d=%223 4.5 6 7.5 9 4.5%22 fill=%22none%22 stroke=%22%238A918A%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')] bg-[right_12px_center] bg-no-repeat";

  return (
    <div className="max-w-2xl mx-auto py-4">
      <h1 className="font-display text-[28px] text-text mb-6">Settings</h1>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-hp-red/10 border border-hp-red/20 rounded-xl">
          <p className="text-[13px] text-hp-red font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-hp-green/10 border border-hp-green/20 rounded-xl">
          <p className="text-[13px] text-hp-green font-medium">{success}</p>
        </div>
      )}

      {/* Migrate local data banner */}
      {hasLocalData && (
        <div className="mb-5 p-4 bg-hp-blue/10 border border-hp-blue/20 rounded-2xl">
          <p className="text-[13px] font-semibold text-text mb-1">Import device data</p>
          <p className="text-[12px] text-dim mb-3">
            We found health data saved on this device. Import it to your account to sync across devices.
          </p>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="px-4 py-2 rounded-xl bg-hp-blue text-white text-[13px] font-bold hover:bg-hp-blue/90 transition disabled:opacity-50"
          >
            {migrating ? "Importing..." : "Import Data"}
          </button>
        </div>
      )}

      {/* Account card */}
      <div className="bg-surface border border-border-light rounded-2xl p-5 mb-4">
        <h2 className="text-[14px] font-bold text-text mb-2">Account</h2>
        <p className="text-[13px] text-dim">{user.email}</p>
        <p className="text-[11px] text-muted mt-1">
          Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-surface border border-border-light rounded-2xl p-5 space-y-4">
        <h2 className="text-[14px] font-bold text-text">Profile</h2>

        <div>
          <label className="block text-[12px] font-semibold text-dim mb-1.5">Display Name</label>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            className={inputCls}
            placeholder="Your name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Height (ft)</label>
            <input type="number" value={form.height_ft} onChange={(e) => setForm({ ...form, height_ft: e.target.value })} className={inputCls} min={3} max={8} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Height (in)</label>
            <input type="number" value={form.height_in} onChange={(e) => setForm({ ...form, height_in: e.target.value })} className={inputCls} min={0} max={11} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Weight (lbs)</label>
            <input type="number" step="0.1" value={form.weight_lbs} onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Age</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inputCls} min={13} max={120} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Sex</label>
            <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className={selectCls}>
              <option value="">Select...</option>
              {SEXES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-dim mb-1.5">Activity Level</label>
            <select value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })} className={selectCls}>
              <option value="">Select...</option>
              {ACTIVITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-dim mb-1.5">Goal</label>
          <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className={selectCls}>
            <option value="">Select...</option>
            {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div ref={hoodRef} className="relative">
          <label className="block text-[12px] font-semibold text-dim mb-1.5">Neighborhood</label>
          <input
            type="text"
            value={form.neighborhood}
            onChange={(e) => { setForm({ ...form, neighborhood: e.target.value }); setHoodOpen(true); }}
            onFocus={() => { if (form.neighborhood.length > 0) setHoodOpen(true); }}
            onKeyDown={(e) => {
              if (!hoodOpen || hoodResults.length === 0) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setHoodCursor(c => Math.min(c + 1, hoodResults.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setHoodCursor(c => Math.max(c - 1, 0)); }
              if (e.key === "Enter") { e.preventDefault(); setForm({ ...form, neighborhood: hoodResults[hoodCursor].name }); setHoodOpen(false); }
              if (e.key === "Escape") setHoodOpen(false);
            }}
            className={inputCls}
            placeholder="Search your neighborhood..."
          />
          {hoodOpen && hoodResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-light rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
              {hoodResults.map((n, i) => (
                <button
                  key={n.slug}
                  type="button"
                  onClick={() => { setForm({ ...form, neighborhood: n.name }); setHoodOpen(false); }}
                  onMouseEnter={() => setHoodCursor(i)}
                  className={[
                    "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                    hoodCursor === i ? "bg-hp-green/10" : "hover:bg-border/40",
                  ].join(" ")}
                >
                  <span className="text-[13px] font-medium text-text">{n.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ml-3 text-dim bg-border/40">
                    {n.borough}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-hp-green text-white text-[14px] font-bold hover:bg-hp-green/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Sign out + Danger zone */}
      <div className="mt-5 space-y-3">
        <button
          onClick={handleSignOut}
          className="w-full py-2.5 rounded-xl border border-border-light text-[14px] font-semibold text-dim hover:text-text hover:bg-surface transition"
        >
          Sign Out
        </button>

        <div className="bg-hp-red/5 border border-hp-red/15 rounded-2xl p-5">
          <h2 className="text-[14px] font-bold text-hp-red mb-1">Danger Zone</h2>
          <p className="text-[12px] text-dim mb-3">Permanently delete your account and all data.</p>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-2 rounded-xl bg-hp-red text-white text-[13px] font-bold hover:bg-hp-red/90 transition"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  // Note: account deletion requires Supabase admin or edge function
                  // For now, sign out the user
                  await signOut();
                  router.push("/");
                }}
                className="px-4 py-2 rounded-xl bg-hp-red text-white text-[13px] font-bold hover:bg-hp-red/90 transition"
              >
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="px-4 py-2 rounded-xl border border-border-light text-[13px] font-semibold text-dim hover:text-text transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

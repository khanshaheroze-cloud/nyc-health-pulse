"use client";

import { useState, useRef, useEffect } from "react";
import { neighborhoods } from "@/lib/neighborhoodData";
import { getSupabase } from "@/lib/supabase/client";

const BOROUGH_COLORS: Record<string, string> = {
  Bronx: "#f07070",
  Brooklyn: "#5b9cf5",
  Manhattan: "#a78bfa",
  Queens: "#2dd4a0",
  "Staten Island": "#f59e42",
};

interface Props {
  userId: string;
  currentName?: string | null;
  onComplete: () => void;
}

export function OnboardingModal({ userId, currentName, onComplete }: Props) {
  const [name, setName] = useState(currentName || "");
  const [neighborhood, setNeighborhood] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results =
    neighborhood.trim().length >= 1
      ? neighborhoods
          .filter(
            (n) =>
              n.name.toLowerCase().includes(neighborhood.toLowerCase()) ||
              n.borough.toLowerCase().includes(neighborhood.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  useEffect(() => {
    setCursor(0);
  }, [neighborhood]);

  function selectNeighborhood(n: (typeof neighborhoods)[0]) {
    setNeighborhood(n.name);
    setShowDropdown(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      selectNeighborhood(results[cursor]);
    }
    if (e.key === "Escape") setShowDropdown(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return onComplete();

      const updates: Record<string, unknown> = {
        onboarding_complete: true,
      };
      if (name.trim()) updates.display_name = name.trim();
      if (neighborhood.trim()) updates.neighborhood = neighborhood.trim();

      await supabase.from("profiles").update(updates).eq("id", userId);

      // Also update auth metadata for immediate display
      if (name.trim()) {
        await supabase.auth.updateUser({
          data: { display_name: name.trim() },
        });
      }

      onComplete();
    } catch {
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from("profiles")
          .update({ onboarding_complete: true })
          .eq("id", userId);
      }
    } catch {
      // non-critical
    }
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-bg rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div
          className="px-6 py-5 text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--color-hp-green) 0%, var(--color-hp-green-light) 100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z"
                fill="white"
                opacity="0.95"
              />
            </svg>
            <h2 className="font-display text-xl font-bold">Welcome to Pulse NYC</h2>
          </div>
          <p className="text-white/80 text-[13px]">
            Let&apos;s personalize your experience
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-4">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? "bg-hp-green" : "bg-hp-green/30"}`}
          />
          <div
            className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? "bg-hp-green" : "bg-hp-green/30"}`}
          />
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div>
              <label className="block text-[12px] font-semibold text-dim mb-1.5">
                What should we call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(2)}
                placeholder="Your first name"
                className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40 transition"
                autoFocus
              />
              <p className="text-[11px] text-muted mt-2">
                This shows up in your daily greeting
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-2.5 text-[13px] text-dim hover:text-text transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 bg-hp-green text-white rounded-xl text-[14px] font-bold hover:bg-hp-green/90 transition"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[12px] font-semibold text-dim mb-1.5">
                What neighborhood are you in?
              </label>
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => {
                    setNeighborhood(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (neighborhood.length > 0) setShowDropdown(true);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search — e.g. Astoria, Park Slope..."
                  className="w-full px-4 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-hp-green/30 focus:border-hp-green/40 transition"
                  autoFocus
                />
                {showDropdown && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-light rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                    {results.map((n, i) => (
                      <button
                        key={n.slug}
                        onClick={() => selectNeighborhood(n)}
                        onMouseEnter={() => setCursor(i)}
                        className={[
                          "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                          cursor === i ? "bg-hp-green/10" : "hover:bg-border/40",
                        ].join(" ")}
                      >
                        <span className="text-[13px] font-medium text-text">
                          {n.name}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ml-3"
                          style={{
                            background: (BOROUGH_COLORS[n.borough] || "#888") + "22",
                            color: BOROUGH_COLORS[n.borough] || "#888",
                          }}
                        >
                          {n.borough}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted mt-2">
                We&apos;ll tailor health data to your area
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 text-[13px] text-dim hover:text-text transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-hp-green text-white rounded-xl text-[14px] font-bold hover:bg-hp-green/90 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Get Started"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

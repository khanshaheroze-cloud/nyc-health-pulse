"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "pulsenyc.distanceBlocksOnboarded";

export function BlocksOnboardingToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Only show if using blocks (default)
    const unit = localStorage.getItem("pulsenyc.distanceUnit");
    if (unit && unit !== "blocks") return;
    setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9990] max-w-sm w-[90vw] animate-slide-up">
      <div className="bg-surface border border-border-light rounded-2xl shadow-lg px-4 py-3 flex items-start gap-3">
        <span className="text-[16px] mt-0.5">🏙️</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-text font-semibold">
            Distance shown in NYC blocks
          </p>
          <p className="text-[11px] text-dim mt-0.5">
            ≈ 1 block per 260 ft. Change to miles in the map toolbar.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-[11px] font-semibold text-dim hover:text-text transition-colors shrink-0"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

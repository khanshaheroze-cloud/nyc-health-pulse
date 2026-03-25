"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DAILY_TIPS } from "@/lib/eatSmartData";

export function EatSmartTeaser() {
  // Defer day-of-year to useEffect to avoid hydration mismatch
  const [dayOfYear, setDayOfYear] = useState(0);
  useEffect(() => {
    setDayOfYear(Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000));
  }, []);
  const samples = [
    DAILY_TIPS[dayOfYear % DAILY_TIPS.length],
    DAILY_TIPS[(dayOfYear + 1) % DAILY_TIPS.length],
    DAILY_TIPS[(dayOfYear + 2) % DAILY_TIPS.length],
  ];

  return (
    <div className="bg-surface border border-border-light rounded-3xl p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥗</span>
          <div>
            <h3 className="font-display text-[20px] text-text leading-snug">Eat Smart NYC</h3>
            <p className="text-[13px] text-muted mt-0.5">Find healthy, affordable meals near you</p>
          </div>
        </div>
        <Link href="/eat-smart" className="text-[13px] font-semibold text-hp-green hover:underline flex-shrink-0">
          Explore meals →
        </Link>
      </div>

      {/* Sample items */}
      <div>
        {samples.map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border-light last:border-0">
            <div className="w-8 h-8 rounded-full bg-surface-sage flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🍽️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-text truncate">{item.item}</p>
              <p className="text-[12px] text-muted">{item.chain}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[16px] font-bold text-hp-green">{item.calories}</p>
              <p className="text-[11px] text-muted">cal</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-muted mt-4">35 NYC chains · Under 600 cal · Updated daily</p>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

/* ── Count-up hook (SSR-safe: starts at target, animates from 0 on client) ── */
function useCountUp(target: number, trigger: boolean, duration = 900) {
  const [value, setValue] = useState(target); // SSR renders real value
  const started = useRef(false);
  const didMount = useRef(false);
  useEffect(() => {
    // On mount, reset to 0 for animation
    if (!didMount.current) {
      didMount.current = true;
      setValue(0);
    }
    if (!trigger || started.current || target === 0) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, trigger, duration]);
  return value;
}

/* ── Data ────────────────────────────────────────────── */

interface Change {
  icon: string;
  label: string;
  detail: string;
  direction: "up" | "down" | "new" | "steady";
  href: string;
  iconBg: string;
  stat?: { value: number; suffix?: string; label: string };
}

const CHANGES: Change[] = [
  {
    icon: "🦠", label: "COVID Hospitalizations",
    detail: "Trending down across all boroughs vs. last month",
    direction: "down", href: "/covid",
    iconBg: "var(--color-accent-bg, rgba(74,124,89,0.1))",
    stat: { value: 1763, label: "90-day total" },
  },
  {
    icon: "🤧", label: "Flu Season",
    detail: "ILI rate declining from Wk51 peak of 11.03%",
    direction: "down", href: "/flu",
    iconBg: "var(--color-surface-sky)",
    stat: { value: 3.84, suffix: "%", label: "current ILI rate" },
  },
  {
    icon: "🐀", label: "Rat Activity",
    detail: "311 complaints remain elevated in Brooklyn & Bronx",
    direction: "up", href: "/environment",
    iconBg: "var(--color-surface-peach)",
  },
  {
    icon: "🍽️", label: "Food Safety",
    detail: "Critical violations stable — inspections ongoing",
    direction: "steady", href: "/food-safety",
    iconBg: "#FDF5ED",
  },
  {
    icon: "🧬", label: "Maternal Health",
    detail: "New section — pregnancy-related mortality & C-section data",
    direction: "new", href: "/maternal-health",
    iconBg: "#F3EFF8",
  },
  {
    icon: "💧", label: "Wastewater Surveillance",
    detail: "COVID + flu wastewater signals now tracked",
    direction: "new", href: "/covid",
    iconBg: "var(--color-surface-sky)",
  },
];

const BADGE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  up:     { bg: "#FDE8E4", text: "var(--color-hp-red)",    label: "Rising" },
  down:   { bg: "#E8F0EA", text: "var(--color-hp-green)",  label: "Declining" },
  new:    { bg: "var(--color-surface-sky)", text: "var(--color-hp-blue)", label: "New" },
  steady: { bg: "#FDF5ED", text: "var(--color-hp-orange)", label: "Stable" },
};

/* ── Component ───────────────────────────────────────── */

function getCurrentWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function WeeklyChanges() {
  const [weekLabel, setWeekLabel] = useState("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWeekLabel(getCurrentWeekLabel());
  }, []);

  // Intersection observer for scroll-triggered count-up
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {/* Section header */}
      <div className="flex items-end justify-between mb-1">
        <div>
          <h2 className="font-display text-[22px] text-text leading-snug">What&apos;s Happening</h2>
          {weekLabel && <p className="text-[12px] text-muted mt-0.5">Week of {weekLabel}</p>}
        </div>
        <Link href="/changelog" className="text-[13px] font-semibold text-hp-green hover:underline flex-shrink-0">
          View all →
        </Link>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {CHANGES.map((c) => (
          <ChangeCard key={c.label} change={c} inView={inView} />
        ))}
      </div>
    </div>
  );
}

/* ── Individual card ────────────────────────────────── */

function ChangeCard({ change: c, inView }: { change: Change; inView: boolean }) {
  const badge = BADGE_STYLE[c.direction];

  // For stat counting — handle decimals
  const isDecimal = c.stat && c.stat.value % 1 !== 0;
  const countTarget = c.stat ? (isDecimal ? Math.round(c.stat.value * 100) : c.stat.value) : 0;
  const counted = useCountUp(countTarget, inView);
  const displayStat = isDecimal ? (counted / 100).toFixed(2) : counted.toString();

  return (
    <Link
      href={c.href}
      className="weekly-card block bg-surface border border-border-light rounded-3xl p-7 transition-all duration-200 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
    >
      {/* Header row: icon + badge */}
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: c.iconBg }}
        >
          {c.icon}
        </div>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.5px] px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[16px] font-bold text-text mt-4">{c.label}</h3>

      {/* Description */}
      <p className="text-[13px] text-dim leading-relaxed mt-1.5">{c.detail}</p>

      {/* Optional stat */}
      {c.stat && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <p className="font-display text-3xl font-extrabold text-text leading-none">
            {displayStat}{c.stat.suffix ?? ""}
          </p>
          <p className="text-[13px] text-muted mt-1">{c.stat.label}</p>
        </div>
      )}
    </Link>
  );
}

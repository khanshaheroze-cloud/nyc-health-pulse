"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

// Content last updated date — update this when CHANGES array is modified
const CONTENT_UPDATED = new Date("2026-04-11");

function getCurrentWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function freshness(): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - CONTENT_UPDATED.getTime()) / 86400000);
  if (diff === 0) return "Updated today";
  if (diff === 1) return "Updated yesterday";
  return `Updated ${diff}d ago`;
}

export function WeeklyChanges() {
  const [weekLabel, setWeekLabel] = useState("");
  const [fresh, setFresh] = useState("");

  useEffect(() => {
    setWeekLabel(getCurrentWeekLabel());
    setFresh(freshness());
  }, []);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="subway-pill bg-hp-green" aria-hidden="true">W</span>
            <h2 className="font-display text-[22px] text-text leading-snug">What&apos;s Happening</h2>
          </div>
          {weekLabel && (
            <p className="text-[12px] text-muted mt-0.5 ml-[34px]">
              Week of {weekLabel} · <span className="text-hp-green font-semibold">{fresh || "Updated today"}</span>
            </p>
          )}
        </div>
        <Link href="/changelog" className="text-[13px] font-semibold text-hp-green hover:underline flex-shrink-0">
          View all →
        </Link>
      </div>

      {/* Compact list card */}
      <div className="bg-surface border border-border-light rounded-2xl overflow-hidden">
        {CHANGES.map((c, i) => {
          const badge = BADGE_STYLE[c.direction];
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[#f3f7f5] ${
                i < CHANGES.length - 1 ? "border-b border-border-light" : ""
              }`}
            >
              {/* Emoji */}
              <span className="text-base flex-shrink-0 w-6 text-center">{c.icon}</span>

              {/* Title */}
              <span className="text-[14px] font-semibold text-text flex-shrink-0 whitespace-nowrap">
                {c.label}
              </span>

              {/* Detail note — truncates on small screens */}
              <span className="text-[13px] text-dim truncate hidden sm:inline">
                {c.detail}
              </span>

              {/* Spacer to push badge right */}
              <span className="flex-1 min-w-0" />

              {/* Badge */}
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.5px] px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                style={{ background: badge.bg, color: badge.text }}
              >
                {badge.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

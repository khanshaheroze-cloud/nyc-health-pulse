"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FreshnessStamp } from "./FreshnessStamp";

/* ── Types ──────────────────────────────────────────── */

interface Change {
  icon: string;
  label: string;
  detail: string;
  direction: "up" | "down" | "new" | "steady";
  href: string;
  iconBg: string;
  stat?: { value: number; suffix?: string; label: string };
}

export interface WeeklyChangesProps {
  totalHosp: number;
  iliRate: number;
  rodentActive: number;
  airAqi: number | null;
  airLabel: string;
  critViolations: number | null;
  pollenLevel: string | null;
  lastUpdated: string;
}

/* ── Dynamic change builder ─────────────────────────── */

function buildChanges(p: WeeklyChangesProps): Change[] {
  const items: Change[] = [];

  // COVID
  const covidDir = p.totalHosp < 2000 ? "down" : p.totalHosp < 3000 ? "steady" : "up";
  const covidDetail = p.totalHosp < 2000
    ? "Continued decline — citywide 90-day total below spring baseline"
    : p.totalHosp < 3000
    ? "Moderate activity — watch for seasonal upticks"
    : "Elevated — hospitalizations rising across boroughs";
  items.push({
    icon: "🦠", label: "COVID Hospitalizations",
    detail: covidDetail,
    direction: covidDir, href: "/covid",
    iconBg: "var(--color-accent-bg, rgba(74,124,89,0.1))",
    stat: { value: p.totalHosp, label: "90-day total" },
  });

  // Flu
  const fluDir = p.iliRate > 5 ? "up" : p.iliRate > 3 ? "steady" : "down";
  const fluDetail = p.iliRate > 5
    ? "Flu season active — ILI rate above baseline"
    : p.iliRate > 3
    ? "Season winding down — ILI rate near off-season baseline"
    : "Off-season — minimal influenza activity";
  items.push({
    icon: "🤧", label: "Flu Season",
    detail: fluDetail,
    direction: fluDir, href: "/flu",
    iconBg: "var(--color-surface-sky)",
    stat: { value: p.iliRate, suffix: "%", label: "current ILI rate" },
  });

  // Rats
  const ratDir = p.rodentActive > 200 ? "up" : p.rodentActive > 150 ? "steady" : "down";
  const ratDetail = p.rodentActive > 200
    ? "Spring surge — 311 rat complaints up in Brooklyn & Bronx"
    : p.rodentActive > 150
    ? "Moderate activity — seasonal levels holding"
    : "Below average — inspections keeping pace";
  items.push({
    icon: "🐀", label: "Rat Activity",
    detail: ratDetail,
    direction: ratDir, href: "/environment",
    iconBg: "var(--color-surface-peach)",
  });

  // Air Quality
  const aqi = p.airAqi;
  const aqiDir = aqi != null && aqi > 100 ? "up" : aqi != null && aqi > 50 ? "steady" : "down";
  const aqiDetail = p.pollenLevel === "High" || p.pollenLevel === "Very High"
    ? "Spring pollen elevated — tree & grass counts high across boroughs"
    : aqi != null && aqi <= 50
    ? "Air quality good — safe for all outdoor activities"
    : aqi != null && aqi <= 100
    ? "Moderate — sensitive groups should take care outdoors"
    : "Air quality concerns — limit prolonged outdoor exertion";
  items.push({
    icon: "🌬️", label: "Air Quality",
    detail: aqiDetail,
    direction: aqiDir, href: "/air-quality",
    iconBg: "var(--color-surface-sage)",
  });

  // Food Safety
  const foodDir = p.critViolations != null
    ? p.critViolations > 5000 ? "up" : p.critViolations > 3000 ? "steady" : "down"
    : "steady";
  const foodDetail = p.critViolations != null
    ? `${p.critViolations.toLocaleString()} critical violations in the last 30 days`
    : "Critical violations stable — outdoor dining inspections ongoing";
  items.push({
    icon: "🍽️", label: "Food Safety",
    detail: foodDetail,
    direction: foodDir, href: "/food-safety",
    iconBg: "#FDF5ED",
  });

  // Street Safety (static for now — crash data isn't on homepage)
  items.push({
    icon: "🏗️", label: "Street Safety",
    detail: "Vision Zero — track fatalities and injuries by borough",
    direction: "steady", href: "/safety",
    iconBg: "#F3EFF8",
  });

  return items;
}

/* ── Styles ─────────────────────────────────────────── */

const BADGE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  up:     { bg: "#FDE8E4", text: "var(--color-hp-red)",    label: "Rising" },
  down:   { bg: "#E8F0EA", text: "var(--color-hp-green)",  label: "Declining" },
  new:    { bg: "var(--color-surface-sky)", text: "var(--color-hp-blue)", label: "New" },
  steady: { bg: "#FDF5ED", text: "var(--color-hp-orange)", label: "Stable" },
};

/* ── Component ──────────────────────────────────────── */

function getCurrentWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function WeeklyChanges(props: WeeklyChangesProps) {
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    setWeekLabel(getCurrentWeekLabel());
  }, []);

  const changes = buildChanges(props);

  return (
    <section role="region" aria-label="What's happening this week in NYC health">
      {/* Section header */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="subway-pill bg-hp-green" aria-hidden="true">W</span>
            <h2 className="font-display text-[22px] text-text leading-snug">What&apos;s Happening</h2>
          </div>
          {weekLabel && (
            <p className="text-[12px] text-muted mt-0.5 ml-[34px]">
              Week of {weekLabel} · <FreshnessStamp lastUpdated={props.lastUpdated} />
            </p>
          )}
        </div>
        <Link href="/changelog" className="text-[13px] font-semibold text-hp-green hover:underline flex-shrink-0">
          View all →
        </Link>
      </div>

      {/* Compact list card */}
      <div className="bg-surface border border-border-light rounded-2xl overflow-hidden">
        {changes.map((c, i) => {
          const badge = BADGE_STYLE[c.direction];
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[#f3f7f5] ${
                i < changes.length - 1 ? "border-b border-border-light" : ""
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
    </section>
  );
}

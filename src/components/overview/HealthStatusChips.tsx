"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────── */

interface StatusItem {
  label: string;
  status: string;
  color: "green" | "yellow" | "orange" | "red";
  href: string;
  detail: string;
}

interface HealthStatusChipsProps {
  airLabel: string;
  airAqi: number | null;
  covidLabel: string;
  totalHosp: number;
  iliRate: number;
  waterSafePct: string;
  pollenLevel: string | null;
  rodentActive: number;
}

/* ── Helpers ─────��───────────────────────────────────────── */

function dotColor(color: "green" | "yellow" | "orange" | "red"): string {
  switch (color) {
    case "green":  return "bg-hp-green";
    case "yellow": return "bg-hp-orange";
    case "orange": return "bg-hp-orange";
    case "red":    return "bg-hp-red";
  }
}

function chipBg(color: "green" | "yellow" | "orange" | "red"): string {
  switch (color) {
    case "green":  return "bg-hp-green/8 border-hp-green/15";
    case "yellow": return "bg-hp-orange/8 border-hp-orange/15";
    case "orange": return "bg-hp-orange/8 border-hp-orange/15";
    case "red":    return "bg-hp-red/8 border-hp-red/15";
  }
}

/* ── Component ──────���────────────────────────────────────── */

export function HealthStatusChips({
  airLabel,
  airAqi,
  covidLabel,
  totalHosp,
  iliRate,
  waterSafePct,
  pollenLevel,
  rodentActive,
}: HealthStatusChipsProps) {
  const [expanded, setExpanded] = useState(false);

  // Build status items
  const airColor = airAqi != null ? (airAqi <= 50 ? "green" : airAqi <= 100 ? "yellow" : "red") : "green";
  const covidColor = covidLabel === "Low" ? "green" : "yellow";
  const fluColor = iliRate > 5 ? "yellow" : iliRate > 3 ? "yellow" : "green";
  const fluLabel = iliRate > 5 ? "Active" : iliRate > 3 ? "Declining" : "Minimal";
  const pollenColor = !pollenLevel || pollenLevel === "Low" || pollenLevel === "None" ? "green" : pollenLevel === "Moderate" ? "yellow" : "orange";
  const ratColor = rodentActive > 200 ? "orange" : rodentActive > 150 ? "yellow" : "green";
  const ratLabel = rodentActive > 200 ? "High" : rodentActive > 150 ? "Moderate" : "Low";

  const items: StatusItem[] = [
    {
      label: "COVID",
      status: covidLabel,
      color: covidColor as StatusItem["color"],
      href: "/covid",
      detail: `${totalHosp.toLocaleString()} hospitalizations (90d)`,
    },
    {
      label: "Flu",
      status: fluLabel,
      color: fluColor as StatusItem["color"],
      href: "/flu",
      detail: `${iliRate}% ILI rate`,
    },
    {
      label: "Air Quality",
      status: airAqi ? `AQI ${airAqi}` : airLabel,
      color: airColor as StatusItem["color"],
      href: "/air-quality",
      detail: airAqi ? `${airLabel} — ${airAqi <= 50 ? "safe for all" : "sensitive groups take care"}` : "",
    },
    {
      label: "Water",
      status: "Safe ✓",
      color: "green",
      href: "/environment",
      detail: `${waterSafePct}% coliform-free`,
    },
    {
      label: "Pollen",
      status: pollenLevel || "Low",
      color: pollenColor as StatusItem["color"],
      href: "/air-quality",
      detail: pollenLevel === "High" ? "Take antihistamines" : "Low impact on most people",
    },
    {
      label: "Rat Activity",
      status: ratLabel,
      color: ratColor as StatusItem["color"],
      href: "/environment",
      detail: `Active rate: ${rodentActive}/1000`,
    },
  ];

  return (
    <div className="rounded-2xl bg-surface border border-border-light p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted">📊 NYC Health Status</p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-dim hover:text-text transition-colors flex items-center gap-1"
        >
          {expanded ? "Collapse" : "Details"}
          <svg
            width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M3 5 L6 8 L9 5" />
          </svg>
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium hover:opacity-80 transition-opacity ${chipBg(item.color)}`}
          >
            <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${dotColor(item.color)}`} />
            <span className="text-text font-semibold">{item.label}</span>
            <span className="text-dim">{item.status}</span>
          </Link>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-light space-y-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between text-[12px] hover:bg-bg/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${dotColor(item.color)}`} />
                <span className="font-semibold text-text">{item.label}</span>
                <span className="text-dim">{item.status}</span>
              </div>
              <span className="text-muted text-[11px]">{item.detail}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

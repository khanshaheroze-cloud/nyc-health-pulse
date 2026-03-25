"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DAILY_TIPS } from "@/lib/eatSmartData";

interface DailyHealthCheckProps {
  airLabel: string;
  airAqi: number | null;
  covidLabel: string;
  totalHosp: number;
  iliRate: number;
  waterSafePct: string;
}

type StatusColor = "green" | "yellow" | "blue";

function dotCss(color: StatusColor): string {
  switch (color) {
    case "green":  return "bg-hp-green";
    case "yellow": return "bg-hp-orange";
    case "blue":   return "bg-hp-blue";
  }
}

function airColor(label: string, aqi: number | null): StatusColor {
  if (aqi !== null) {
    if (aqi <= 50) return "green";
    if (aqi <= 100) return "yellow";
    return "yellow";
  }
  if (label === "Good") return "green";
  return "yellow";
}

function covidColor(label: string): StatusColor {
  if (label === "Low") return "green";
  return "yellow";
}

function fluStatus(rate: number): { label: string; color: StatusColor } {
  if (rate > 5) return { label: "Active", color: "yellow" };
  if (rate > 3) return { label: "Declining", color: "yellow" };
  return { label: "Minimal", color: "green" };
}

export function DailyHealthCheck({ airLabel, airAqi, covidLabel, totalHosp, iliRate, waterSafePct }: DailyHealthCheckProps) {
  const [dateStr, setDateStr] = useState("");
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
  }, []);

  const flu = fluStatus(iliRate);

  const items: { label: string; status: string; note: string; color: StatusColor; href: string }[] = [
    {
      label: "Air Quality",
      status: airAqi ? `AQI ${airAqi}` : airLabel,
      note: airLabel === "Good" ? "Safe for all groups" : airLabel === "Moderate" ? "Sensitive groups take care" : "Limit outdoor activity",
      color: airColor(airLabel, airAqi),
      href: "/air-quality",
    },
    {
      label: "COVID",
      status: covidLabel,
      note: `${totalHosp.toLocaleString()} hospitalizations (90d)`,
      color: covidColor(covidLabel),
      href: "/covid",
    },
    {
      label: "Flu",
      status: flu.label,
      note: `${iliRate}% ILI rate`,
      color: flu.color,
      href: "/flu",
    },
    {
      label: "Water",
      status: "Safe \u2713",
      note: `${waterSafePct}% coliform-free`,
      color: "green" as StatusColor,
      href: "/environment",
    },
  ];

  // Daily food tip — rotates by day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const tip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];

  return (
    <div
      className="ticker-container mt-7 bg-surface border border-border-light rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 flex items-center animate-fade-in-up"
      style={{ animationDelay: "100ms" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Label */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-5">
        <span className="ticker-label text-[10px] sm:text-[11px] font-bold tracking-[1px] uppercase text-muted">
          Today in NYC
        </span>
        {dateStr && (
          <span className="text-[10px] text-dim bg-bg px-2 py-0.5 rounded-full hidden sm:inline">{dateStr}</span>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border flex-shrink-0 mr-5 hidden sm:block" />

      {/* Ticker scroll area */}
      <div
        ref={scrollRef}
        className="ticker-scroll flex items-center gap-5 overflow-x-auto scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className={`ticker-track flex items-center gap-5 ${paused ? "ticker-paused" : ""}`}
        >
          {items.map((item, idx) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 whitespace-nowrap hover:opacity-70 transition-opacity flex-shrink-0 min-h-[44px]"
              style={{ animation: `fadeUp 0.4s ease-out ${idx * 0.1}s both` }}
            >
              <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${dotCss(item.color)}`} />
              <span className="text-[13px] font-semibold text-text">{item.label}</span>
              <span className="text-[13px] text-dim">{item.status}</span>
              <span className="text-[12px] text-muted hidden lg:inline">— {item.note}</span>
            </Link>
          ))}

          {/* Daily food tip */}
          <Link
            href="/eat-smart"
            className="flex items-center gap-2 whitespace-nowrap hover:opacity-70 transition-opacity flex-shrink-0 min-h-[44px]"
          >
            <span className="text-base flex-shrink-0">🥗</span>
            <span className="text-[13px] font-semibold text-text">Lunch idea</span>
            <span className="text-[13px] text-dim">{tip.chain} {tip.item}</span>
            <span className="text-[12px] text-muted hidden lg:inline">— {tip.calories} cal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

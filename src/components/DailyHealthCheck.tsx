"use client";

import { useState, useEffect } from "react";

interface DailyHealthCheckProps {
  airLabel: string;
  airAqi: number | null;
  covidLabel: string;
  totalHosp: number;
  iliRate: number;
  waterSafePct: string;
}

type StatusColor = "green" | "yellow" | "orange" | "red";

function dotColor(color: StatusColor): string {
  switch (color) {
    case "green":  return "bg-hp-green";
    case "yellow": return "bg-hp-yellow";
    case "orange": return "bg-hp-orange";
    case "red":    return "bg-hp-red";
  }
}

function airColor(label: string, aqi: number | null): StatusColor {
  if (aqi !== null) {
    if (aqi <= 50) return "green";
    if (aqi <= 100) return "yellow";
    if (aqi <= 150) return "orange";
    return "red";
  }
  if (label === "Good") return "green";
  if (label === "Moderate") return "yellow";
  return "orange";
}

function covidColor(label: string): StatusColor {
  if (label === "Low") return "green";
  if (label === "Moderate") return "yellow";
  return "red";
}

function fluStatus(rate: number): { label: string; color: StatusColor } {
  if (rate > 5) return { label: "Active", color: "orange" };
  if (rate > 3) return { label: "Declining", color: "yellow" };
  return { label: "Minimal", color: "green" };
}

export function DailyHealthCheck({ airLabel, airAqi, covidLabel, totalHosp, iliRate, waterSafePct }: DailyHealthCheckProps) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
  }, []);
  const flu = fluStatus(iliRate);

  const items: { label: string; status: string; note: string; color: StatusColor }[] = [
    {
      label: "Air Quality",
      status: airAqi ? `AQI ${airAqi}` : airLabel,
      note: airLabel === "Good" ? "Safe for all groups" : airLabel === "Moderate" ? "Sensitive groups take care" : "Limit outdoor activity",
      color: airColor(airLabel, airAqi),
    },
    {
      label: "COVID",
      status: covidLabel,
      note: `${totalHosp.toLocaleString()} hospitalizations (90d)`,
      color: covidColor(covidLabel),
    },
    {
      label: "Flu",
      status: flu.label,
      note: `${iliRate}% ILI rate`,
      color: flu.color,
    },
    {
      label: "Water",
      status: `Safe \u2713`,
      note: `${waterSafePct}% coliform-free`,
      color: "green" as StatusColor,
    },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted">Today in NYC</span>
        {dateStr && <span className="text-[10px] text-dim">{dateStr}</span>}
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:divide-x sm:divide-border gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 sm:px-3 first:sm:pl-0 last:sm:pr-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(item.color)}`} />
            <span className="text-[12px] font-semibold text-text">{item.label}</span>
            <span className="text-[12px] text-dim">{item.status}</span>
            <span className="text-[11px] text-muted hidden md:inline">— {item.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

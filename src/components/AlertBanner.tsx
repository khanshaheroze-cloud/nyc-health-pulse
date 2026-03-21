"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NWSAlert {
  id: string;
  properties: {
    event: string;
    headline: string;
    severity: string;
  };
}

type AlertLevel = "red" | "amber" | "blue";

interface ActiveAlert {
  id: string;
  level: AlertLevel;
  message: string;
  href: string;
  severity: number; // higher = more severe
}

const LEVEL_STYLES: Record<AlertLevel, string> = {
  red:   "bg-hp-red/10 border-hp-red/20 text-hp-red",
  amber: "bg-hp-orange/10 border-hp-orange/20 text-hp-orange",
  blue:  "bg-hp-blue/10 border-hp-blue/20 text-hp-blue",
};

const LEVEL_ICONS: Record<AlertLevel, string> = {
  red:   "⚠",
  amber: "⚠",
  blue:  "❄",
};

function buildAlerts(aqi: number | null, nwsAlerts: NWSAlert[]): ActiveAlert[] {
  const alerts: ActiveAlert[] = [];

  // AQI alerts
  if (aqi != null && aqi > 150) {
    alerts.push({
      id: `aqi-${aqi}`,
      level: "red",
      message: `Air Quality Alert: AQI ${aqi} — Unhealthy. Avoid prolonged outdoor activity.`,
      href: "/air-quality",
      severity: 90,
    });
  } else if (aqi != null && aqi > 100) {
    alerts.push({
      id: `aqi-${aqi}`,
      level: "amber",
      message: `Air Quality Alert: AQI ${aqi} — Unhealthy for Sensitive Groups. Limit outdoor exercise.`,
      href: "/air-quality",
      severity: 70,
    });
  }

  // NWS weather alerts
  for (const alert of nwsAlerts) {
    const event = alert.properties.event;

    if (/heat|excessive heat/i.test(event)) {
      const isExcessive = /excessive/i.test(event);
      alerts.push({
        id: alert.id,
        level: isExcessive ? "red" : "amber",
        message: `${event}: ${alert.properties.headline}`,
        href: "/environment",
        severity: isExcessive ? 85 : 65,
      });
    }

    if (/winter storm|blizzard|wind chill/i.test(event)) {
      const isBlizzard = /blizzard/i.test(event);
      alerts.push({
        id: alert.id,
        level: "blue",
        message: `${event}: ${alert.properties.headline}`,
        href: "/environment",
        severity: isBlizzard ? 80 : 60,
      });
    }
  }

  return alerts.sort((a, b) => b.severity - a.severity);
}

const NWS_URL =
  "https://api.weather.gov/alerts/active?zone=NYZ072,NYZ073,NYZ074,NYZ075,NYZ176";
const DISMISSED_KEY = "pulse-alert-dismissed";

export function AlertBanner({ aqi }: { aqi?: number | null }) {
  const [nwsAlerts, setNwsAlerts] = useState<NWSAlert[]>([]);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    // Load dismissed alert from sessionStorage
    try {
      const stored = sessionStorage.getItem(DISMISSED_KEY);
      if (stored) setDismissed(stored);
    } catch {}

    // Fetch NWS alerts
    fetch(NWS_URL, {
      headers: { "User-Agent": "(pulsenyc.app, contact@pulsenyc.app)" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.features) {
          setNwsAlerts(data.features as NWSAlert[]);
        }
      })
      .catch(() => {});
  }, []);

  const alerts = buildAlerts(aqi ?? null, nwsAlerts);
  const top = alerts[0];

  if (!top || dismissed === top.id) return null;

  const handleDismiss = () => {
    setDismissed(top.id);
    try {
      sessionStorage.setItem(DISMISSED_KEY, top.id);
    } catch {}
  };

  return (
    <div
      className={`relative w-full border rounded-xl px-4 py-2.5 mb-3 ${LEVEL_STYLES[top.level]}`}
    >
      <div className="flex items-center gap-2 pr-6">
        <span className="text-sm flex-shrink-0">{LEVEL_ICONS[top.level]}</span>
        <span className="text-[12px] font-semibold leading-snug">
          {top.message}
        </span>
        <Link
          href={top.href}
          className="text-[12px] font-bold underline underline-offset-2 whitespace-nowrap flex-shrink-0 ml-auto"
        >
          Learn more &rarr;
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-2 text-[14px] leading-none opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss alert"
      >
        &times;
      </button>
    </div>
  );
}

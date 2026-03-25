"use client";

import { useEffect, useState } from "react";

type NotifState = "idle" | "granted" | "denied" | "unsupported";

function getAqiCategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

async function checkAndNotify() {
  try {
    const res = await fetch("/api/airnow");
    if (!res.ok) return;
    const data = await res.json();
    const obs = data?.observations ?? [];
    const maxAqi: number = obs.reduce(
      (m: number, o: { AQI?: number }) => Math.max(m, o.AQI ?? 0),
      0
    );
    if (maxAqi >= 101) {
      new Notification("NYC Air Quality Alert", {
        body: `Current AQI: ${maxAqi} — ${getAqiCategory(maxAqi)}. Check /air-quality for details.`,
        icon: "/apple-icon.png",
        tag: "aqi-alert",
      });
    }
  } catch (_) {
    // Silently fail — non-critical
  }
}

export function AqiNotificationButton() {
  const [state, setState] = useState<NotifState>("idle");

  useEffect(() => {
    if (!("Notification" in window)) {
      setState("unsupported");
      return;
    }

    const perm = Notification.permission;
    const opted = localStorage.getItem("aqi-alerts") === "true";

    if (perm === "denied") {
      setState("denied");
      return;
    }

    if (perm === "granted" && opted) {
      setState("granted");
      // Auto-check on load if already opted in
      checkAndNotify();
    }
  }, []);

  async function handleClick() {
    if (state === "granted") {
      // Disable alerts
      localStorage.removeItem("aqi-alerts");
      setState("idle");
      return;
    }

    if (!("Notification" in window)) return;

    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem("aqi-alerts", "true");
      setState("granted");
      await checkAndNotify();
    } else {
      setState("denied");
    }
  }

  if (state === "unsupported") return null;

  if (state === "denied") {
    return (
      <p className="text-[11px] text-muted mt-2">
        Notifications blocked — enable in browser settings to receive AQI alerts.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleClick}
        className={
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-[12px] font-semibold transition-colors " +
          (state === "granted"
            ? "bg-hp-green/10 border-hp-green/30 text-hp-green hover:bg-hp-green/20"
            : "bg-surface border-border text-dim hover:text-text hover:border-hp-blue/40")
        }
      >
        <span>{state === "granted" ? "🔔" : "🔕"}</span>
        {state === "granted" ? "AQI alerts on — click to disable" : "Get AQI alerts"}
        {state === "granted" && (
          <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
        )}
      </button>
      <p className="text-[10px] text-muted mt-1.5">
        Alerts trigger when AQI ≥ 101 (Unhealthy for Sensitive Groups). Browser must be open.
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

type TimeBand = "dawn" | "morning" | "afternoon" | "golden" | "sunset" | "dusk" | "night";
type WeatherCategory = "clear" | "partlyCloudy" | "overcast" | "rain" | "snow" | "fog";

interface EnvironmentBackdropProps {
  weatherLabel?: string | null;
}

function getTimeBand(): TimeBand {
  const nycHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(new Date()),
    10,
  );
  const nycMin = parseInt(
    new Intl.DateTimeFormat("en-US", { minute: "numeric", timeZone: "America/New_York" }).format(new Date()),
    10,
  );
  const t = nycHour * 60 + nycMin;
  if (t >= 300 && t < 420) return "dawn";
  if (t >= 420 && t < 660) return "morning";
  if (t >= 660 && t < 960) return "afternoon";
  if (t >= 960 && t < 1110) return "golden";
  if (t >= 1110 && t < 1230) return "sunset";
  if (t >= 1230 && t < 1350) return "dusk";
  return "night";
}

function categorizeWeather(label?: string | null): WeatherCategory {
  if (!label) return "clear";
  const l = label.toLowerCase();
  if (l.includes("snow") || l.includes("sleet") || l.includes("ice")) return "snow";
  if (l.includes("rain") || l.includes("drizzle") || l.includes("shower") || l.includes("thunder")) return "rain";
  if (l.includes("fog") || l.includes("mist") || l.includes("haz")) return "fog";
  if (l.includes("overcast")) return "overcast";
  if (l.includes("partly") || l.includes("mostly clear") || l.includes("mostly cloudy")) return "partlyCloudy";
  return "clear";
}

const TIME_GRADIENTS: Record<TimeBand, string> = {
  dawn:      "linear-gradient(180deg, #F8E1C7 0%, #FCE8D2 45%, #FAFAF7 100%)",
  morning:   "linear-gradient(180deg, #DBEAF6 0%, #EAF1F8 50%, #FAFAF7 100%)",
  afternoon: "linear-gradient(180deg, #C6DDF1 0%, #E2ECF6 45%, #FAFAF7 100%)",
  golden:    "linear-gradient(180deg, #F6CDA4 0%, #F8DDC0 45%, #FAFAF7 100%)",
  sunset:    "linear-gradient(180deg, #E08B6E 0%, #ECB892 35%, #F2D5C0 70%, #FAFAF7 100%)",
  dusk:      "linear-gradient(180deg, #3D4769 0%, #6B6F87 40%, #C5C2C0 80%, #FAFAF7 100%)",
  night:     "linear-gradient(180deg, #1B1F36 0%, #2A2F4A 35%, #5A5F7A 75%, #FAFAF7 100%)",
};

function getWeatherOverlay(weather: WeatherCategory, isNight: boolean): string | null {
  switch (weather) {
    case "clear":
      return isNight
        ? "radial-gradient(circle at 80% 10%, rgba(220,228,255,0.32) 0%, rgba(220,228,255,0) 35%)"
        : "radial-gradient(circle at 80% 10%, rgba(255,234,180,0.45) 0%, rgba(255,234,180,0) 35%)";
    case "partlyCloudy":
      return "radial-gradient(ellipse at 25% 22%, rgba(255,255,255,0.5) 0%, transparent 35%), radial-gradient(ellipse at 72% 32%, rgba(255,255,255,0.42) 0%, transparent 32%)";
    case "overcast":
      return "rgba(250,250,250,0.28)";
    case "rain":
      return "rgba(50,60,80,0.18)";
    case "snow":
      return "rgba(220,228,240,0.30)";
    case "fog":
      return "linear-gradient(180deg, rgba(220,225,230,0.32) 0%, transparent 60%)";
    default:
      return null;
  }
}

export function EnvironmentBackdrop({ weatherLabel }: EnvironmentBackdropProps) {
  const [timeBand, setTimeBand] = useState<TimeBand>("afternoon");
  const [prevBand, setPrevBand] = useState<TimeBand | null>(null);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const updateBand = useCallback(() => {
    setTimeBand(prev => {
      const next = getTimeBand();
      if (next !== prev) setPrevBand(prev);
      return next;
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    updateBand();

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const mqHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", mqHandler);

    intervalRef.current = setInterval(updateBand, 60_000);

    const visHandler = () => {
      if (document.visibilityState === "visible") {
        updateBand();
        if (!intervalRef.current) intervalRef.current = setInterval(updateBand, 60_000);
      } else {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = undefined; }
      }
    };
    document.addEventListener("visibilitychange", visHandler);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", visHandler);
      mq.removeEventListener("change", mqHandler);
    };
  }, [updateBand]);

  useEffect(() => {
    if (prevBand) {
      const t = setTimeout(() => setPrevBand(null), 1500);
      return () => clearTimeout(t);
    }
  }, [prevBand]);

  const weather = categorizeWeather(weatherLabel);
  const isNight = timeBand === "night" || timeBand === "dusk";
  const isDark = isNight || timeBand === "sunset";
  const weatherOverlay = getWeatherOverlay(weather, isNight);

  const stars = useMemo(() => {
    if (!isNight) return [];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      w: 1 + (((i * 7 + 3) % 5) / 5) * 1.5,
      top: ((i * 31 + 17) % 55),
      left: ((i * 47 + 11) % 100),
      opacity: 0.4 + (((i * 13 + 7) % 10) / 10) * 0.5,
      dur: 2 + (((i * 11 + 5) % 8) / 8) * 3,
      delay: ((i * 19 + 3) % 30) / 10,
    }));
  }, [isNight]);

  const rainDrops = useMemo(() => {
    if (weather !== "rain" || reducedMotion) return [];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      h: 12 + (((i * 7 + 3) % 5) / 5) * 24,
      left: ((i * 47 + 11) % 100),
      dur: 0.4 + (((i * 13 + 7) % 10) / 10) * 0.4,
      delay: ((i * 19 + 3) % 20) / 10,
    }));
  }, [weather, reducedMotion]);

  const snowFlakes = useMemo(() => {
    if (weather !== "snow" || reducedMotion) return [];
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      w: 2 + (((i * 7 + 3) % 5) / 5) * 3,
      left: ((i * 47 + 11) % 100),
      dur: 3 + (((i * 11 + 5) % 8) / 8) * 4,
      delay: ((i * 19 + 3) % 30) / 10,
    }));
  }, [weather, reducedMotion]);

  if (!mounted) {
    return <div className="absolute inset-0 -z-10" aria-hidden="true" />;
  }

  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Layer 1 — Base time-band gradient */}
      <div
        className="absolute inset-0"
        style={{ background: TIME_GRADIENTS[timeBand], transition: reducedMotion ? "none" : "opacity 1.5s ease" }}
      />
      {prevBand && !reducedMotion && (
        <div
          className="absolute inset-0 animate-[fadeOut_1.5s_ease_forwards]"
          style={{ background: TIME_GRADIENTS[prevBand] }}
        />
      )}

      {/* Layer 2 — Weather overlay */}
      {weatherOverlay && (
        <div className="absolute inset-0" style={{ background: weatherOverlay }} />
      )}

      {/* Rain lines (motion-safe only) */}
      {rainDrops.length > 0 && (
        <div className="absolute inset-0 hidden min-[480px]:block overflow-hidden">
          {rainDrops.map((d) => (
            <span
              key={d.id}
              className="absolute w-px bg-sky-300/30 env-rain"
              style={{
                height: `${d.h}px`,
                left: `${d.left}%`,
                top: "-20px",
                animationDuration: `${d.dur}s`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Snow particles (motion-safe only) */}
      {snowFlakes.length > 0 && (
        <div className="absolute inset-0 hidden min-[480px]:block overflow-hidden">
          {snowFlakes.map((f) => (
            <span
              key={f.id}
              className="absolute rounded-full bg-white/40 env-snow"
              style={{
                width: `${f.w}px`,
                height: `${f.w}px`,
                left: `${f.left}%`,
                top: "-10px",
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer 3 — Night star particles */}
      {isNight && stars.length > 0 && !reducedMotion && (
        <div className="absolute inset-0 hidden min-[480px]:block">
          {stars.map((s) => (
            <span
              key={s.id}
              className="absolute rounded-full bg-white env-star"
              style={{
                width: `${s.w}px`,
                height: `${s.w}px`,
                top: `${s.top}%`,
                left: `${s.left}%`,
                opacity: s.opacity,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer 4 — Contrast guard: full-page fade starting at ~30vh */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "70%",
          background: isDark
            ? "linear-gradient(180deg, transparent 0%, rgba(250,250,247,0.6) 30%, rgba(250,250,247,0.92) 60%, #FAFAF7 100%)"
            : "linear-gradient(180deg, transparent 0%, rgba(250,250,247,0.5) 25%, rgba(250,250,247,0.85) 55%, #FAFAF7 100%)",
        }}
      />

      {/* Layer 5 — Vignette (night/sunset only) */}
      {isDark && (
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)" }}
        />
      )}
    </div>
  );
}

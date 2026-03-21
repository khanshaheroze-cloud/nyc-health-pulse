"use client";

import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  countUp hook — easeOutExpo over ~2 s                              */
/* ------------------------------------------------------------------ */
function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let raf: number;
    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface LiveCounterStripProps {
  calls311: number;
  ratSightings: number;
  inspections: number;
  covidTests: number;
}

/* ------------------------------------------------------------------ */
/*  Single counter cell                                                */
/* ------------------------------------------------------------------ */
function Counter({
  icon,
  label,
  value,
  loading,
}: {
  icon: string;
  label: string;
  value: number | null;
  loading?: boolean;
}) {
  const animated = useCountUp(value ?? 0, 2000);
  const display =
    loading ? "..." : value === null ? "\u2014" : animated.toLocaleString();

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 min-w-0">
      <span className="text-xs leading-none">{icon}</span>
      <span
        className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-white"
        style={{ textShadow: "0 0 12px rgba(45,212,160,.45)" }}
      >
        {display}
      </span>
      <span className="text-[10px] sm:text-xs leading-tight text-center whitespace-nowrap" style={{ color: "rgba(255,255,255,.55)" }}>
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main strip                                                         */
/* ------------------------------------------------------------------ */
export function LiveCounterStrip({
  calls311,
  ratSightings,
  inspections,
  covidTests,
}: LiveCounterStripProps) {
  /* ---- Citi Bike live fetch ---- */
  const [bikes, setBikes] = useState<number | null>(null);
  const [bikesLoading, setBikesLoading] = useState(true);

  const fetchBikes = useCallback(async () => {
    try {
      const res = await fetch("/api/citibike-count");
      if (!res.ok) throw new Error("fail");
      const json = await res.json();
      if (typeof json.totalBikes === "number") setBikes(json.totalBikes);
      else setBikes(null);
    } catch {
      setBikes(null);
    } finally {
      setBikesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBikes();
    const id = setInterval(fetchBikes, 60_000);
    return () => clearInterval(id);
  }, [fetchBikes]);

  /* ---- Render ---- */
  return (
    <section
      aria-label="Right Now in NYC"
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        background:
          "linear-gradient(135deg, #1a2e28 0%, #162622 50%, #1a2e28 100%)",
      }}
    >
      {/* green pulse line along the top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, #2dd4a0, transparent)",
          animation: "pulseSlide 3s ease-in-out infinite",
        }}
      />

      {/* heading — tight */}
      <p className="text-center text-[10px] uppercase tracking-[.2em] pt-2 pb-0.5 font-medium select-none" style={{ color: "rgba(45,212,160,.7)" }}>
        Right Now in NYC
      </p>

      {/* counters */}
      <div className="grid grid-cols-3 sm:flex sm:flex-row sm:justify-evenly sm:items-center pb-2">
        <Counter icon="📞" label="311 Calls Today" value={calls311} />
        <Counter icon="🐀" label="Rat Sightings (30d)" value={ratSightings} />
        <Counter
          icon="🍽️"
          label="Restaurant Inspections"
          value={inspections}
        />
        <Counter icon="🧪" label="COVID Tests (90d)" value={covidTests} />
        <Counter
          icon="🚲"
          label="Citi Bikes Available"
          value={bikes}
          loading={bikesLoading}
        />
      </div>

    </section>
  );
}

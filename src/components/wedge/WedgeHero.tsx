"use client";

import { useState, useEffect } from "react";
import { getTimeBand, isDarkBand } from "@/lib/timeBand";

interface WedgeHeroProps {
  /** Ranked under-$15 picks currently shown; null while loading. The promise
   *  line must never claim "5" when the radius only produced fewer. */
  under15Count?: number | null;
}

export function WedgeHero({ under15Count = null }: WedgeHeroProps) {
  const [time, setTime] = useState("");
  const [hood, setHood] = useState("NYC");
  // Client-only like `time` above: SSR renders the light variant, mount
  // corrects it — same pattern EnvironmentBackdrop uses for its gradient
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      setTime(`${h % 12 || 12}:${m} ${ampm}`);
      setDark(isDarkBand(getTimeBand()));
    };
    fmt();
    const id = setInterval(fmt, 30_000);

    try {
      const saved = localStorage.getItem("pulse-my-neighborhood");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setHood(parsed.name);
      }
    } catch {}

    const hoodHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.name) setHood(detail.name);
      else setHood("NYC");
    };
    window.addEventListener("pulse-my-neighborhood-change", hoodHandler);

    return () => {
      clearInterval(id);
      window.removeEventListener("pulse-my-neighborhood-change", hoodHandler);
    };
  }, []);

  return (
    <div className="text-center pt-12 pb-2 px-4">
      {/* Eyebrow chip */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6E5DE] bg-white mb-6">
        <span className="w-2 h-2 rounded-full bg-[#C24A37] hero-pulse-dot" />
        <span className="text-[12px] font-semibold tracking-[1.5px] uppercase text-muted">
          LIVE · {time} · {hood}
        </span>
      </div>

      {/* H1 — light cream on the dusk/night backdrop (June 2026 audit: dark
          text on the #1B1F36 night gradient failed 4.5:1) */}
      <h1
        className={`font-display leading-[1.05] tracking-[-0.5px] mb-4 ${dark ? "text-[#FAFAF7]" : ""}`}
        style={{ fontSize: "clamp(40px, 6vw, 64px)" }}
      >
        Healthy food,{" "}
        <span className={`hero-swipe ${dark ? "text-[#6FD39A]" : "text-[#2F8F4D]"}`}>near you</span>,
        <br />
        right now.
      </h1>

      {/* Subtitle — the wedge sentence */}
      <p
        className={`text-[18px] max-w-[580px] mx-auto mb-2 ${dark ? "text-[#E9E8E0]" : "text-[#6B716B]"}`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        The {under15Count != null && under15Count > 0 && under15Count < 5 ? under15Count : 5} best macro-friendly meals under $15, within a 10-minute walk — with exactly what to order.
      </p>

      {/* Moat line */}
      <p
        className={`text-[13px] max-w-[580px] mx-auto mb-8 ${dark ? "text-[#CFCFC6]" : "text-[#6B716B]"}`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        We pick the dish. Macros, walk time, what to order — even at the bodega.
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

export function WedgeHero() {
  const [time, setTime] = useState("");
  const [hood, setHood] = useState("NYC");

  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      setTime(`${h % 12 || 12}:${m} ${ampm}`);
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

      {/* H1 */}
      <h1 className="font-display leading-[1.05] tracking-[-0.5px] mb-4" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>
        Healthy food,{" "}
        <em className="text-[#2F8F4D]">near you</em>,
        <br />
        right now.
      </h1>

      {/* Subtitle */}
      <p className="text-[18px] text-[#6B716B] max-w-[580px] mx-auto mb-2" style={{ fontFamily: "var(--font-sans)" }}>
        Tell us where you are. We&apos;ll show you the 5 best healthy spots open in the next 10 minutes — with what to order.
      </p>

      {/* Moat line */}
      <p className="text-[13px] text-[#6B716B] max-w-[580px] mx-auto mb-8" style={{ fontFamily: "var(--font-sans)" }}>
        We pick the dish. Macros, walk time, what to order — even at the bodega.
      </p>
    </div>
  );
}

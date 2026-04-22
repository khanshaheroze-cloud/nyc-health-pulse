"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
  storageKey?: string;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({
  value,
  durationMs = 700,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = false,
  storageKey,
  className,
}: CountUpProps) {
  const [display, setDisplay] = useState<string>("");
  const rafRef = useRef<number>(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let from = 0;
    if (storageKey) {
      const cached = sessionStorage.getItem(`countup-${storageKey}`);
      if (cached != null) from = parseFloat(cached);
    }

    if (prefersReducedMotion || from === value) {
      setDisplay(format(value));
      if (storageKey) sessionStorage.setItem(`countup-${storageKey}`, String(value));
      return;
    }

    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);
      const current = from + (value - from) * eased;
      setDisplay(format(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (storageKey) sessionStorage.setItem(`countup-${storageKey}`, String(value));
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs, storageKey]);

  function format(n: number): string {
    const fixed = n.toFixed(decimals);
    if (!separator) return `${prefix}${fixed}${suffix}`;
    const [int, dec] = fixed.split(".");
    const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${prefix}${dec != null ? `${withCommas}.${dec}` : withCommas}${suffix}`;
  }

  if (!display) return <span className={className}>{format(value)}</span>;
  return <span className={className}>{display}</span>;
}

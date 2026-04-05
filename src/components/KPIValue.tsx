"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Client component that animates a numeric KPI value counting up from 0.
 * Falls back to static display for non-numeric values.
 * Triggered by IntersectionObserver on scroll into view (once).
 *
 * SSR: Renders the real value immediately so crawlers and no-JS users see data.
 * Client: After hydration, animates from 0 to the target on scroll into view.
 */
export function KPIValue({
  value,
  unit,
  className,
}: {
  value: string;
  unit?: string;
  className: string;
}) {
  // Strip commas so "42,357" parses as 42357, not 42 with suffix ",357"
  const stripped = value.replace(/,/g, "");
  const match = stripped.match(/^([<>≤≥~]?)(\d+(?:\.\d+)?)(.*)/);
  const isNumeric = !!match;
  const prefix = match?.[1] ?? "";
  const numericPart = match ? parseFloat(match[2]) : 0;
  const suffix = match?.[3] ?? "";
  const decimals = match?.[2]?.includes(".") ? (match[2].split(".")[1]?.length ?? 0) : 0;
  // If value had commas, we need to format the animated number with commas too
  const needsCommas = value.includes(",");

  // Start with real value for SSR — animation resets to 0 after mount
  const [display, setDisplay] = useState(numericPart);
  const [hydrated, setHydrated] = useState(false);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  // After hydration, set up scroll-triggered count-up animation
  useEffect(() => {
    setHydrated(true);
    const el = ref.current;
    if (!el || !isNumeric || numericPart === 0) return;

    // Reset ref for React strict mode double-mount
    started.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();

          // Reset to 0 and animate up — only when element is in view
          setDisplay(0);

          const duration = 1200;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const p = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
            setDisplay(eased * numericPart);
            if (p < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isNumeric, numericPart]);

  if (!isNumeric) {
    // For long text values (e.g. "Cardiovascular"), scale down font to fit
    const longText = value.length > 10;
    return (
      <div className={`${className} ${longText ? "!text-[clamp(16px,4.5vw,24px)]" : ""} break-words`}>
        {value}
        {unit && <span className="text-[12px] sm:text-[14px] font-sans font-normal text-dim ml-1">{unit}</span>}
      </div>
    );
  }

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : needsCommas
      ? Math.round(display).toLocaleString("en-US")
      : String(Math.round(display));

  return (
    <div ref={ref} className={className}>
      {prefix}{formatted}{suffix}
      {unit && <span className="text-[12px] sm:text-[14px] font-sans font-normal text-dim ml-1">{unit}</span>}
    </div>
  );
}

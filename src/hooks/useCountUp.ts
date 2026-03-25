"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms using requestAnimationFrame.
 * Triggers only once when the element scrolls into view (IntersectionObserver, threshold 0.1).
 * Returns [displayValue, ref] — attach ref to the element to trigger on scroll.
 */
export function useCountUp(
  target: number,
  duration = 1200
): [number, React.RefObject<HTMLElement | null>] {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const p = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [value, ref];
}

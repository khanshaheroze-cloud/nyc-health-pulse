"use client";

import { useEffect, useRef } from "react";

/**
 * Intersection Observer hook — adds `.revealed` class when element enters viewport.
 * Pair with `.reveal-on-scroll` CSS class in globals.css.
 *
 * Safety: forces reveal after 2s timeout if observer never fires.
 * Content is also visible by default via CSS (no hard opacity: 0).
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.1,
  once = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already revealed (e.g., by a previous render)
    if (el.classList.contains("revealed")) return;

    // Immediately reveal if already in or near viewport
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 300) {
      el.classList.add("revealed");
      if (once) return;
    }

    // Safety timeout — force reveal after 2s no matter what
    const safety = setTimeout(() => {
      el.classList.add("revealed");
    }, 2000);

    // Check for IntersectionObserver support
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("revealed");
      clearTimeout(safety);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          clearTimeout(safety);
          if (once) observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px 300px 0px" }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(safety);
    };
  }, [threshold, once]);

  return ref;
}

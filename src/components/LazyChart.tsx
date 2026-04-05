"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

/**
 * Delays rendering chart children until the container scrolls into view.
 * This triggers Recharts' built-in mount animations at the right time.
 */
export function LazyChart({
  children,
  className = "",
  fallbackHeight = "250px",
}: {
  children: ReactNode;
  className?: string;
  fallbackHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "200px" }
    );

    observer.observe(el);

    // Fallback: if observer hasn't fired after 3s, force render
    const timer = setTimeout(() => setVisible(true), 3000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        children
      ) : (
        <div
          className="w-full skeleton rounded-xl"
          style={{ height: fallbackHeight }}
        />
      )}
    </div>
  );
}

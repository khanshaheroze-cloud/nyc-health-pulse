"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** When true, wraps children in a stagger container (each child gets 60ms delay) */
  stagger?: boolean;
}

/**
 * Wrapper component that fades in children when they scroll into view.
 * Uses Intersection Observer via useScrollReveal hook.
 */
export function ScrollReveal({ children, className = "", delay, stagger }: ScrollRevealProps) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${stagger ? "reveal-stagger" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

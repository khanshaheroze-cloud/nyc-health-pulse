"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
}

export function TooltipIcon({ text }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click/touch
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        aria-label="More information"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-[18px] h-[18px] rounded-full border border-dim/50 bg-surface text-dim text-[10px] font-bold flex items-center justify-center hover:border-hp-green hover:text-hp-green transition-colors leading-none cursor-help"
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-[240px] bg-surface border border-border rounded-xl p-3 text-[11px] text-dim z-[100] shadow-xl leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
}

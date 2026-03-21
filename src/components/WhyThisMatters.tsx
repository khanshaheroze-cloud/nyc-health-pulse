"use client";

export function WhyThisMatters({ text }: { text: string }) {
  return (
    <details className="mt-2 ml-1 group">
      <summary className="text-[11px] text-dim cursor-pointer select-none list-none flex items-center gap-1 hover:text-text transition-colors">
        <span className="text-[10px]">ℹ</span>
        <span>Why this matters</span>
        <span className="text-[9px] opacity-60 group-open:rotate-90 transition-transform">▸</span>
      </summary>
      <p className="text-[11px] text-dim leading-relaxed mt-1 ml-4 max-w-prose">
        {text}
      </p>
    </details>
  );
}

"use client";

export type HealthInsight = {
  category: string;
  text: string;
  status: "good" | "warn" | "bad" | "info";
};

const CHIP: Record<HealthInsight["status"], string> = {
  good: "bg-hp-green/15 text-hp-green border border-hp-green/30",
  warn: "bg-hp-yellow/15 text-hp-yellow border border-hp-yellow/30",
  bad:  "bg-hp-red/15 text-hp-red border border-hp-red/30",
  info: "bg-hp-blue/15 text-hp-blue border border-hp-blue/30",
};

export function HealthInsightsTicker({ insights }: { insights: HealthInsight[] }) {
  if (!insights.length) return null;

  return (
    <div className="bg-surface border border-border rounded-xl mb-4 overflow-hidden flex items-center h-12">
      {/* Fixed left label — clearly marked as dashboard data */}
      <div className="flex flex-col justify-center px-3 shrink-0 border-r border-border h-full">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-hp-blue live-pulse" />
          <span className="text-[11px] font-semibold tracking-widest text-hp-blue">PULSE DATA</span>
        </div>
        <span className="text-[9px] text-muted tracking-wide mt-0.5">From our dashboard</span>
      </div>

      {/* Scrolling area */}
      <div className="overflow-hidden flex-1 h-full flex items-center">
        <div
          className="animate-ticker-slow"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "running";
          }}
        >
          {[...insights, ...insights].map((item, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="inline-flex items-center gap-2 whitespace-nowrap text-[12px]">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${CHIP[item.status]}`}>
                  {item.category}
                </span>
                <span className="text-text">{item.text}</span>
              </span>
              <span className="mx-5 text-border/60">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

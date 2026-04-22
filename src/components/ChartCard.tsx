import { WhyThisMatters } from "./WhyThisMatters";
import { LazyChart } from "./LazyChart";
import { FreshnessStamp } from "./FreshnessStamp";

function DataTag({ tag }: { tag: string }) {
  if (tag === "LIVE") return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold text-hp-green flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse flex-shrink-0" />
      LIVE
    </span>
  );
  const isMonth = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(tag);
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
      isMonth
        ? "text-hp-yellow bg-hp-yellow/10 border-hp-yellow/20"
        : "text-dim bg-surface border-border"
    }`}>
      {tag}
    </span>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  tall?: boolean;
  fill?: boolean;
  tag?: string;
  lastUpdated?: string;
  whyItMatters?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  fullWidth,
  tall,
  fill,
  tag,
  lastUpdated,
  whyItMatters,
}: ChartCardProps) {
  return (
    <div
      className={[
        "bg-surface border border-border-light rounded-3xl p-6 card-hover",
        fullWidth ? "col-span-full" : "",
        fill ? "flex flex-col" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-1 gap-2">
        <h3 className="text-[13px] font-bold text-text">{title}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {tag && <DataTag tag={tag} />}
          {lastUpdated && <FreshnessStamp lastUpdated={lastUpdated} compact />}
        </div>
      </div>
      {subtitle && (
        <p className="text-[11px] text-dim mb-4">{subtitle}</p>
      )}
      <LazyChart
        className={fill ? "relative flex-1 min-h-[250px]" : tall ? "h-[320px]" : "h-[250px]"}
        fallbackHeight={tall ? "320px" : "250px"}
      >
        {fill ? <div className="absolute inset-0">{children}</div> : children}
      </LazyChart>
      {whyItMatters && <WhyThisMatters text={whyItMatters} />}
    </div>
  );
}

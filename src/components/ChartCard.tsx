import { WhyThisMatters } from "./WhyThisMatters";

function DataTag({ tag }: { tag: string }) {
  if (tag === "LIVE") return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold text-hp-green flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse flex-shrink-0" />
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
  whyItMatters,
}: ChartCardProps) {
  return (
    <div
      className={[
        "bg-surface border border-border rounded-xl p-[18px]",
        fullWidth ? "col-span-full" : "",
        fill ? "flex flex-col" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-0.5 gap-2">
        <h3 className="text-[13px] font-bold">{title}</h3>
        {tag && <DataTag tag={tag} />}
      </div>
      {subtitle && (
        <p className="text-[11px] text-dim mb-3">{subtitle}</p>
      )}
      <div className={fill ? "relative flex-1 min-h-[250px]" : tall ? "h-[320px]" : "h-[250px]"}>
        {fill ? <div className="absolute inset-0">{children}</div> : children}
      </div>
      {whyItMatters && <WhyThisMatters text={whyItMatters} />}
    </div>
  );
}

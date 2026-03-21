import { TooltipIcon } from "./TooltipIcon";

type BadgeType = "good" | "warn" | "bad";

type KPIColor =
  | "green"
  | "blue"
  | "purple"
  | "orange"
  | "red"
  | "pink"
  | "yellow"
  | "cyan";

type TrendDirection = "up" | "down" | "stable" | "new";

interface KPICardProps {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  badge?: { text: string; type: BadgeType };
  color: KPIColor;
  tag?: string;
  tooltip?: string;
  trend?: { direction: TrendDirection; label: string };
  index?: number;
}

function DataTag({ tag }: { tag: string }) {
  if (tag === "LIVE") return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold text-hp-green flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-heartbeat flex-shrink-0" />
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

const TREND_STYLES: Record<TrendDirection, { icon: string; color: string }> = {
  up:     { icon: "↑", color: "text-hp-red" },
  down:   { icon: "↓", color: "text-hp-green" },
  stable: { icon: "→", color: "text-muted" },
  new:    { icon: "✦", color: "text-hp-blue" },
};

const colorMap: Record<
  KPIColor,
  { border: string; value: string; topBar: string }
> = {
  green:  { border: "border-border", value: "text-hp-green",  topBar: "bg-hp-green" },
  blue:   { border: "border-border", value: "text-hp-blue",   topBar: "bg-hp-blue" },
  purple: { border: "border-border", value: "text-hp-purple", topBar: "bg-hp-purple" },
  orange: { border: "border-border", value: "text-hp-orange", topBar: "bg-hp-orange" },
  red:    { border: "border-border", value: "text-hp-red",    topBar: "bg-hp-red" },
  pink:   { border: "border-border", value: "text-hp-pink",   topBar: "bg-hp-pink" },
  yellow: { border: "border-border", value: "text-hp-yellow", topBar: "bg-hp-yellow" },
  cyan:   { border: "border-border", value: "text-hp-cyan",   topBar: "bg-hp-cyan" },
};

const badgeStyles: Record<BadgeType, string> = {
  good: "text-hp-green bg-hp-green/10",
  warn: "text-hp-yellow bg-hp-yellow/10",
  bad:  "text-hp-red bg-hp-red/10",
};

export function KPICard({ label, value, unit, sub, badge, color, tag, tooltip, trend, index }: KPICardProps) {
  const c = colorMap[color];

  return (
    <div
      className={`relative bg-surface border ${c.border} rounded-xl p-4 overflow-visible animate-fade-in-up`}
      style={{ animationDelay: `${(index ?? 0) * 60}ms` }}
    >
      {/* Colored top bar — rounded-t-xl matches card corners */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${c.topBar}`} />

      <div className="flex items-center justify-between mb-1 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-dim truncate">
            {label}
          </div>
          {tooltip && <TooltipIcon text={tooltip} />}
        </div>
        {tag && <DataTag tag={tag} />}
      </div>

      <div className="flex items-baseline gap-2">
        <div className={`font-display font-bold text-[26px] leading-tight ${c.value}`}>
          {value}
          {unit && (
            <span className="text-[14px] font-sans font-normal text-dim ml-1">
              {unit}
            </span>
          )}
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold animate-trend-bounce ${TREND_STYLES[trend.direction].color}`}>
            {TREND_STYLES[trend.direction].icon} {trend.label}
          </span>
        )}
      </div>

      {(sub || badge) && (
        <div className="flex items-center gap-1.5 mt-1">
          {sub && <span className="text-[11px] text-muted">{sub}</span>}
          {badge && (
            <span
              className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeStyles[badge.type]}`}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

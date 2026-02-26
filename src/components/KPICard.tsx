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

interface KPICardProps {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  badge?: { text: string; type: BadgeType };
  color: KPIColor;
}

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

export function KPICard({ label, value, unit, sub, badge, color }: KPICardProps) {
  const c = colorMap[color];

  return (
    <div className={`relative bg-surface border ${c.border} rounded-xl p-4 overflow-hidden`}>
      {/* Colored top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.topBar}`} />

      <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-dim mb-1">
        {label}
      </div>

      <div className={`font-display font-bold text-[26px] leading-tight ${c.value}`}>
        {value}
        {unit && (
          <span className="text-[14px] font-sans font-normal text-dim ml-1">
            {unit}
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

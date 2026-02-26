interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  tall?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  children,
  fullWidth,
  tall,
}: ChartCardProps) {
  return (
    <div
      className={[
        "bg-surface border border-border rounded-xl p-[18px]",
        fullWidth ? "col-span-full" : "",
      ].join(" ")}
    >
      <h3 className="text-[13px] font-bold mb-0.5">{title}</h3>
      {subtitle && (
        <p className="text-[11px] text-dim mb-3">{subtitle}</p>
      )}
      <div className={tall ? "h-[320px]" : "h-[250px]"}>{children}</div>
    </div>
  );
}

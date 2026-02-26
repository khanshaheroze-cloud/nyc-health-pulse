interface SectionShellProps {
  icon: string;
  title: string;
  description: string;
  accentColor?: string;
  children?: React.ReactNode;
}

export function SectionShell({
  icon,
  title,
  description,
  accentColor = "rgba(45,212,160,.12)",
  children,
}: SectionShellProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: accentColor }}
        >
          {icon}
        </div>
        <h2 className="font-display font-bold text-[18px]">{title}</h2>
      </div>
      <p className="text-[12px] text-dim mb-5 pl-9">{description}</p>

      {children ?? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-dim text-sm">This section is coming soon.</p>
          <p className="text-muted text-xs mt-1">
            Charts and data will be added in the next phase.
          </p>
        </div>
      )}
    </>
  );
}

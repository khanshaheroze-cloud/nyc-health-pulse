import Link from "next/link";

interface SectionShellProps {
  icon: string;
  title: string;
  description: string;
  accentColor?: string;
  breadcrumb?: { label: string; href: string }[];
  children?: React.ReactNode;
}

export function SectionShell({
  icon,
  title,
  description,
  accentColor = "rgba(45,212,160,.12)",
  breadcrumb,
  children,
}: SectionShellProps) {
  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="pt-6 sm:pt-10 animate-fade-in-up">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-3 text-[12px] text-muted">
            <Link href="/" className="text-hp-green hover:underline">Overview</Link>
            {breadcrumb.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                <span className="text-border">/</span>
                {i === breadcrumb.length - 1 ? (
                  <span className="text-dim">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-hp-green hover:underline">{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: accentColor }}
          >
            {icon}
          </div>
          <h1 className="font-display text-[24px] sm:text-[32px] text-text leading-snug">{title}</h1>
        </div>
        <p className="text-[14px] sm:text-[16px] text-dim max-w-[600px] mt-2 leading-relaxed">{description}</p>
      </div>

      {/* Content area */}
      <div className="mt-5 sm:mt-8">
        {children ?? (
          <div className="section-card text-center animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <p className="text-dim text-sm">This section is coming soon.</p>
            <p className="text-muted text-xs mt-1">
              Charts and data will be added in the next phase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

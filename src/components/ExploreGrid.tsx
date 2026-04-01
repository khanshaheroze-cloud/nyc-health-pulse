import Link from "next/link";

const FEATURES = [
  { href: "/run-routes", emoji: "\uD83C\uDFC3", title: "Smart Run Routes", desc: "AI-optimized routes scored on 4 factors", stat: "Park-biased routing" },
  { href: "/nutrition-tracker", emoji: "\uD83C\uDF7D", title: "Nutrition Tracker", desc: "Log meals & track macros with NYC foods", stat: "300+ foods" },
  { href: "/building-health", emoji: "\uD83C\uDFE0", title: "Building Safety", desc: "HPD violations, complaints & tenant info", stat: "Any NYC address" },
  { href: "/covid", emoji: "\uD83D\uDCCA", title: "Health Dashboards", desc: "COVID, Flu, Chronic Disease & more", stat: "10 dashboards" },
  { href: "/find-care", emoji: "\uD83E\uDE7A", title: "Find Care", desc: "Urgent care, hospitals & providers near you", stat: "NPPES data" },
  { href: "/air-quality", emoji: "\uD83C\uDF21", title: "Air Quality", desc: "Real-time AQI, PM2.5, ozone by borough", stat: "EPA AirNow" },
  { href: "/neighborhood", emoji: "\uD83C\uDFD8", title: "Neighborhoods", desc: "Health scores for 42 NYC neighborhoods", stat: "UHF42 index" },
  { href: "/food-safety", emoji: "\uD83D\uDEE1", title: "Food Safety", desc: "Restaurant inspection grades & violations", stat: "DOHMH data" },
  { href: "/safety", emoji: "\uD83D\uDEA6", title: "Street Safety", desc: "Vision Zero crash data by borough", stat: "NYPD data" },
];

export function ExploreGrid() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[11px] font-bold tracking-[2px] uppercase text-muted whitespace-nowrap">
          Explore Pulse NYC
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group flex items-start gap-3 rounded-2xl border border-border-light bg-surface p-4 hover:shadow-md hover:-translate-y-px transition-all cursor-pointer"
          >
            {/* Emoji icon */}
            <div className="w-10 h-10 rounded-xl bg-accent-bg flex items-center justify-center text-lg shrink-0">
              {f.emoji}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text group-hover:text-accent transition-colors leading-tight">
                {f.title}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <path d="M4.5 2.5l3.5 3.5-3.5 3.5"/>
                </svg>
              </p>
              <p className="text-xs text-muted mt-0.5 leading-snug">
                {f.desc}
              </p>
              <span className="inline-block mt-1.5 text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                {f.stat}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

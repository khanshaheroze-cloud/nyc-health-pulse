"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

/** Primary nav — 8 top-level items. Mobile hamburger reveals Health Data sub-pages. */
const primaryNav = [
  { href: "/", label: "Overview" },
  { href: "/neighborhood", label: "Neighborhoods" },
  { href: "/air-quality", label: "Air Quality" },
  { href: "/food-safety", label: "Food Safety" },
  { href: "/grocery", label: "Grocery" },
  { href: "/building-health", label: "Building Safety" },
  { href: "/safety", label: "Street Safety" },
  { href: "/health-data", label: "Health Data", isGroup: true },
  { href: "/active", label: "Active" },
  { href: "/wellness", label: "Wellness" },
  { href: "/find-care", label: "Find Care" },
];

/** Sub-pages under "Health Data" — shown in mobile dropdown */
const healthDataItems = [
  { href: "/covid", label: "COVID-19" },
  { href: "/flu", label: "Flu / ILI" },
  { href: "/chronic-disease", label: "Chronic Disease" },
  { href: "/maternal-health", label: "Maternal Health" },
  { href: "/overdose", label: "Overdose & Lead" },
  { href: "/demographics", label: "Demographics" },
  { href: "/environment", label: "Environment" },
  { href: "/nutrition", label: "Nutrition" },
];

/** All navigable items for path matching */
const allItems = [...primaryNav.filter(i => !i.isGroup), ...healthDataItems];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [healthDropdown, setHealthDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Is a Health Data sub-page active?
  const isHealthDataActive = healthDataItems.some(
    (i) => i.href === pathname || pathname.startsWith(i.href)
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setHealthDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="mb-6">
      {/* Desktop nav — 8-item horizontal bar */}
      <div className="hidden md:block">
        <nav className="flex gap-1 pb-2.5 border-b border-border">
          {primaryNav.map(({ href, label, isGroup }) => {
            if (isGroup) {
              // Health Data dropdown
              return (
                <div key={href} className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setHealthDropdown(!healthDropdown)}
                    className={[
                      "text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border transition-all duration-150 flex-shrink-0 inline-flex items-center gap-1",
                      isHealthDataActive
                        ? "text-hp-green bg-hp-green/10 border-hp-green/20"
                        : "text-dim border-transparent hover:text-text hover:bg-surface",
                    ].join(" ")}
                  >
                    {label}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`transition-transform ${healthDropdown ? "rotate-180" : ""}`}>
                      <path d="M2.5 4 L5 6.5 L7.5 4" />
                    </svg>
                  </button>
                  {healthDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl p-2 shadow-lg z-50 min-w-[180px]">
                      {healthDataItems.map(({ href: h, label: l }) => {
                        const active = h === pathname || pathname.startsWith(h);
                        return (
                          <Link
                            key={h}
                            href={h}
                            onClick={() => setHealthDropdown(false)}
                            className={[
                              "block text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all",
                              active
                                ? "text-hp-green bg-hp-green/10"
                                : "text-dim hover:text-text hover:bg-bg",
                            ].join(" ")}
                          >
                            {l}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border transition-all duration-150 flex-shrink-0",
                  isActive
                    ? "text-hp-green bg-hp-green/10 border-hp-green/20"
                    : "text-dim border-transparent hover:text-text hover:bg-surface",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile nav — current page label + hamburger */}
      <div className="md:hidden border-b border-border pb-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-hp-green truncate">
            {allItems.find(i => i.href === pathname || (i.href !== "/" && pathname.startsWith(i.href)))?.label ?? "Overview"}
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg border border-border text-dim hover:text-text hover:bg-surface transition-colors flex-shrink-0"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </>
              ) : (
                <>
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <line x1="2" y1="12" x2="14" y2="12" />
                </>
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="mt-2 bg-surface border border-border rounded-xl p-3 space-y-3">
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-muted mb-1.5">Main</p>
              <div className="flex flex-wrap gap-1">
                {primaryNav.filter(i => !i.isGroup).map(({ href, label }) => {
                  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all",
                        isActive
                          ? "text-hp-green bg-hp-green/10 border-hp-green/20"
                          : "text-dim border-border hover:text-text hover:bg-bg",
                      ].join(" ")}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-muted mb-1.5">Health Data</p>
              <div className="flex flex-wrap gap-1">
                {healthDataItems.map(({ href, label }) => {
                  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all",
                        isActive
                          ? "text-hp-green bg-hp-green/10 border-hp-green/20"
                          : "text-dim border-border hover:text-text hover:bg-bg",
                      ].join(" ")}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Borough color bar */}
      <div
        aria-hidden="true"
        title="Bronx · Brooklyn · Manhattan · Queens · Staten Island"
        style={{
          height: "3px",
          background: "linear-gradient(to right, #EE352E 20%, #FF6319 20% 40%, #2850AD 40% 60%, #B933AD 60% 80%, #6CBE45 80%)",
          borderRadius: "0 0 2px 2px",
        }}
      />
    </div>
  );
}

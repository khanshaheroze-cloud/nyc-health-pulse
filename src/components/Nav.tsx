"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/* ── Navigation structure ─────────────────────────────────── */

interface NavItem {
  href: string;
  label: string;
  dropdown?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/neighborhood", label: "Neighborhoods" },
  { href: "/air-quality", label: "Air Quality" },
  { href: "/workouts", label: "Workouts" },
  { href: "/run-routes", label: "Run Routes" },
  { href: "/eat-smart", label: "Food & Nutrition", dropdown: "food" },
  { href: "/building-health", label: "Building Safety" },
  { href: "/health-data", label: "Health Data", dropdown: "health" },
  { href: "/find-care", label: "Find Care" },
];

const FOOD_ITEMS = [
  { href: "/eat-smart", label: "Eat Smart" },
  { href: "/nutrition-tracker", label: "Nutrition Tracker" },
  { href: "/restaurants", label: "Restaurant Guide" },
  { href: "/food-safety", label: "Food Safety" },
  { href: "/grocery", label: "Grocery Prices" },
  { href: "/nutrition", label: "Nutrition Data" },
];

const HEALTH_ITEMS = [
  { href: "/covid", label: "COVID-19" },
  { href: "/flu", label: "Flu / ILI" },
  { href: "/chronic-disease", label: "Chronic Disease" },
  { href: "/maternal-health", label: "Maternal Health" },
  { href: "/overdose", label: "Overdose & Lead" },
  { href: "/demographics", label: "Demographics" },
  { href: "/environment", label: "Environment" },
  { href: "/wellness", label: "Wellness" },
  { href: "/safety", label: "Street Safety" },
];

/* ── Chevron icon ─────────────────────────────────────────── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <path d="M2.5 4 L5 6.5 L7.5 4" />
    </svg>
  );
}

/* ── Mobile overlay (portalled to document.body) ──────────── */
function MobileOverlay({
  pathname,
  mobileAccordion,
  setMobileAccordion,
  onClose,
}: {
  pathname: string;
  mobileAccordion: string | null;
  setMobileAccordion: (v: string | null) => void;
  onClose: () => void;
}) {
  const isHealthActive = HEALTH_ITEMS.some(i => i.href === pathname || pathname.startsWith(i.href));
  const isFoodActive = FOOD_ITEMS.some(i => i.href === pathname || pathname.startsWith(i.href));

  return createPortal(
    <>
      {/* Backdrop — full screen, click to close */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99998,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Slide-in panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "85%",
          maxWidth: "360px",
          zIndex: 99999,
          background: "var(--color-bg, #FAFAF7)",
          overflowY: "auto",
          animation: "slideInFromRight 0.3s ease-out",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header: logo + close */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--color-border-light, #F0ECE6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #4A7C59, #6B9E7A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 15.3C8.4 14.7 2 10.2 2 6.5 2 4.2 3.8 2.5 5.8 2.5c1.2 0 2.3.6 3.2 1.7.9-1.1 2-1.7 3.2-1.7 2 0 3.8 1.7 3.8 4 0 3.7-6.4 8.2-7 8.8z" fill="white" opacity="0.95"/>
              </svg>
            </div>
            <span style={{ fontSize: "19px", fontWeight: 800, color: "var(--color-text, #1A1D1A)" }}>
              Pulse<span style={{ color: "var(--color-hp-green, #4A7C59)" }}>NYC</span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px",
              border: "1px solid var(--color-border, #E8E4DE)",
              background: "transparent",
              color: "var(--color-dim, #5C635C)",
              cursor: "pointer",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div style={{ padding: "8px" }}>
          {NAV_ITEMS.map((item) => {
            const isDropdown = !!item.dropdown;
            const isActive = isDropdown
              ? (item.dropdown === "food" ? isFoodActive : isHealthActive)
              : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
            const isAccordionOpen = mobileAccordion === item.dropdown;
            const dropdownItems = item.dropdown === "food" ? FOOD_ITEMS : item.dropdown === "health" ? HEALTH_ITEMS : [];

            if (isDropdown) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setMobileAccordion(isAccordionOpen ? null : item.dropdown!)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      fontSize: "17px",
                      fontWeight: 600,
                      color: isActive ? "var(--color-hp-green, #4A7C59)" : "var(--color-text, #1A1D1A)",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--color-border-light, #F0ECE6)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {item.label}
                    <Chevron open={isAccordionOpen} />
                  </button>
                  {isAccordionOpen && (
                    <div style={{ background: "var(--color-surface-sage, #EEF2ED)", padding: "4px 0", opacity: 0.85 }}>
                      {dropdownItems.map(({ href, label }) => {
                        const subActive = href === pathname || pathname.startsWith(href);
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            style={{
                              display: "block",
                              padding: "12px 32px",
                              fontSize: "15px",
                              fontWeight: 500,
                              color: subActive ? "var(--color-hp-green, #4A7C59)" : "var(--color-dim, #5C635C)",
                              textDecoration: "none",
                            }}
                          >
                            {label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: "block",
                  padding: "16px",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: isActive ? "var(--color-hp-green, #4A7C59)" : "var(--color-text, #1A1D1A)",
                  borderBottom: "1px solid var(--color-border-light, #F0ECE6)",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Main Nav component ───────────────────────────────────── */

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const isHealthActive = HEALTH_ITEMS.some(i => i.href === pathname || pathname.startsWith(i.href));
  const isFoodActive = FOOD_ITEMS.some(i => i.href === pathname || pathname.startsWith(i.href));

  // Mounted guard for portal
  useEffect(() => { setMounted(true); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on ESC
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div ref={navRef}>
      {/* ── Desktop nav (inline in header) ─────────────────── */}
      <nav className="hidden md:flex items-center justify-end gap-0.5" style={{ overflow: "visible" }}>
        {NAV_ITEMS.map((item) => {
          const isDropdown = !!item.dropdown;
          const isActive = isDropdown
            ? (item.dropdown === "food" ? isFoodActive : isHealthActive)
            : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
          const isOpen = openDropdown === item.dropdown;
          const dropdownItems = item.dropdown === "food" ? FOOD_ITEMS : item.dropdown === "health" ? HEALTH_ITEMS : [];

          if (isDropdown) {
            return (
              <div key={item.label} style={{ position: "relative" }}>
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : item.dropdown!)}
                  className={[
                    "text-[13px] font-medium px-2.5 py-1.5 rounded-xl transition-all duration-200 flex-shrink-0 inline-flex items-center gap-1 whitespace-nowrap",
                    isActive
                      ? "text-hp-green bg-accent-bg"
                      : "text-dim hover:text-text hover:bg-surface-warm",
                  ].join(" ")}
                >
                  {item.label}
                  <Chevron open={isOpen} />
                </button>
                {isOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "6px",
                      minWidth: "200px",
                      zIndex: 99999,
                      background: "var(--color-surface, #FFFFFF)",
                      border: "1px solid var(--color-border, #E8E4DE)",
                      borderRadius: "16px",
                      padding: "8px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    }}
                  >
                    {dropdownItems.map(({ href, label }) => {
                      const active = href === pathname || pathname.startsWith(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpenDropdown(null)}
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 500,
                            padding: "8px 12px",
                            borderRadius: "12px",
                            transition: "all 0.15s",
                            color: active ? "var(--color-hp-green, #4A7C59)" : "var(--color-dim, #5C635C)",
                            background: active ? "var(--color-accent-bg, #E8F0EA)" : "transparent",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = "var(--color-surface-warm, #F5F0EB)";
                              e.currentTarget.style.color = "var(--color-text, #1A1D1A)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--color-dim, #5C635C)";
                            }
                          }}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "text-[13px] font-medium px-2.5 py-1.5 rounded-xl transition-all duration-200 flex-shrink-0 whitespace-nowrap",
                isActive
                  ? "text-hp-green bg-accent-bg"
                  : "text-dim hover:text-text hover:bg-surface-warm",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile hamburger button ────────────────────────── */}
      <div className="md:hidden flex justify-end">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-dim hover:text-text hover:bg-surface-warm btn-press transition-colors flex-shrink-0"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="17" y2="6" />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="14" x2="17" y2="14" />
          </svg>
        </button>
      </div>

      {/* ── Mobile overlay — portalled to document.body ───── */}
      {mounted && mobileOpen && (
        <MobileOverlay
          pathname={pathname}
          mobileAccordion={mobileAccordion}
          setMobileAccordion={setMobileAccordion}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}

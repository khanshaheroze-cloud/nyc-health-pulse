"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => setOpen(false), [pathname]);

  if (loading) return null;

  // Not signed in — show compact sign-in link
  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-dim border border-border-light hover:text-hp-green hover:border-hp-green/30 transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="5" r="3" />
          <path d="M2 14c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5" />
        </svg>
        Sign In
      </Link>
    );
  }

  // Signed in — avatar + dropdown
  const initial = (
    user.user_metadata?.display_name?.[0] ||
    user.email?.[0] ||
    "P"
  ).toUpperCase();

  const displayName =
    user.user_metadata?.display_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl hover:bg-surface-warm transition-colors"
        aria-label="Account menu"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
          style={{ background: "linear-gradient(135deg, var(--color-hp-green) 0%, var(--color-hp-green-light) 100%)" }}
        >
          {initial}
        </div>
        <span className="hidden lg:inline text-[12px] font-semibold text-dim max-w-[80px] truncate">
          {displayName}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted">
          <path d="M2.5 4 5 6.5 7.5 4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 bg-surface border border-border-light rounded-xl shadow-lg z-[200] overflow-hidden animate-fade-in-up">
          <div className="px-3.5 py-2.5 border-b border-border-light">
            <p className="text-[12px] font-bold text-text truncate">{user.user_metadata?.display_name || displayName}</p>
            <p className="text-[10px] text-muted truncate">{user.email}</p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-medium text-dim hover:bg-surface-warm hover:text-text transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="2.5" />
              <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
            </svg>
            Settings
          </Link>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-medium text-hp-red hover:bg-hp-red/5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M6 8h8" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

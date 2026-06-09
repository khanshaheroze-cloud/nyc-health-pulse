"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { CHAINS } from "@/lib/restaurantData";
import { ChainMenu } from "@/components/ChainMenu";
import { openDirections } from "@/lib/openDirections";
import { GENERIC_TEMPLATES, type GenericTemplate } from "@/lib/genericRestaurants";
import { inferMealType, mealMatches, type MealCategory } from "@/lib/inferMealType";
import type { ResultSpot } from "./LiveResultsStrip";

interface SpotModalProps {
  spot: ResultSpot | null;
  onClose: () => void;
  meal?: MealCategory;
}

export function SpotModal({ spot, onClose, meal }: SpotModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const savedOverflowRef = useRef("");
  const scrollYRef = useRef(0);

  const chain = spot && !spot.isGeneric ? CHAINS.find(c => c.slug === spot.slug) : null;
  const template: GenericTemplate | undefined = spot?.isGeneric && spot.category
    ? GENERIC_TEMPLATES.find(t => t.category === spot.category)
    : undefined;

  const isOpen = !!(spot && (chain || template));

  const stableClose = useCallback(() => onClose(), [onClose]);

  /* ── Body scroll lock + focus trap + Escape ────────────── */
  useEffect(() => {
    if (!isOpen) return;

    prevFocusRef.current = document.activeElement as HTMLElement;
    savedOverflowRef.current = document.body.style.overflow;
    scrollYRef.current = window.scrollY;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stableClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = savedOverflowRef.current;
      window.scrollTo(0, scrollYRef.current);
      prevFocusRef.current?.focus();
    };
  }, [isOpen, stableClose]);

  if (!isOpen || !spot) return null;

  const displayName = chain?.name ?? spot.name;
  const displayCategory = chain?.category ?? spot.category ?? "";
  const displayEmoji = chain?.emoji ?? template?.emoji ?? "📍";
  const displayPrice = chain?.priceRange ?? spot.priceRange;
  const orderingTip = chain?.orderingTip ?? template?.orderingTip;
  const isGeneric = spot.isGeneric ?? false;

  const templatePicks = template?.picks ?? [];
  const BEVERAGE_RE = /\b(latte|cappuccino|espresso|americano|matcha|cold.?brew|drip coffee|chai|macchiato|mocha|frappuccino)\b/i;
  const UNHEALTHY_SNACK_RE = /\b(glazed\s*donut|frosted\s*donut|cheese\s*danish|cinnamon\s*roll|chocolate\s*croissant)\b/i;
  const visiblePicks = meal && template
    ? [...templatePicks]
        .filter(p => {
          if (BEVERAGE_RE.test(p.name)) {
            if (meal === "lunch" || meal === "dinner") return false;
            if (meal !== "coffee" && p.protein < 5) return false;
          }
          if (meal === "snack") {
            if (p.cal > 450) return false;
            if (p.protein > 25) return false;
            if (UNHEALTHY_SNACK_RE.test(p.name)) return false;
          }
          if (meal === "coffee" && p.protein >= 15 && p.cal >= 400) return false;
          if ((meal === "lunch" || meal === "dinner") && p.cal < 250 && p.protein < 10) return false;
          return true;
        })
        .sort((a, b) => {
          const aInferred = inferMealType(a.name, undefined, template.category);
          const bInferred = inferMealType(b.name, undefined, template.category);
          const aPri = aInferred === meal ? 2 : mealMatches(aInferred, meal) ? 1 : 0;
          const bPri = bInferred === meal ? 2 : mealMatches(bInferred, meal) ? 1 : 0;
          return bPri - aPri;
        })
    : templatePicks;

  return createPortal(
    /* Backdrop — flex-centers the modal on desktop, anchors bottom on mobile */
    <div
      className="fixed inset-0 z-[1000] flex items-end min-[880px]:items-center justify-center bg-[rgba(15,17,22,0.45)] backdrop-blur-sm"
      onClick={stableClose}
      aria-hidden="true"
    >
      {/* Modal panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="outline-none flex flex-col bg-white w-full max-h-[88vh] rounded-t-[18px] rounded-b-none min-[880px]:w-[min(520px,90vw)] min-[880px]:max-h-[82vh] min-[880px]:rounded-[18px] motion-safe:animate-sheetUp min-[880px]:motion-safe:animate-modalIn"
        style={{
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header — sticky */}
        <div className="flex-shrink-0 border-b border-[#E6E5DE] px-5 py-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl flex-shrink-0">{displayEmoji}</span>
              <h2 id="spot-modal-title" className="font-display text-[19px] text-[#1A1A1A] truncate">
                {displayName}
              </h2>
            </div>
            <p className="text-[12px] text-[#6B716B] mt-0.5">
              {displayCategory}{displayPrice ? ` · ${"$".repeat(displayPrice)}` : ""}{spot.walkMinutes != null ? ` · ${spot.walkMinutes} min walk` : ""}{spot.grade ? ` · Grade ${spot.grade}` : ""}
            </p>
            {spot.address && (
              <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#6B716B]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="truncate">{spot.address}</span>
                <button
                  onClick={() => openDirections({ lat: spot.lat, lng: spot.lng, address: spot.address, name: displayName })}
                  className="text-[12px] text-[#2A6BC9] font-medium whitespace-nowrap hover:underline flex-shrink-0"
                >
                  Get directions &rarr;
                </button>
              </div>
            )}
          </div>
          <button
            ref={closeRef}
            onClick={stableClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F5F0EB] transition-colors text-[#6B716B] hover:text-[#1A1A1A] flex-shrink-0 ml-3"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {/* Generic disclaimer */}
          {isGeneric && (
            <div className="mb-4 p-3 bg-[#FBF6E8] border border-[#F0E3B5] rounded-xl text-[13px] text-[#8A6A1C]">
              <strong>PulseNYC pick</strong> &middot; &plusmn;15% variance expected. These are our recommended healthy choices for a typical {displayCategory.toLowerCase()} like this. {displayName}&apos;s actual items and prices may differ slightly. Macros based on standard USDA composition.
            </div>
          )}

          {/* Ordering tip */}
          {orderingTip && (
            <div className="mb-4 p-3 bg-[#E8F0EA] rounded-xl text-[13px] text-[#4A7C59]">
              <strong>Pro tip:</strong> {orderingTip}
            </div>
          )}

          {/* Generic template picks */}
          {isGeneric && visiblePicks.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="text-[13px] font-semibold text-[#1A1A1A] uppercase tracking-[0.5px]">Top picks</h3>
              {visiblePicks.map((pick, i) => (
                <div key={i} className="bg-white border border-[#E6E5DE] rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">{pick.name}</p>
                      {pick.description && (
                        <p className="text-[11px] text-[#6B716B] mt-0.5">{pick.description}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B716B] whitespace-nowrap flex-shrink-0">
                      ~{pick.cal} cal &middot; {pick.protein}g P
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chain menu (full component) */}
          {chain && <ChainMenu chain={chain} />}
        </div>

        {/* Footer — sticky */}
        <div className="flex-shrink-0 border-t border-[#E6E5DE] px-5 py-3 flex items-center justify-between">
          <button className="text-[12px] text-[#6B716B] hover:text-[#1A1A1A] hover:underline">
            Report an error
          </button>
          <a
            href={`/restaurants/${spot.slug}`}
            className="text-[12px] text-[#2A6BC9] font-medium hover:underline"
          >
            Open full page &rarr;
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}

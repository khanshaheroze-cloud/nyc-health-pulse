"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { CHAINS } from "@/lib/restaurantData";
import { ChainMenu } from "@/components/ChainMenu";
import { openDirections } from "@/lib/openDirections";
import { GENERIC_TEMPLATES, type GenericTemplate } from "@/lib/genericRestaurants";
import { type MealCategory } from "@/lib/inferMealType";
import { formatMonthYear } from "@/lib/freshness";
import type { ResultSpot } from "./LiveResultsStrip";

interface SpotModalProps {
  spot: ResultSpot | null;
  onClose: () => void;
  /** Kept for API compatibility — picks are now meal-filtered server-side */
  meal?: MealCategory;
}

export function SpotModal({ spot, onClose }: SpotModalProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("wrong-item");
  const [reportNotes, setReportNotes] = useState("");
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent" | "error">("idle");
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

  // Single source of truth: the card and this modal both render the API's
  // topPicks — they can never disagree on the recommended order again.
  // (Previously the modal re-filtered template picks with its own copy of the
  // meal guards, so card and modal could headline different dishes.)
  const visiblePicks = spot.topPicks ?? [];
  const inspectedLabel = formatMonthYear(spot.inspectedAt);

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
              {displayCategory}{displayPrice ? ` · ${"$".repeat(displayPrice)}` : ""}{spot.walkMinutes != null ? ` · ${spot.walkMinutes} min walk` : ""}{spot.grade ? ` · Grade ${spot.grade}` : ""}{inspectedLabel ? ` · Inspected ${inspectedLabel}` : ""}
            </p>
            {spot.verifiedBadge === "verified" && (
              <p className="text-[11px] font-bold text-[#2F8F4D] mt-0.5">
                ✓ Menu verified by PulseNYC — we check menus, prices, and hours in person
              </p>
            )}
            {(spot.locationCount ?? 1) > 1 && spot.otherLocations && spot.otherLocations.length > 0 && (
              <details className="mt-1">
                <summary className="text-[12px] text-[#2A6BC9] cursor-pointer select-none">
                  {spot.locationCount} locations nearby — this is the closest
                </summary>
                <ul className="mt-1 space-y-0.5">
                  {spot.otherLocations.map((loc, i) => (
                    <li key={i} className="text-[11px] text-[#6B716B]">
                      {loc.address} · {loc.walkMinutes} min walk{loc.grade ? ` · Grade ${loc.grade}` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            )}
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

          {/* Top picks — same data as the result card (single source) */}
          {visiblePicks.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="text-[13px] font-semibold text-[#1A1A1A] uppercase tracking-[0.5px]">Top picks</h3>
              {visiblePicks.map((pick, i) => (
                <div key={i} className={`bg-white border rounded-xl p-3 ${i === 0 ? "border-[#2F8F4D]/40" : "border-[#E6E5DE]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1A1A]">
                        {i === 0 && <span className="text-[#2F8F4D] mr-1">★</span>}
                        {pick.name}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#6B716B] whitespace-nowrap flex-shrink-0">
                      {isGeneric ? "~" : ""}{pick.calories} cal &middot; {pick.protein}g P
                    </span>
                  </div>
                </div>
              ))}
              {spot.bestDrink && (
                <p className="text-[12px] text-[#6B716B] pl-1">
                  Best drink: <span className="text-[#1A1A1A] font-medium">{spot.bestDrink.name}</span> · {spot.bestDrink.calories} cal
                </p>
              )}
              {isGeneric && (
                <p className="text-[11px] text-[#9A9F9A] pl-1">Estimates — actual items vary ±15% by location.</p>
              )}
            </div>
          )}

          {/* No coherent pick: show ordering guidance instead of a named dish */}
          {visiblePicks.length === 0 && isGeneric && (
            <div className="mb-4 p-3 bg-white border border-[#E6E5DE] rounded-xl text-[13px] text-[#6B716B]">
              <p className="font-semibold text-[#1A1A1A] mb-1">Smart ordering tips</p>
              <p>{spot.orderingTip || template?.orderingTip || "Ask for grilled over fried, sauce on the side, and add a vegetable side — that combination works at almost any kitchen."}</p>
            </div>
          )}

          {/* Chain menu (full component) */}
          {chain && <ChainMenu chain={chain} />}
        </div>

        {/* Footer — sticky */}
        <div className="flex-shrink-0 border-t border-[#E6E5DE] px-5 py-3">
          {reportOpen && reportState !== "sent" && (
            <form
              className="mb-3 space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setReportState("sending");
                try {
                  const res = await fetch("/api/eat-smart/report-error", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      venueId: spot.slug,
                      venueName: displayName,
                      address: spot.address ?? null,
                      field: reportReason,
                      message: reportNotes.slice(0, 500),
                      reportedAt: new Date().toISOString(),
                    }),
                  });
                  setReportState(res.ok ? "sent" : "error");
                } catch {
                  setReportState("error");
                }
              }}
            >
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-[12px] border border-[#E6E5DE] rounded-lg px-2 py-1.5 bg-white text-[#1A1A1A]"
              >
                <option value="wrong-item">An item listed isn&apos;t on the real menu</option>
                <option value="wrong-macros">Calories or protein look wrong</option>
                <option value="closed">This place is closed / wrong location</option>
                <option value="wrong-name">The name is wrong or misspelled</option>
                <option value="other">Something else</option>
              </select>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                maxLength={500}
                placeholder="Details (optional)"
                rows={2}
                className="w-full text-[12px] border border-[#E6E5DE] rounded-lg px-2 py-1.5 bg-white text-[#1A1A1A] resize-none"
              />
              <div className="flex items-center gap-2">
                <button type="submit" disabled={reportState === "sending"} className="text-[12px] font-semibold text-white bg-[#2F8F4D] rounded-lg px-3 py-1.5 disabled:opacity-50">
                  {reportState === "sending" ? "Sending…" : "Send report"}
                </button>
                <button type="button" onClick={() => setReportOpen(false)} className="text-[12px] text-[#6B716B] hover:underline">Cancel</button>
                {reportState === "error" && <span className="text-[11px] text-[#C04545]">Couldn&apos;t send — try again</span>}
              </div>
            </form>
          )}
          {reportState === "sent" && (
            <p className="mb-3 text-[12px] text-[#2F8F4D]">Thanks — your report is in the review queue.</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReportOpen((v) => !v)}
                className="text-[12px] text-[#6B716B] hover:text-[#1A1A1A] hover:underline"
              >
                Report an error
              </button>
              <a href="/methodology" className="text-[12px] text-[#6B716B] hover:text-[#1A1A1A] hover:underline">
                How PulseScore works
              </a>
            </div>
            {/* Un-verified generic venues have no /restaurants/* page — linking would 404 */}
            {(!isGeneric || spot.verifiedSlug) && (
              <a
                href={`/restaurants/${spot.verifiedSlug ?? spot.slug}`}
                className="text-[12px] text-[#2A6BC9] font-medium hover:underline"
              >
                Open full page &rarr;
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

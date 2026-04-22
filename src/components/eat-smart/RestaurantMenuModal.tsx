"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { MenuItem, MenuCategoryId, RestaurantMenu, AvailabilityStatus, MealTab } from "@/lib/eat-smart/types";
import { quickLogMenuItem, removeQuickLog, countTodayLogs } from "@/lib/eat-smart/quickLog";
import type { QuickLogSource } from "@/lib/eat-smart/quickLog";
import { CategoryPills } from "./CategoryPills";
import { MenuItemCard } from "./MenuItemCard";
import { QuickLogToast } from "./QuickLogToast";

interface RestaurantMenuModalProps {
  menu: RestaurantMenu | null;
  distance?: string;         // e.g. "3 blocks"
  grade?: string | null;     // DOHMH grade
  tabContext?: MealTab;       // which meal tab triggered this modal
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ToastState {
  itemName: string;
  restaurantName: string;
  calories: number;
  protein: number;
  logId: string;
  duplicateCount?: number;
}

export function RestaurantMenuModal({ menu, distance, grade, tabContext, open, onOpenChange }: RestaurantMenuModalProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | MenuCategoryId>("all");
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Reset category when menu changes
  useEffect(() => {
    if (!menu) return;
    // For cafes, default to Drinks tab
    if (menu.restaurantType === "cafe" && menu.items.some(i => i.isDrink)) {
      setActiveCategory("drinks");
    } else {
      setActiveCategory("all");
    }
  }, [menu]);

  // Active items only (hide discontinued)
  const activeItems = useMemo(() => {
    if (!menu) return [];
    return menu.items.filter(i => i.availabilityStatus !== "discontinued");
  }, [menu?.items]);

  // Get unique categories present in active items
  const categories = useMemo(() => {
    const cats = new Set<MenuCategoryId>();
    activeItems.forEach(i => cats.add(i.category));
    return Array.from(cats);
  }, [activeItems]);

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    const items = activeCategory === "all"
      ? activeItems
      : activeItems.filter(i => i.category === activeCategory);

    // Sort: best pick pinned #1, then food by PulseScore, then drinks by DrinkScore
    // In the "drinks" category tab, all items are drinks so the food/drink split is moot
    const isDrinksTab = activeCategory === "drinks";
    return [...items].sort((a, b) => {
      if (a.isBestPick && !b.isBestPick) return -1;
      if (!a.isBestPick && b.isBestPick) return 1;
      // In "all" tab: food above drinks (scores aren't comparable)
      if (!isDrinksTab) {
        if (!a.isDrink && b.isDrink) return -1;
        if (a.isDrink && !b.isDrink) return 1;
      }
      const aScore = a.isDrink ? (a.drinkScore ?? a.pulseScore) : a.pulseScore;
      const bScore = b.isDrink ? (b.drinkScore ?? b.pulseScore) : b.pulseScore;
      return bScore - aScore;
    });
  }, [activeItems, activeCategory]);

  // Oldest verification date across all items with source data
  const oldestVerified = useMemo(() => {
    if (!menu) return null;
    let oldest: string | null = null;
    for (const item of menu.items) {
      const d = item.source?.lastVerified;
      if (d && (!oldest || d < oldest)) oldest = d;
    }
    return oldest;
  }, [menu?.items]);

  const verifiedAgeDays = useMemo(() => {
    if (!oldestVerified) return null;
    return Math.floor((Date.now() - new Date(oldestVerified).getTime()) / 86400000);
  }, [oldestVerified]);

  const handleLog = useCallback((item: MenuItem) => {
    if (!menu) return;
    const result = quickLogMenuItem({
      item,
      restaurantName: menu.restaurantName,
      restaurantId: menu.restaurantId,
      source: "menu-item-log" as QuickLogSource,
    });

    setLoggedIds(prev => new Set(prev).add(item.id));

    const dupCount = countTodayLogs(item.id);
    setToast({
      itemName: item.name,
      restaurantName: menu.restaurantName,
      calories: item.calories,
      protein: item.protein,
      logId: result.logId,
      duplicateCount: dupCount > 1 ? dupCount : undefined,
    });
  }, [menu]);

  const handleUndo = useCallback((logId: string) => {
    removeQuickLog(logId);
    setToast(null);
  }, []);

  const isCuisineTemplate = menu?.source === "cuisine-template";

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          {/* Overlay — portaled to body */}
          <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/40 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />

          {/* Content — portaled to body, bottom sheet on mobile, centered on desktop */}
          <Dialog.Content
            className="fixed z-[9999] outline-none
              inset-x-0 bottom-0 md:inset-auto
              md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
              w-full md:max-w-[560px] max-h-[85vh] md:max-h-[80vh]
              bg-surface rounded-t-3xl md:rounded-3xl overflow-hidden
              flex flex-col animate-slide-up"
            onOpenAutoFocus={(e) => {
              // Prevent auto-focus scroll jump — let the modal container receive focus naturally
              e.preventDefault();
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-border-light">
              {/* Drag handle (mobile) */}
              <div className="md:hidden w-10 h-1 rounded-full bg-border mx-auto mb-3" />

              <div className="flex items-start justify-between">
                <div>
                  <Dialog.Title className="text-[18px] font-bold text-text">
                    {menu?.restaurantName}
                  </Dialog.Title>
                  <Dialog.Description className="text-[12px] text-dim mt-0.5">
                    {menu?.cuisine}
                    {distance && <> · {distance}</>}
                    {grade && <> · Grade {grade}</>}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-border-light text-dim hover:text-text hover:bg-surface-warm transition-colors"
                    aria-label="Close menu"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </Dialog.Close>
              </div>

              {/* Limited healthy options banner */}
              {menu?.limitedHealthyOptions && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-hp-yellow/8 border border-hp-yellow/20">
                  <p className="text-[11px] text-dim leading-relaxed">
                    ⚠️ This chain has limited healthy options — here&apos;s the best we&apos;ve got.
                  </p>
                </div>
              )}

              {/* Cuisine template disclaimer */}
              {isCuisineTemplate && menu && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-caution/8 border border-caution/20">
                  <p className="text-[11px] text-dim leading-relaxed">
                    ℹ️ <strong>Generic menu — ±15% variance expected.</strong>{" "}
                    This is a typical menu for a {menu.cuisine.toLowerCase()} spot.
                    {" "}{menu.restaurantName}&apos;s actual items and prices may differ.
                    Macros based on standard USDA composition.
                  </p>
                </div>
              )}

              {/* Category pills */}
              <div className="mt-3">
                <CategoryPills
                  categories={categories}
                  active={activeCategory}
                  onSelect={setActiveCategory}
                />
              </div>
            </div>

            {/* Drinks disclaimer */}
            {activeCategory === "drinks" && (
              <div className="px-6 pt-2">
                <p className="text-[10px] text-muted italic">
                  Drinks scored on protein, sugar, and calories — not comparable to food scores.
                </p>
              </div>
            )}

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {showReportForm ? (
                <MenuErrorReport
                  items={activeItems}
                  restaurantName={menu?.restaurantName ?? ""}
                  onSubmit={() => { setShowReportForm(false); setReportSubmitted(true); }}
                  onCancel={() => setShowReportForm(false)}
                />
              ) : reportSubmitted ? (
                <div className="text-center py-6">
                  <p className="text-[14px] font-semibold text-hp-green mb-1">Thanks for the report!</p>
                  <p className="text-[12px] text-dim">We&apos;ll review it within 72 hours.</p>
                  <button
                    onClick={() => setReportSubmitted(false)}
                    className="text-[12px] text-hp-blue hover:underline mt-3"
                  >
                    ← Back to menu
                  </button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[13px] text-muted">
                    No {activeCategory !== "all" ? activeCategory : ""} picks curated for this spot yet.
                  </p>
                </div>
              ) : (
                filteredItems.map((item, i) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    rank={i + 1}
                    onLog={handleLog}
                    isLogged={loggedIds.has(item.id)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-border-light">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted">
                  {isCuisineTemplate ? "PulseNYC cuisine guide" : "PulseNYC curated"} · Last updated{" "}
                  {menu ? new Date(menu.lastUpdated).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                  {oldestVerified && (
                    <>
                      {" · Verified: "}
                      <span className={
                        verifiedAgeDays != null && verifiedAgeDays > 90 ? "text-hp-red font-semibold" :
                        verifiedAgeDays != null && verifiedAgeDays > 60 ? "text-hp-yellow font-semibold" :
                        ""
                      }>
                        {new Date(oldestVerified).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </>
                  )}
                </p>
                <button
                  onClick={() => setShowReportForm(true)}
                  className="text-[10px] text-hp-blue hover:underline flex-shrink-0"
                >
                  Report an error →
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast — rendered outside dialog portal so it's always visible */}
      {toast && (
        <QuickLogToast
          {...toast}
          onUndo={handleUndo}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}

/* ── Report-an-Error Form ─────────────────────────────────────── */

const ERROR_REASONS = [
  "An item listed isn't on the real menu anymore",
  "The calories or protein looks wrong",
  "The restaurant pulled this item",
  "The modifier hint doesn't work at this location",
  "Something else",
] as const;

function MenuErrorReport({
  items,
  restaurantName,
  onSubmit,
  onCancel,
}: {
  items: MenuItem[];
  restaurantName: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSending(true);
    try {
      await fetch("/api/eat-smart/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName,
          reason,
          itemId: itemId || null,
          itemName: items.find(i => i.id === itemId)?.name ?? null,
          notes: notes.trim() || null,
          reportedAt: new Date().toISOString(),
        }),
      });
    } catch { /* swallow — best-effort */ }
    setSending(false);
    onSubmit();
  };

  return (
    <div className="py-2">
      <h3 className="text-[15px] font-bold text-text mb-3">What&apos;s wrong with this menu?</h3>

      <div className="space-y-2 mb-4">
        {ERROR_REASONS.map(r => (
          <label key={r} className="flex items-start gap-2 cursor-pointer group">
            <input
              type="radio"
              name="error-reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="mt-0.5 accent-hp-green"
            />
            <span className="text-[13px] text-dim group-hover:text-text transition-colors">{r}</span>
          </label>
        ))}
      </div>

      <label className="block mb-3">
        <span className="text-[11px] text-muted">Item (optional)</span>
        <select
          value={itemId}
          onChange={e => setItemId(e.target.value)}
          className="mt-1 block w-full text-[13px] px-3 py-2 rounded-xl border border-border-light bg-surface text-text"
        >
          <option value="">— Select an item —</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </label>

      <label className="block mb-4">
        <span className="text-[11px] text-muted">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          className="mt-1 block w-full text-[13px] px-3 py-2 rounded-xl border border-border-light bg-surface text-text resize-none"
          placeholder="Any details that would help us fix this..."
        />
      </label>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!reason || sending}
          className="flex-1 px-4 py-2 rounded-xl text-[13px] font-semibold bg-hp-green text-white disabled:opacity-40 transition-opacity"
        >
          {sending ? "Sending…" : "Submit"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-[13px] font-semibold border border-border-light text-dim hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

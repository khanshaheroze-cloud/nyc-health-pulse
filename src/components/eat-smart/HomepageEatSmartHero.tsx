"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { detectMealTab } from "@/lib/eat-smart/types";
import type { MenuItem, RestaurantMenu, MealTab } from "@/lib/eat-smart/types";
import { quickLogMenuItem, removeQuickLog, countTodayLogs } from "@/lib/eat-smart/quickLog";
import { getRestaurantMenu } from "@/lib/eat-smart/useRestaurantMenu";
import { formatDistance } from "@/lib/eat-smart/distance";
import { useDistanceUnit } from "@/lib/eat-smart/useDistanceUnit";
import { QuickLogToast } from "./QuickLogToast";
import { LazyMenuModal, preloadMenuModal } from "./LazyMenuModal";
import { BlocksOnboardingToast } from "./BlocksOnboardingToast";

const TABS: { id: MealTab; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "🍳" },
  { id: "lunch", label: "Lunch", emoji: "🥗" },
  { id: "dinner", label: "Dinner", emoji: "🍽️" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
];

const TAB_COPY: Record<MealTab, { headline: string; sub: string }> = {
  breakfast: { headline: "Breakfast in 10 seconds.", sub: "Real food near you — skip the bodega bacon-egg-and-cheese." },
  lunch: { headline: "Lunch in 10 seconds.", sub: "Skip the decision fatigue." },
  dinner: { headline: "Dinner on your way home.", sub: "Healthy picks near you." },
  coffee: { headline: "Coffee break.", sub: "Cafes near you — from black to middle-ground." },
};

interface NearbyResult {
  name: string;
  cuisine: string;
  grade: string | null;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  chainSlug: string | null;
  isHealthy: boolean;
}

interface EnrichedCard {
  result: NearbyResult;
  menu: RestaurantMenu;
  topPick: MenuItem;
  distanceLabel: string;
}

interface ToastState {
  itemName: string;
  restaurantName: string;
  calories: number;
  protein: number;
  logId: string;
  duplicateCount?: number;
}

/* ── Cafe detection ────────────────────────────────────── */

const CAFE_CUISINE_KEYWORDS = /coffee|caf[eé]|espresso|bakery|roaster/i;

function isCafeRestaurant(menu: RestaurantMenu): boolean {
  return menu.restaurantType === "cafe" || CAFE_CUISINE_KEYWORDS.test(menu.cuisine);
}

/* ── Fallback picks when no geolocation ─────────────────── */

const FALLBACK_CHAINS = ["sweetgreen", "chipotle", "chick-fil-a", "cava", "just-salad", "starbucks"];

function getFallbackCards(tab: MealTab): EnrichedCard[] {
  const slugs = tab === "coffee"
    ? ["starbucks", "dunkin", "pret"]
    : tab === "breakfast"
    ? ["starbucks", "dunkin", "panera", "pret", "mcdonalds", "subway"]
    : FALLBACK_CHAINS;

  const cards: EnrichedCard[] = [];
  for (const slug of slugs) {
    const menu = getRestaurantMenu(slug, "", slug, slug);
    if (!menu) continue;

    // Find best pick for this tab — food for meals, drinks for coffee
    const sorted = [...menu.items]
      .filter(i => {
        if (i.availabilityStatus === "discontinued") return false;
        if (tab === "coffee") return i.isDrink;
        if (tab === "breakfast") return !i.isDrink && i.category === "breakfast";
        return !i.isDrink;
      })
      .sort((a, b) => {
        const aScore = a.isDrink ? (a.drinkScore ?? a.pulseScore) : a.pulseScore;
        const bScore = b.isDrink ? (b.drinkScore ?? b.pulseScore) : b.pulseScore;
        return bScore - aScore;
      });
    const topPick = sorted[0];
    if (!topPick) continue;

    cards.push({
      result: {
        name: menu.restaurantName,
        cuisine: menu.cuisine,
        grade: "A",
        address: "",
        lat: 0, lng: 0,
        distance: 0,
        chainSlug: slug,
        isHealthy: true,
      },
      menu,
      topPick,
      distanceLabel: "",
    });
    if (cards.length >= 3) break;
  }
  return cards;
}

/* ── Component ─────────────────────────────────────────── */

export function HomepageEatSmartHero() {
  const [activeTab, setActiveTab] = useState<MealTab>("lunch");
  const [cards, setCards] = useState<EnrichedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [modalMenu, setModalMenu] = useState<{ menu: RestaurantMenu; distance?: string; grade?: string | null; tabContext?: MealTab } | null>(null);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const [distanceUnit] = useDistanceUnit();

  // Auto-select tab based on NYC time
  useEffect(() => {
    setMounted(true);
    setActiveTab(detectMealTab());
  }, []);

  // Fetch nearby restaurants — runs once on location grant, not per tab
  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nearby-food?lat=${lat}&lng=${lng}&radius=800`);
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      const results: NearbyResult[] = json.results ?? [];

      const enriched: EnrichedCard[] = [];
      for (const r of results) {
        const menu = getRestaurantMenu(r.chainSlug, r.cuisine, r.name, r.name);
        if (!menu || menu.items.length === 0) continue;

        const foodItems = menu.items.filter(i => !i.isDrink && i.availabilityStatus !== "discontinued");
        const sorted = [...(foodItems.length > 0 ? foodItems : menu.items)].sort((a, b) => b.pulseScore - a.pulseScore);
        const topPick = sorted[0];
        if (!topPick) continue;

        const dist = formatDistance(r.distance, distanceUnit);

        enriched.push({ result: r, menu, topPick, distanceLabel: dist });
        if (enriched.length >= 15) break;
      }

      setCards(enriched);
      setHasLocation(true);
    } catch {
      setCards(getFallbackCards(detectMealTab()));
    }
    setLoading(false);
  }, [distanceUnit]);

  // Try geolocation on mount — fetch once, filter per tab client-side
  useEffect(() => {
    if (!mounted) return;

    const fallback = () => {
      setCards(getFallbackCards(detectMealTab()));
      setLoading(false);
    };

    navigator.permissions?.query({ name: "geolocation" }).then((perm) => {
      if (perm.state === "granted") {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
          fallback,
        );
      } else {
        fallback();
      }
    }).catch(fallback);
  }, [mounted, fetchNearby]);

  // Filter cards based on active tab
  const displayCards = useMemo(() => {
    if (!hasLocation) return cards.slice(0, 3);

    let filtered: EnrichedCard[];
    if (activeTab === "coffee") {
      // Coffee tab: cafes only, drinks only, alternate pick style
      filtered = cards
        .filter(c => isCafeRestaurant(c.menu))
        .map((c, i) => {
          const drinks = [...c.menu.items]
            .filter(it => it.isDrink && it.availabilityStatus !== "discontinued")
            .sort((a, b) => (b.drinkScore ?? b.pulseScore) - (a.drinkScore ?? a.pulseScore));
          if (drinks.length === 0) return c;
          const middleGround = drinks.filter(d => d.isMiddleGround).sort((a, b) => (b.drinkScore ?? b.pulseScore) - (a.drinkScore ?? a.pulseScore))[0];
          const zeroCal = drinks.filter(d => d.calories <= 20).sort((a, b) => (b.drinkScore ?? b.pulseScore) - (a.drinkScore ?? a.pulseScore))[0];
          // Card 0: highest overall, Card 1: middle-ground, Card 2: zero-cal
          const pick = i === 0 ? drinks[0] : i === 1 && middleGround ? middleGround : i === 2 && zeroCal ? zeroCal : drinks[0];
          return { ...c, topPick: pick };
        });
    } else if (activeTab === "breakfast") {
      // Surface restaurants with breakfast items
      filtered = cards.filter(c =>
        c.menu.items.some(i => i.category === "breakfast") ||
        isCafeRestaurant(c.menu) ||
        c.menu.restaurantType === "deli"
      );
      // Re-pick top item: breakfast food only (never drinks)
      filtered = filtered.map(c => {
        const bfFood = [...c.menu.items]
          .filter(i => !i.isDrink && i.category === "breakfast")
          .sort((a, b) => b.pulseScore - a.pulseScore)[0];
        if (bfFood) return { ...c, topPick: bfFood };
        const anyFood = [...c.menu.items]
          .filter(i => !i.isDrink)
          .sort((a, b) => b.pulseScore - a.pulseScore)[0];
        return anyFood ? { ...c, topPick: anyFood } : c;
      });
    } else {
      // Lunch/Dinner — exclude cafes, re-pick top item as FOOD only (never a drink)
      filtered = cards
        .filter(c => !isCafeRestaurant(c.menu))
        .map(c => {
          const foodItems = [...c.menu.items]
            .filter(i => !i.isDrink && i.availabilityStatus !== "discontinued")
            .sort((a, b) => b.pulseScore - a.pulseScore);
          const pick = foodItems[0];
          return pick ? { ...c, topPick: pick } : null;
        })
        .filter((c): c is EnrichedCard => c !== null);
    }

    return (filtered.length >= 3 ? filtered : cards).slice(0, 3);
  }, [cards, activeTab, hasLocation]);

  const handleQuickLog = useCallback((card: EnrichedCard) => {
    const result = quickLogMenuItem({
      item: card.topPick,
      restaurantName: card.menu.restaurantName,
      restaurantId: card.menu.restaurantId,
      source: "homepage-card-log",
    });

    setLoggedIds(prev => new Set(prev).add(card.topPick.id));

    const dupCount = countTodayLogs(card.topPick.id);
    setToast({
      itemName: card.topPick.name,
      restaurantName: card.menu.restaurantName,
      calories: card.topPick.calories,
      protein: card.topPick.protein,
      logId: result.logId,
      duplicateCount: dupCount > 1 ? dupCount : undefined,
    });
  }, []);

  const handleUndo = useCallback((logId: string) => {
    removeQuickLog(logId);
    setToast(null);
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      () => {},
    );
  };

  if (!mounted) {
    return <div className="rounded-3xl bg-surface border border-border-light p-8 h-[320px]" />;
  }

  return (
    <>
      <div className="rounded-3xl bg-surface border border-border-light overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[18px] font-bold text-text">🥗 Eat Smart Near You</h2>
            <Link
              href="/eat-smart"
              className="text-[12px] font-semibold text-hp-green hover:underline"
            >
              Open map →
            </Link>
          </div>
          <p className="text-[13px] text-dim">
            {TAB_COPY[activeTab].headline} {TAB_COPY[activeTab].sub}
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            Healthy picks within 5 blocks, ranked by nutrition — tap to log.
          </p>

          {/* Meal tabs */}
          <div className="flex gap-2 mt-4 mb-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-hp-green text-white"
                    : "bg-surface-warm text-dim hover:text-text"
                }`}
              >
                <span className="text-[11px]">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-surface-warm border border-border-light p-5 h-[200px] animate-pulse" />
              ))}
            </div>
          ) : displayCards.length === 0 ? (
            <div className="text-center py-8">
              {!hasLocation ? (
                <>
                  <p className="text-[14px] text-dim mb-3">Share your location and we&apos;ll pick lunch for you.</p>
                  <button
                    onClick={requestLocation}
                    className="px-5 py-2 rounded-xl bg-hp-green text-white text-[13px] font-semibold hover:bg-hp-green/90 transition-colors"
                  >
                    📍 Share Location
                  </button>
                </>
              ) : activeTab === "coffee" ? (
                <p className="text-[14px] text-dim">No cafes within 0.5 mi. Try expanding to 1 mi.</p>
              ) : activeTab === "breakfast" ? (
                <p className="text-[14px] text-dim">No breakfast spots in range yet. Try expanding to 1 mi, or check the bagel and deli options nearby.</p>
              ) : (
                <p className="text-[14px] text-dim">No graded restaurants in your radius yet. Try expanding to 1 mile.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {displayCards.map((card, i) => (
                <div
                  key={`${card.result.name}-${i}`}
                  className="rounded-2xl border border-border-light bg-white p-4 flex flex-col"
                >
                  {/* Restaurant info */}
                  <div className="mb-3">
                    <h3 className="text-[14px] font-bold text-text truncate">{card.result.name}</h3>
                    <p className="text-[11px] text-muted">
                      {card.distanceLabel && <>{card.distanceLabel} · </>}
                      {card.result.grade && <>Grade {card.result.grade} · </>}
                      {card.topPick.isDrink ? "⚡" : "🥗"} {card.topPick.isDrink ? (card.topPick.drinkScore ?? card.topPick.pulseScore) : card.topPick.pulseScore}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-muted">{card.topPick.isDrink ? "⚡ DrinkScore" : "🥗 PulseScore"}</span>
                    <span className="font-display text-[22px] font-bold text-hp-green">
                      {card.topPick.isDrink ? (card.topPick.drinkScore ?? card.topPick.pulseScore) : card.topPick.pulseScore}
                    </span>
                  </div>

                  {/* Top pick */}
                  <div className="flex-1 mb-3">
                    <p className="text-[13px] font-semibold text-text">{card.topPick.name}</p>
                    <p className="text-[11px] text-dim">
                      {card.topPick.calories} cal · {card.topPick.protein}g P
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalMenu({
                        menu: card.menu,
                        distance: card.distanceLabel,
                        grade: card.result.grade,
                        tabContext: activeTab,
                      })}
                      onMouseEnter={preloadMenuModal}
                      className="flex-1 px-3 py-2 rounded-xl border border-border-light text-[12px] font-semibold text-dim hover:border-hp-green/30 hover:text-text transition-colors"
                    >
                      See menu
                    </button>
                    <button
                      onClick={() => handleQuickLog(card)}
                      disabled={loggedIds.has(card.topPick.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors ${
                        loggedIds.has(card.topPick.id)
                          ? "bg-good/10 text-good"
                          : "bg-hp-green text-white hover:bg-hp-green/90 active:scale-95"
                      }`}
                    >
                      {loggedIds.has(card.topPick.id) ? "✓ Logged" : "I ate this"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom links */}
          {displayCards.length > 0 && (
            <div className="flex gap-3 mt-4">
              <Link
                href="/eat-smart"
                className="flex-1 text-center px-4 py-2 rounded-xl border border-border-light text-[12px] font-semibold text-dim hover:border-hp-green/30 hover:text-text transition-colors"
              >
                Open map →
              </Link>
              <Link
                href="/eat-smart#search"
                className="flex-1 text-center px-4 py-2 rounded-xl border border-border-light text-[12px] font-semibold text-dim hover:border-hp-green/30 hover:text-text transition-colors"
              >
                Search a restaurant →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Menu modal */}
      <LazyMenuModal
        open={!!modalMenu}
        menu={modalMenu?.menu ?? null}
        distance={modalMenu?.distance}
        grade={modalMenu?.grade}
        tabContext={modalMenu?.tabContext}
        onOpenChange={(o) => { if (!o) setModalMenu(null); }}
      />

      {/* Toast */}
      {toast && (
        <QuickLogToast
          {...toast}
          onUndo={handleUndo}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Blocks onboarding */}
      {hasLocation && <BlocksOnboardingToast />}
    </>
  );
}

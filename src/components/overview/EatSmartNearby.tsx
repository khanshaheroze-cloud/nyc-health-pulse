"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CHAINS as EAT_SMART_CHAINS, getChainTopPicks } from "@/lib/eatSmartData";
import { getHealthyTip, getMarkerIcon, getDirectionsUrl } from "@/lib/cuisineTips";
import { getRestaurantMenu } from "@/lib/eat-smart/useRestaurantMenu";
import { quickLogMenuItem, removeQuickLog } from "@/lib/eat-smart/quickLog";
import { formatDistance } from "@/lib/eat-smart/distance";
import { useDistanceUnit } from "@/lib/eat-smart/useDistanceUnit";
import type { RestaurantMenu } from "@/lib/eat-smart/types";
import { LazyMenuModal, preloadMenuModal } from "../eat-smart/LazyMenuModal";
import { QuickLogToast } from "../eat-smart/QuickLogToast";
import type { MiniMapRestaurant } from "./_EatSmartMiniMap";

const MiniMapImpl = dynamic(() => import("./_EatSmartMiniMap"), { ssr: false });

/* ── Types ───────────────────────────────────────────────── */

interface NearbyResult {
  name: string;
  cuisine: string;
  grade: string | null;
  score: number | null;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  chainSlug: string | null;
  isHealthy: boolean;
}

interface EnrichedResult extends NearbyResult {
  isChain: boolean;
  icon: string;
  bestPick: { name: string; calories: number; protein: number; pulseScore: number } | null;
  healthyTip: { category: string; defaultOrder: string; smartOrder: string; tip: string; estimatedSavings: string } | null;
}

/* ── Component ───────────────────────────────────────────── */

export function EatSmartNearby() {
  const [results, setResults] = useState<EnrichedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | "chains" | "local">("all");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [modalMenu, setModalMenu] = useState<{ menu: RestaurantMenu; distance?: string; grade?: string | null } | null>(null);
  const [toastData, setToastData] = useState<{ itemName: string; restaurantName: string; calories: number; protein: number; logId: string } | null>(null);
  const [distanceUnit] = useDistanceUnit();

  // Listen for map popup button clicks (data-menu-open / data-quick-log)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const menuBtn = target.closest("[data-menu-open]") as HTMLElement | null;
      const logBtn = target.closest("[data-quick-log]") as HTMLElement | null;

      if (menuBtn) {
        try {
          const d = JSON.parse(menuBtn.getAttribute("data-menu-open") ?? "{}");
          const menu = getRestaurantMenu(d.chainSlug, d.cuisine, d.name, d.name);
          if (menu) setModalMenu({ menu, distance: d.distance, grade: d.grade });
        } catch { /* ignore */ }
      }

      if (logBtn) {
        try {
          const d = JSON.parse(logBtn.getAttribute("data-quick-log") ?? "{}");
          const menu = getRestaurantMenu(d.chainSlug, d.cuisine, d.name, d.name);
          if (menu && menu.items.length > 0) {
            const foodItems = menu.items.filter(i => !i.isDrink);
            const topItem = [...(foodItems.length > 0 ? foodItems : menu.items)].sort((a, b) => b.pulseScore - a.pulseScore)[0];
            const result = quickLogMenuItem({
              item: topItem,
              restaurantName: menu.restaurantName,
              restaurantId: menu.restaurantId,
              source: "map-quick-log",
            });
            logBtn.textContent = "✓ Logged";
            logBtn.style.opacity = "0.7";
            setToastData({
              itemName: topItem.name,
              restaurantName: menu.restaurantName,
              calories: topItem.calories,
              protein: topItem.protein,
              logId: result.logId,
            });
          }
        } catch { /* ignore */ }
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nearby-food?lat=${lat}&lng=${lng}&radius=800`);
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      const raw: NearbyResult[] = json.results ?? [];

      // Enrich with chain data + cuisine tips
      const enriched: EnrichedResult[] = raw.slice(0, 50).map((r) => {
        const isChain = r.chainSlug !== null;
        const icon = getMarkerIcon(r.cuisine, r.chainSlug, r.isHealthy);

        let bestPick: EnrichedResult["bestPick"] = null;
        if (r.chainSlug) {
          const chain = EAT_SMART_CHAINS.find(c => c.slug === r.chainSlug);
          if (chain) {
            const top = getChainTopPicks(chain, 1)[0];
            if (top) bestPick = { name: top.name, calories: top.calories, protein: top.protein ?? 0, pulseScore: top.pulseScore };
          }
        }

        const healthyTip = !isChain ? getHealthyTip(r.cuisine, r.name) : null;

        return { ...r, isChain, icon, bestPick, healthyTip };
      });

      setResults(enriched);
      setUserLoc({ lat, lng });
      setHasLocation(true);
      preloadMenuModal();
    } catch {
      // Fall back to showing top chain picks without map
      setHasLocation(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    // Silently check if geolocation is already granted
    if (navigator.geolocation && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((perm) => {
        if (perm.state === "granted") {
          navigator.geolocation.getCurrentPosition(
            (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
            () => {},
            { timeout: 5000 }
          );
        }
      }).catch(() => {});
    }
  }, [fetchNearby]);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      () => setLoading(false),
      { timeout: 8000 }
    );
  };

  if (!mounted) return <div className="rounded-2xl bg-surface border border-border-light p-6 h-[420px]" />;

  // Build map data
  const mapRestaurants: MiniMapRestaurant[] = results.slice(0, 30).map((r) => {
    const distLabel = formatDistance(r.distance, distanceUnit);
    let popupContent = "";

    if (r.isChain && r.bestPick) {
      popupContent = `
        <p style="font-size:10px;color:#4A7C59;font-weight:600;margin:4px 0 0;">💪 Best: ${r.bestPick.name}</p>
        <p style="font-size:10px;color:#666;margin:2px 0 0;">Score ${r.bestPick.pulseScore} · ${r.bestPick.calories} cal · ${r.bestPick.protein}g P</p>
      `;
    } else if (r.healthyTip) {
      popupContent = `
        <p style="font-size:10px;color:#4A7C59;font-weight:600;margin:4px 0 0;">💡 Healthy Swap:</p>
        <p style="font-size:10px;color:#888;text-decoration:line-through;margin:2px 0 0;">${r.healthyTip.defaultOrder}</p>
        <p style="font-size:10px;color:#333;font-weight:500;margin:2px 0 0;">→ ${r.healthyTip.smartOrder}</p>
        <p style="font-size:9px;color:#4A7C59;font-weight:600;margin:2px 0 0;">${r.healthyTip.estimatedSavings}</p>
      `;
    }

    const gradeBadge = r.grade
      ? `<span style="margin-left:6px;padding:1px 5px;border-radius:4px;font-size:10px;font-weight:700;background:${
          r.grade === "A" ? "#d1fae5" : r.grade === "B" ? "#fef3c7" : "#fecaca"
        };color:${
          r.grade === "A" ? "#059669" : r.grade === "B" ? "#d97706" : "#dc2626"
        }">Grade ${r.grade}</span>`
      : "";

    const dirUrl = getDirectionsUrl(r.lat, r.lng, r.name);
    const menuBtnData = JSON.stringify({ name: r.name, cuisine: r.cuisine, chainSlug: r.chainSlug, grade: r.grade, distance: distLabel }).replace(/"/g, "&quot;");
    return {
      name: r.name,
      cuisine: r.cuisine,
      grade: r.grade,
      lat: r.lat,
      lng: r.lng,
      distance: r.distance,
      isChain: r.isChain,
      icon: r.icon,
      popupHtml: `
        <div style="min-width:200px;font-family:system-ui,-apple-system,sans-serif;">
          <p style="font-size:13px;font-weight:700;margin:0 0 2px;">${r.name}</p>
          <p style="font-size:11px;color:#666;margin:0;">${r.cuisine} · ${distLabel}${gradeBadge}</p>
          ${popupContent}
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button data-menu-open="${menuBtnData}" style="flex:1;padding:6px 10px;border-radius:8px;border:1px solid #ddd;background:white;color:#333;font-size:11px;font-weight:600;cursor:pointer;">See menu →</button>
            <button data-quick-log="${menuBtnData}" style="flex:1;padding:6px 10px;border-radius:8px;border:none;background:#4A7C59;color:white;font-size:11px;font-weight:600;cursor:pointer;">+ I ate this</button>
          </div>
          <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;padding:5px 10px;border-radius:8px;border:1px solid #e5e5e5;color:#666;font-size:10px;font-weight:500;text-decoration:none;text-align:center;">🧭 Directions</a>
        </div>
      `,
    };
  });

  // Filter map restaurants
  const filteredMap = mapRestaurants.filter((r) => {
    if (filter === "chains") return r.isChain;
    if (filter === "local") return !r.isChain;
    return true;
  });

  // Top 3 picks for the list below map
  const topPicks = results
    .filter(r => r.isChain && r.bestPick)
    .sort((a, b) => (b.bestPick?.pulseScore ?? 0) - (a.bestPick?.pulseScore ?? 0))
    .slice(0, 3);

  // Top tip picks for non-chains
  const topTips = results
    .filter(r => !r.isChain && r.healthyTip && r.grade === "A")
    .slice(0, 2);

  const medals = ["🥇", "🥈", "🥉"];
  const chainCount = results.filter(r => r.isChain).length;
  const tipCount = results.filter(r => !r.isChain && r.healthyTip).length;

  return (
    <div className="rounded-2xl bg-surface border border-border-light overflow-hidden animate-fade-in-up">
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted">🗺 Eat Smart — Near You</p>
          {hasLocation && (
            <span className="text-[10px] text-dim">{results.length} restaurants within ~5 blocks</span>
          )}
        </div>
      </div>

      {/* Map or location prompt */}
      {hasLocation && userLoc ? (
        <>
          {/* Filter pills */}
          <div className="flex gap-1.5 px-5 pt-3 overflow-x-auto">
            {([
              ["all", "All Nearby", results.length],
              ["chains", "🍗 Chains", chainCount],
              ["local", "🏪 Local Spots", tipCount],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => { setFilter(key as typeof filter); setSelectedIdx(null); }}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                  filter === key
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "border-border-light text-dim hover:text-text"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="relative h-[300px] w-full">
            <MiniMapImpl
              center={[userLoc.lat, userLoc.lng]}
              restaurants={filteredMap}
              selectedIndex={selectedIdx}
            />
            {/* Legend */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-border/50 flex gap-3 z-10">
              <span className="flex items-center gap-1 text-[9px] text-dim">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#4A7C59" }} /> Chain ({chainCount})
              </span>
              <span className="flex items-center gap-1 text-[9px] text-dim">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-white border border-gray-300" /> Local ({tipCount} w/ tips)
              </span>
              <span className="flex items-center gap-1 text-[9px] text-dim">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#5b9cf5" }} /> You
              </span>
            </div>
          </div>

          {/* Top picks */}
          <div className="p-5">
            {topPicks.length > 0 && filter !== "local" && (
              <>
                <p className="text-[11px] font-semibold text-dim mb-2">Top PulseScore picks nearby:</p>
                <div className="space-y-2.5 mb-4">
                  {topPicks.map((pick, i) => {
                    const mapIdx = filteredMap.findIndex(m => m.lat === pick.lat && m.lng === pick.lng);
                    const dirUrl = getDirectionsUrl(pick.lat, pick.lng, pick.name);
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 cursor-pointer hover:bg-bg/50 rounded-lg px-1 py-0.5 -mx-1 transition-colors"
                        onClick={() => mapIdx >= 0 && setSelectedIdx(mapIdx)}
                      >
                        <span className="text-[16px] flex-shrink-0">{medals[i]}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-text">{pick.name} — {pick.bestPick!.name}</p>
                          <p className="text-[11px] text-dim">
                            <span className="font-bold text-accent">Score {pick.bestPick!.pulseScore}</span>
                            {" · "}{pick.bestPick!.calories} cal · {pick.bestPick!.protein}g protein
                          </p>
                          <a href={dirUrl} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="text-[10px] font-semibold text-hp-green hover:underline">🚶 Get Directions</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {topTips.length > 0 && filter !== "chains" && (
              <>
                <p className="text-[11px] font-semibold text-dim mb-2">💡 Local spots with healthy swaps:</p>
                <div className="space-y-2 mb-4">
                  {topTips.map((r, i) => {
                    const mapIdx = filteredMap.findIndex(m => m.lat === r.lat && m.lng === r.lng);
                    const dirUrl = getDirectionsUrl(r.lat, r.lng, r.name);
                    return (
                      <div
                        key={i}
                        className="rounded-lg bg-hp-green/5 border border-hp-green/10 px-3 py-2 cursor-pointer hover:bg-hp-green/10 transition-colors"
                        onClick={() => mapIdx >= 0 && setSelectedIdx(mapIdx)}
                      >
                        <p className="text-[12px] font-bold text-text">{r.icon} {r.name} <span className="text-[10px] text-muted font-normal">· {r.cuisine} · Grade {r.grade}</span></p>
                        <p className="text-[10px] text-dim line-through mt-0.5">{r.healthyTip!.defaultOrder}</p>
                        <p className="text-[10px] text-text font-medium">→ {r.healthyTip!.smartOrder}</p>
                        <p className="text-[9px] text-hp-green font-semibold mt-0.5">{r.healthyTip!.estimatedSavings}</p>
                        <a href={dirUrl} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="text-[10px] font-semibold text-hp-green hover:underline mt-1 inline-block">🚶 Get Directions</a>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <Link
              href="/eat-smart"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-accent/30 text-[13px] font-bold text-accent hover:bg-accent/5 transition-colors"
            >
              See All {EAT_SMART_CHAINS.length} Chains →
            </Link>
          </div>
        </>
      ) : (
        <div className="p-5">
          <div className="text-center py-4">
            <p className="text-[13px] text-dim mb-3">
              {loading ? "Finding restaurants near you..." : "Find real restaurants near you with healthy ordering tips"}
            </p>
            {!loading && (
              <button
                onClick={requestLocation}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors"
              >
                📍 Use My Location
              </button>
            )}
            {loading && (
              <div className="w-5 h-5 mx-auto border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            )}
          </div>

          {/* Fallback: show top chain picks globally */}
          {!loading && (
            <>
              <p className="text-[11px] font-semibold text-dim mb-2 mt-2">Top PulseScore picks in NYC:</p>
              <div className="space-y-2 mb-4">
                {EAT_SMART_CHAINS
                  .map(chain => {
                    const top = getChainTopPicks(chain, 1)[0];
                    return top ? { chain, top } : null;
                  })
                  .filter((x): x is NonNullable<typeof x> => x !== null)
                  .sort((a, b) => b.top.pulseScore - a.top.pulseScore)
                  .slice(0, 3)
                  .map(({ chain, top }, i) => (
                    <div key={chain.slug} className="flex items-start gap-2.5">
                      <span className="text-[16px] flex-shrink-0">{medals[i]}</span>
                      <div>
                        <p className="text-[13px] font-bold text-text">{chain.emoji} {chain.name} — {top.name}</p>
                        <p className="text-[11px] text-dim">
                          <span className="font-bold text-accent">Score {top.pulseScore}</span>
                          {" · "}{top.calories} cal · {(top.protein ?? 0)}g protein
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
              <Link
                href="/eat-smart"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-accent/30 text-[13px] font-bold text-accent hover:bg-accent/5 transition-colors"
              >
                See All {EAT_SMART_CHAINS.length} Chains →
              </Link>
            </>
          )}
        </div>
      )}

      {/* Menu modal + undo toast (triggered from map popup buttons) */}
      <LazyMenuModal
        open={!!modalMenu}
        menu={modalMenu?.menu ?? null}
        distance={modalMenu?.distance}
        grade={modalMenu?.grade}
        onOpenChange={(o) => { if (!o) setModalMenu(null); }}
      />
      {toastData && (
        <QuickLogToast
          itemName={toastData.itemName}
          restaurantName={toastData.restaurantName}
          calories={toastData.calories}
          protein={toastData.protein}
          logId={toastData.logId}
          onUndo={(logId) => { removeQuickLog(logId); setToastData(null); }}
          onDismiss={() => setToastData(null)}
        />
      )}
    </div>
  );
}

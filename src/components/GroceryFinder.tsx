"use client";

import { useState, useEffect, useCallback } from "react";

interface Store {
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  sqft: number | null;
  zip: string;
}

interface Market {
  name: string;
  address: string;
  borough: string;
  lat: number;
  lng: number;
  distance: number;
  daysHours: string;
  acceptsEBT: boolean;
  season: string;
}

type Tab = "stores" | "markets";

const TYPE_ICONS: Record<string, string> = {
  Supermarket: "🏪",
  Grocery: "🛒",
  Convenience: "🏬",
  Bodega: "🏠",
  Specialty: "🧀",
};

function sizeLabel(sqft: number | null) {
  if (!sqft) return "";
  if (sqft >= 10000) return "Large";
  if (sqft >= 3000) return "Medium";
  return "Small";
}

export function GroceryFinder() {
  const [tab, setTab] = useState<Tab>("stores");
  const [stores, setStores] = useState<Store[] | null>(null);
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError("");
    try {
      const [storeRes, marketRes] = await Promise.all([
        fetch(`/api/grocery-stores?lat=${lat}&lng=${lng}&radius=0.75`),
        fetch(`/api/farmers-markets?lat=${lat}&lng=${lng}`),
      ]);
      if (storeRes.ok) {
        const data = await storeRes.json();
        setStores(data.stores ?? []);
      }
      if (marketRes.ok) {
        const data = await marketRes.json();
        setMarkets(data.markets ?? []);
      }
    } catch {
      setError("Could not load store data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocated(true);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fetchNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Location access denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchNearby]);

  // Auto-refresh every 5 min if located
  useEffect(() => {
    if (!coords) return;
    const id = setInterval(() => fetchNearby(coords.lat, coords.lng), 300000);
    return () => clearInterval(id);
  }, [coords, fetchNearby]);

  return (
    <div className="bg-surface border border-border-light rounded-3xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <h3 className="text-[15px] font-bold text-text">Grocery Stores Near You</h3>
        </div>
        {located && (
          <button
            onClick={handleLocate}
            className="text-[10px] text-hp-blue font-semibold hover:underline"
          >
            Refresh
          </button>
        )}
      </div>

      {!located && !loading && !error && (
        <div className="text-center py-6">
          <button
            onClick={handleLocate}
            disabled={locating}
            className="px-6 py-3 text-[13px] font-semibold rounded-full bg-hp-green text-white hover:bg-hp-green/90 disabled:opacity-50 transition-all"
          >
            {locating ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Finding your location...
              </span>
            ) : (
              "Find stores near me"
            )}
          </button>
          <p className="text-[10px] text-muted mt-2">
            Uses your location to find grocery stores, supermarkets, and farmers markets within 0.75 miles
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2 text-dim text-[12px]">
          <span className="w-4 h-4 border-2 border-hp-blue/30 border-t-hp-blue rounded-full animate-spin" />
          Searching nearby stores...
        </div>
      )}

      {error && (
        <p className="text-[12px] text-hp-red text-center py-3">{error}</p>
      )}

      {located && !loading && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setTab("stores")}
              className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                tab === "stores"
                  ? "bg-hp-green/10 text-hp-green border border-hp-green/20"
                  : "text-dim border border-transparent hover:text-text"
              }`}
            >
              Stores {stores ? `(${stores.length})` : ""}
            </button>
            <button
              onClick={() => setTab("markets")}
              className={`text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                tab === "markets"
                  ? "bg-hp-green/10 text-hp-green border border-hp-green/20"
                  : "text-dim border border-transparent hover:text-text"
              }`}
            >
              Farmers Markets {markets ? `(${markets.length})` : ""}
            </button>
          </div>

          {/* Store list */}
          {tab === "stores" && stores && (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {stores.length === 0 && (
                <p className="text-[12px] text-dim text-center py-4">No stores found within 0.75 miles.</p>
              )}
              {stores.map((s, i) => (
                <div key={i} className="flex items-start gap-3 border border-border-light rounded-xl px-3.5 py-2.5 hover:bg-bg/50 transition-colors">
                  <span className="text-lg mt-0.5">{TYPE_ICONS[s.type] ?? "🛒"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-text truncate">{s.name}</p>
                    <p className="text-[10px] text-muted">{s.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-border/50 text-dim font-medium">{s.type}</span>
                      {s.sqft && (
                        <span className="text-[9px] text-dim">{sizeLabel(s.sqft)} ({s.sqft.toLocaleString()} sq ft)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-bold text-text">{s.distance} mi</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Markets list */}
          {tab === "markets" && markets && (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {markets.length === 0 && (
                <p className="text-[12px] text-dim text-center py-4">No farmers markets found nearby. Markets are seasonal (typically Jun–Nov).</p>
              )}
              {markets.map((m, i) => (
                <div key={i} className="flex items-start gap-3 border border-border-light rounded-xl px-3.5 py-2.5 hover:bg-bg/50 transition-colors">
                  <span className="text-lg mt-0.5">🥕</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-text truncate">{m.name}</p>
                    <p className="text-[10px] text-muted">{m.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.daysHours && (
                        <span className="text-[9px] text-dim">{m.daysHours}</span>
                      )}
                      {m.acceptsEBT && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-hp-green/10 text-hp-green font-semibold">
                          SNAP/EBT ✓
                        </span>
                      )}
                    </div>
                    {m.season && (
                      <p className="text-[9px] text-dim mt-0.5">Season: {m.season}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-bold text-text">{m.distance} mi</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

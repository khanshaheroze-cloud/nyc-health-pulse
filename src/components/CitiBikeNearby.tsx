"use client";

import { useState, useEffect, useCallback } from "react";

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  bikes: number;
  docks: number;
  capacity: number;
  distance: number;
}

interface CitiBikeData {
  stations: Station[];
  summary: { count: number; totalBikes: number; totalDocks: number; radius: number };
}

function bikeBar(bikes: number, capacity: number) {
  const pct = capacity > 0 ? Math.min(100, (bikes / capacity) * 100) : 0;
  const color = pct > 50 ? "#2dd4a0" : pct > 20 ? "#f5c542" : "#f07070";
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-dim w-6 text-right">{bikes}</span>
    </div>
  );
}

export function CitiBikeNearby() {
  const [data, setData] = useState<CitiBikeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const fetchStations = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/citibike?lat=${lat}&lng=${lng}&radius=0.5`);
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch {
      setError("Could not load Citi Bike data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        fetchStations(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Location access denied. Enable location to find nearby stations.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchStations]);

  // Auto-refresh every 60s if we have data
  useEffect(() => {
    if (!data) return;
    const id = setInterval(() => {
      const first = data.stations[0];
      if (first) fetchStations(first.lat, first.lng);
    }, 60000);
    return () => clearInterval(id);
  }, [data, fetchStations]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🚲</span>
          <h3 className="text-[13px] font-bold text-text">Citi Bike Near You</h3>
        </div>
        {data && (
          <span className="text-[10px] text-muted">
            {data.summary.totalBikes} bikes at {data.summary.count} stations
          </span>
        )}
      </div>

      {!data && !loading && !error && (
        <div className="text-center py-4">
          <button
            onClick={handleLocate}
            disabled={locating}
            className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-hp-blue text-white hover:bg-hp-blue/90 disabled:opacity-50 transition-all"
          >
            {locating ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Finding your location...
              </span>
            ) : (
              "Find stations near me"
            )}
          </button>
          <p className="text-[10px] text-muted mt-2">Uses your current location to find Citi Bike stations within 0.5 miles</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-6 gap-2 text-dim text-[12px]">
          <span className="w-4 h-4 border-2 border-hp-blue/30 border-t-hp-blue rounded-full animate-spin" />
          Loading stations...
        </div>
      )}

      {error && (
        <p className="text-[12px] text-hp-red text-center py-3">{error}</p>
      )}

      {data && data.stations.length === 0 && (
        <p className="text-[12px] text-dim text-center py-3">No Citi Bike stations found within 0.5 miles.</p>
      )}

      {data && data.stations.length > 0 && (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {data.stations.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border border-border rounded-lg px-3 py-2 hover:bg-bg/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-text truncate">{s.name}</p>
                <p className="text-[10px] text-muted">{s.distance} mi away</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <p className={`text-[14px] font-display font-bold ${s.bikes === 0 ? "text-hp-red" : s.bikes < 3 ? "text-hp-yellow" : "text-hp-green"}`}>
                    {s.bikes}
                  </p>
                  <p className="text-[8px] text-muted uppercase tracking-wider">bikes</p>
                </div>
                <div className="text-center">
                  <p className={`text-[14px] font-display font-bold ${s.docks === 0 ? "text-hp-red" : "text-dim"}`}>
                    {s.docks}
                  </p>
                  <p className="text-[8px] text-muted uppercase tracking-wider">docks</p>
                </div>
                {bikeBar(s.bikes, s.capacity)}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
          <button
            onClick={handleLocate}
            className="text-[10px] text-hp-blue font-semibold hover:underline"
          >
            Refresh location
          </button>
          <span className="text-[9px] text-muted">Auto-refreshes every 60s · Citi Bike GBFS</span>
        </div>
      )}
    </div>
  );
}

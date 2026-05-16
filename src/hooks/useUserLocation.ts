"use client";

import { useEffect, useState, useCallback } from "react";

const NYC_DEFAULT = { lat: 40.7128, lng: -74.006 };
const CACHE_KEY = "pulsenyc:lastLocation";
const CACHE_TTL_MS = 60 * 60 * 1000;

export type LocationSource = "gps" | "cached" | "ip" | "default";
export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "timeout" | "unavailable";

export interface LocationState {
  coords: { lat: number; lng: number };
  source: LocationSource;
  status: LocationStatus;
  city?: string;
  retry: () => void;
}

export function useUserLocation(): LocationState {
  const [state, setState] = useState<Omit<LocationState, "retry">>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Date.now() - cached.ts < CACHE_TTL_MS) {
            return {
              coords: { lat: cached.lat, lng: cached.lng },
              source: "cached" as const,
              status: "granted" as const,
              city: cached.city,
            };
          }
        }
      } catch {}
    }
    return { coords: NYC_DEFAULT, source: "default" as const, status: "idle" as const };
  });

  const ipFallback = useCallback(async () => {
    try {
      const r = await fetch("/api/geo-ip", { cache: "no-store" });
      if (!r.ok) return;
      const { lat, lng, city } = await r.json();
      if (typeof lat === "number" && typeof lng === "number") {
        try {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ lat, lng, city, ts: Date.now() }),
          );
        } catch {}
        setState({ coords: { lat, lng }, source: "ip", status: "granted", city });
      }
    } catch {}
  }, []);

  const requestGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, status: "unavailable" }));
      return;
    }
    setState((s) => ({ ...s, status: "requesting" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ...coords, ts: Date.now() }),
          );
        } catch {}
        setState({ coords, source: "gps", status: "granted" });
      },
      (err) => {
        const status: LocationStatus =
          err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable";
        setState((s) => ({ ...s, status }));
        if (err.code !== 1) ipFallback();
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }, [ipFallback]);

  useEffect(() => {
    if (state.source === "default" && state.status === "idle") requestGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, retry: requestGps };
}

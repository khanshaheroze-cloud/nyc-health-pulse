"use client";

import { useEffect, useState, useCallback } from "react";
import {
  readLocation,
  writeLocation,
  subscribeLocation,
  requestBrowserLocation,
  type LocationStatus,
} from "@/lib/locationStore";

const NYC_DEFAULT = { lat: 40.7128, lng: -74.006 };

export type LocationSource = "gps" | "manual" | "cached" | "ip" | "default";
export type { LocationStatus };

export interface LocationState {
  coords: { lat: number; lng: number };
  source: LocationSource;
  status: LocationStatus;
  /** GPS accuracy worse than ~2km (typical desktop IP geolocation) */
  lowConfidence?: boolean;
  city?: string;
  retry: () => void;
}

/**
 * Shared user location. Backed by the single locationStore (one localStorage
 * key + change events), so a location set on ANY surface — homepage wedge,
 * /eat-smart, this hook — is immediately reflected everywhere.
 *
 * Status machine: idle | locating | success | denied | unavailable | timeout | out_of_area
 */
export function useUserLocation(): LocationState {
  const [state, setState] = useState<Omit<LocationState, "retry">>(() => {
    const cached = readLocation();
    if (cached) {
      return {
        coords: { lat: cached.lat, lng: cached.lng },
        source: "cached" as const,
        status: "success" as const,
        city: cached.label,
      };
    }
    return { coords: NYC_DEFAULT, source: "default" as const, status: "idle" as const };
  });

  const ipFallback = useCallback(async () => {
    try {
      const r = await fetch("/api/geo-ip", { cache: "no-store" });
      if (!r.ok) return;
      const { lat, lng, city } = await r.json();
      if (typeof lat === "number" && typeof lng === "number") {
        writeLocation({ lat, lng, label: city, source: "ip" });
        setState({ coords: { lat, lng }, source: "ip", status: "success", lowConfidence: true, city });
      }
    } catch {}
  }, []);

  const requestGps = useCallback(async () => {
    setState((s) => ({ ...s, status: "locating" }));
    const result = await requestBrowserLocation(10_000);
    if (result.status === "success") {
      const { lat, lng } = result.coords!;
      writeLocation({ lat, lng, source: "gps", accuracy: result.accuracy });
      setState({
        coords: { lat, lng },
        source: "gps",
        status: "success",
        lowConfidence: result.lowConfidence,
      });
      return;
    }
    setState((s) => ({ ...s, status: result.status }));
    // Denied is the user's explicit choice — only fall back to IP on technical failures
    if (result.status === "timeout" || result.status === "unavailable") ipFallback();
  }, [ipFallback]);

  useEffect(() => {
    if (state.source === "default" && state.status === "idle") requestGps();
    // Stay in sync when another surface (wedge, eat-smart) sets the location
    return subscribeLocation((loc) => {
      setState({
        coords: { lat: loc.lat, lng: loc.lng },
        source: loc.source === "manual" ? "manual" : loc.source,
        status: "success",
        city: loc.label,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, retry: requestGps };
}

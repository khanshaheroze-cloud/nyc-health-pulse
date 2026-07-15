/* ── useNearMe — the ONE data hook behind Eat Smart + the Overview carousel ──
 * State machine: loading → ready | error, with an offline seed fallback.
 * Race-guarded: every fetch gets an incrementing id and a response may only
 * touch state if its id is still the latest — the LAST location/meal change
 * owns the UI, never whichever response resolves last (web round-4 P0 class).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNearMe } from "./api";
import { getSeedNearMe } from "./bundledRestaurants";
import { getUserLocation, NYC_DEFAULT, type LocationResult } from "./location";
import type { MealParam, NearMeResponse } from "./types";

export interface NearMeState {
  status: "loading" | "ready" | "error";
  data: NearMeResponse | null;
  /** true when `data` came from the bundled seed (render the offline banner). */
  offline: boolean;
  offlineCellLabel: string | null;
  origin: { lat: number; lng: number; label: string; source: string } | null;
  fetchedAt: number | null;
  errorMessage: string | null;
}

const INITIAL: NearMeState = {
  status: "loading",
  data: null,
  offline: false,
  offlineCellLabel: null,
  origin: null,
  fetchedAt: null,
  errorMessage: null,
};

export function useNearMe(meal: MealParam): NearMeState & { refresh: () => void } {
  const [state, setState] = useState<NearMeState>(INITIAL);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++seq.current;
    setState((s) => ({ ...s, status: s.data ? s.status : "loading", errorMessage: null }));

    // Location must never gate the pipeline: race it with a hard 6s fallback.
    // (July 14 emulator repro: a wedged AsyncStorage read inside the location
    // cache left BOTH screens in skeletons forever. Results > precision.)
    let loc: LocationResult | null = null;
    try {
      loc = await Promise.race([
        getUserLocation(),
        new Promise<null>((r) => setTimeout(() => r(null), 6000)),
      ]);
    } catch {}
    const resolved = loc ?? { lat: NYC_DEFAULT.lat, lng: NYC_DEFAULT.lng, accuracy: null, source: "default" as const };
    if (__DEV__) console.log(`[useNearMe] origin ${resolved.source} ${resolved.lat.toFixed(4)},${resolved.lng.toFixed(4)} meal=${meal}`);
    if (reqId !== seq.current) return; // superseded

    const origin = {
      lat: resolved.lat,
      lng: resolved.lng,
      // Honest origin line: a GPS/recent-cache fix is "Current location"; the
      // no-permission fallback is NAMED as a default, never passed off as you.
      label: resolved.source === "default" ? "Long Island City (default)" : "Current location",
      source: resolved.source,
    };

    try {
      const data = await fetchNearMe(resolved.lat, resolved.lng, meal);
      if (__DEV__) console.log(`[useNearMe] ready ${data.restaurants.length} restaurants, ${data.excluded.length} excluded`);
      if (reqId !== seq.current) return; // superseded — stale response never renders
      setState({
        status: "ready",
        data,
        offline: false,
        offlineCellLabel: null,
        origin,
        fetchedAt: Date.now(),
        errorMessage: null,
      });
    } catch (e) {
      if (reqId !== seq.current) return;
      if (__DEV__) console.warn(`[useNearMe] fetch failed (${e instanceof Error ? e.message : e}) — trying seed`);
      // Network/timeout → offline seed (real captured responses, same shape).
      const seeded = getSeedNearMe(resolved.lat, resolved.lng, meal);
      if (seeded) {
        setState({
          status: "ready",
          data: seeded.response,
          offline: true,
          offlineCellLabel: seeded.cellLabel,
          origin,
          fetchedAt: Date.now(),
          errorMessage: null,
        });
      } else {
        setState({
          status: "error",
          data: null,
          offline: false,
          offlineCellLabel: null,
          origin,
          fetchedAt: null,
          errorMessage: e instanceof Error ? e.message : "Couldn't load results",
        });
      }
    }
  }, [meal]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

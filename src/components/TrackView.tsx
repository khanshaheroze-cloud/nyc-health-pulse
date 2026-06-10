"use client";

import { useEffect } from "react";
import { trackEvent, type FunnelEvent } from "@/lib/analytics";

/** Fires one funnel event on mount — drop into server components to count views */
export function TrackView({ event, source }: { event: FunnelEvent; source?: string }) {
  useEffect(() => {
    trackEvent(event, { source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

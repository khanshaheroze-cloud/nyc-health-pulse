"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Clear ALL old caches immediately on page load
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== "pulse-v8") {
          caches.delete(key);
        }
      });
    });

    // Register the service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // If a new SW is waiting, skip waiting
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      })
      .catch((err) => console.warn("SW registration failed:", err));
  }, []);

  return null;
}

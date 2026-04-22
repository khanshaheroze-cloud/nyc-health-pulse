"use client";

import { useRef, useEffect, useState, type MutableRefObject } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { EnrichedResult } from "./EatSmartMapHero";
import { getMarkerIcon, getDirectionsUrl } from "@/lib/cuisineTips";
import { formatDistance, type DistanceUnit } from "@/lib/eat-smart/distance";

/* ── Pin marker factory ────────────────────────────────────────────── */

function createPinMarker(icon: string, isChain: boolean): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";

  const circle = document.createElement("div");
  const bg = isChain ? "#4A7C59" : "#ffffff";
  const textColor = isChain ? "white" : "#374151";
  circle.style.cssText = `width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25);background:${bg};color:${textColor};transition:transform 0.15s ease,box-shadow 0.15s ease;`;
  circle.textContent = icon;

  const tail = document.createElement("div");
  tail.style.cssText = `width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${bg};margin-top:-1px;`;

  wrapper.addEventListener("mouseenter", () => {
    circle.style.transform = "scale(1.15)";
    circle.style.boxShadow = "0 4px 12px rgba(0,0,0,.35)";
  });
  wrapper.addEventListener("mouseleave", () => {
    circle.style.transform = "scale(1)";
    circle.style.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
  });

  wrapper.appendChild(circle);
  wrapper.appendChild(tail);
  return wrapper;
}

/* ── Component ───────────────────────────────────────────────────────── */

interface Props {
  center: [number, number]; // [lat, lng]
  restaurants: EnrichedResult[];
  selectedId?: string | null;
  onMapMove?: (center: { lat: number; lng: number }) => void;
  flyToRef?: MutableRefObject<((lat: number, lng: number) => void) | null>;
  distanceUnit?: DistanceUnit;
}

export default function EatSmartMapHeroImpl({ center, restaurants, selectedId, onMapMove, flyToRef, distanceUnit = "blocks" }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const markerIdRef = useRef<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [center[1], center[0]],
      zoom: 15,
      attributionControl: false,
      minZoom: 12,
      maxZoom: 18,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
      "top-right",
    );
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => setMapReady(true));

    // Debounced map move handler
    map.on("moveend", () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        const c = map.getCenter();
        onMapMove?.({ lat: c.lat, lng: c.lng });
      }, 500);
    });

    // User location marker
    const userEl = document.createElement("div");
    userEl.style.cssText = "width:14px;height:14px;border-radius:50%;background:#5b9cf5;border:3px solid white;box-shadow:0 0 0 2px #5b9cf5,0 2px 8px rgba(0,0,0,.3);";
    new mapboxgl.Marker({ element: userEl }).setLngLat([center[1], center[0]]).addTo(map);

    mapRef.current = map;

    return () => {
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);

  // Expose flyTo
  useEffect(() => {
    if (flyToRef) {
      flyToRef.current = (lat: number, lng: number) => {
        const map = mapRef.current;
        if (!map) return;
        map.flyTo({ center: [lng, lat], zoom: 16, duration: 600 });

        // Open the matching marker's popup
        setTimeout(() => {
          const id = `${lat}-${lng}`;
          const idx = markerIdRef.current.indexOf(id);
          if (idx >= 0) {
            markersRef.current.forEach((m) => m.getPopup()?.isOpen() && m.togglePopup());
            const marker = markersRef.current[idx];
            if (marker && !marker.getPopup()?.isOpen()) marker.togglePopup();
          }
        }, 650);
      };
    }
  }, [flyToRef, mapReady]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markerIdRef.current = [];

    restaurants.forEach((r) => {
      const isChain = r.chainSlug !== null;
      const icon = getMarkerIcon(r.cuisine, r.chainSlug, r.isHealthy);
      const el = createPinMarker(icon, isChain);
      const distLabel = formatDistance(r.distance, distanceUnit);

      const gradeBadge = r.grade
        ? `<span style="margin-left:6px;padding:1px 5px;border-radius:4px;font-size:10px;font-weight:700;background:${
            r.grade === "A" ? "#d1fae5" : r.grade === "B" ? "#fef3c7" : "#fecaca"
          };color:${
            r.grade === "A" ? "#059669" : r.grade === "B" ? "#d97706" : "#dc2626"
          }">Grade ${r.grade}</span>`
        : "";

      let extraHtml = "";
      if (r.bestPick) {
        extraHtml = `
          <p style="font-size:10px;color:#4A7C59;font-weight:600;margin:4px 0 0;">💪 Best: ${r.bestPick.name}</p>
          <p style="font-size:10px;color:#666;margin:2px 0 0;">Score ${r.bestPick.pulseScore} · ${r.bestPick.calories} cal · ${r.bestPick.protein}g P</p>
        `;
      } else if (r.healthyTip) {
        extraHtml = `
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:4px 0;" />
          <p style="font-size:10px;color:#4A7C59;font-weight:600;margin:0 0 2px;">💡 Healthy Swap:</p>
          <p style="font-size:10px;color:#888;text-decoration:line-through;margin:0;">${r.healthyTip.defaultOrder}</p>
          <p style="font-size:10px;color:#333;font-weight:500;margin:2px 0 0;">→ ${r.healthyTip.smartOrder}</p>
          <p style="font-size:9px;color:#4A7C59;font-weight:600;margin:2px 0 0;">${r.healthyTip.estimatedSavings}</p>
        `;
      }

      const dirUrl = getDirectionsUrl(r.lat, r.lng, r.name, r.address);
      const menuBtnData = JSON.stringify({ name: r.name, cuisine: r.cuisine, chainSlug: r.chainSlug, grade: r.grade, distance: distLabel }).replace(/"/g, "&quot;");

      const popupHtml = `
        <div style="min-width:200px;max-width:280px;font-family:system-ui,-apple-system,sans-serif;">
          <p style="font-size:13px;font-weight:700;margin:0 0 2px;">${r.name}</p>
          <p style="font-size:11px;color:#666;margin:0;">${r.cuisine} · ${distLabel}${gradeBadge}</p>
          <p style="font-size:10px;color:#888;margin:4px 0 0;">${r.address}</p>
          ${extraHtml}
          <div style="display:flex;gap:6px;margin-top:8px;">
            <button data-menu-open="${menuBtnData}" style="flex:1;padding:6px 10px;border-radius:8px;border:1px solid #ddd;background:white;color:#333;font-size:11px;font-weight:600;cursor:pointer;">See menu →</button>
            <button data-quick-log="${menuBtnData}" style="flex:1;padding:6px 10px;border-radius:8px;border:none;background:#4A7C59;color:white;font-size:11px;font-weight:600;cursor:pointer;">+ I ate this</button>
          </div>
          <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;padding:5px 10px;border-radius:8px;border:1px solid #e5e5e5;color:#666;font-size:10px;font-weight:500;text-decoration:none;text-align:center;">🧭 Directions</a>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([r.lng, r.lat])
        .setPopup(new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: "300px" }).setHTML(popupHtml))
        .addTo(map);

      markersRef.current.push(marker);
      markerIdRef.current.push(`${r.lat}-${r.lng}`);
    });

    // Fit bounds
    if (restaurants.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([center[1], center[0]]);
      restaurants.forEach((r) => bounds.extend([r.lng, r.lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    }
  }, [restaurants, center, mapReady, distanceUnit]);

  // Fly to selected ID
  useEffect(() => {
    if (!selectedId) return;
    const idx = markerIdRef.current.indexOf(selectedId);
    if (idx < 0) return;
    const marker = markersRef.current[idx];
    if (!marker) return;

    markersRef.current.forEach((m) => m.getPopup()?.isOpen() && m.togglePopup());
    const lngLat = marker.getLngLat();
    mapRef.current?.flyTo({ center: lngLat, zoom: 16, duration: 600 });
    setTimeout(() => {
      if (!marker.getPopup()?.isOpen()) marker.togglePopup();
    }, 650);
  }, [selectedId]);

  return <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />;
}

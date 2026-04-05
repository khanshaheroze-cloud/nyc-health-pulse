"use client";

import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyRestaurant } from "./NearbyFoodMap";
import { getMarkerIcon, getDirectionsUrl } from "@/lib/cuisineTips";

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

  // Hover effect on the CIRCLE only — not the wrapper (avoids Mapbox transform conflict)
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
  restaurants: NearbyRestaurant[];
  selectedIndex?: number | null;
  onMarkerClick?: (index: number) => void;
}

export default function NearbyFoodMapImpl({ center, restaurants, selectedIndex, onMarkerClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once
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
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      // User location radius
      map.addSource("user-radius", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [center[1], center[0]],
          },
        },
      });

      map.addLayer({
        id: "user-radius-fill",
        type: "circle",
        source: "user-radius",
        paint: {
          "circle-radius": { stops: [[10, 30], [14, 280], [16, 1100]] },
          "circle-color": "#5b9cf5",
          "circle-opacity": 0.04,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#5b9cf5",
          "circle-stroke-opacity": 0.2,
        },
      });

      setMapReady(true);
    });

    // User location marker
    const userEl = document.createElement("div");
    userEl.style.cssText = "width:14px;height:14px;border-radius:50%;background:#5b9cf5;border:3px solid white;box-shadow:0 0 0 2px #5b9cf5,0 2px 8px rgba(0,0,0,.3);";
    new mapboxgl.Marker({ element: userEl }).setLngLat([center[1], center[0]]).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);

  // Update markers when restaurants or map changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add restaurant markers
    restaurants.forEach((r, i) => {
      const isChain = r.chainSlug !== null;
      const icon = getMarkerIcon(r.cuisine, r.chainSlug, r.isHealthy);
      const el = createPinMarker(icon, isChain);

      const distMi = (r.distance / 1609.34).toFixed(2);

      const gradeBadge = r.grade
        ? `<span style="margin-left:6px;padding:1px 5px;border-radius:4px;font-size:10px;font-weight:700;background:${
            r.grade === "A" ? "#d1fae5" : r.grade === "B" ? "#fef3c7" : "#fecaca"
          };color:${
            r.grade === "A" ? "#059669" : r.grade === "B" ? "#d97706" : "#dc2626"
          }">Grade ${r.grade}</span>`
        : "";

      // Build popup content based on type
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
          <p style="font-size:9px;color:#888;font-style:italic;margin:3px 0 0;">${r.healthyTip.tip}</p>
        `;
      }

      const dirUrl = getDirectionsUrl(r.lat, r.lng, r.name, r.address);
      const popupHtml = `
        <div style="min-width:200px;max-width:280px;font-family:system-ui,-apple-system,sans-serif;">
          <p style="font-size:13px;font-weight:700;margin:0 0 2px;">${r.name}</p>
          <p style="font-size:11px;color:#666;margin:0;">${r.cuisine} · ${distMi} mi${gradeBadge}</p>
          <p style="font-size:10px;color:#888;margin:4px 0 0;">${r.address}</p>
          ${extraHtml}
          <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;padding:7px 12px;border-radius:8px;background:#4A7C59;color:white;font-size:12px;font-weight:600;text-decoration:none;text-align:center;">🧭 Get Directions</a>
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([r.lng, r.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: "300px" }).setHTML(popupHtml)
        )
        .addTo(map);

      el.addEventListener("click", () => onMarkerClick?.(i));
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (restaurants.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([center[1], center[0]]);
      restaurants.forEach((r) => bounds.extend([r.lng, r.lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    }
  }, [restaurants, center, mapReady]);

  // Fly to selected restaurant
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedIndex == null || selectedIndex < 0) return;
    const marker = markersRef.current[selectedIndex];
    if (!marker) return;

    // Close all popups first
    markersRef.current.forEach((m) => m.getPopup()?.isOpen() && m.togglePopup());

    const lngLat = marker.getLngLat();
    map.flyTo({ center: lngLat, zoom: 16, duration: 600 });
    setTimeout(() => {
      if (!marker.getPopup()?.isOpen()) marker.togglePopup();
    }, 650);
  }, [selectedIndex]);

  return <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />;
}

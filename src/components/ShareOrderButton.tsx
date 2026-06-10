"use client";

import { useState } from "react";

interface ShareOrderProps {
  venue: string;
  order: string;
  calories?: number | null;
  protein?: number | null;
  price?: number | null;
  className?: string;
}

// "Share this order" — Web Share API with clipboard fallback. The shared link
// carries UTM tags and the OG card comes from /api/share-order, so a pasted
// link unfurls into a clean venue/order/macros image.
export function ShareOrderButton({ venue, order, calories, protein, price, className }: ShareOrderProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const params = new URLSearchParams({ venue, order });
    if (calories != null) params.set("cal", String(calories));
    if (protein != null) params.set("protein", String(protein));
    if (price != null) params.set("price", String(price));

    const imageUrl = `${window.location.origin}/api/share-order?${params}`;
    const text = `${order} at ${venue}${price != null ? ` (~$${price})` : ""}${protein != null ? ` — ${protein}g protein` : ""} · found on PulseNYC`;
    const pageUrl = `${window.location.origin}/?utm_source=share&utm_medium=order-card`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "PulseNYC order", text, url: pageUrl });
        return;
      }
    } catch {
      /* user cancelled — fall through to clipboard */
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${pageUrl}\n${imageUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className ?? "text-[12px] text-[#6B716B] hover:text-[#1A1A1A] hover:underline"}
    >
      {copied ? "✓ Copied" : "Share this order"}
    </button>
  );
}

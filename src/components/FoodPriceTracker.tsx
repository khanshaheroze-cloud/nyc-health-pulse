"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PriceItem {
  name: string;
  price: number;
  unit: string;
  change: number;
  period: string;
  category: string;
}

interface PriceData {
  items: PriceItem[];
  basketTotal: number;
  source: string;
  note: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Protein: "🥩",
  Dairy: "🥛",
  Produce: "🥬",
  Grains: "🌾",
  Beverages: "🧃",
};

/* Seed data — BLS Northeast urban averages (updated Feb 2026) */
const SEED_DATA: PriceData = {
  items: [
    { name: "Eggs (dozen)", price: 4.95, unit: "per dozen", change: 11.2, period: "Feb 2026", category: "Protein" },
    { name: "Milk (gallon)", price: 4.29, unit: "per gallon", change: 2.4, period: "Feb 2026", category: "Dairy" },
    { name: "Bread, white", price: 2.19, unit: "per lb", change: 1.9, period: "Feb 2026", category: "Grains" },
    { name: "Chicken breast", price: 4.42, unit: "per lb", change: -1.3, period: "Feb 2026", category: "Protein" },
    { name: "Bananas", price: 0.69, unit: "per lb", change: 3.0, period: "Feb 2026", category: "Produce" },
    { name: "Rice, white", price: 1.12, unit: "per lb", change: 4.7, period: "Feb 2026", category: "Grains" },
    { name: "Ground beef", price: 5.89, unit: "per lb", change: 3.2, period: "Feb 2026", category: "Protein" },
    { name: "Cheddar cheese", price: 6.15, unit: "per lb", change: 1.8, period: "Feb 2026", category: "Dairy" },
    { name: "Potatoes", price: 1.19, unit: "per lb", change: -2.1, period: "Feb 2026", category: "Produce" },
    { name: "Orange juice (64 oz)", price: 5.69, unit: "per 64 oz", change: 8.4, period: "Feb 2026", category: "Beverages" },
  ],
  basketTotal: 36.68,
  source: "BLS CPI Average Price Data · Northeast Urban",
  note: "Northeast urban averages — NYC prices may vary ±10-15%. Updates monthly.",
};

export function FoodPriceTracker() {
  const [data, setData] = useState<PriceData>(SEED_DATA);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch("/api/food-prices")
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (json.items?.length > 0) {
            setData(json);
            setIsLive(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-surface border border-border-light rounded-3xl p-7">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-display text-[20px] text-text leading-snug">NYC Grocery Prices</h3>
          <p className="text-[13px] text-muted mt-0.5">
            {data.source.split("·")[0].trim()} · {data.items[0]?.period}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-2 justify-end">
            <p className="text-[28px] font-extrabold text-hp-green leading-none">${(data.basketTotal ?? 0).toFixed(2)}</p>
            {isLive && (
              <span className="flex items-center gap-1 text-[9px] text-hp-green font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-hp-green live-pulse" />
                LIVE
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted mt-0.5">10-item basket</p>
        </div>
      </div>

      {/* Link to full tracker */}
      <div className="flex justify-end mb-3">
        <Link href="/grocery" className="text-[13px] font-semibold text-hp-green hover:underline">
          Full tracker →
        </Link>
      </div>

      {/* Item rows */}
      <div>
        {data.items.map((item) => (
          <div key={item.name} className="flex items-center gap-3 py-3 border-b border-border-light last:border-0">
            <span className="text-base w-6 text-center flex-shrink-0">{CATEGORY_ICONS[item.category] ?? "🛒"}</span>
            <p className="text-[14px] font-medium text-text flex-1 min-w-0 truncate">{item.name}</p>
            <div className="text-right flex-shrink-0 flex items-center gap-3">
              <p className="text-[16px] font-bold text-text">${(item.price ?? 0).toFixed(2)}</p>
              {item.change != null && item.change !== 0 && (
                <p className={`text-[12px] font-semibold min-w-[60px] text-right ${
                  item.change > 0 ? "text-hp-red" : "text-hp-green"
                }`}>
                  {item.change > 0 ? "↑" : "↓"} {Math.abs(item.change).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-[11px] text-muted italic mt-4">{data.note}</p>
    </div>
  );
}

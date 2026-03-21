"use client";

import { useState, useEffect } from "react";

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
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <div>
            <h3 className="text-[13px] font-bold text-text">NYC Grocery Price Tracker</h3>
            <p className="text-[10px] text-muted">{data.source} · {data.items[0]?.period}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-display font-bold text-hp-orange">${data.basketTotal.toFixed(2)}</p>
          <p className="text-[9px] text-muted">10-item basket</p>
        </div>
      </div>

      <div className="space-y-1">
        {data.items.map((item) => (
          <div key={item.name} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
            <span className="text-sm w-5 text-center">{CATEGORY_ICONS[item.category] ?? "🛒"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-text truncate">{item.name}</p>
              <p className="text-[9px] text-muted">{item.unit}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[13px] font-display font-bold text-text">${item.price.toFixed(2)}</p>
              {item.change !== 0 && (
                <p className={`text-[9px] font-semibold ${
                  Math.abs(item.change) > 10 ? "text-hp-red font-bold" :
                  item.change > 0 ? "text-hp-red" : "text-hp-green"
                }`}>
                  {item.change > 0 ? "↑" : "↓"} {Math.abs(item.change).toFixed(1)}% YoY
                  {Math.abs(item.change) > 10 && " ⚠️"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-[9px] text-muted italic">{data.note}</p>
        {isLive && (
          <span className="flex items-center gap-1 text-[9px] text-hp-green font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-hp-green animate-pulse" />
            LIVE
          </span>
        )}
      </div>
    </div>
  );
}

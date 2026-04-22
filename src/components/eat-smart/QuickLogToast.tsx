"use client";

import { useEffect, useState } from "react";

interface QuickLogToastProps {
  itemName: string;
  restaurantName: string;
  calories: number;
  protein: number;
  logId: string;
  duplicateCount?: number;
  onUndo: (logId: string) => void;
  onDismiss: () => void;
}

export function QuickLogToast({
  itemName,
  restaurantName,
  calories,
  protein,
  logId,
  duplicateCount,
  onUndo,
  onDismiss,
}: QuickLogToastProps) {
  const [visible, setVisible] = useState(true);
  const [undone, setUndone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // allow exit animation
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleUndo = () => {
    setUndone(true);
    onUndo(logId);
    setTimeout(onDismiss, 800);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] max-w-[420px] w-[calc(100%-2rem)] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-text text-white rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3">
        <span className="text-lg flex-shrink-0">{undone ? "↩️" : "✅"}</span>
        <div className="flex-1 min-w-0">
          {undone ? (
            <p className="text-[13px] font-medium">Removed from log</p>
          ) : (
            <>
              <p className="text-[13px] font-medium truncate">
                {restaurantName} — {itemName}
              </p>
              <p className="text-[11px] text-white/70">
                {calories} cal · {protein}g P
                {duplicateCount && duplicateCount > 1
                  ? ` · logged ${duplicateCount}x today`
                  : ""}
              </p>
            </>
          )}
        </div>
        {!undone && (
          <button
            onClick={handleUndo}
            className="text-[12px] font-bold text-white/90 hover:text-white underline underline-offset-2 flex-shrink-0"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
}

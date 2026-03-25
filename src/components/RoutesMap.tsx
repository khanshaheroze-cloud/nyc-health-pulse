"use client";

import dynamic from "next/dynamic";

const RoutesMapImpl = dynamic(() => import("./_RoutesMapImpl"), { ssr: false });

export function RoutesMap() {
  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 420 }}>
      <RoutesMapImpl />
    </div>
  );
}

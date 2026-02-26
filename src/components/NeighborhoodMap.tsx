"use client";

import dynamic from "next/dynamic";

const NeighborhoodMapImpl = dynamic(() => import("./_NeighborhoodMapImpl"), { ssr: false });

export type MapMetric = "asthmaED" | "obesity" | "pm25" | "lifeExp" | "poverty";

interface Props {
  metric?: MapMetric;
  height?: number;
}

export function NeighborhoodMap({ metric = "asthmaED", height = 420 }: Props) {
  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-border">
      <NeighborhoodMapImpl metric={metric} height={height} />
    </div>
  );
}

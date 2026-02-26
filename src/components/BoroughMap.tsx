"use client";

import dynamic from "next/dynamic";
import type { MapMetric } from "./_BoroughMapImpl";

const BoroughMapImpl = dynamic(() => import("./_BoroughMapImpl"), { ssr: false });

interface Props {
  metric: MapMetric;
  height?: number;
}

export function BoroughMap({ metric, height = 360 }: Props) {
  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-border">
      <BoroughMapImpl metric={metric} />
    </div>
  );
}

export type { MapMetric };

"use client";

import dynamic from "next/dynamic";

const BoroughMapImpl = dynamic(() => import("./_BoroughMapImpl"), { ssr: false });

interface Props {
  height?: number;
}

export function BoroughMap({ height = 400 }: Props) {
  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-border">
      <BoroughMapImpl height={height} />
    </div>
  );
}

export type { MapMetric } from "./_BoroughMapImpl";

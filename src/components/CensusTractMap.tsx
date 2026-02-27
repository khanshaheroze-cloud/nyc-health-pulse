"use client";

import dynamic from "next/dynamic";

const CensusTractMapImpl = dynamic(() => import("./_CensusTractMapImpl"), { ssr: false });

export type TractMetric = "OBESITY" | "DIABETES" | "CASTHMA" | "BPHIGH" | "CSMOKING";

export const TRACT_METRIC_CONFIG: Record<TractMetric, { label: string; unit: string; invert: boolean; min: number; max: number }> = {
  OBESITY:  { label: "Obesity",         unit: "%", invert: true,  min: 8,  max: 58 },
  DIABETES: { label: "Diabetes",        unit: "%", invert: true,  min: 3,  max: 30 },
  CASTHMA:  { label: "Current Asthma",  unit: "%", invert: true,  min: 5,  max: 20 },
  BPHIGH:   { label: "High Blood Pres.","unit": "%", invert: true, min: 15, max: 60 },
  CSMOKING: { label: "Smoking",         unit: "%", invert: true,  min: 4,  max: 30 },
};

interface Props {
  metric?: TractMetric;
  height?: number;
}

export function CensusTractMap({ metric = "OBESITY", height = 480 }: Props) {
  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-border">
      <CensusTractMapImpl metric={metric} height={height} />
    </div>
  );
}

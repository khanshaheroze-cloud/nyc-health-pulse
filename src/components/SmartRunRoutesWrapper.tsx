"use client";

import dynamic from "next/dynamic";

const SmartRunRoutes = dynamic(
  () => import("@/components/SmartRunRoutes"),
  { ssr: false, loading: () => <div className="h-[500px] rounded-2xl bg-surface border border-border animate-pulse flex items-center justify-center text-dim text-sm">Loading route generator…</div> },
);

export function SmartRunRoutesWrapper() {
  return <SmartRunRoutes />;
}

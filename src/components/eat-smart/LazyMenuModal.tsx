"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { RestaurantMenu, MealTab } from "@/lib/eat-smart/types";

const RestaurantMenuModal = dynamic(
  () => import("./RestaurantMenuModal").then((m) => m.RestaurantMenuModal),
  { ssr: false },
);

let preloaded = false;
export function preloadMenuModal() {
  if (preloaded) return;
  preloaded = true;
  import("./RestaurantMenuModal");
}

interface LazyMenuModalProps {
  menu: RestaurantMenu | null;
  distance?: string;
  grade?: string | null;
  tabContext?: MealTab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LazyMenuModal(props: LazyMenuModalProps) {
  const hovered = useRef(false);

  useEffect(() => {
    if (props.open && !preloaded) {
      preloaded = true;
    }
  }, [props.open]);

  if (!props.open && !hovered.current) return null;
  return <RestaurantMenuModal {...props} />;
}

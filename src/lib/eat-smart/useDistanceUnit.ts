"use client";

import { useState, useEffect, useCallback } from "react";
import type { DistanceUnit } from "./distance";

const STORAGE_KEY = "pulsenyc.distanceUnit";
const VALID: DistanceUnit[] = ["blocks", "imperial", "miles"];

function readUnit(): DistanceUnit {
  if (typeof window === "undefined") return "blocks";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw && VALID.includes(raw as DistanceUnit) ? (raw as DistanceUnit) : "blocks";
}

export function useDistanceUnit(): [DistanceUnit, (u: DistanceUnit) => void] {
  const [unit, setUnit] = useState<DistanceUnit>("blocks");

  useEffect(() => {
    setUnit(readUnit());
  }, []);

  const update = useCallback((u: DistanceUnit) => {
    setUnit(u);
    localStorage.setItem(STORAGE_KEY, u);
  }, []);

  return [unit, update];
}

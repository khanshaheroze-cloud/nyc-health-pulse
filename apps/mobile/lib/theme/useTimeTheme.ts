import { useState, useEffect } from "react";
import { themeForHour, bandProgress, type ThemeSnapshot, type TimeBand } from "./time-of-day";

export interface TimeTheme extends ThemeSnapshot {
  progress: number;
  hour: number;
}

export function useTimeTheme(): TimeTheme {
  const [theme, setTheme] = useState<TimeTheme>(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return { ...themeForHour(h), progress: bandProgress(h, m), hour: h };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      setTheme({ ...themeForHour(h), progress: bandProgress(h, m), hour: h });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return theme;
}

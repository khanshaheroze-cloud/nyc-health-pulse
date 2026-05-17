import { useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TimeBucket = "dawn" | "morning" | "midday" | "dusk" | "night";
export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "fog";
export type AqiBand = "good" | "moderate" | "unhealthy";

export interface Environment {
  timeBucket: TimeBucket;
  weather: WeatherCondition;
  aqi: number;
  aqiBand: AqiBand;
  sunrise: Date;
  sunset: Date;
  isNight: boolean;
  tempF: number;
  tempLabel: string;
}

const CACHE_KEY = "pulse-weather-cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface WeatherCache {
  weather: WeatherCondition;
  tempF: number;
  aqi: number;
  ts: number;
}

async function getCachedWeather(): Promise<WeatherCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: WeatherCache = JSON.parse(raw);
    if (Date.now() - cached.ts > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

async function setCachedWeather(data: Omit<WeatherCache, "ts">): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
  } catch {}
}

function getTimeBucket(h: number): TimeBucket {
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "midday";
  if (h >= 16 && h < 19) return "dusk";
  return "night";
}

function getAqiBand(aqi: number): AqiBand {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  return "unhealthy";
}

interface WeatherFetchResult {
  weather: WeatherCondition;
  tempF: number | null;
  aqi: number;
  debug: WeatherDebug;
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherFetchResult> {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const code: number = data.current?.weather_code ?? 0;
    const rawTemp = data.current?.temperature_2m;
    const tempF: number | null = rawTemp != null ? Math.round(rawTemp) : null;

    let weather: WeatherCondition = "clear";
    if ([45, 48].includes(code)) weather = "fog";
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code))
      weather = "rain";
    else if ([71, 73, 75, 77, 85, 86].includes(code)) weather = "snow";
    else if ([1, 2, 3].includes(code)) weather = "cloudy";

    return {
      weather,
      tempF,
      aqi: 43,
      debug: {
        apiUrl,
        field: "current.temperature_2m",
        rawValue: String(rawTemp ?? "null"),
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch {
    return {
      weather: "clear",
      tempF: null,
      aqi: 43,
      debug: {
        apiUrl,
        field: "current.temperature_2m",
        rawValue: "FETCH_FAILED",
        fetchedAt: new Date().toISOString(),
      },
    };
  }
}

async function fetchAqi(): Promise<number> {
  try {
    const res = await fetch(
      "https://pulsenyc.app/api/airnow?zip=10001",
    );
    if (!res.ok) return 43;
    const data = await res.json();
    return data.aqi ?? 43;
  } catch {
    return 43;
  }
}

function getSunTimes(): { sunrise: Date; sunset: Date } {
  const now = new Date();
  const sunrise = new Date(now);
  sunrise.setHours(5, 45, 0, 0);
  const sunset = new Date(now);
  sunset.setHours(20, 5, 0, 0);

  const month = now.getMonth();
  if (month >= 3 && month <= 8) {
    sunrise.setHours(5, 30, 0, 0);
    sunset.setHours(20, 15, 0, 0);
  } else {
    sunrise.setHours(7, 0, 0, 0);
    sunset.setHours(16, 45, 0, 0);
  }
  return { sunrise, sunset };
}

export interface WeatherDebug {
  apiUrl: string;
  field: string;
  rawValue: string;
  fetchedAt: string;
}

export function useEnvironment(lat = 40.7128, lng = -74.006): Environment & { debug: WeatherDebug | null } {
  const fetched = useRef(false);
  const [debug, setDebug] = useState<WeatherDebug | null>(null);

  const [env, setEnv] = useState<Environment>(() => {
    const h = new Date().getHours();
    const bucket = getTimeBucket(h);
    const { sunrise, sunset } = getSunTimes();
    return {
      timeBucket: bucket,
      weather: "clear",
      aqi: 43,
      aqiBand: "good",
      sunrise,
      sunset,
      isNight: bucket === "night" || bucket === "dusk",
      tempF: 0,
      tempLabel: "—°",
    };
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await getCachedWeather();
      if (cached && !cancelled) {
        const h = new Date().getHours();
        const bucket = getTimeBucket(h);
        const { sunrise, sunset } = getSunTimes();
        setEnv({
          timeBucket: bucket,
          weather: cached.weather,
          aqi: cached.aqi,
          aqiBand: getAqiBand(cached.aqi),
          sunrise,
          sunset,
          isNight: bucket === "night" || bucket === "dusk",
          tempF: cached.tempF,
          tempLabel: `${cached.tempF}°`,
        });
        fetched.current = true;
        return;
      }

      if (fetched.current) return;

      const [weatherData, aqi] = await Promise.all([
        fetchWeather(lat, lng),
        fetchAqi(),
      ]);
      if (cancelled) return;

      const h = new Date().getHours();
      const bucket = getTimeBucket(h);
      const { sunrise, sunset } = getSunTimes();
      const finalAqi = aqi || weatherData.aqi;
      const temp = weatherData.tempF;

      if (temp != null) {
        await setCachedWeather({
          weather: weatherData.weather,
          tempF: temp,
          aqi: finalAqi,
        });
      }

      setDebug(weatherData.debug);
      setEnv({
        timeBucket: bucket,
        weather: weatherData.weather,
        aqi: finalAqi,
        aqiBand: getAqiBand(finalAqi),
        sunrise,
        sunset,
        isNight: bucket === "night" || bucket === "dusk",
        tempF: temp ?? 0,
        tempLabel: temp != null ? `${temp}°` : "—°",
      });
      fetched.current = true;
    })();

    const interval = setInterval(() => {
      const h = new Date().getHours();
      const bucket = getTimeBucket(h);
      setEnv((prev) => ({
        ...prev,
        timeBucket: bucket,
        isNight: bucket === "night" || bucket === "dusk",
      }));
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lat, lng]);

  return { ...env, debug };
}

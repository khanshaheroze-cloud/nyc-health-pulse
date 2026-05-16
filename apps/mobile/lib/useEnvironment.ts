import { useState, useEffect } from "react";

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

async function fetchWeather(
  lat: number,
  lng: number,
): Promise<{ weather: WeatherCondition; tempF: number; aqi: number }> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York`,
    );
    if (!res.ok) throw new Error("weather fetch failed");
    const data = await res.json();
    const code: number = data.current?.weather_code ?? 0;
    const tempF: number = Math.round(data.current?.temperature_2m ?? 55);

    let weather: WeatherCondition = "clear";
    if ([45, 48].includes(code)) weather = "fog";
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code))
      weather = "rain";
    else if ([71, 73, 75, 77, 85, 86].includes(code)) weather = "snow";
    else if ([1, 2, 3].includes(code)) weather = "cloudy";

    return { weather, tempF, aqi: 43 };
  } catch {
    return { weather: "clear", tempF: 55, aqi: 43 };
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

export function useEnvironment(lat = 40.7128, lng = -74.006): Environment {
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
      tempF: 55,
      tempLabel: "55°",
    };
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [weatherData, aqi] = await Promise.all([
        fetchWeather(lat, lng),
        fetchAqi(),
      ]);
      if (cancelled) return;

      const h = new Date().getHours();
      const bucket = getTimeBucket(h);
      const { sunrise, sunset } = getSunTimes();
      const finalAqi = aqi || weatherData.aqi;

      setEnv({
        timeBucket: bucket,
        weather: weatherData.weather,
        aqi: finalAqi,
        aqiBand: getAqiBand(finalAqi),
        sunrise,
        sunset,
        isNight: bucket === "night" || bucket === "dusk",
        tempF: weatherData.tempF,
        tempLabel: `${weatherData.tempF}°`,
      });
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

  return env;
}

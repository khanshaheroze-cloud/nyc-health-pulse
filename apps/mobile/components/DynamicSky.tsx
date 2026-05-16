import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from "react-native-svg";

import type { TimeBucket, WeatherCondition, AqiBand } from "../lib/useEnvironment";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  env: {
    timeBucket: TimeBucket;
    weather: WeatherCondition;
    aqiBand: AqiBand;
    isNight: boolean;
  };
  children: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Lookup tables                                                      */
/* ------------------------------------------------------------------ */

const SKY_GRADIENTS: Record<TimeBucket, [string, string, string]> = {
  dawn: ["#FFD3B6", "#FFAAA5", "#FF8B94"],
  morning: ["#A8DADC", "#CFE9EA", "#F1FAEE"],
  midday: ["#87CEEB", "#B8E0F0", "#FFF8DC"],
  dusk: ["#355C7D", "#C06C84", "#F8B195"],
  night: ["#0B1026", "#1A1F3A", "#2D3561"],
};

const WEATHER_OVERLAY: Record<WeatherCondition, string> = {
  clear: "transparent",
  cloudy: "rgba(180,180,190,0.25)",
  rain: "rgba(70,90,110,0.40)",
  snow: "rgba(255,255,255,0.35)",
  fog: "rgba(200,200,200,0.45)",
};

const AQI_OVERLAY: Record<AqiBand, string> = {
  good: "rgba(120,200,120,0.08)",
  moderate: "rgba(240,200,90,0.10)",
  unhealthy: "rgba(220,90,90,0.12)",
};

const SKY_HEIGHT = 280;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Seeded-ish random for stable layout across re-renders */
function stableRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/* ------------------------------------------------------------------ */
/*  Rain                                                               */
/* ------------------------------------------------------------------ */

interface RaindropConfig {
  left: number;
  height: number;
  duration: number;
  delay: number;
}

function useRaindrops(active: boolean) {
  const count = 25;
  const anims = useRef<Animated.Value[]>([]);

  const configs = useMemo<RaindropConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      left: stableRandom(i) * SCREEN_WIDTH,
      height: 12 + stableRandom(i + 100) * 8, // 12-20
      duration: 800 + stableRandom(i + 200) * 700, // 0.8-1.5s
      delay: stableRandom(i + 300) * 800,
    }));
  }, []);

  // Lazily create Animated.Values
  if (anims.current.length === 0) {
    anims.current = configs.map(() => new Animated.Value(0));
  }

  useEffect(() => {
    if (!active) {
      anims.current.forEach((a) => a.setValue(0));
      return;
    }

    const animations = anims.current.map((anim, i) => {
      const { duration, delay } = configs[i];
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    animations.forEach((a) => a.start());

    return () => {
      animations.forEach((a) => a.stop());
    };
  }, [active, configs]);

  return { configs, anims: anims.current };
}

function RainLayer({ active }: { active: boolean }) {
  const { configs, anims } = useRaindrops(active);

  if (!active) return null;

  return (
    <View style={styles.effectLayer} pointerEvents="none">
      {configs.map((cfg, i) => {
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, SKY_HEIGHT],
        });

        return (
          <Animated.View
            key={`rain-${i}`}
            style={[
              styles.raindrop,
              {
                left: cfg.left,
                height: cfg.height,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Stars                                                              */
/* ------------------------------------------------------------------ */

interface StarConfig {
  left: number;
  top: number;
  duration: number;
}

function useStars(active: boolean) {
  const count = 30;
  const anims = useRef<Animated.Value[]>([]);

  const configs = useMemo<StarConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      left: stableRandom(i + 500) * SCREEN_WIDTH,
      top: stableRandom(i + 600) * (SKY_HEIGHT - 20),
      duration: 2000 + stableRandom(i + 700) * 3000, // 2-5s
    }));
  }, []);

  if (anims.current.length === 0) {
    anims.current = configs.map(
      (cfg) => new Animated.Value(0.3 + stableRandom(cfg.duration) * 0.7),
    );
  }

  useEffect(() => {
    if (!active) {
      anims.current.forEach((a) => a.setValue(0));
      return;
    }

    const animations = anims.current.map((anim, i) => {
      const { duration } = configs[i];
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    animations.forEach((a) => a.start());

    return () => {
      animations.forEach((a) => a.stop());
    };
  }, [active, configs]);

  return { configs, anims: anims.current };
}

function StarLayer({ active }: { active: boolean }) {
  const { configs, anims } = useStars(active);

  if (!active) return null;

  return (
    <View style={styles.effectLayer} pointerEvents="none">
      {configs.map((cfg, i) => (
        <Animated.View
          key={`star-${i}`}
          style={[
            styles.star,
            {
              left: cfg.left,
              top: cfg.top,
              opacity: anims[i],
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function DynamicSky({ env, children }: Props) {
  const gradientColors = SKY_GRADIENTS[env.timeBucket] ?? SKY_GRADIENTS.midday;
  const weatherColor = WEATHER_OVERLAY[env.weather] ?? "transparent";
  const aqiColor = AQI_OVERLAY[env.aqiBand] ?? AQI_OVERLAY.good;

  return (
    <View style={styles.container}>
      {/* Sky gradient (SVG-based, no native module needed) */}
      <Svg width="100%" height={SKY_HEIGHT} style={styles.gradient}>
        <Defs>
          <SvgGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} />
            <Stop offset="0.5" stopColor={gradientColors[1]} />
            <Stop offset="1" stopColor={gradientColors[2]} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sky)" />
      </Svg>

      {/* Weather overlay */}
      <View style={[styles.overlay, { backgroundColor: weatherColor }]} />

      {/* AQI tint */}
      <View style={[styles.overlay, { backgroundColor: aqiColor }]} />

      {/* Particle effects */}
      <RainLayer active={env.weather === "rain"} />
      <StarLayer active={env.timeBucket === "night"} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    height: SKY_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  effectLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
  raindrop: {
    position: "absolute",
    top: 0,
    width: 1.5,
    backgroundColor: "rgba(200,220,240,0.5)",
    borderRadius: 1,
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
});

export default DynamicSky;

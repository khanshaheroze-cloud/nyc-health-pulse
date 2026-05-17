import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ParticleField } from "./ParticleField";
import type { TimeTheme } from "../../lib/theme/useTimeTheme";
import type { WeatherCondition, AqiBand } from "../../lib/useEnvironment";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = 280;

const AnimatedStop = Animated.createAnimatedComponent(Stop);

const WEATHER_OVERLAY: Record<WeatherCondition, string> = {
  clear: "transparent",
  cloudy: "rgba(180,180,190,0.20)",
  rain: "rgba(70,90,110,0.35)",
  snow: "rgba(255,255,255,0.30)",
  fog: "rgba(200,200,200,0.40)",
};

const AQI_OVERLAY: Record<AqiBand, string> = {
  good: "rgba(120,200,120,0.06)",
  moderate: "rgba(240,200,90,0.08)",
  unhealthy: "rgba(220,90,90,0.10)",
};

interface Props {
  theme: TimeTheme;
  weather?: WeatherCondition;
  aqiBand?: AqiBand;
  children: React.ReactNode;
}

export function AnimatedHero({ theme, weather = "clear", aqiBand = "good", children }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.cubic) });
  }, [theme.band]);

  const [c0, c1, c2] = theme.gradient;
  const weatherColor = WEATHER_OVERLAY[weather];
  const aqiColor = AQI_OVERLAY[aqiBand];

  return (
    <View style={styles.container}>
      <Svg width={SCREEN_W} height={HERO_H} style={styles.gradient}>
        <Defs>
          <LinearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c0} stopOpacity="1" />
            <Stop offset="0.5" stopColor={c1} stopOpacity="1" />
            <Stop offset="1" stopColor={c2} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_W} height={HERO_H} fill="url(#heroGrad)" />
      </Svg>

      <View style={[styles.overlay, { backgroundColor: weatherColor }]} />
      <View style={[styles.overlay, { backgroundColor: aqiColor }]} />

      <ParticleField
        band={theme.band}
        color={theme.particleColor}
        count={theme.particleCount}
      />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HERO_H,
    width: "100%",
    overflow: "hidden",
    borderRadius: 0,
    marginBottom: 12,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
});

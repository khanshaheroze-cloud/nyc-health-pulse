import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import type { TimeBand } from "../../lib/theme/time-of-day";

const { width: SCREEN_W } = Dimensions.get("window");
const FIELD_H = 280;

interface Props {
  band: TimeBand;
  color: string;
  count: number;
}

function stableRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

interface ParticleConfig {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

function Particle({ cfg, color }: { cfg: ParticleConfig; color: string }) {
  const opacity = useSharedValue(0.2);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      cfg.delay,
      withRepeat(
        withTiming(0.8, { duration: cfg.duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    translateY.value = withDelay(
      cfg.delay,
      withRepeat(
        withTiming(-8, { duration: cfg.duration * 1.5, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [cfg]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: cfg.x,
          top: cfg.y,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function ParticleField({ band, color, count }: Props) {
  const configs = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: stableRand(i + 10) * (SCREEN_W - 10),
      y: stableRand(i + 50) * (FIELD_H - 20),
      size: band === "night" ? 1.5 + stableRand(i + 90) * 1.5 : 3 + stableRand(i + 90) * 4,
      duration: 2000 + stableRand(i + 130) * 3000,
      delay: stableRand(i + 170) * 1500,
    }));
  }, [band, count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {configs.map((cfg, i) => (
        <Particle key={`${band}-${i}`} cfg={cfg} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: "absolute",
  },
});

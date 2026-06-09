import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/tokens';

const DEFAULT_ITEMS = [
  'AQI 43 ↓5',
  'Pollen Moderate',
  'COVID Low',
  'Flu Declining',
  'Water Safe ✓',
  '311 Calls 12.8K',
  'Rats High · UWS',
  'CitiBike 4.2K active',
  'MTA On-Time 78%',
];

const SEPARATOR = ' · ';
const SCROLL_DURATION = 30000;
const PULSE_DURATION = 2000;

interface PulseTickerProps {
  items?: string[];
}

export default function PulseTicker({ items = DEFAULT_ITEMS }: PulseTickerProps) {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const [contentWidth, setContentWidth] = useState(0);

  const tickerText = items.join(SEPARATOR) + SEPARATOR;

  // Pulsing green dot animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.6,
            duration: PULSE_DURATION / 2,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.3,
            duration: PULSE_DURATION / 2,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: PULSE_DURATION / 2,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: PULSE_DURATION / 2,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseScale, pulseOpacity]);

  // Scrolling animation — starts once content width is measured
  useEffect(() => {
    if (contentWidth === 0) return;

    scrollAnim.setValue(0);
    const scroll = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: -contentWidth,
        duration: SCROLL_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    scroll.start();
    return () => scroll.stop();
  }, [contentWidth, scrollAnim]);

  const handleTextLayout = (e: { nativeEvent: { layout: { width: number } } }) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== contentWidth) {
      setContentWidth(w);
    }
  };

  return (
    <View style={styles.container}>
      {/* Static LIVE badge */}
      <View style={styles.badge}>
        <View style={styles.dotWrapper}>
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <View style={styles.dotCore} />
        </View>
        <Text style={styles.badgeText}>LIVE</Text>
      </View>

      {/* Scrolling content */}
      <View style={styles.scrollClip}>
        <Animated.View
          style={[styles.scrollInner, { transform: [{ translateX: scrollAnim }] }]}
        >
          <Text style={styles.tickerText} numberOfLines={1} onLayout={handleTextLayout}>
            {tickerText}
          </Text>
          <Text style={styles.tickerText} numberOfLines={1}>{tickerText}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    height: 38,
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSage,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    gap: 4,
  },
  dotWrapper: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  dotCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: `${fonts.body}_700Bold`,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollClip: {
    flex: 1,
    height: 16,
    overflow: 'hidden',
  },
  scrollInner: {
    flexDirection: 'row',
    height: 16,
  },
  tickerText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: `${fonts.body}_500Medium`,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

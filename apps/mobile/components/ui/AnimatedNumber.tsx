import React, { useEffect } from "react";
import { TextStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useDerivedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { TextInput } from "react-native";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface Props {
  value: number;
  duration?: number;
  suffix?: string;
  style?: TextStyle;
}

export function AnimatedNumber({ value, duration = 800, suffix = "", style }: Props) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const text = `${Math.round(animatedValue.value)}${suffix}`;
    return { text, defaultValue: text } as any;
  });

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      style={[{ padding: 0, margin: 0 }, style]}
      animatedProps={animatedProps}
    />
  );
}

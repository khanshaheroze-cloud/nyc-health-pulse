import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { radius } from "../../theme/tokens";

interface Props {
  children: React.ReactNode;
  dark?: boolean;
  intensity?: number;
  style?: ViewStyle;
}

export function GlassCard({ children, dark = false, style }: Props) {
  return (
    <View style={[styles.outer, dark ? styles.outerDark : styles.outerLight, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: 12,
  },
  outerLight: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  outerDark: {
    backgroundColor: "rgba(20,25,40,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  content: {
    padding: 16,
  },
});

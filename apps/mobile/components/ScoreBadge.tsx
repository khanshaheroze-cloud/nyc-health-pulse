import { View, Text, StyleSheet } from "react-native";

interface Props {
  score: number;
  size?: number;
}

export function ScoreBadge({ score, size = 40 }: Props) {
  const bg = score >= 70 ? "#d1fae5" : score >= 50 ? "#fef3c7" : "#fee2e2";
  const fg = score >= 70 ? "#065f46" : score >= 50 ? "#92400e" : "#991b1b";

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg, fontSize: size * 0.4 }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { justifyContent: "center", alignItems: "center" },
  text: { fontWeight: "800" },
});

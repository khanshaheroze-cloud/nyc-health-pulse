import { View, Text, StyleSheet } from "react-native";

interface Props {
  label: string;
  value: number;
  total: number;
  unit: string;
  color: string;
}

export function MacroRing({ label, value, total, unit, color }: Props) {
  const pct = Math.round(((total - value) / total) * 100);
  return (
    <View style={styles.ring}>
      <View style={[styles.ringCircle, { borderColor: color }]}>
        <Text style={[styles.ringValue, { color }]}>{value}</Text>
        <Text style={styles.ringUnit}>{unit}</Text>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
      <Text style={styles.ringPct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: "center" },
  ringCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, justifyContent: "center", alignItems: "center",
  },
  ringValue: { fontSize: 16, fontWeight: "800" },
  ringUnit: { fontSize: 9, color: "#8ba89c" },
  ringLabel: { fontSize: 10, fontWeight: "600", color: "#5a7a6e", marginTop: 4 },
  ringPct: { fontSize: 9, color: "#8ba89c" },
});

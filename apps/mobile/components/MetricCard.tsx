import { View, Text, StyleSheet } from "react-native";

interface Props {
  icon: string;
  label: string;
  value: string;
  sub: string;
}

export function MetricCard({ icon, label, value, sub }: Props) {
  return (
    <View style={styles.metric}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metric: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e2e8e4",
  },
  icon: { fontSize: 24, marginBottom: 8 },
  label: { fontSize: 11, color: "#8ba89c", fontWeight: "600", textTransform: "uppercase" },
  value: { fontSize: 22, fontWeight: "800", color: "#1e2d2a", marginTop: 4 },
  sub: { fontSize: 11, color: "#5a7a6e", marginTop: 2 },
});

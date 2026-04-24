import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  icon: string;
  title: string;
  hint: string;
  onGrant: () => void;
  onSkip: () => void;
}

export function PermissionGate({ icon, title, hint, onGrant, onSkip }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <TouchableOpacity style={styles.grantButton} onPress={onGrant}>
        <Text style={styles.grantText}>Allow</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSkip}>
        <Text style={styles.skipText}>Not Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#f8fafb", justifyContent: "center",
    alignItems: "center", padding: 40,
  },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#1e2d2a" },
  hint: { fontSize: 14, color: "#5a7a6e", textAlign: "center", marginTop: 8, maxWidth: 280 },
  grantButton: {
    marginTop: 24, backgroundColor: "#2dd4a0", paddingVertical: 14,
    paddingHorizontal: 48, borderRadius: 14,
  },
  grantText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  skipText: { fontSize: 14, color: "#8ba89c", marginTop: 16 },
});

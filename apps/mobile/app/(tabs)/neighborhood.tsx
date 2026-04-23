import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { apiFetch } from "../../lib/api";

interface NeighborhoodData {
  name: string;
  borough: string;
  healthScore: number;
  healthGrade: string;
  aqi: number | null;
  aqiLabel: string;
  lifeExpectancy: number;
  crashes12mo: number;
}

export default function NeighborhoodScreen() {
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location needed to show your neighborhood health data.");
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const result = await apiFetch<NeighborhoodData>(
          `/api/neighborhood-health?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`,
        );
        setData(result);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2dd4a0" />
        <Text style={styles.loadingText}>Loading neighborhood data...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? "Could not load data"}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.borough}>{data.borough}</Text>
      </View>

      <View style={styles.gradeCard}>
        <Text style={styles.gradeLabel}>Health Score</Text>
        <Text style={styles.grade}>{data.healthGrade}</Text>
        <Text style={styles.gradeValue}>{data.healthScore}/100</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard icon="🌬️" label="Air Quality" value={data.aqi != null ? `AQI ${data.aqi}` : "—"} sub={data.aqiLabel} />
        <MetricCard icon="❤️" label="Life Expectancy" value={`${data.lifeExpectancy} yr`} sub="neighborhood avg" />
        <MetricCard icon="🚗" label="Crashes (12mo)" value={`${data.crashes12mo}`} sub="pedestrian + cyclist" />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function MetricCard({ icon, label, value, sub }: {
  icon: string; label: string; value: string; sub: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafb" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#5a7a6e" },
  errorText: { fontSize: 14, color: "#f07070", textAlign: "center", padding: 40 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1e2d2a" },
  borough: { fontSize: 14, color: "#5a7a6e", marginTop: 4 },
  gradeCard: {
    backgroundColor: "#ffffff", borderRadius: 20, padding: 24,
    marginHorizontal: 20, marginBottom: 20, alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8e4",
  },
  gradeLabel: { fontSize: 12, color: "#8ba89c", fontWeight: "600", textTransform: "uppercase" },
  grade: { fontSize: 56, fontWeight: "900", color: "#2dd4a0", marginVertical: 4 },
  gradeValue: { fontSize: 14, color: "#5a7a6e" },
  metricsGrid: { paddingHorizontal: 20, gap: 12 },
  metric: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e2e8e4",
  },
  metricIcon: { fontSize: 24, marginBottom: 8 },
  metricLabel: { fontSize: 11, color: "#8ba89c", fontWeight: "600", textTransform: "uppercase" },
  metricValue: { fontSize: 22, fontWeight: "800", color: "#1e2d2a", marginTop: 4 },
  metricSub: { fontSize: 11, color: "#5a7a6e", marginTop: 2 },
});

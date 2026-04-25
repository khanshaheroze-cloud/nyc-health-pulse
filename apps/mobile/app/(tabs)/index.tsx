import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { detectMealSlot, type MenuItem } from "../../lib/core";
import { apiFetch } from "../../lib/api";

interface NearbyRestaurant {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  distance: number;
  walkMinutes: number;
  topPicks: MenuItem[];
}

export default function EatSmartScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mealSlot = detectMealSlot();

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await apiFetch<{ restaurants: NearbyRestaurant[] }>(
        `/api/smart-menu/near-me?lat=${lat}&lng=${lng}&meal=${mealSlot}`,
      );
      setRestaurants(data.restaurants ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [mealSlot]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission needed to find food near you.");
          setLoading(false);
          return;
        }
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Location timed out — try enabling GPS in emulator settings.")), 8000),
          ),
        ]);
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setLocation(coords);
        await fetchNearby(coords.lat, coords.lng);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [fetchNearby]);

  const onRefresh = useCallback(async () => {
    if (!location) return;
    setRefreshing(true);
    await fetchNearby(location.lat, location.lng);
    setRefreshing(false);
  }, [location, fetchNearby]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Eat Smart Near You</Text>
        <Text style={styles.subtitle}>
          {mealSlot.charAt(0).toUpperCase() + mealSlot.slice(1)} picks scored for your goals
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push("/scan")}
        >
          <Text style={styles.scanIcon}>📷</Text>
          <Text style={styles.scanLabel}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push("/ocr")}
        >
          <Text style={styles.scanIcon}>🔍</Text>
          <Text style={styles.scanLabel}>Read Menu</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2dd4a0" />
          <Text style={styles.loadingText}>Finding food near you...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2dd4a0" />
          }
        >
          {restaurants.map((r) => (
            <View key={r.restaurantId} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.restaurantName}>{r.restaurantName}</Text>
                <Text style={styles.distance}>
                  {r.walkMinutes}min walk
                </Text>
              </View>
              <Text style={styles.cuisine}>{r.cuisine}</Text>
              {r.topPicks.map((item) => (
                <View key={item.id} style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMacros}>
                      {item.calories} cal · {item.protein}g protein
                    </Text>
                  </View>
                  <View style={[
                    styles.scoreBadge,
                    { backgroundColor: item.pulseScore >= 70 ? "#d1fae5" : item.pulseScore >= 50 ? "#fef3c7" : "#fee2e2" },
                  ]}>
                    <Text style={[
                      styles.scoreText,
                      { color: item.pulseScore >= 70 ? "#065f46" : item.pulseScore >= 50 ? "#92400e" : "#991b1b" },
                    ]}>
                      {item.pulseScore}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#1e2d2a" },
  subtitle: { fontSize: 14, color: "#5a7a6e", marginTop: 4 },
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  scanButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#ffffff", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#e2e8e4",
  },
  scanIcon: { fontSize: 20 },
  scanLabel: { fontSize: 13, fontWeight: "600", color: "#1e2d2a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#5a7a6e" },
  errorText: { fontSize: 14, color: "#f07070", textAlign: "center" },
  list: { flex: 1, paddingHorizontal: 20 },
  card: {
    backgroundColor: "#ffffff", borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#e2e8e4",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  restaurantName: { fontSize: 17, fontWeight: "700", color: "#1e2d2a" },
  distance: { fontSize: 12, color: "#8ba89c", fontWeight: "500" },
  cuisine: { fontSize: 12, color: "#5a7a6e", marginTop: 2, marginBottom: 12 },
  menuItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f0f4f2",
  },
  menuItemLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#1e2d2a" },
  itemMacros: { fontSize: 11, color: "#8ba89c", marginTop: 2 },
  scoreBadge: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  scoreText: { fontSize: 16, fontWeight: "800" },
});

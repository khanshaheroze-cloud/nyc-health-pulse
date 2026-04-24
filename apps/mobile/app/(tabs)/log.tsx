import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { calculateRemaining, type DailyLog, type LoggedFood, type NutritionGoals } from "../../lib/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { flushQueue } from "../../lib/offlineQueue";
import { readHealthData, calculateCalorieBoost, type HealthData } from "../../lib/healthKit";
import { MacroRing } from "../../components/MacroRing";

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export default function LogScreen() {
  const [log, setLog] = useState<DailyLog>({
    date: todayKey(),
    entries: [],
    goals: DEFAULT_GOALS,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);

  const loadLog = useCallback(async () => {
    const key = `pulse-log-${todayKey()}`;
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      setLog(JSON.parse(raw));
    }
  }, []);

  useEffect(() => {
    loadLog();
    readHealthData().then((d) => { if (d) setHealth(d); }).catch(() => {});
  }, [loadLog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await flushQueue();
    await loadLog();
    setRefreshing(false);
  }, [loadLog]);

  const calorieBoost = health ? calculateCalorieBoost(health.activeEnergy) : 0;
  const adjustedLog: DailyLog = calorieBoost > 0
    ? { ...log, goals: { ...log.goals, calories: log.goals.calories + calorieBoost } }
    : log;
  const budget = calculateRemaining(adjustedLog);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Log</Text>
        <Text style={styles.subtitle}>{budget.percentComplete}% of daily goal</Text>
      </View>

      <View style={styles.macroRow}>
        <MacroRing label="Calories" value={budget.remainingCal} total={adjustedLog.goals.calories} unit="cal" color="#2dd4a0" />
        <MacroRing label="Protein" value={budget.remainingProtein} total={adjustedLog.goals.protein} unit="g" color="#5b9cf5" />
        <MacroRing label="Carbs" value={budget.remainingCarbs} total={adjustedLog.goals.carbs} unit="g" color="#f59e42" />
        <MacroRing label="Fat" value={budget.remainingFat} total={adjustedLog.goals.fat} unit="g" color="#a78bfa" />
      </View>

      {health && health.activeEnergy > 0 && (
        <View style={styles.healthBanner}>
          <Text style={styles.healthIcon}>⌚</Text>
          <View style={styles.healthInfo}>
            <Text style={styles.healthText}>
              {health.activeEnergy} cal burned · {health.steps.toLocaleString()} steps
            </Text>
            {calorieBoost > 0 && (
              <Text style={styles.healthBoost}>+{calorieBoost} cal added to today's budget</Text>
            )}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2dd4a0" />
        }
      >
        {log.entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No food logged yet today</Text>
            <Text style={styles.emptyHint}>Scan a barcode or pick from Smart Menu to start</Text>
          </View>
        ) : (
          log.entries.map((entry, i) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryName}>{entry.name}</Text>
                <Text style={styles.entrySlot}>{entry.mealSlot}</Text>
              </View>
              <Text style={styles.entryMacros}>
                {entry.calories} cal · {entry.protein}g P · {entry.carbs}g C · {entry.fat}g F
              </Text>
              {entry.pulseScore != null && (
                <Text style={styles.entryScore}>Smart Score: {entry.pulseScore}</Text>
              )}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1e2d2a" },
  subtitle: { fontSize: 14, color: "#5a7a6e", marginTop: 4 },
  macroRow: {
    flexDirection: "row", justifyContent: "space-around",
    paddingHorizontal: 16, paddingBottom: 16,
  },
healthBanner: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 20,
    marginBottom: 12, backgroundColor: "#d1fae5", borderRadius: 12, padding: 12,
  },
  healthIcon: { fontSize: 20, marginRight: 10 },
  healthInfo: { flex: 1 },
  healthText: { fontSize: 12, fontWeight: "600", color: "#065f46" },
  healthBoost: { fontSize: 11, color: "#047857", marginTop: 2 },
  list: { flex: 1, paddingHorizontal: 20 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#1e2d2a" },
  emptyHint: { fontSize: 13, color: "#8ba89c", marginTop: 4, textAlign: "center" },
  entryCard: {
    backgroundColor: "#ffffff", borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: "#e2e8e4",
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryName: { fontSize: 14, fontWeight: "600", color: "#1e2d2a", flex: 1 },
  entrySlot: { fontSize: 10, color: "#8ba89c", textTransform: "uppercase", fontWeight: "600" },
  entryMacros: { fontSize: 12, color: "#5a7a6e", marginTop: 4 },
  entryScore: { fontSize: 11, color: "#2dd4a0", fontWeight: "600", marginTop: 4 },
});

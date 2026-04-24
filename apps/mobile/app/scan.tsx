import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { calculateFoodPulseScore, detectMealSlot, type MenuItem } from "../lib/core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enqueue } from "../lib/offlineQueue";

interface FoodLookupResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  addedSugar?: number;
  saturatedFat?: number;
  servingSize?: string;
  barcode: string;
  source: "pulsenyc" | "openfoodfacts" | "usda";
}

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodLookupResult | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const processingRef = useRef(false);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionView}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionHint}>
          Scan barcodes to instantly see nutrition scores and log food.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.skipText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcode = async ({ data }: { data: string }) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanned(true);
    setLoading(true);

    try {
      // Lookup chain: Open Food Facts → USDA
      const offRes = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json?fields=product_name,nutriments`,
      );
      const offData = await offRes.json();

      if (offData.status === 1 && offData.product) {
        const p = offData.product;
        const n = p.nutriments || {};
        const item: FoodLookupResult = {
          name: p.product_name || "Unknown Product",
          calories: Math.round(n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? 0),
          protein: Math.round(n.proteins_serving ?? n.proteins_100g ?? 0),
          carbs: Math.round(n.carbohydrates_serving ?? n.carbohydrates_100g ?? 0),
          fat: Math.round(n.fat_serving ?? n.fat_100g ?? 0),
          fiber: n.fiber_serving ?? n.fiber_100g,
          sodium: n.sodium_serving != null ? Math.round(n.sodium_serving * 1000) : undefined,
          sugar: n.sugars_serving ?? n.sugars_100g,
          saturatedFat: n["saturated-fat_serving"] ?? n["saturated-fat_100g"],
          barcode: data,
          source: "openfoodfacts",
        };
        const pulseScore = calculateFoodPulseScore(item);
        setResult(item);
        setScore(pulseScore);
      } else {
        Alert.alert("Not Found", "Barcode not in our database. Try searching by name instead.");
        setScanned(false);
        processingRef.current = false;
      }
    } catch {
      Alert.alert("Error", "Could not look up this product. Check your connection.");
      setScanned(false);
      processingRef.current = false;
    }
    setLoading(false);
  };

  const handleLog = async () => {
    if (!result) return;
    const entry = {
      id: `scan-${Date.now()}`,
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      sodium: result.sodium,
      sugar: result.sugar,
      addedSugar: result.addedSugar,
      saturatedFat: result.saturatedFat,
      pulseScore: score,
      source: "scan" as const,
      barcode: result.barcode,
      loggedAt: new Date().toISOString(),
      mealSlot: detectMealSlot(),
    };

    // Save to local log
    const key = `pulse-log-${new Date().toISOString().split("T")[0]}`;
    const raw = await AsyncStorage.getItem(key);
    const log = raw ? JSON.parse(raw) : { date: key.replace("pulse-log-", ""), entries: [], goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 } };
    log.entries.push(entry);
    await AsyncStorage.setItem(key, JSON.stringify(log));

    // Queue for Supabase sync
    await enqueue("nutrition_log", entry);

    router.back();
  };

  return (
    <View style={styles.container}>
      {!scanned && (
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
          onBarcodeScanned={handleBarcode}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        {!scanned && !loading && (
          <View style={styles.scanGuide}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>Point at a barcode</Text>
          </View>
        )}

        {loading && (
          <View style={styles.resultCard}>
            <ActivityIndicator size="large" color="#2dd4a0" />
            <Text style={styles.lookupText}>Looking up product...</Text>
          </View>
        )}

        {result && score != null && (
          <View style={styles.resultCard}>
            <Text style={styles.productName}>{result.name}</Text>
            <View style={styles.scoreRow}>
              <View style={[
                styles.bigScore,
                { backgroundColor: score >= 70 ? "#d1fae5" : score >= 50 ? "#fef3c7" : "#fee2e2" },
              ]}>
                <Text style={[
                  styles.bigScoreText,
                  { color: score >= 70 ? "#065f46" : score >= 50 ? "#92400e" : "#991b1b" },
                ]}>
                  {score}
                </Text>
              </View>
              <View style={styles.macroCol}>
                <Text style={styles.macroLine}>{result.calories} cal</Text>
                <Text style={styles.macroLine}>{result.protein}g protein</Text>
                <Text style={styles.macroLine}>{result.carbs}g carbs · {result.fat}g fat</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logButton} onPress={handleLog}>
              <Text style={styles.logButtonText}>Log It</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setScanned(false); setResult(null); setScore(null); processingRef.current = false; }}
            >
              <Text style={styles.rescanText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  closeButton: {
    position: "absolute", top: 56, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center",
  },
  closeText: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  scanGuide: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanFrame: {
    width: 250, height: 150, borderWidth: 2, borderColor: "#2dd4a0",
    borderRadius: 16, backgroundColor: "transparent",
  },
  scanHint: { color: "#ffffff", fontSize: 14, marginTop: 16, fontWeight: "500" },
  resultCard: {
    backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, alignItems: "center",
  },
  lookupText: { marginTop: 12, fontSize: 14, color: "#5a7a6e" },
  productName: { fontSize: 18, fontWeight: "700", color: "#1e2d2a", textAlign: "center", marginBottom: 16 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  bigScore: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
  },
  bigScoreText: { fontSize: 28, fontWeight: "900" },
  macroCol: { gap: 4 },
  macroLine: { fontSize: 14, color: "#1e2d2a", fontWeight: "500" },
  logButton: {
    backgroundColor: "#2dd4a0", paddingVertical: 14, paddingHorizontal: 64,
    borderRadius: 14, marginBottom: 12,
  },
  logButtonText: { fontSize: 17, fontWeight: "700", color: "#ffffff" },
  rescanText: { fontSize: 14, color: "#5a7a6e", fontWeight: "500" },
  permissionView: {
    flex: 1, backgroundColor: "#f8fafb", justifyContent: "center",
    alignItems: "center", padding: 40,
  },
  permissionIcon: { fontSize: 64, marginBottom: 20 },
  permissionTitle: { fontSize: 22, fontWeight: "800", color: "#1e2d2a" },
  permissionHint: { fontSize: 14, color: "#5a7a6e", textAlign: "center", marginTop: 8, maxWidth: 280 },
  grantButton: {
    marginTop: 24, backgroundColor: "#2dd4a0", paddingVertical: 14,
    paddingHorizontal: 48, borderRadius: 14,
  },
  grantText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  skipText: { fontSize: 14, color: "#8ba89c", marginTop: 16 },
});

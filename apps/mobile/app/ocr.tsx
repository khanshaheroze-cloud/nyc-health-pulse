import { useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { calculateFoodPulseScore, type MenuItem } from "../lib/core";
import { apiFetch } from "../lib/api";

interface ParsedMenuItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  pulseScore: number;
}

export default function OCRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [items, setItems] = useState<ParsedMenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionView}>
        <Text style={styles.permissionIcon}>🔍</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionHint}>
          Point your camera at a restaurant menu to see dishes ranked by nutrition.
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

  const captureAndParse = async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (!photo?.base64) throw new Error("Failed to capture photo");

      const result = await apiFetch<{ items: Omit<ParsedMenuItem, "pulseScore">[] }>(
        "/api/menu/parse",
        {
          method: "POST",
          body: JSON.stringify({ image: photo.base64 }),
        },
      );

      const scored = (result.items || []).map((item) => ({
        ...item,
        pulseScore: calculateFoodPulseScore(item),
      }));
      scored.sort((a, b) => b.pulseScore - a.pulseScore);
      setItems(scored);
    } catch (e: any) {
      setError(e.message || "Could not read menu. Try better lighting.");
    }
    setCapturing(false);
  };

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.bottomBar}>
              {capturing ? (
                <ActivityIndicator size="large" color="#2dd4a0" />
              ) : (
                <>
                  <Text style={styles.hint}>Point at a restaurant menu</Text>
                  <TouchableOpacity style={styles.captureButton} onPress={captureAndParse}>
                    <View style={styles.captureInner} />
                  </TouchableOpacity>
                </>
              )}
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Menu Ranked by Fit</Text>
            <TouchableOpacity onPress={() => { setItems([]); setError(null); }}>
              <Text style={styles.rescan}>Scan Again</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.resultsList}>
            {items.map((item, i) => (
              <View key={i} style={styles.resultItem}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{i + 1}</Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultMacros}>
                    {item.calories} cal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
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
            <TouchableOpacity style={styles.closeResults} onPress={() => router.back()}>
              <Text style={styles.closeResultsText}>Done</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}
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
  bottomBar: { alignItems: "center", paddingBottom: 50 },
  hint: { color: "#ffffff", fontSize: 15, fontWeight: "500", marginBottom: 20 },
  captureButton: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: "#ffffff",
    justifyContent: "center", alignItems: "center",
  },
  captureInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "#2dd4a0",
  },
  errorText: { color: "#f07070", fontSize: 13, marginTop: 12 },
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
  resultsContainer: { flex: 1, backgroundColor: "#f8fafb" },
  resultsHeader: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  resultsTitle: { fontSize: 22, fontWeight: "800", color: "#1e2d2a" },
  rescan: { fontSize: 14, color: "#2dd4a0", fontWeight: "600" },
  resultsList: { flex: 1, paddingHorizontal: 20 },
  resultItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff",
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#e2e8e4",
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#f0f4f2",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  rankText: { fontSize: 12, fontWeight: "700", color: "#5a7a6e" },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: "600", color: "#1e2d2a" },
  resultMacros: { fontSize: 11, color: "#8ba89c", marginTop: 2 },
  scoreBadge: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: "center", alignItems: "center", marginLeft: 8,
  },
  scoreText: { fontSize: 16, fontWeight: "800" },
  closeResults: {
    backgroundColor: "#2dd4a0", padding: 16, borderRadius: 14,
    alignItems: "center", marginTop: 12,
  },
  closeResultsText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
});

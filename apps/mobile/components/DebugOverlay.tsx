import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from "react-native";
import * as Location from "expo-location";
import { colors, fonts, radius } from "../theme/tokens";
import { getBundledCount, getBundledNearby } from "../lib/bundledRestaurants";

interface DebugInfo {
  bundledTotal: number;
  bundledNearby: number;
  lat: number;
  lng: number;
  accuracy: number | null;
  source: "gps" | "default";
  timestamp: string;
}

export function DebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState<DebugInfo | null>(null);

  const refresh = async () => {
    let lat = 40.7440;
    let lng = -73.9485;
    let accuracy: number | null = null;
    let source: "gps" | "default" = "default";

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
        ]);
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        accuracy = loc.coords.accuracy;
        source = "gps";
      }
    } catch {}

    const nearby = getBundledNearby(lat, lng, 2500, 999);
    setInfo({
      bundledTotal: getBundledCount(),
      bundledNearby: nearby.length,
      lat,
      lng,
      accuracy,
      source,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  useEffect(() => {
    if (visible) refresh();
  }, [visible]);

  return (
    <>
      <TouchableOpacity
        style={s.fab}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={s.fabText}>D</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.title}>Debug Overlay</Text>

            {info && (
              <ScrollView>
                <Row label="Bundled total" value={`${info.bundledTotal}`} />
                <Row label="Within 2.5km" value={`${info.bundledNearby}`} />
                <Row label="Location" value={`${info.lat.toFixed(4)}, ${info.lng.toFixed(4)}`} />
                <Row label="Source" value={info.source} />
                <Row label="GPS accuracy" value={info.accuracy != null ? `${info.accuracy.toFixed(0)}m` : "N/A"} />
                <Row label="Refreshed" value={info.timestamp} />
              </ScrollView>
            )}

            <View style={s.actions}>
              <TouchableOpacity style={s.refreshBtn} onPress={refresh} activeOpacity={0.7}>
                <Text style={s.refreshText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.closeBtn} onPress={() => setVisible(false)} activeOpacity={0.7}>
                <Text style={s.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 110,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  fabText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  sheet: {
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 20,
    width: "85%",
    maxHeight: "60%",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderLight,
    alignSelf: "center", marginBottom: 16,
  },
  title: {
    fontSize: 18, fontWeight: "700", color: colors.textPrimary,
    fontFamily: `${fonts.display}_400Regular`, textAlign: "center", marginBottom: 16,
  },

  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  label: { fontSize: 13, color: colors.textSecondary, fontFamily: `${fonts.body}_500Medium` },
  value: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },

  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  refreshBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.borderLight, alignItems: "center",
  },
  refreshText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },
  closeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.sm,
    backgroundColor: colors.accentSage, alignItems: "center",
  },
  closeText: { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: `${fonts.body}_600SemiBold` },
});

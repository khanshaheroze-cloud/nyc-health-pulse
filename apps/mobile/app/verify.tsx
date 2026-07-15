/* ── "Verify this spot" — Community Verification v1 (App v1 phase 5) ─────────
 * Camera → photograph the menu / posted calorie board → GPS + timestamp
 * attach → upload to /api/verify-submission. GPS >150m from the venue is
 * flagged server-side (never auto-trusted). Anonymous submissions allowed
 * (credit "a local"); signed-in users get contributor credit. If the upload
 * fails offline, the submission queues locally and retries.
 */
import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { colors, fonts, radius, typography } from "../theme/tokens";
import { apiFetch } from "../lib/api";
import { getUserLocation } from "../lib/location";
import { supabase } from "../lib/supabase";

const PENDING_KEY = "pulse-verify-pending";
const COUNT_KEY = "pulse-verify-count";

type VerifyParams = {
  restaurantId: string;
  camis: string;
  placeId: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
};

async function contributor(): Promise<{ id: string | null; name: string | null }> {
  try {
    const { data } = await supabase.auth.getUser();
    const u = data?.user;
    if (!u) return { id: null, name: null };
    const name = (u.user_metadata?.name as string) || u.email?.split("@")[0] || null;
    return { id: u.id, name };
  } catch {
    return { id: null, name: null };
  }
}

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<VerifyParams>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [photo, setPhoto] = useState<{ base64: string; uri: string } | null>(null);
  const [state, setState] = useState<"camera" | "preview" | "uploading" | "done" | "queued">("camera");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ extractedCount: number; remote: boolean } | null>(null);

  const capture = useCallback(async () => {
    if (!cameraRef.current) return;
    setError(null);
    try {
      // quality 0.4 keeps a menu photo ~500KB-1.5MB base64 — inside the 4MB
      // endpoint cap without losing menu-text legibility.
      const shot = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.4 });
      if (!shot?.base64) throw new Error("capture failed");
      setPhoto({ base64: shot.base64, uri: shot.uri });
      setState("preview");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setError("Couldn't capture — try again.");
    }
  }, []);

  const buildPayload = useCallback(async (base64: string) => {
    const loc = await Promise.race([
      getUserLocation(),
      new Promise<null>((r) => setTimeout(() => r(null), 5000)),
    ]).catch(() => null);
    const who = await contributor();
    return {
      imageBase64: base64,
      restaurantId: params.restaurantId ?? null,
      camis: params.camis ?? null,
      placeId: params.placeId ?? null,
      venueName: params.name ?? "Unknown venue",
      address: params.address ?? null,
      venueLat: params.lat ? parseFloat(params.lat) : null,
      venueLng: params.lng ? parseFloat(params.lng) : null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      contributorId: who.id,
      contributorName: who.name,
      capturedAt: new Date().toISOString(),
    };
  }, [params]);

  const upload = useCallback(async () => {
    if (!photo) return;
    setState("uploading");
    setError(null);
    const payload = await buildPayload(photo.base64);
    try {
      const res = await apiFetch<{ id: string; extractedCount: number; remote: boolean }>(
        "/api/verify-submission",
        { method: "POST", body: JSON.stringify(payload) },
        30_000, // photo upload + extraction needs more than the 12s default
      );
      setResult({ extractedCount: res.extractedCount, remote: res.remote });
      const count = parseInt((await AsyncStorage.getItem(COUNT_KEY)) ?? "0", 10) + 1;
      await AsyncStorage.setItem(COUNT_KEY, String(count));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState("done");
    } catch (e) {
      // Queue ONLY on network-level failures (offline/timeout) — a server
      // rejection (413 too large, 400) would just fail again on retry.
      const msg = e instanceof Error ? e.message : String(e);
      const isNetwork =
        (e instanceof Error && e.name === "AbortError") ||
        /network request failed|failed to fetch|abort/i.test(msg);
      if (isNetwork) {
        try {
          const raw = await AsyncStorage.getItem(PENDING_KEY);
          const queue = raw ? JSON.parse(raw) : [];
          queue.push(payload);
          await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(queue));
          setState("queued");
          return;
        } catch {}
      }
      setError(`Upload failed — ${msg}`);
      setState("preview");
    }
  }, [photo, buildPayload]);

  if (!permission?.granted) {
    return (
      <View style={s.permissionView}>
        <Text style={s.permissionIcon}>📸</Text>
        <Text style={s.permissionTitle}>Camera Access Needed</Text>
        <Text style={s.permissionHint}>
          Photograph the menu or posted calorie board to help keep PulseNYC accurate for everyone.
        </Text>
        <TouchableOpacity style={s.grantButton} onPress={requestPermission} accessibilityRole="button">
          <Text style={s.grantText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={s.skipText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === "done" || state === "queued") {
    return (
      <View style={s.permissionView}>
        <Text style={s.permissionIcon}>{state === "done" ? "✅" : "📥"}</Text>
        <Text style={s.permissionTitle}>
          {state === "done" ? "Thanks for verifying!" : "Saved — will upload later"}
        </Text>
        <Text style={s.permissionHint}>
          {state === "done"
            ? `${params.name ?? "This spot"} is in the review queue${
                result?.extractedCount ? ` — ${result.extractedCount} items read from your photo` : ""
              }. Once approved, it gets the "✓ Menu verified" badge with your credit.`
            : "You're offline. Your photo is queued and will submit automatically next time the app opens online."}
        </Text>
        {result?.remote && (
          <Text style={[s.permissionHint, { color: colors.caution }]}>
            Heads up: your location was far from the venue, so this submission gets extra review.
          </Text>
        )}
        <TouchableOpacity style={s.grantButton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={s.grantText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {state === "camera" && (
        <>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
          <View style={s.overlay}>
            <TouchableOpacity style={s.closeButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
            <View style={s.topBanner}>
              <Text style={s.topBannerText} numberOfLines={1}>
                📸 Verifying {params.name ?? "this spot"}
              </Text>
            </View>
            <View style={s.bottomBar}>
              <Text style={s.hint}>Fill the frame with the menu or calorie board</Text>
              <TouchableOpacity style={s.captureButton} onPress={capture} accessibilityRole="button" accessibilityLabel="Take photo">
                <View style={s.captureInner} />
              </TouchableOpacity>
              {error && <Text style={s.errorText}>{error}</Text>}
            </View>
          </View>
        </>
      )}

      {(state === "preview" || state === "uploading") && photo && (
        <View style={s.previewWrap}>
          <Image source={{ uri: photo.uri }} style={s.previewImage} resizeMode="contain" />
          <View style={s.previewBar}>
            {state === "uploading" ? (
              <>
                <ActivityIndicator color={colors.accentSage} />
                <Text style={s.previewHint}>Uploading &amp; reading the menu…</Text>
              </>
            ) : (
              <>
                <Text style={s.previewHint}>Menu text readable?</Text>
                {error && <Text style={s.errorText}>{error}</Text>}
                <View style={s.previewButtons}>
                  <TouchableOpacity
                    style={s.retakeBtn}
                    onPress={() => {
                      setPhoto(null);
                      setState("camera");
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={s.retakeText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.submitBtn} onPress={upload} accessibilityRole="button">
                    <Text style={s.submitText}>Submit →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: { color: "#FFFFFF", fontSize: 18, fontFamily: `${fonts.body}_700Bold` },
  topBanner: {
    marginTop: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxWidth: "75%",
  },
  topBannerText: { color: "#FFFFFF", fontSize: 13, fontFamily: `${fonts.body}_600SemiBold` },
  bottomBar: { alignItems: "center", paddingBottom: 50 },
  hint: { color: "#FFFFFF", fontSize: 14, fontFamily: `${fonts.body}_500Medium`, marginBottom: 18 },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSage },
  errorText: { color: colors.accentCoral, fontSize: 13, fontFamily: `${fonts.body}_500Medium`, marginTop: 12 },

  previewWrap: { flex: 1, backgroundColor: "#000000" },
  previewImage: { flex: 1 },
  previewBar: { backgroundColor: colors.bg, padding: 20, paddingBottom: 40, alignItems: "center", gap: 10 },
  previewHint: { ...typography.bodyMedium, color: colors.textPrimary },
  previewButtons: { flexDirection: "row", gap: 12 },
  retakeBtn: {
    minHeight: 48,
    paddingHorizontal: 24,
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  retakeText: { fontSize: 14, color: colors.textPrimary, fontFamily: `${fonts.body}_600SemiBold` },
  submitBtn: {
    minHeight: 48,
    paddingHorizontal: 28,
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.accentSage,
  },
  submitText: { fontSize: 14, color: "#FFFFFF", fontFamily: `${fonts.body}_700Bold` },

  permissionView: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 40 },
  permissionIcon: { fontSize: 64, marginBottom: 20 },
  permissionTitle: { ...typography.title, color: colors.textPrimary, textAlign: "center" },
  permissionHint: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: `${fonts.body}_400Regular`,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
    lineHeight: 20,
  },
  grantButton: {
    marginTop: 24,
    backgroundColor: colors.accentSage,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: radius.md,
    minHeight: 48,
    justifyContent: "center",
  },
  grantText: { fontSize: 16, color: "#FFFFFF", fontFamily: `${fonts.body}_700Bold` },
  skipText: { fontSize: 14, color: colors.textMuted, fontFamily: `${fonts.body}_500Medium`, marginTop: 16 },
});

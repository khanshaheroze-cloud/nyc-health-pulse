import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { flushAllQueues } from "../lib/offlineFlush";
import { useFonts } from "expo-font";
// Brand fonts (web parity since Round 3): Fraunces display + Inter body.
// Splash is held until these load, so there is no FOUT flash.
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Offline-first: drain queued food logs + verification photos on start and
  // whenever the app returns to the foreground (phase 6).
  useEffect(() => {
    flushAllQueues();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") flushAllQueues();
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="ocr" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="verify" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="privacy" options={{ presentation: "modal" }} />
        <Stack.Screen name="signin" options={{ presentation: "modal" }} />
        <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal" }} />
      </Stack>
    </>
  );
}

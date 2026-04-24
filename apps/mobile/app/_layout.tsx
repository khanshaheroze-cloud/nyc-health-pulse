import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { initSentry } from "../lib/sentry";
import { registerForPushNotifications } from "../lib/notifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    initSentry();
    SplashScreen.hideAsync();
    registerForPushNotifications().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="ocr" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="signin" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}

import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Pulse NYC",
  slug: "pulsenyc",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "pulsenyc",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#f8fafb",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.pulsenyc.mobile",
    infoPlist: {
      NSCameraUsageDescription: "Scan barcodes and read restaurant menus to log food instantly.",
      NSLocationWhenInUseUsageDescription: "Show healthy food options near your current location.",
      NSHealthShareUsageDescription: "Read your workouts so your macro budget adjusts with your training. We never write to your health data.",
    },
    entitlements: {
      "com.apple.developer.healthkit": true,
      "com.apple.developer.healthkit.access": [],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#f8fafb",
    },
    package: "app.pulsenyc.mobile",
    permissions: [
      "CAMERA",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
    ],
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-camera",
      {
        cameraPermission: "Scan barcodes and read restaurant menus.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Show healthy food near you. We never track you in the background.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#2dd4a0",
      },
    ],
    [
      "react-native-health-connect",
      {
        permissions: [
          "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
          "android.permission.health.READ_STEPS",
          "android.permission.health.READ_HEART_RATE",
          "android.permission.health.READ_WEIGHT",
          "android.permission.health.READ_EXERCISE",
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "placeholder-update-after-eas-init",
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://pulsenyc.app",
  },
});

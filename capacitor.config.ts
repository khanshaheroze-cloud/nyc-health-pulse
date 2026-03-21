import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.pulsenyc",
  appName: "Pulse NYC",
  // Point at the live site — content updates without app store resubmission
  server: {
    url: "https://pulsenyc.app",
    cleartext: false,
  },
  ios: {
    scheme: "Pulse NYC",
    contentInset: "automatic",
    backgroundColor: "#f8fafb",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#f8fafb",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#f8fafb",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#f8fafb",
    },
  },
};

export default config;

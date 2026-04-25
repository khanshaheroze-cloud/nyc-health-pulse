const fs = require("fs");
const path = require("path");

const appJsonPath = path.join(__dirname, "..", "app.json");
const config = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

config.expo.plugins = [
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
      locationWhenInUsePermission:
        "Show healthy food near you. We never track you in the background.",
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
];

fs.writeFileSync(appJsonPath, JSON.stringify(config, null, 2) + "\n");
console.log("Injected plugins into app.json");

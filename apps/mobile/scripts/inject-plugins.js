const fs = require("fs");
const path = require("path");

// Debug: what does EAS see?
console.log("=== EAS DEBUG ===");
console.log("cwd:", process.cwd());
console.log("__dirname:", __dirname);
console.log("node_modules exists:", fs.existsSync(path.join(process.cwd(), "node_modules")));
console.log("expo exists:", fs.existsSync(path.join(process.cwd(), "node_modules", "expo")));
console.log("package.json exists:", fs.existsSync(path.join(process.cwd(), "package.json")));
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  console.log("package name:", pkg.name);
  console.log("has expo dep:", !!pkg.dependencies?.expo);
} catch(e) { console.log("cant read package.json:", e.message); }
// Check parent dirs
console.log("parent package.json:", fs.existsSync(path.join(process.cwd(), "..", "..", "package.json")));
console.log("parent node_modules:", fs.existsSync(path.join(process.cwd(), "..", "..", "node_modules")));
try {
  const files = fs.readdirSync(path.join(process.cwd(), "..",".."));
  console.log("root dir files:", files.filter(f => !f.startsWith(".")).join(", "));
} catch(e) { console.log("cant read root:", e.message); }
console.log("=== END DEBUG ===");

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

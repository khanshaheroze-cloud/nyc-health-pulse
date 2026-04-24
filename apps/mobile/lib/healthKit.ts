import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HealthData {
  activeEnergy: number;
  steps: number;
  restingHeartRate: number | null;
  weight: number | null;
  workouts: WorkoutEntry[];
}

export interface WorkoutEntry {
  type: string;
  durationMinutes: number;
  caloriesBurned: number;
  date: string;
}

const CACHE_KEY = "pulse-health-data";
const CACHE_TTL = 15 * 60 * 1000;

async function getCached(): Promise<{ data: HealthData; ts: number } | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (Date.now() - parsed.ts > CACHE_TTL) return null;
  return parsed;
}

async function setCache(data: HealthData): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
}

let healthModule: typeof import("react-native-health") | null = null;
let healthConnectModule: typeof import("react-native-health-connect") | null = null;

async function loadiOS(): Promise<typeof import("react-native-health") | null> {
  if (Platform.OS !== "ios") return null;
  try {
    healthModule ??= await import("react-native-health");
    return healthModule;
  } catch {
    return null;
  }
}

async function loadAndroid(): Promise<typeof import("react-native-health-connect") | null> {
  if (Platform.OS !== "android") return null;
  try {
    healthConnectModule ??= await import("react-native-health-connect");
    return healthConnectModule;
  } catch {
    return null;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS === "ios") {
    const mod = await loadiOS();
    if (!mod) return false;

    const permissions = {
      permissions: {
        read: [
          mod.default.Constants.Permissions.ActiveEnergyBurned,
          mod.default.Constants.Permissions.StepCount,
          mod.default.Constants.Permissions.HeartRate,
          mod.default.Constants.Permissions.Weight,
          mod.default.Constants.Permissions.Workout,
        ],
        write: [],
      },
    };

    return new Promise((resolve) => {
      mod.default.initHealthKit(permissions, (err: string) => {
        resolve(!err);
      });
    });
  }

  if (Platform.OS === "android") {
    const mod = await loadAndroid();
    if (!mod) return false;

    try {
      const available = await mod.getSdkStatus();
      if (available !== mod.SdkAvailabilityStatus.SDK_AVAILABLE) return false;

      await mod.initialize();
      const granted = await mod.requestPermission([
        { accessType: "read", recordType: "ActiveCaloriesBurned" },
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "HeartRate" },
        { accessType: "read", recordType: "Weight" },
        { accessType: "read", recordType: "ExerciseSession" },
      ]);
      return granted.length > 0;
    } catch {
      return false;
    }
  }

  return false;
}

async function readiOS(): Promise<HealthData | null> {
  const mod = await loadiOS();
  if (!mod) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const options = { startDate: startOfDay.toISOString(), endDate: now.toISOString() };

  const [energy, steps, hr, weight, workouts] = await Promise.all([
    new Promise<number>((resolve) => {
      mod!.default.getActiveEnergyBurned(options, (err: string, results: { value: number }[]) => {
        resolve(err ? 0 : results.reduce((sum, r) => sum + r.value, 0));
      });
    }),
    new Promise<number>((resolve) => {
      mod!.default.getStepCount(options, (err: string, results: { value: number }[]) => {
        resolve(err ? 0 : results.reduce((sum, r) => sum + r.value, 0));
      });
    }),
    new Promise<number | null>((resolve) => {
      mod!.default.getHeartRateSamples(options, (err: string, results: { value: number }[]) => {
        if (err || results.length === 0) return resolve(null);
        resolve(Math.round(results.reduce((s, r) => s + r.value, 0) / results.length));
      });
    }),
    new Promise<number | null>((resolve) => {
      mod!.default.getLatestWeight(undefined, (err: string, results: { value: number }) => {
        resolve(err ? null : results?.value ?? null);
      });
    }),
    new Promise<WorkoutEntry[]>((resolve) => {
      mod!.default.getSamples({
        ...options,
        type: mod!.default.Constants.Permissions.Workout,
      }, (err: string, results: { activityName: string; duration: number; calories: number; start: string }[]) => {
        if (err) return resolve([]);
        resolve(results.map((w) => ({
          type: w.activityName || "Workout",
          durationMinutes: Math.round(w.duration / 60),
          caloriesBurned: Math.round(w.calories || 0),
          date: w.start,
        })));
      });
    }),
  ]);

  return {
    activeEnergy: Math.round(energy),
    steps: Math.round(steps),
    restingHeartRate: hr,
    weight,
    workouts,
  };
}

async function readAndroid(): Promise<HealthData | null> {
  const mod = await loadAndroid();
  if (!mod) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timeRange = { operator: "between" as const, startTime: startOfDay.toISOString(), endTime: now.toISOString() };

  try {
    const [energyResult, stepsResult, hrResult, weightResult, workoutsResult] = await Promise.all([
      mod.readRecords("ActiveCaloriesBurned", { timeRangeFilter: timeRange }).catch(() => ({ records: [] as any[] })),
      mod.readRecords("Steps", { timeRangeFilter: timeRange }).catch(() => ({ records: [] as any[] })),
      mod.readRecords("HeartRate", { timeRangeFilter: timeRange }).catch(() => ({ records: [] as any[] })),
      mod.readRecords("Weight", { timeRangeFilter: timeRange }).catch(() => ({ records: [] as any[] })),
      mod.readRecords("ExerciseSession", { timeRangeFilter: timeRange }).catch(() => ({ records: [] as any[] })),
    ]);

    const energy = energyResult.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0), 0);
    const steps = stepsResult.records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);

    const hrSamples = hrResult.records.flatMap((r: any) => r.samples?.map((s: any) => s.beatsPerMinute) ?? []);
    const avgHr = hrSamples.length > 0 ? Math.round(hrSamples.reduce((s: number, v: number) => s + v, 0) / hrSamples.length) : null;

    const latestWeight = weightResult.records.length > 0 ? weightResult.records[weightResult.records.length - 1]?.weight?.inKilograms ?? null : null;

    const workouts: WorkoutEntry[] = workoutsResult.records.map((r: any) => ({
      type: r.exerciseType?.toString() ?? "Workout",
      durationMinutes: Math.round(((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000)),
      caloriesBurned: 0,
      date: r.startTime,
    }));

    return {
      activeEnergy: Math.round(energy),
      steps: Math.round(steps),
      restingHeartRate: avgHr,
      weight: latestWeight,
      workouts,
    };
  } catch {
    return null;
  }
}

export async function readHealthData(): Promise<HealthData | null> {
  const cached = await getCached();
  if (cached) return cached.data;

  const data = Platform.OS === "ios" ? await readiOS() : await readAndroid();
  if (data) await setCache(data);
  return data;
}

export function calculateCalorieBoost(activeEnergy: number): number {
  return Math.round(activeEnergy * 1.0);
}

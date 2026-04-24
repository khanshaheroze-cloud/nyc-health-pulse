declare module "react-native-health" {
  interface HealthKitConstants {
    Permissions: {
      ActiveEnergyBurned: string;
      StepCount: string;
      HeartRate: string;
      Weight: string;
      Workout: string;
    };
  }
  interface HealthKit {
    Constants: HealthKitConstants;
    initHealthKit(permissions: unknown, callback: (err: string) => void): void;
    getActiveEnergyBurned(options: unknown, callback: (err: string, results: { value: number }[]) => void): void;
    getStepCount(options: unknown, callback: (err: string, results: { value: number }[]) => void): void;
    getHeartRateSamples(options: unknown, callback: (err: string, results: { value: number }[]) => void): void;
    getLatestWeight(options: unknown, callback: (err: string, results: { value: number }) => void): void;
    getSamples(options: unknown, callback: (err: string, results: { activityName: string; duration: number; calories: number; start: string }[]) => void): void;
  }
  const _default: HealthKit;
  export default _default;
}

declare module "react-native-health-connect" {
  export enum SdkAvailabilityStatus {
    SDK_AVAILABLE = 3,
    SDK_UNAVAILABLE = 1,
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED = 2,
  }
  export function getSdkStatus(): Promise<SdkAvailabilityStatus>;
  export function initialize(): Promise<void>;
  export function requestPermission(permissions: { accessType: string; recordType: string }[]): Promise<unknown[]>;
  export function readRecords(recordType: string, options: { timeRangeFilter: unknown }): Promise<{ records: any[] }>;
}

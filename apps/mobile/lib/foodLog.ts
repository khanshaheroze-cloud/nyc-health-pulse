/* ── Shared food-log storage — ONE writer for every "log this" flow ──────────
 * Key: pulse-log-<YYYY-MM-DD>. Historical mess: log.tsx writes a bare array,
 * scan.tsx writes { entries: [...] } — readers accept both. This module
 * normalizes on read and PRESERVES the stored shape on write so both existing
 * readers keep working. Every write also enqueues to the offline Supabase
 * queue (visible-pending, flushed on reconnect — phase 6).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { enqueue } from "./offlineQueue";
import { detectLogSlot } from "./daypart";

export type LogSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface LogEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  mealSlot: LogSlot;
  /** Where the entry came from — venue pick, barcode scan, menu photo, manual. */
  source?: "venue-pick" | "scan" | "ocr" | "manual";
  restaurantId?: string;
  restaurantName?: string;
  pulseScore?: number;
  loggedAt?: string;
}

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().split("T")[0];
}

function storageKey(now?: Date): string {
  return `pulse-log-${todayKey(now)}`;
}

export async function readTodayEntries(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.entries ?? [];
  } catch {
    return [];
  }
}

export async function appendLogEntry(entry: Omit<LogEntry, "id" | "mealSlot" | "loggedAt"> & { mealSlot?: LogSlot }): Promise<LogEntry> {
  const full: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mealSlot: entry.mealSlot ?? detectLogSlot(),
    loggedAt: new Date().toISOString(),
    ...entry,
  };
  const key = storageKey();
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      await AsyncStorage.setItem(key, JSON.stringify([full]));
    } else {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.push(full);
        await AsyncStorage.setItem(key, JSON.stringify(parsed));
      } else {
        parsed.entries = [...(parsed.entries ?? []), full];
        await AsyncStorage.setItem(key, JSON.stringify(parsed));
      }
    }
  } catch {
    await AsyncStorage.setItem(key, JSON.stringify([full]));
  }
  // Offline-first sync: queued locally, flushed to Supabase on reconnect.
  try {
    await enqueue("nutrition_log", full);
  } catch {}
  return full;
}

export function totals(entries: LogEntry[]): { calories: number; protein: number; carbs: number; fat: number } {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

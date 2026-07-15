/* ── Offline queue flush (App v1 phase 6) ────────────────────────────────────
 * Two queues drain on app start + foreground resume:
 *  1. pulse-verify-pending — verification photos captured offline
 *  2. pulse-offline-queue  — food-log rows for Supabase sync (offlineQueue.ts;
 *     enqueue existed since v0 but flushQueue was never called — wired now)
 * Failures stay queued; pendingCounts() powers the visible pending state.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";
import { flushQueue, getQueue } from "./offlineQueue";

const VERIFY_PENDING_KEY = "pulse-verify-pending";

let flushing = false;

export async function flushAllQueues(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    // 1. Pending verification submissions
    try {
      const raw = await AsyncStorage.getItem(VERIFY_PENDING_KEY);
      const queue: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
      if (queue.length > 0) {
        const still: Record<string, unknown>[] = [];
        for (const payload of queue) {
          try {
            await apiFetch("/api/verify-submission", { method: "POST", body: JSON.stringify(payload) }, 30_000);
          } catch {
            still.push(payload);
          }
        }
        await AsyncStorage.setItem(VERIFY_PENDING_KEY, JSON.stringify(still));
        if (__DEV__) console.log(`[offlineFlush] verify: ${queue.length - still.length} sent, ${still.length} still queued`);
      }
    } catch {}

    // 2. Food-log Supabase sync
    try {
      await flushQueue();
    } catch {}
  } finally {
    flushing = false;
  }
}

/** Visible pending state (Profile). */
export async function pendingCounts(): Promise<{ verifications: number; logSync: number }> {
  let verifications = 0;
  try {
    const raw = await AsyncStorage.getItem(VERIFY_PENDING_KEY);
    verifications = raw ? (JSON.parse(raw) as unknown[]).length : 0;
  } catch {}
  let logSync = 0;
  try {
    logSync = (await getQueue()).length;
  } catch {}
  return { verifications, logSync };
}

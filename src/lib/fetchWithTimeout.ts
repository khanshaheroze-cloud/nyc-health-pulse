// Site-wide async rule: no data surface may spin forever. Wrap client fetches
// in this 12s timeout so every loading state settles into content or an
// error-with-retry. (Server routes cap their own upstreams — see
// /api/building-health for the per-source 8s pattern.)

export const CLIENT_FETCH_TIMEOUT_MS = 12_000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = CLIENT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
}

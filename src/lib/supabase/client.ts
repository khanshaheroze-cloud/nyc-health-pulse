import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Whether Supabase is configured (env vars present) */
export const supabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

// Lazy singleton — only created on first access in the browser
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

/**
 * Convenience export — returns the client or throws if Supabase isn't configured.
 * Only use in code paths that are guarded by `supabaseEnabled` or `useAuth().user`.
 */
export function getSupabaseOrThrow() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

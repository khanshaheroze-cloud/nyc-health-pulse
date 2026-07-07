import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Cookie-free Supabase client for server-side infrastructure tables (Places
// enrichment cache, API-call counters). Unlike src/lib/supabase/server.ts this
// never touches next/headers, so it's safe in cached server components and
// module-level singletons. Prefers the service-role key when provisioned;
// falls back to the anon key (the cache tables' RLS allows it — see
// supabase/migrations/20260706_places_cache.sql).
let client: SupabaseClient | null | undefined;

export function serviceClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createSupabaseClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

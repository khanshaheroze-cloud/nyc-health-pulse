-- Google Places enrichment cache + daily API-call counter (Round 7).
-- Run this in the Supabase SQL editor (or `supabase db push`).
--
-- places_cache: one row per venue key (venue:{camis}) or bodega cell
-- (bodega-cell:{lat}:{lng}); payload is the PlacesEnrichment / PlaceLite[]
-- JSON. 7-day TTL enforced by readers (fetched_at), not by the DB.
--
-- The app writes with the service-role key when SUPABASE_SERVICE_ROLE_KEY is
-- provisioned; otherwise the anon key (policies below allow it — acceptable
-- for a cache that is re-derivable from the API and validated on read).

create table if not exists public.places_cache (
  key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table public.places_cache enable row level security;

create policy "anon can read places cache"
  on public.places_cache for select
  using (true);

create policy "anon can insert places cache"
  on public.places_cache for insert
  with check (true);

create policy "anon can update places cache"
  on public.places_cache for update
  using (true);

-- Daily Places API call counter — the hard-budget circuit breaker reads this.
create table if not exists public.places_counters (
  day text primary key,        -- YYYY-MM-DD in America/New_York
  calls integer not null default 0
);

alter table public.places_counters enable row level security;

create policy "anon can read places counters"
  on public.places_counters for select
  using (true);

-- Atomic increment, callable by anon (security definer bypasses RLS writes).
create or replace function public.increment_places_calls(p_day text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.places_counters (day, calls)
  values (p_day, 1)
  on conflict (day) do update set calls = places_counters.calls + 1
  returning calls;
$$;

grant execute on function public.increment_places_calls(text) to anon;

-- Community "this place is closed" soft-exclusions read the existing
-- data_reports table; anon needs read access to closed-venue reports so the
-- ranked endpoint can apply the 2-report gate (Round 7, phase 1).
create policy "anon can read closed reports"
  on public.data_reports for select
  using (field = 'closed');

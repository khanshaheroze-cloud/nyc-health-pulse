-- Round 8: cache hit counter alongside the daily Places API call counter, so
-- /admin/metrics can show hit-rate and make cost surprises impossible.
-- Run in the Supabase SQL editor (or `supabase db push`).

alter table public.places_counters
  add column if not exists hits integer not null default 0;

-- Atomic hit increment, same shape as increment_places_calls.
create or replace function public.increment_places_hits(p_day text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.places_counters (day, calls, hits)
  values (p_day, 0, 1)
  on conflict (day) do update set hits = places_counters.hits + 1
  returning hits;
$$;

grant execute on function public.increment_places_hits(text) to anon;

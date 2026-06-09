-- Review queue for user-submitted data corrections (Eat Smart "Report an
-- error"). Run this in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.data_reports (
  id uuid primary key default gen_random_uuid(),
  venue_id text,
  venue_name text not null,
  address text,
  field text not null,            -- wrong-item | wrong-macros | closed | wrong-name | other
  item_name text,
  message text,
  reported_at timestamptz not null default now(),
  user_agent text,
  status text not null default 'new',  -- new | reviewing | fixed | rejected
  created_at timestamptz not null default now()
);

alter table public.data_reports enable row level security;

-- Anonymous visitors may file reports; only the service role reads the queue.
create policy "anyone can insert reports"
  on public.data_reports for insert
  with check (true);

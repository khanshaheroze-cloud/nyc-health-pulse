-- Product-event sink for the demand-validation funnel (no PII).
-- Run in the Supabase SQL editor like 20260609_data_reports.sql.

create table if not exists public.events (
  id bigint generated always as identity primary key,
  event text not null,
  source text not null default 'direct',
  path text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists events_event_created_idx on public.events (event, created_at desc);

alter table public.events enable row level security;

-- Anyone may write events (cookieless beacon); reads are aggregate-only via
-- the dashboard. Rows contain no PII (event name + source + path only).
create policy "anyone can insert events"
  on public.events for insert
  with check (true);

create policy "anyone can count events"
  on public.events for select
  using (true);

-- Community Verification v1 (App v1 phase 5). Photo submissions of menus /
-- posted calorie boards, extracted into structured items, reviewed in the
-- admin queue. Run in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.verification_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- pending → approved | rejected
  status text not null default 'pending',
  camis text,
  place_id text,
  restaurant_id text,
  venue_name text not null,
  address text,
  venue_lat double precision,
  venue_lng double precision,
  submitter_lat double precision,
  submitter_lng double precision,
  distance_m integer,
  -- GPS >150m from the venue: flagged, never auto-trusted
  remote boolean not null default false,
  contributor_id text,
  contributor_name text,
  photo_path text not null,
  -- menu-parse extraction: {items:[{name, price?, calories?, protein?, source}], notes?}
  -- source: 'posted-board' (NYC chains legally post calories) | 'menu-estimated'
  extracted jsonb,
  extraction_model text,
  reviewed_at timestamptz,
  -- built on approve: a ready-to-merge verified-venues record with verifiedAt
  -- + contributor handle (promotion into the frozen ranked surface stays the
  -- owner's verified-venues.json workflow — see APP-FREEZE-REPORT)
  verified_record jsonb
);

alter table public.verification_submissions enable row level security;
-- No anon policies: the API route reads/writes with the service-role key only.

-- Private storage bucket for submission photos.
insert into storage.buckets (id, name, public)
values ('verification-photos', 'verification-photos', false)
on conflict (id) do nothing;

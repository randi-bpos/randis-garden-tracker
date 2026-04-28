-- Run this in Supabase SQL Editor to create your tables.

create extension if not exists "pgcrypto";

create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  variety text,
  date_planted date,
  location text,
  status text not null default 'growing',
  created_at timestamptz not null default now()
);

create table if not exists public.care_logs (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  event_type text not null check (event_type in ('water', 'rain', 'fertilize', 'note')),
  amount_mm numeric(6,2),
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Very open policies for first learning build.
-- Later, we can tighten this with auth and per-user rules.
alter table public.plants enable row level security;
alter table public.care_logs enable row level security;

drop policy if exists "allow all plants" on public.plants;
create policy "allow all plants" on public.plants
for all
using (true)
with check (true);

drop policy if exists "allow all care_logs" on public.care_logs;
create policy "allow all care_logs" on public.care_logs
for all
using (true)
with check (true);

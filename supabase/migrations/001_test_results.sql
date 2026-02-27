create extension if not exists "pgcrypto";

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.club_users(id) on delete cascade,
  station_id text not null,
  station_name text not null,
  station_short_name text not null,
  time_seconds numeric not null,
  tested_at timestamptz not null default now(),
  device_id text null,
  created_at timestamptz not null default now()
);

create index if not exists test_results_club_id_tested_at_idx
  on public.test_results (club_id, tested_at desc);

create index if not exists test_results_user_id_tested_at_idx
  on public.test_results (user_id, tested_at desc);

create index if not exists test_results_station_id_tested_at_idx
  on public.test_results (station_id, tested_at desc);

alter table public.test_results enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'test_results'
      AND policyname = 'staff/admin can read club results'
  ) THEN
    create policy "staff/admin can read club results"
    on public.test_results
    for select
    using (
      public.is_admin_user()
      or exists (
        select 1
        from public.club_staff cs
        where cs.user_id = auth.uid()
          and cs.club_id = test_results.club_id
      )
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'test_results'
      AND policyname = 'staff/admin can insert club results'
  ) THEN
    create policy "staff/admin can insert club results"
    on public.test_results
    for insert
    with check (
      public.is_admin_user()
      or exists (
        select 1
        from public.club_staff cs
        where cs.user_id = auth.uid()
          and cs.club_id = test_results.club_id
      )
    );
  END IF;
END
$$;

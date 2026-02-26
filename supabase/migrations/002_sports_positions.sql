create extension if not exists "pgcrypto";

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (club_id, name)
);

create index if not exists sports_club_id_idx on public.sports (club_id);

alter table public.sports enable row level security;

create policy "staff/admin can read club sports"
on public.sports
for select
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sports.club_id
  )
);

create policy "staff/admin can insert club sports"
on public.sports
for insert
with check (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sports.club_id
  )
);

create policy "staff/admin can update club sports"
on public.sports
for update
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sports.club_id
  )
)
with check (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sports.club_id
  )
);

create table if not exists public.sport_positions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (sport_id, name)
);

create index if not exists sport_positions_club_id_idx on public.sport_positions (club_id);
create index if not exists sport_positions_sport_id_idx on public.sport_positions (sport_id);

alter table public.sport_positions enable row level security;

create policy "staff/admin can read club sport positions"
on public.sport_positions
for select
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sport_positions.club_id
  )
);

create policy "staff/admin can insert club sport positions"
on public.sport_positions
for insert
with check (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sport_positions.club_id
  )
);

create policy "staff/admin can update club sport positions"
on public.sport_positions
for update
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sport_positions.club_id
  )
)
with check (
  public.is_admin_user()
  or exists (
    select 1
    from public.club_staff cs
    where cs.user_id = auth.uid()
      and cs.club_id = sport_positions.club_id
  )
);

alter table public.club_users
  add column if not exists sport_id uuid null references public.sports(id) on delete set null;

alter table public.club_users
  add column if not exists position_id uuid null references public.sport_positions(id) on delete set null;

create index if not exists club_users_sport_id_idx on public.club_users (sport_id);
create index if not exists club_users_position_id_idx on public.club_users (position_id);

-- Note: this migration is additive. No existing data is deleted.

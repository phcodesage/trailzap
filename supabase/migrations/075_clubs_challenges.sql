-- 075_clubs_challenges.sql
-- Clubs (groups) and challenges (time-boxed goals) with membership/participation.

create table if not exists public.clubs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  avatar_url  text,
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  is_private  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

create table if not exists public.club_members (
  id        uuid primary key default gen_random_uuid(),
  club_id   uuid not null references public.clubs (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      public.club_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create index if not exists idx_club_members_club on public.club_members (club_id);
create index if not exists idx_club_members_user on public.club_members (user_id);

-- Helper: is `viewer` a member of `club`? Used by RLS for private clubs.
create or replace function public.is_club_member(viewer uuid, club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_members where club_id = club and user_id = viewer
  );
$$;

-- ---------------------------------------------------------------------------

create table if not exists public.challenges (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  activity_type public.activity_type,
  metric        public.challenge_metric not null,
  target_value  numeric not null check (target_value > 0),
  start_date    date,
  end_date      date,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date >= start_date)
);

create table if not exists public.challenge_participants (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  progress     numeric not null default 0,
  completed    boolean not null default false,
  joined_at    timestamptz not null default now(),
  unique (challenge_id, user_id)
);

create index if not exists idx_challenge_participants_challenge on public.challenge_participants (challenge_id);
create index if not exists idx_challenge_participants_user      on public.challenge_participants (user_id);

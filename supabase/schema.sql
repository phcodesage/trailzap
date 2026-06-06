-- ============================================================================
-- TrailZap — FULL Supabase schema (single file)
-- Paste this whole file into the Supabase SQL editor and Run.
-- Re-runnable: guarded with IF EXISTS / IF NOT EXISTS / ON CONFLICT.
-- ============================================================================

-- 010_extensions.sql
-- Required Postgres extensions for the TrailZap schema.
-- Supabase installs extensions into the `extensions` schema by convention.

-- gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- Case-insensitive text (usernames, emails)
create extension if not exists citext with schema extensions;

-- Geospatial types & indexes (segments, activity start/end points)
create extension if not exists postgis with schema extensions;

-- Make extension types (citext, geography) resolvable for the statements below.
set search_path = public, extensions;


-- 020_enums.sql
-- Enumerated types used across the schema. Guarded so the migration is re-runnable.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum (
      'run', 'ride', 'walk', 'hike', 'swim', 'workout', 'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_visibility') then
    create type public.activity_visibility as enum (
      'everyone', 'followers', 'only_me'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_status') then
    create type public.activity_status as enum (
      'processing', 'ready', 'error'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'gender_type') then
    create type public.gender_type as enum (
      'male', 'female', 'non_binary', 'other', 'prefer_not_to_say'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'club_role') then
    create type public.club_role as enum (
      'owner', 'admin', 'member'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'challenge_metric') then
    create type public.challenge_metric as enum (
      'distance', 'elevation', 'moving_time', 'activity_count'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'like', 'comment', 'follow', 'club_invite', 'challenge_complete', 'segment_kom'
    );
  end if;
end$$;


-- 030_profiles.sql
-- Identity: one row per auth user, auto-created on signup. No password storage
-- (Supabase Auth owns credentials). Denormalized counters are maintained by
-- triggers in later migrations (follows, activities, engagement).

create table if not exists public.profiles (
  id                          uuid primary key references auth.users (id) on delete cascade,
  username                    citext unique not null
                                check (char_length(username) between 3 and 30),
  full_name                   text,
  avatar_url                  text,
  bio                         text check (bio is null or char_length(bio) <= 500),
  location                    text,
  weight_kg                   numeric(5, 2),
  height_cm                   numeric(5, 2),
  gender                      public.gender_type,
  is_private                  boolean not null default false,

  -- Denormalized stats (trigger-maintained; never written by clients)
  total_activities            integer not null default 0,
  total_distance_meters       bigint  not null default 0,
  total_moving_time_seconds   bigint  not null default 0,
  total_elevation_gain_meters integer not null default 0,
  follower_count              integer not null default 0,
  following_count             integer not null default 0,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger function (reused by every table with updated_at).
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile when a new auth user is created.
-- Username comes from signup metadata, falling back to a unique-ish default.
-- SECURITY DEFINER so it can write to public.profiles regardless of caller.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  desired_username citext;
begin
  desired_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1),
    'user'
  );

  -- Ensure uniqueness; append a short suffix from the uid if taken.
  if exists (select 1 from public.profiles where username = desired_username) then
    desired_username := desired_username || '_' || left(replace(new.id::text, '-', ''), 6);
  end if;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    desired_username,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 040_social_graph.sql
-- Follow relationships + maintained follower/following counts + RLS helper.

create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists idx_follows_follower  on public.follows (follower_id);
create index if not exists idx_follows_following on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- Maintain profiles.follower_count / following_count.
-- ---------------------------------------------------------------------------
create or replace function public.sync_follow_counts()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count  = follower_count  + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set follower_count  = greatest(follower_count  - 1, 0) where id = old.following_id;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_sync_counts on public.follows;
create trigger follows_sync_counts
  after insert or delete on public.follows
  for each row execute function public.sync_follow_counts();

-- ---------------------------------------------------------------------------
-- RLS helper: is `viewer` following `target`?
-- SECURITY DEFINER so it bypasses RLS on follows and avoids recursion when
-- referenced from other tables' policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_following(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.follows
    where follower_id = viewer and following_id = target
  );
$$;


-- 050_activities.sql
-- Core activity table + GPS points + photos. Profile aggregate stats are kept
-- in sync via trigger. can_view_activity() is the shared visibility helper used
-- by RLS on activities and all child tables.

create table if not exists public.activities (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles (id) on delete cascade,
  activity_type               public.activity_type not null,
  title                       text not null,
  description                 text check (description is null or char_length(description) <= 1000),

  distance_meters             numeric not null default 0 check (distance_meters >= 0),
  moving_time_seconds         integer not null default 0 check (moving_time_seconds >= 0),
  elapsed_time_seconds        integer check (elapsed_time_seconds is null or elapsed_time_seconds >= 0),
  elevation_gain_meters       numeric not null default 0 check (elevation_gain_meters >= 0),
  average_speed               numeric,  -- meters/second
  max_speed                   numeric,  -- meters/second
  average_pace_seconds_per_km numeric,
  calories                    integer check (calories is null or calories >= 0),

  start_point                 geography(Point, 4326),
  end_point                   geography(Point, 4326),
  route                       jsonb,        -- GeoJSON LineString
  gpx_file_url                text,         -- Storage path in the `gpx` bucket

  start_time                  timestamptz not null,
  visibility                  public.activity_visibility not null default 'everyone',
  status                      public.activity_status not null default 'ready',

  likes_count                 integer not null default 0,
  comments_count              integer not null default 0,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_activities_user_start on public.activities (user_id, start_time desc);
create index if not exists idx_activities_vis_start  on public.activities (visibility, start_time desc);
create index if not exists idx_activities_start_point on public.activities using gist (start_point);

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Maintain profile aggregate stats from activities.
-- ---------------------------------------------------------------------------
create or replace function public.sync_activity_stats()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set
      total_activities            = total_activities + 1,
      total_distance_meters       = total_distance_meters + coalesce(new.distance_meters, 0),
      total_moving_time_seconds   = total_moving_time_seconds + coalesce(new.moving_time_seconds, 0),
      total_elevation_gain_meters = total_elevation_gain_meters + coalesce(new.elevation_gain_meters, 0)::int
    where id = new.user_id;

  elsif tg_op = 'DELETE' then
    update public.profiles set
      total_activities            = greatest(total_activities - 1, 0),
      total_distance_meters       = greatest(total_distance_meters - coalesce(old.distance_meters, 0), 0),
      total_moving_time_seconds   = greatest(total_moving_time_seconds - coalesce(old.moving_time_seconds, 0), 0),
      total_elevation_gain_meters = greatest(total_elevation_gain_meters - coalesce(old.elevation_gain_meters, 0)::int, 0)
    where id = old.user_id;

  elsif tg_op = 'UPDATE' then
    -- Adjust by the delta (handles edits and user reassignment).
    update public.profiles set
      total_distance_meters       = greatest(total_distance_meters - coalesce(old.distance_meters, 0), 0),
      total_moving_time_seconds   = greatest(total_moving_time_seconds - coalesce(old.moving_time_seconds, 0), 0),
      total_elevation_gain_meters = greatest(total_elevation_gain_meters - coalesce(old.elevation_gain_meters, 0)::int, 0),
      total_activities            = greatest(total_activities - 1, 0)
    where id = old.user_id;

    update public.profiles set
      total_activities            = total_activities + 1,
      total_distance_meters       = total_distance_meters + coalesce(new.distance_meters, 0),
      total_moving_time_seconds   = total_moving_time_seconds + coalesce(new.moving_time_seconds, 0),
      total_elevation_gain_meters = total_elevation_gain_meters + coalesce(new.elevation_gain_meters, 0)::int
    where id = new.user_id;
  end if;

  return null;
end;
$$;

drop trigger if exists activities_sync_stats on public.activities;
create trigger activities_sync_stats
  after insert or update or delete on public.activities
  for each row execute function public.sync_activity_stats();

-- ---------------------------------------------------------------------------
-- Visibility helper used by RLS on activities + child tables.
-- ---------------------------------------------------------------------------
create or replace function public.can_view_activity(
  viewer uuid,
  activity_owner uuid,
  visibility public.activity_visibility
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    activity_owner = viewer
    or visibility = 'everyone'
    or (visibility = 'followers' and public.is_following(viewer, activity_owner));
$$;

-- ---------------------------------------------------------------------------
-- High-volume GPS samples for full route replay (optional to populate).
-- ---------------------------------------------------------------------------
create table if not exists public.activity_points (
  id          bigint generated always as identity primary key,
  activity_id uuid not null references public.activities (id) on delete cascade,
  latitude    double precision not null,
  longitude   double precision not null,
  elevation   double precision,
  heart_rate  smallint,
  cadence     smallint,
  speed       double precision,
  recorded_at timestamptz
);

create index if not exists idx_activity_points_activity on public.activity_points (activity_id, recorded_at);

-- ---------------------------------------------------------------------------
-- Activity photos (files live in the `activity-photos` Storage bucket).
-- ---------------------------------------------------------------------------
create table if not exists public.activity_photos (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  image_url   text not null,
  width       integer,
  height      integer,
  created_at  timestamptz not null default now()
);

create index if not exists idx_activity_photos_activity on public.activity_photos (activity_id);


-- 060_engagement.sql
-- Likes and comments, with denormalized counts on activities maintained by triggers.

create table if not exists public.activity_likes (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index if not exists idx_activity_likes_activity on public.activity_likes (activity_id);
create index if not exists idx_activity_likes_user     on public.activity_likes (user_id);

create or replace function public.sync_like_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.activities set likes_count = likes_count + 1 where id = new.activity_id;
  elsif tg_op = 'DELETE' then
    update public.activities set likes_count = greatest(likes_count - 1, 0) where id = old.activity_id;
  end if;
  return null;
end;
$$;

drop trigger if exists activity_likes_sync_count on public.activity_likes;
create trigger activity_likes_sync_count
  after insert or delete on public.activity_likes
  for each row execute function public.sync_like_count();

-- ---------------------------------------------------------------------------

create table if not exists public.activity_comments (
  id                uuid primary key default gen_random_uuid(),
  activity_id       uuid not null references public.activities (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  body              text not null check (char_length(body) between 1 and 1000),
  parent_comment_id uuid references public.activity_comments (id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_activity_comments_activity on public.activity_comments (activity_id, created_at);
create index if not exists idx_activity_comments_parent   on public.activity_comments (parent_comment_id);

drop trigger if exists activity_comments_set_updated_at on public.activity_comments;
create trigger activity_comments_set_updated_at
  before update on public.activity_comments
  for each row execute function public.set_updated_at();

create or replace function public.sync_comment_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.activities set comments_count = comments_count + 1 where id = new.activity_id;
  elsif tg_op = 'DELETE' then
    update public.activities set comments_count = greatest(comments_count - 1, 0) where id = old.activity_id;
  end if;
  return null;
end;
$$;

drop trigger if exists activity_comments_sync_count on public.activity_comments;
create trigger activity_comments_sync_count
  after insert or delete on public.activity_comments
  for each row execute function public.sync_comment_count();


-- 070_segments.sql
-- Segments + per-pass efforts + a ranked leaderboard view.

create table if not exists public.segments (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text,
  activity_type         public.activity_type,
  distance_meters       numeric,
  elevation_gain_meters numeric,
  start_point           geography(Point, 4326),
  end_point             geography(Point, 4326),
  polyline              text,  -- Google encoded polyline
  creator_id            uuid references public.profiles (id) on delete set null,
  is_private            boolean not null default false,
  created_at            timestamptz not null default now()
);

create index if not exists idx_segments_start_point on public.segments using gist (start_point);
create index if not exists idx_segments_end_point   on public.segments using gist (end_point);
create index if not exists idx_segments_creator     on public.segments (creator_id);

-- ---------------------------------------------------------------------------

create table if not exists public.segment_efforts (
  id                   uuid primary key default gen_random_uuid(),
  segment_id           uuid not null references public.segments (id) on delete cascade,
  activity_id          uuid not null references public.activities (id) on delete cascade,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  elapsed_time_seconds integer not null check (elapsed_time_seconds >= 0),
  moving_time_seconds  integer check (moving_time_seconds is null or moving_time_seconds >= 0),
  average_speed        numeric,
  start_time           timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists idx_segment_efforts_ranking  on public.segment_efforts (segment_id, elapsed_time_seconds);
create index if not exists idx_segment_efforts_user     on public.segment_efforts (user_id);
create index if not exists idx_segment_efforts_activity on public.segment_efforts (activity_id);

-- ---------------------------------------------------------------------------
-- Leaderboard: each user's best effort per segment, ranked by time.
-- A view keeps it always-correct; swap for a materialized view / physical
-- cache table if ranking ever becomes a hot path.
-- ---------------------------------------------------------------------------
create or replace view public.segment_leaderboards as
with best_efforts as (
  select distinct on (segment_id, user_id)
    segment_id,
    user_id,
    id as best_effort_id,
    elapsed_time_seconds as best_time_seconds,
    start_time
  from public.segment_efforts
  order by segment_id, user_id, elapsed_time_seconds asc, start_time asc
)
select
  segment_id,
  user_id,
  best_effort_id,
  best_time_seconds,
  rank() over (partition by segment_id order by best_time_seconds asc) as rank
from best_efforts;


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


-- 078_personal_records_notifications.sql
-- Personal records (precomputed bests) and per-user notifications.
-- PR population logic (trigger / edge function) is intentionally deferred.

create table if not exists public.personal_records (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  activity_type     public.activity_type not null,
  record_type       text not null,             -- e.g. '5k', '10k', 'longest', 'fastest'
  distance_meters   numeric,
  best_time_seconds integer,
  activity_id       uuid references public.activities (id) on delete set null,
  achieved_at       timestamptz,
  updated_at        timestamptz not null default now(),
  unique (user_id, activity_type, record_type)
);

create index if not exists idx_personal_records_user on public.personal_records (user_id);

drop trigger if exists personal_records_set_updated_at on public.personal_records;
create trigger personal_records_set_updated_at
  before update on public.personal_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,  -- recipient
  actor_id     uuid references public.profiles (id) on delete set null,          -- who triggered it
  type         public.notification_type not null,
  reference_id uuid,                                                              -- polymorphic target
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, is_read, created_at desc);


-- 080_rls.sql
-- Row Level Security for every table. All policies target the `authenticated`
-- role. Visibility decisions reuse the SECURITY DEFINER helpers is_following(),
-- can_view_activity(), and is_club_member() so policies never recurse.
-- Re-runnable: each policy is dropped first.

-- Make the leaderboard view respect the querying user's RLS on segment_efforts.
alter view public.segment_leaderboards set (security_invoker = on);

-- ===========================================================================
-- profiles
-- ===========================================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (not is_private or id = auth.uid() or public.is_following(auth.uid(), id));

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ===========================================================================
-- follows
-- ===========================================================================
alter table public.follows enable row level security;

drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows
  for select to authenticated using (true);

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own on public.follows
  for insert to authenticated with check (follower_id = auth.uid());

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows
  for delete to authenticated using (follower_id = auth.uid());

-- ===========================================================================
-- activities
-- ===========================================================================
alter table public.activities enable row level security;

drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities
  for select to authenticated
  using (public.can_view_activity(auth.uid(), user_id, visibility));

drop policy if exists activities_insert_own on public.activities;
create policy activities_insert_own on public.activities
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists activities_update_own on public.activities;
create policy activities_update_own on public.activities
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists activities_delete_own on public.activities;
create policy activities_delete_own on public.activities
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- activity_points  (visibility inherited from parent activity)
-- ===========================================================================
alter table public.activity_points enable row level security;

drop policy if exists activity_points_select on public.activity_points;
create policy activity_points_select on public.activity_points
  for select to authenticated
  using (exists (
    select 1 from public.activities a
    where a.id = activity_id
      and public.can_view_activity(auth.uid(), a.user_id, a.visibility)
  ));

drop policy if exists activity_points_write_own on public.activity_points;
create policy activity_points_write_own on public.activity_points
  for all to authenticated
  using (exists (
    select 1 from public.activities a where a.id = activity_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.activities a where a.id = activity_id and a.user_id = auth.uid()
  ));

-- ===========================================================================
-- activity_photos
-- ===========================================================================
alter table public.activity_photos enable row level security;

drop policy if exists activity_photos_select on public.activity_photos;
create policy activity_photos_select on public.activity_photos
  for select to authenticated
  using (exists (
    select 1 from public.activities a
    where a.id = activity_id
      and public.can_view_activity(auth.uid(), a.user_id, a.visibility)
  ));

drop policy if exists activity_photos_insert_own on public.activity_photos;
create policy activity_photos_insert_own on public.activity_photos
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.activities a where a.id = activity_id and a.user_id = auth.uid())
  );

drop policy if exists activity_photos_delete_own on public.activity_photos;
create policy activity_photos_delete_own on public.activity_photos
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- activity_likes
-- ===========================================================================
alter table public.activity_likes enable row level security;

drop policy if exists activity_likes_select on public.activity_likes;
create policy activity_likes_select on public.activity_likes
  for select to authenticated
  using (exists (
    select 1 from public.activities a
    where a.id = activity_id
      and public.can_view_activity(auth.uid(), a.user_id, a.visibility)
  ));

drop policy if exists activity_likes_insert_own on public.activity_likes;
create policy activity_likes_insert_own on public.activity_likes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = activity_id
        and public.can_view_activity(auth.uid(), a.user_id, a.visibility)
    )
  );

drop policy if exists activity_likes_delete_own on public.activity_likes;
create policy activity_likes_delete_own on public.activity_likes
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- activity_comments
-- ===========================================================================
alter table public.activity_comments enable row level security;

drop policy if exists activity_comments_select on public.activity_comments;
create policy activity_comments_select on public.activity_comments
  for select to authenticated
  using (exists (
    select 1 from public.activities a
    where a.id = activity_id
      and public.can_view_activity(auth.uid(), a.user_id, a.visibility)
  ));

drop policy if exists activity_comments_insert_own on public.activity_comments;
create policy activity_comments_insert_own on public.activity_comments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.activities a
      where a.id = activity_id
        and public.can_view_activity(auth.uid(), a.user_id, a.visibility)
    )
  );

drop policy if exists activity_comments_update_own on public.activity_comments;
create policy activity_comments_update_own on public.activity_comments
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists activity_comments_delete_own on public.activity_comments;
create policy activity_comments_delete_own on public.activity_comments
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- segments
-- ===========================================================================
alter table public.segments enable row level security;

drop policy if exists segments_select on public.segments;
create policy segments_select on public.segments
  for select to authenticated
  using (not is_private or creator_id = auth.uid());

drop policy if exists segments_insert_own on public.segments;
create policy segments_insert_own on public.segments
  for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists segments_update_own on public.segments;
create policy segments_update_own on public.segments
  for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());

drop policy if exists segments_delete_own on public.segments;
create policy segments_delete_own on public.segments
  for delete to authenticated using (creator_id = auth.uid());

-- ===========================================================================
-- segment_efforts  (visibility inherited from the parent activity)
-- ===========================================================================
alter table public.segment_efforts enable row level security;

drop policy if exists segment_efforts_select on public.segment_efforts;
create policy segment_efforts_select on public.segment_efforts
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.activities a
      where a.id = activity_id
        and public.can_view_activity(auth.uid(), a.user_id, a.visibility)
    )
  );

drop policy if exists segment_efforts_insert_own on public.segment_efforts;
create policy segment_efforts_insert_own on public.segment_efforts
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.activities a where a.id = activity_id and a.user_id = auth.uid())
  );

drop policy if exists segment_efforts_delete_own on public.segment_efforts;
create policy segment_efforts_delete_own on public.segment_efforts
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- clubs
-- ===========================================================================
alter table public.clubs enable row level security;

drop policy if exists clubs_select on public.clubs;
create policy clubs_select on public.clubs
  for select to authenticated
  using (not is_private or owner_id = auth.uid() or public.is_club_member(auth.uid(), id));

drop policy if exists clubs_insert_own on public.clubs;
create policy clubs_insert_own on public.clubs
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists clubs_update_own on public.clubs;
create policy clubs_update_own on public.clubs
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists clubs_delete_own on public.clubs;
create policy clubs_delete_own on public.clubs
  for delete to authenticated using (owner_id = auth.uid());

-- ===========================================================================
-- club_members
-- ===========================================================================
alter table public.club_members enable row level security;

drop policy if exists club_members_select on public.club_members;
create policy club_members_select on public.club_members
  for select to authenticated
  using (
    public.is_club_member(auth.uid(), club_id)
    or exists (select 1 from public.clubs c where c.id = club_id and (not c.is_private or c.owner_id = auth.uid()))
  );

drop policy if exists club_members_join_self on public.club_members;
create policy club_members_join_self on public.club_members
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists club_members_leave_or_owner on public.club_members;
create policy club_members_leave_or_owner on public.club_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.clubs c where c.id = club_id and c.owner_id = auth.uid())
  );

drop policy if exists club_members_update_owner on public.club_members;
create policy club_members_update_owner on public.club_members
  for update to authenticated
  using (exists (select 1 from public.clubs c where c.id = club_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.clubs c where c.id = club_id and c.owner_id = auth.uid()));

-- ===========================================================================
-- challenges
-- ===========================================================================
alter table public.challenges enable row level security;

drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select to authenticated using (true);

drop policy if exists challenges_insert_own on public.challenges;
create policy challenges_insert_own on public.challenges
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists challenges_update_own on public.challenges;
create policy challenges_update_own on public.challenges
  for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists challenges_delete_own on public.challenges;
create policy challenges_delete_own on public.challenges
  for delete to authenticated using (created_by = auth.uid());

-- ===========================================================================
-- challenge_participants
-- ===========================================================================
alter table public.challenge_participants enable row level security;

drop policy if exists challenge_participants_select on public.challenge_participants;
create policy challenge_participants_select on public.challenge_participants
  for select to authenticated using (true);

drop policy if exists challenge_participants_join_self on public.challenge_participants;
create policy challenge_participants_join_self on public.challenge_participants
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists challenge_participants_update_self on public.challenge_participants;
create policy challenge_participants_update_self on public.challenge_participants
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists challenge_participants_delete_self on public.challenge_participants;
create policy challenge_participants_delete_self on public.challenge_participants
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- personal_records  (owner-only for now)
-- ===========================================================================
alter table public.personal_records enable row level security;

drop policy if exists personal_records_all_own on public.personal_records;
create policy personal_records_all_own on public.personal_records
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===========================================================================
-- notifications  (recipient-only; actor may create its own)
-- ===========================================================================
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_insert_actor on public.notifications;
create policy notifications_insert_actor on public.notifications
  for insert to authenticated with check (actor_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (user_id = auth.uid());


-- 085_feed.sql
-- Home feed as a query (no fan-out table). Returns activities from the people
-- `viewer` follows plus the viewer's own, newest first, with author info,
-- counters, and whether the viewer has liked each one.
--
-- SECURITY INVOKER (the default): activity RLS still applies, so visibility is
-- enforced automatically — this function only narrows to followed authors.

create or replace function public.get_feed(
  viewer uuid default auth.uid(),
  page_limit integer default 20,
  before timestamptz default now()
)
returns table (
  id                          uuid,
  user_id                     uuid,
  username                    citext,
  full_name                   text,
  avatar_url                  text,
  activity_type               public.activity_type,
  title                       text,
  description                 text,
  distance_meters             numeric,
  moving_time_seconds         integer,
  elevation_gain_meters       numeric,
  average_speed               numeric,
  average_pace_seconds_per_km numeric,
  route                       jsonb,
  start_time                  timestamptz,
  visibility                  public.activity_visibility,
  likes_count                 integer,
  comments_count              integer,
  viewer_has_liked            boolean,
  created_at                  timestamptz
)
language sql
stable
as $$
  select
    a.id,
    a.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    a.activity_type,
    a.title,
    a.description,
    a.distance_meters,
    a.moving_time_seconds,
    a.elevation_gain_meters,
    a.average_speed,
    a.average_pace_seconds_per_km,
    a.route,
    a.start_time,
    a.visibility,
    a.likes_count,
    a.comments_count,
    exists (
      select 1 from public.activity_likes l
      where l.activity_id = a.id and l.user_id = viewer
    ) as viewer_has_liked,
    a.created_at
  from public.activities a
  join public.profiles p on p.id = a.user_id
  where a.created_at < before
    and (
      a.user_id = viewer
      or a.user_id in (
        select following_id from public.follows where follower_id = viewer
      )
    )
  order by a.created_at desc
  limit greatest(least(page_limit, 100), 1);
$$;

grant execute on function public.get_feed(uuid, integer, timestamptz) to authenticated;


-- 090_storage.sql
-- Storage buckets + object policies. Convention: files live under a top-level
-- folder named after the owner's uid, e.g. `avatars/<uid>/photo.png`, so the
-- first path segment is checked against auth.uid().

insert into storage.buckets (id, name, public)
values
  ('avatars',         'avatars',         true),
  ('activity-photos', 'activity-photos', true),
  ('gpx',             'gpx',             false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- avatars (public read, owner write)
-- ---------------------------------------------------------------------------
drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- activity-photos (public read, owner write)
-- ---------------------------------------------------------------------------
drop policy if exists activity_photos_read on storage.objects;
create policy activity_photos_read on storage.objects
  for select using (bucket_id = 'activity-photos');

drop policy if exists activity_photos_insert_own on storage.objects;
create policy activity_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists activity_photos_update_own on storage.objects;
create policy activity_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists activity_photos_delete_own on storage.objects;
create policy activity_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'activity-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- gpx (private: owner-only for all operations)
-- ---------------------------------------------------------------------------
drop policy if exists gpx_select_own on storage.objects;
create policy gpx_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists gpx_insert_own on storage.objects;
create policy gpx_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists gpx_update_own on storage.objects;
create policy gpx_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists gpx_delete_own on storage.objects;
create policy gpx_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'gpx' and (storage.foldername(name))[1] = auth.uid()::text);


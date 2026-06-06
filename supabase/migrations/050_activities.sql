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

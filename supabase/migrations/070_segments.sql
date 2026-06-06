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

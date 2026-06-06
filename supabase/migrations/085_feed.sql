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

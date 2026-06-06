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

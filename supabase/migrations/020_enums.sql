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

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
set search_path = public
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

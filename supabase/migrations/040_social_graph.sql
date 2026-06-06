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

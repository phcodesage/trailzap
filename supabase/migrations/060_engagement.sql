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

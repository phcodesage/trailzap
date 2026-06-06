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

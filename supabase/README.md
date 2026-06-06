# TrailZap — Supabase schema

Full Strava-style schema. **Database is the source of truth**; the app code is
still being migrated to it (see "App not yet aligned" below).

## Apply order

Run the files in `migrations/` in numeric order. Two ways:

**Supabase SQL editor** (simplest): open each file in order and Run.

```
010_extensions.sql
020_enums.sql
030_profiles.sql
040_social_graph.sql
050_activities.sql
060_engagement.sql
070_segments.sql
075_clubs_challenges.sql
078_personal_records_notifications.sql
080_rls.sql
085_feed.sql
090_storage.sql
```

**Supabase CLI** (versioned): `supabase link --project-ref <ref>` then
`supabase db push`. (CLI prefers timestamped filenames; rename if you adopt this flow.)

Migrations are re-runnable (guards + `drop ... if exists`).

## Design at a glance

- **Identity:** `profiles` keyed to `auth.users(id)`, auto-created by the
  `handle_new_user()` trigger on signup. No password storage.
- **Counters** (`profiles.total_*`, `follower_count`/`following_count`,
  `activities.likes_count`/`comments_count`) are trigger-maintained — never write them from clients.
- **Visibility** is enforced by RLS using `can_view_activity()` / `is_following()`
  (everyone / followers / only_me).
- **Feed:** call the `get_feed()` function (no fan-out table).
- **Leaderboards:** `segment_leaderboards` view over `segment_efforts`.
- **Geo:** PostGIS `geography(Point,4326)` for `start_point`/`end_point`; full route
  kept as GeoJSON `jsonb` on `activities`; optional `activity_points` for full replay.
- **Storage buckets:** `avatars` (public), `activity-photos` (public), `gpx` (private).
  Files go under a `<uid>/...` folder; policies check the first path segment.

PostGIS and citext install into the `extensions` schema (Supabase's default
`search_path` includes it, so the unqualified `geography`/`citext` types resolve).

## Deferred on purpose

- `feed_items` fan-out table (use `get_feed()` until scale demands it).
- `personal_records` population logic (table exists; fill via trigger/edge function later).
- Segment-effort detection (matching activities to segments) — app/edge logic.

## App not yet aligned

The current app still targets the old `users`/`activities` shape. These need updating
in a later phase (out of scope for the schema work):
`services/supabase.ts`, `app/(tabs)/track.tsx`, `services/activities.ts`,
`utils/userUtils.ts`, `types/auth.ts`, `types/activity.ts`.

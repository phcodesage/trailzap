-- 010_extensions.sql
-- Required Postgres extensions for the TrailZap schema.
-- Supabase installs extensions into the `extensions` schema by convention.

-- gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- Case-insensitive text (usernames, emails)
create extension if not exists citext with schema extensions;

-- Geospatial types & indexes (segments, activity start/end points)
create extension if not exists postgis with schema extensions;

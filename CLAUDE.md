# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

TrailZap is an Expo (SDK 54) React Native app backed entirely by Supabase (no custom server).

- **Frontend**: expo-router (file-based routing, typed routes enabled), React Native Paper (Material Design UI), React 19 / RN 0.81.
- **Backend/data**: Supabase only — auth via `services/supabase.ts` (`supabase.auth.*`) and Postgres accessed directly with the Supabase client (e.g. `services/activities.ts`, and inline queries in screens like `app/(tabs)/track.tsx`).
- **Package manager**: npm (package-lock.json).

## Commands

- `npm run dev` — start Expo dev server (then scan QR with Expo Go).
- `npm run lint` — runs `expo lint` (Expo's ESLint wrapper; not raw `eslint`).
- `npm run ios` / `npm run android` — native simulator/device builds.
- No test framework is set up — there are no tests to run.

## Conventions

- **Path alias**: import from project root with `@/*` (e.g. `@/components/Button`), per tsconfig.
- **Formatting** (.prettierrc): 2-space indent, single quotes, no tabs. A hook auto-formats edited `.ts`/`.tsx` files.
- **Logging**: use the custom logger in `utils/logger.ts` (DEBUG/INFO/WARN/ERROR, env-aware) instead of raw `console.*`.
- **Commits**: use lowercase `verb: description` messages matching history (e.g. `added: saving track`, `fixed: dark theme on hometab`). Commit directly to `main` — no PR flow.

## Environment

Client env vars must be prefixed `EXPO_PUBLIC_` to be exposed: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (the Supabase project URL + publishable/anon key). Both are required — `services/supabase.ts` throws if either is missing. See `.env.example`.

## Gotchas

- Data access goes straight through the Supabase client — table reads/writes depend on Row Level Security policies, so a query can succeed yet return nothing if RLS isn't set for that table.
- Typed routes are enabled (`experiments.typedRoutes`), so route strings are type-checked — add the route before referencing it.
- `utils/userUtils.ts` (`transformSupabaseUser`) maps Supabase `user_metadata` to the app `User` type; use it rather than reading metadata directly.

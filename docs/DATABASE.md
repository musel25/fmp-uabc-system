# Database

Supabase Postgres. Two application tables; `schema.sql` at the repo root is the always-current reference copy, and `migrations/` holds the incremental changes that were actually applied.

## Tables

**`profiles`** — one row per account, created automatically by the `on_auth_user_created` trigger when someone signs up. Holds `email`, `name`, and `role` (`user` | `admin`). The application can read profiles but never write them; roles are managed from the Supabase dashboard.

**`events`** — one row per registered event. Columns map 1:1 to the documented `Event` interface in `lib/types.ts` (snake_case here, camelCase there; `lib/event-mapper.ts` is the only converter). Highlights:

- `status`: `en_revision` (default) → `aprobado` | `rechazado`.
- `is_authorized`, `user_type`, `seaes_categories`: the space-rental questions added by migration 001. `NULL` (or `{}`) means the row predates the questions.
- `responsible` / `email`: a copy of the creator's name/email taken at registration time; admin queries also embed the live profile and prefer it.
- `certificate_status`: reserved for a future certificate workflow; the app doesn't use it yet.
- `updated_at` maintained by trigger on both tables.

## Row Level Security — the authorization model

The browser talks to Postgres directly with the anon key, so these policies are the only thing standing between a user and the data:

| Table | Policy | Effect |
|---|---|---|
| events | Users can view their own events | `user_id = auth.uid()` |
| events | Users can create events | own row **and `status = 'en_revision'`** |
| events | Users can update their own events | own row, **and the result must stay `en_revision`** |
| events | Admins can view / update all events | `profiles.role = 'admin'` |
| profiles | Users can view their own profile | `id = auth.uid()` |
| profiles | Admins can view all profiles | via `is_admin()` |

Consequences, by design:

- A user **cannot approve their own event** — no user-side write can produce `aprobado`.
- A user **cannot make themselves admin** — there is no UPDATE policy on profiles at all.
- Nobody can DELETE through the API (no DELETE policies).
- `is_admin()` is `SECURITY DEFINER` so the profiles policy can consult profiles without infinite RLS recursion.

## Making schema changes

1. Write a numbered file in `migrations/` (`002_...sql`) with a comment explaining *why*.
2. Apply it: Supabase Dashboard → SQL Editor (or the Management API).
3. Update `schema.sql` to match, and `lib/types.ts` + `lib/event-mapper.ts` if columns changed.

Never point the app at columns before the migration has run in production — PostgREST rejects unknown columns and event registration would break.

# Deployment

## Where it runs

- **Hosting:** Vercel — production at [fmp-uabc-system.vercel.app](https://fmp-uabc-system.vercel.app), auto-deployed from `master` on GitHub (`musel25/fmp-uabc-system`).
- **Database & auth:** Supabase project (Postgres + Auth). The auth redirect URLs in `lib/supabase-auth.ts` point at the production domain — update them if the domain changes.
- **Email:** Resend, via the `RESEND_API_KEY` environment variable.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public by design; RLS enforces access |
| `RESEND_API_KEY` | production | Without it, emails are logged server-side instead of sent |

No service-role key is used anywhere, on purpose.

## Releasing

1. Merge/push to `master` → Vercel builds and deploys automatically.
2. The build fails on any TypeScript or ESLint error (enforced in `next.config.mjs` by *not* ignoring them) — so a green build is a real signal.
3. **If the release includes a migration, apply the SQL to Supabase *before* pushing the code** (Dashboard → SQL Editor, or the Management API). Code that references columns the database doesn't have yet breaks event registration.

## Operations notes

- **Promote an admin:** Supabase Dashboard → Table Editor → `profiles` → set `role = 'admin'`. There is deliberately no in-app way to do this.
- **Auth emails** (confirmation, password reset) are sent by Supabase itself and configured in the Supabase dashboard, separate from Resend.
- **Backups / data:** standard Supabase tooling; the app performs no deletes (no DELETE policies), so data loss via the app is not possible.

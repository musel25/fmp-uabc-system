# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this system is

A **Next.js 15 web application** for the Faculty of Medicine and Psychology (FMP) at UABC (Universidad Autónoma de Baja California). Organizers register events through a wizard; the coordination reviews each request and approves or rejects it; email notifications keep both sides informed. Full product description: `docs/ARCHITECTURE.md`.

**Stack:** Next.js 15 (App Router, all interactive pages are client components) · TypeScript strict · Tailwind CSS v4 · shadcn/ui (New York) · React Hook Form + Zod · **Supabase** (auth + Postgres with RLS) · Resend for email · Vercel hosting.

## Commands

```bash
npm run dev      # development server
npm run build    # production build — TypeScript and ESLint errors FAIL the build
npm run lint     # ESLint (next/core-web-vitals)
npx tsc --noEmit # typecheck only
```

## Architecture in one paragraph

There is no meaningful server side: every page runs in the browser and talks to Supabase directly with the **anon key**, so **Row Level Security is the entire authorization model** (`schema.sql` documents it; `migrations/` holds incremental changes). The one API route, `app/api/send-email/route.ts`, sends mail through Resend. Auth is real Supabase auth (`lib/supabase-auth.ts`); a `profiles` row with a `role` of `user` or `admin` is created by a DB trigger at signup, and roles are changed only from the Supabase dashboard.

## The event lifecycle

```
create (wizard) ──► en_revision ──► aprobado
                        ▲               └─ (final)
                        └── rechazado ──► edit + resubmit
```

- Users can only create/update events with `status = 'en_revision'` — RLS forbids anything else, so admins are the only path to `aprobado`/`rechazado`.
- Only `rechazado` events are editable (`app/events/[id]/edit`).
- Approving/rejecting emails the organizer; approving also emails the codes team. See `lib/email.ts` for who gets notified — **do not remove the email system; it is in production use.**

## Key modules (read these before touching data flow)

- `lib/types.ts` — the `Event` / `CreateEventData` domain types, documented field by field.
- `lib/event-mapper.ts` — the **only** place snake_case rows convert to/from camelCase. Add new columns here.
- `lib/supabase-database.ts` — user-side queries. `lib/supabase-admin.ts` — admin-side queries (embed `profiles` for the creator's name/email).
- `lib/event-form.ts` — wizard form values (`""` = unanswered radio), catalog constants (SEAES categories, external-user costs), and converters between form values and `CreateEventData`.
- `lib/timezone.ts` — all event datetimes are Tijuana wall time in the UI and UTC in the DB. Always use these helpers.
- `lib/workflow.ts` — the six-phase process guide, deadlines (21-day lead, evidence window), and copy shown across the app.

## Adding a field to events (the full chain)

1. SQL migration in `migrations/` (apply via Supabase; keep `schema.sql` in sync).
2. `lib/types.ts` (`Event` + `CreateEventData` if user-provided).
3. `lib/event-mapper.ts` (both directions).
4. Wizard: schema in `event-wizard.tsx`, UI in `wizard-steps/event-data-step.tsx`, summary in `wizard-steps/event-review-step.tsx`, prefill in `lib/event-form.ts#eventToWizardValues`.
5. Display: `app/events/[id]/page.tsx` and `components/admin/admin-event-review-drawer.tsx`.

## Conventions

- Spanish locale (`es-MX`) for every user-facing string; code and comments may be English or Spanish (match the file).
- Path alias `@/*`. Kebab-case files, PascalCase components.
- UABC brand: primary green `#006341`, secondary ochre `#cc8a00`; status colors via `--state-*` CSS variables in `app/globals.css`; `card-uabc`, `chip-*`, `eyebrow` utility classes.
- `components/ui/` is shadcn-generated — extend via composition, don't hand-edit.
- Forms: React Hook Form + Zod with Spanish messages; follow `components/events/wizard-steps/`.

## Environment

`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `RESEND_API_KEY` is set in Vercel for production; without it the email route logs instead of sending. There is no service-role key anywhere in the app — never add one to client code.

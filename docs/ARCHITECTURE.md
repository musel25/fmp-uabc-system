# Architecture

## What the system does

The site is the front door for organizing an event at the Faculty of Medicine and Psychology (FMP-UABC). It exists so that:

1. **Organizers** (professors, students, and now also people external to UABC renting faculty spaces) register an event with everything the coordination needs to evaluate it: dates, venue, modality, program, classification, SEAES categories, description, speakers, organizers, and whether dirección/subdirección already authorized it.
2. **The coordination (admins)** works through a review queue, opens each request, and resolves it — approve (optionally with a note) or reject (with a mandatory reason the organizer must fix).
3. **Email** keeps everyone in sync: the coordination hears about each new request, the organizer hears the resolution, and the codes team receives the "códigos 8 = 1" details for approved events.
4. **Rejected events** can be edited by their owner and resubmitted, re-entering the queue.

Rules the system enforces:

- Events need **at least 21 calendar days** of lead time (`MIN_LEAD_DAYS` in `lib/workflow.ts`).
- Events that **charge attendees** are not registered here — the wizard stops and points to the continuing-education office.
- **External users** see the space rental prices and payment instructions inside the wizard (`EXTERNAL_USER_COSTS` in `lib/event-form.ts`).
- All dates are captured and displayed in **Tijuana time** and stored in UTC (`lib/timezone.ts`).
- The interface is entirely in **Spanish** (`es-MX`).

## How it's built

```
Browser (Next.js pages, all "use client")
  │
  ├─ supabase-js + anon key ──► Supabase
  │       │                      ├─ Auth (sessions, password reset)
  │       │                      └─ Postgres  ← RLS = the authorization model
  │       └─ every query runs as the signed-in user
  │
  └─ POST /api/send-email ─────► Resend (email delivery)
```

Design decisions worth knowing:

- **No server-side data layer.** Pages query Supabase directly from the browser. Authorization therefore lives entirely in Row Level Security policies (see `docs/DATABASE.md`); the UI's role checks (`ProtectedRoute requireAdmin`) are UX, not security.
- **One API route.** `app/api/send-email/route.ts` wraps Resend so the API key stays server-side. Without `RESEND_API_KEY` it logs the message and reports success — useful in development.
- **Roles.** `profiles.role` is `user` or `admin`. The row is created by the `on_auth_user_created` trigger at signup; the API can never change a role — admins are promoted from the Supabase dashboard.
- **Status model.** `en_revision → aprobado | rechazado`. Users can only ever write rows whose status is `en_revision` (RLS-enforced), which makes self-approval impossible and makes "resubmit" a single UPDATE.

## Event lifecycle

```
wizard submit ──► en_revision ──► aprobado  (organizer + codes team emailed)
                      ▲
                      └── rechazado (reason emailed) ──► owner edits ──► resubmit
```

The six-phase process guide shown to users (authorization, registration, review, preparation, during the event, evidence/certificates) lives in `lib/workflow.ts` as data, together with every deadline and the copy for "what's next" hints. The certificate phase is **informational only** for now — the `certificate_status` DB column is reserved but unused by the app.

## Page map

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Redirects to login/dashboard |
| `/login`, `/forgot-password`, `/reset-password` | public | Supabase auth flows |
| `/dashboard` | user | Your events, status chips, next-step reminders |
| `/events/new` | user | 3-step registration wizard |
| `/events/[id]` | owner/admin | Full event record, process guide, printable view |
| `/events/[id]/edit` | owner, only `rechazado` | Prefilled wizard → resubmit |
| `/admin/review` | admin | Review queue + all-events table + CSV export + resolution drawer |
| `/admin/analytics` | admin | Per-semester charts |

Component-by-component detail: `docs/COMPONENTS.md`.

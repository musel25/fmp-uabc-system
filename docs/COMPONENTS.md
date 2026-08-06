# Components and modules

How each piece works and where to look when changing behavior. `components/ui/` (shadcn-generated primitives) is omitted — extend those by composition, not by editing.

## The registration wizard

**`components/events/event-wizard.tsx`** — owns the three steps, the Zod schema, and navigation. Key mechanics:

- The form holds `EventWizardValues` (`lib/event-form.ts`): like `CreateEventData` but radio questions use `""` for "not answered yet" and dates are Tijuana wall-time strings for the `datetime-local` inputs.
- `blockedReason` computes, on step 1, the human-readable reason the "Siguiente" button is disabled (unanswered authorization/user-type question, event with cost, missing or too-soon start date). The button is disabled *and* the reason is shown — never disable without explaining.
- On submit it normalizes dates to UTC, converts to `CreateEventData` (`wizardValuesToCreateData`), and calls the `onSubmit` prop — the create page and the edit page decide what that means (create vs. resubmit).
- `initialData` prefills the wizard for the edit flow (`eventToWizardValues(event)`).

**`wizard-steps/event-data-step.tsx`** — step 1. Contains:
- the authorization question (*¿Dirección o subdirección ya autorizó este evento?* — Sí/No radio; "No" does **not** block, authorization can arrive after review),
- identification (name, the internal/external question — choosing *externo* reveals the rental costs panel with `EXTERNAL_USER_COSTS` and payment steps),
- classification (program/type/classification + the SEAES multi-select checkboxes),
- dates (21-day lead-time hint and validation), modality/venue (venue disabled for online events), organizers, observations, and the has-cost checkbox that stops the flow.

**`wizard-steps/event-files-step.tsx`** — step 2: the two long texts (event description, speakers' CVs) with word counters against `MAX_WORDS_LONG_FIELD`.

**`wizard-steps/event-review-step.tsx`** — step 3: read-only summary of everything (including the three new answers) plus the pre-submission notes (`SUBMISSION_NOTES`).

## Event display

- **`components/events/event-card.tsx`** — dashboard card: name, dates, status chip, next-step hint.
- **`app/events/[id]/page.tsx`** — the full record: data fields (authorization, user type, SEAES included when present), long texts, rejection banner with the reason, process guide, and a print-friendly layout.
- **`components/workflow/process-guide.tsx`** and **`event-next-steps.tsx`** — render the six phases from `lib/workflow.ts`; `nextStepFor(event)` decides which phase an event is in and what the owner should do next (e.g., evidence deadline countdown).

## Admin

- **`app/admin/review/page.tsx`** — two tabs: the pending queue (oldest first) and the full table with status/program/text filters, pagination, and CSV export. Resolution happens in the drawer.
- **`components/admin/admin-event-review-drawer.tsx`** — side sheet with the complete record (authorization / user type / SEAES fields included) and the approve/reject form; rejecting requires a reason. Calls `approveEvent` / `rejectEvent`, which also send the emails.
- **`components/admin/semester-charts.tsx`** + **`app/admin/analytics/page.tsx`** — per-semester aggregation (`lib/semester.ts` maps a date to its ciclo, e.g. `2026-2`) rendered with Recharts.

## Layout & auth plumbing

- **`components/layout/protected-route.tsx`** — client-side gate: redirects to `/login` when signed out, to `/dashboard` when `requireAdmin` and the profile isn't admin. UX only — real enforcement is RLS.
- **`app-shell.tsx`, `header.tsx`, `navbar.tsx`, `footer.tsx`, `page-header.tsx`** — chrome; navbar switches links by role and hosts the theme toggle (`next-themes` via `components/theme-provider.tsx`).

## lib/

| Module | Responsibility |
|---|---|
| `types.ts` | Domain types, documented field by field |
| `event-mapper.ts` | The only snake_case ↔ camelCase converter |
| `supabase.ts` | The shared anon-key client |
| `supabase-auth.ts` | Sign up/in/out, session, profile fetch, password reset |
| `supabase-database.ts` | User-side: `createEvent`, `getUserEvents`, `getEventById`, `resubmitEvent` |
| `supabase-admin.ts` | Admin-side: review queue, filtered listing, `approveEvent`, `rejectEvent` |
| `email.ts` | Resend templates + senders (never throw; see who gets notified in its header) |
| `event-form.ts` | Wizard values type, converters, SEAES/costs catalogs |
| `timezone.ts` | Tijuana ↔ UTC conversion for event dates |
| `workflow.ts` | Phases, deadlines (`MIN_LEAD_DAYS`, evidence window), shared copy, date formatting |
| `semester.ts` | Date → school cycle ("2026-1"/"2026-2") |
| `utils.ts` | `cn()` (clsx + tailwind-merge) |

## Hooks

- `hooks/use-toast.ts` — toast store used for every success/failure message.
- `hooks/use-mobile.ts` — viewport breakpoint helper.

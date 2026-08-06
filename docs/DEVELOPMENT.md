# Development

## Setup

```bash
git clone https://github.com/musel25/fmp-uabc-system.git
cd fmp-uabc-system
npm install
cp .env.local.example .env.local   # or create it — see below
npm run dev                        # http://localhost:3000
```

`.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
# RESEND_API_KEY is optional locally: without it the email route
# logs the message to the server console and reports success.
```

Both `NEXT_PUBLIC_` values are safe to expose — they're shipped to the browser by design, and Row Level Security does the real enforcement. **Never** put a service-role key in this project.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build — TypeScript and ESLint errors fail it
npm run lint     # next/core-web-vitals ruleset
npx tsc --noEmit # typecheck without building
```

There is no test suite yet; the build is the gate. Verify UI changes by exercising the real flows (wizard, review drawer) in the browser.

## Conventions

- **Language:** every user-facing string is Spanish (`es-MX`).
- **Files:** kebab-case; components PascalCase; import via the `@/*` alias.
- **Forms:** React Hook Form + Zod, Spanish validation messages, follow the wizard-step patterns.
- **Styling:** Tailwind v4 with the UABC theme in `app/globals.css` (green `#006341`, ochre `#cc8a00`, `--state-*` variables for status colors, `card-uabc` / `chip-*` / `eyebrow` utilities). Support light and dark — use the CSS variables, not hardcoded colors.
- **shadcn/ui:** `components/ui/` is generated; wrap or compose instead of editing.
- **Dates:** always through `lib/timezone.ts` — inputs and display are Tijuana wall time, storage is UTC.
- **Data access:** through `lib/supabase-database.ts` / `lib/supabase-admin.ts`; never query `supabase.from(...)` from a page, and never map rows outside `lib/event-mapper.ts`.

## Recipes

**Add a field to events** — the full chain, in order:

1. `migrations/00N_*.sql` — write and apply it (SQL Editor in the Supabase dashboard). Update `schema.sql`.
2. `lib/types.ts` — add to `Event` (and `CreateEventData` if the user provides it). Make it nullable if old rows won't have it.
3. `lib/event-mapper.ts` — both `dbRowToEvent` and `createEventDataToDbRow`.
4. Wizard: default + schema in `event-wizard.tsx`, input in `event-data-step.tsx`, summary row in `event-review-step.tsx`, prefill in `event-form.ts#eventToWizardValues`.
5. Display: `app/events/[id]/page.tsx` and `components/admin/admin-event-review-drawer.tsx`.

Do the migration **first**: the code must never reference a column production doesn't have (PostgREST rejects the whole write).

**Change workflow copy, deadlines, or phases** — everything lives in `lib/workflow.ts` as data.

**Change who receives notification emails** — recipient addresses are in `lib/email.ts`, one sender function per notification.

**Change RLS / permissions** — new migration; then update the policy table in `docs/DATABASE.md` and `schema.sql`. Test with a non-admin account before trusting it.

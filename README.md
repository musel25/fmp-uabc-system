# Sistema de Registro y Constancias — FMP UABC

Web application for registering and reviewing events at the Faculty of Medicine and Psychology, Universidad Autónoma de Baja California.

**Live:** [fmp-uabc-system.vercel.app](https://fmp-uabc-system.vercel.app)

Organizers — UABC members and external users renting faculty spaces — register an event through a guided wizard; the coordination reviews each request, approves or returns it with corrections, and email notifications keep everyone informed.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · React Hook Form + Zod · Supabase (Auth + Postgres with Row Level Security) · Resend · Vercel

## Quick start

```bash
npm install
# create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | What the system does, how it's built, page map |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | How every component and module works |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, the RLS authorization model, migrations |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, conventions, common recipes |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel/Supabase/Resend operations |
| [CLAUDE.md](CLAUDE.md) | Orientation for AI-assisted development |

`schema.sql` is the reference copy of the live database; `migrations/` holds the applied changes.

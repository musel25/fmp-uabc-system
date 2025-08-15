# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 15 web application** for the Faculty of Medicine and Psychology (FMP) at UABC (Universidad Autónoma de Baja California). The system manages event registration and certificate requests with an admin review workflow.

**Key Technologies:**
- Next.js 15 with App Router and React Server Components
- TypeScript with strict mode
- Tailwind CSS v4 with custom UABC branding
- shadcn/ui components (New York style)
- React Hook Form with Zod validation
- Mock authentication using localStorage

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

**Note:** TypeScript and ESLint errors are currently ignored during builds via `next.config.mjs`.

## Architecture & Patterns

### Authentication System
- Mock authentication system using localStorage (`lib/auth.ts`)
- Two user roles: `"user"` and `"admin"`
- `ProtectedRoute` component wraps routes requiring authentication
- Admin routes require `requireAdmin={true}` prop

### Event Management Workflow
The application manages a complete event lifecycle:

1. **Event Creation**: Users create events with detailed information and file uploads
2. **Admin Review**: Admins review, approve/reject events with comments
3. **Certificate Requests**: Users can request certificates for approved events
4. **Certificate Generation**: Admins manage certificate status and generation

### Key Data Types

**Event Status Flow:**
```
"borrador" → "en_revision" → "aprobado" | "rechazado"
```

**Certificate Status:**
```
"sin_solicitar" → "solicitadas" → "emitidas"
```

**Core Event Interface:** See `lib/types.ts` for complete `Event` and `CreateEventData` interfaces.

### Component Organization

- `app/`: Next.js App Router pages and layouts
- `components/ui/`: shadcn/ui primitives (auto-generated, don't edit manually)
- `components/layout/`: Layout components (Navbar, ProtectedRoute)
- `components/events/`: Event-specific components (wizards, dialogs, timeline)
- `components/admin/`: Admin-specific components (review drawers)

### Styling Conventions

- Uses Tailwind CSS v4 with CSS variables for theming
- Custom UABC brand colors: `--color-primary: #006341` (green), `--color-secondary: #cc8a00` (ochre)
- `cn()` utility function combines `clsx` and `tailwind-merge` for conditional classes
- Custom utility classes in `app/globals.css` (`.btn-primary`, `.chip-*` status indicators)
- Supports light/dark themes via `next-themes`

### Path Aliases
Configure imports using `@/*` alias:
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Event } from "@/lib/types"
```

### Form Handling
- Use React Hook Form with Zod schemas for validation
- Follow existing form patterns in `components/events/wizard-steps/`
- Spanish locale validation messages

### Mock Data
- Event data stored in `lib/mock-events.ts`
- Authentication is simulated (any email/password combination works)
- Admin users: emails containing "admin"

## Development Notes

- Application uses Spanish locale (`es-MX`) for dates and interface
- Mock file uploads return placeholder data
- Event program options: "Médico", "Psicología", "Nutrición", "Posgrado"
- Event types: "Académico", "Cultural", "Deportivo", "Salud"
- All forms and interfaces are in Spanish

## File Structure Patterns

When adding new features:
- Place reusable components in appropriate `components/` subdirectories
- Add new pages under `app/` following App Router conventions
- Define types in `lib/types.ts`
- Add utilities to `lib/utils.ts`
- Follow existing naming conventions (kebab-case for files, PascalCase for components)
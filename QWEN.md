# Qwen Code Context for `fmp-uabc-system`

This document provides an overview of the `fmp-uabc-system` project for use by Qwen Code.

## Project Type

This is a **Next.js 15 (App Router) web application** written in TypeScript. It uses Tailwind CSS v4 for styling and integrates components from `shadcn/ui` (New York style) and `lucide-react` icons. The project is configured for React Server Components (RSC).

## Key Technologies & Libraries

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, `tw-animate-css`
- **UI Components**: `shadcn/ui`, `lucide-react`
- **Utilities**: `class-variance-authority`, `clsx`, `tailwind-merge`, `next-themes`
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`, `input-otp`
- **State/Data**: `date-fns`, `recharts`
- **Other**: `geist` (font)

## Project Structure

- `app/`: Next.js App Router pages and layouts. Contains main routes like `login`, `dashboard`, `admin`, and `events`.
- `components/`: Reusable UI components, including `ui` (shadcn/ui primitives), `layout`, `events`, and `admin` specific components.
- `lib/`: Utility functions, including `utils.ts` for `cn` helper.
- `hooks/`: Custom React hooks.
- `public/`: Static assets.
- `styles/`: Global styles and CSS files (though `app/globals.css` is the main one).
- Configuration files: `next.config.mjs`, `tsconfig.json`, `components.json`, `package.json`, `postcss.config.mjs`.

## Styling & Themes

- The main stylesheet is `app/globals.css`, which imports Tailwind and `tw-animate-css`.
- Custom color variables for UABC branding (e.g., `--color-primary: #006341`) and shadcn/ui compatibility are defined in `:root` and `.dark`.
- A `ThemeProvider` component (`components/theme-provider.tsx`) using `next-themes` manages light/dark mode.
- Utility classes like `.btn-primary`, `.chip-aprobado` are defined in `globals.css` for consistent UI elements.

## UABC Branding

The project incorporates UABC's brand colors (`#006341` for primary green, `#cc8a00` for secondary ocre) as CSS variables.

## Routing

- The root page (`/`) redirects to `/login`.
- Main application sections are located under `/dashboard`, `/admin`, and `/events`.

## Building and Running

- **Development:** `npm run dev` or `next dev`
- **Build:** `npm run build` or `next build`
- **Start (production):** `npm run start` or `next start`
- **Lint:** `npm run lint` or `next lint`

Type checking and ESLint errors are currently ignored during builds (`next.config.mjs`).

## Development Conventions

- Uses `@/*` path alias (configured in `tsconfig.json` and `components.json`) for imports relative to the project root.
- Components are built using `shadcn/ui` primitives.
- Tailwind CSS is used extensively for styling, often with `clsx` and `tailwind-merge` for conditional class names via the `cn` utility.
- TypeScript is used throughout for type safety.

# FMP-UABC Event Management System

A Next.js 15 web application for the Faculty of Medicine and Psychology (FMP) at Universidad Autónoma de Baja California (UABC). This system manages event registration, admin review workflows, and certificate generation.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account (for production)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fmp-uabc-system

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🏗️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 with custom UABC branding
- **Components:** shadcn/ui (New York style)
- **Forms:** React Hook Form + Zod validation
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Email:** Resend
- **State Management:** React Server Components + Server Actions

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin-only pages
│   ├── dashboard/         # User dashboard
│   ├── events/            # Event management pages
│   └── (auth)/            # Authentication pages
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Layout components
│   ├── events/           # Event-specific components
│   └── admin/            # Admin components
├── lib/                  # Utility functions and configs
│   ├── supabase*.ts     # Supabase configurations
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
└── docs/                 # Documentation
```

## 🔧 Development Commands

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

## 🎯 Key Features

### Event Management
- **Multi-step Event Creation:** Wizard-based form for comprehensive event data
- **File Uploads:** Support for program details and speaker CVs
- **Status Tracking:** Draft → Under Review → Approved/Rejected workflow
- **Certificate Requests:** Users can request certificates for approved events

### Admin Panel
- **Event Review:** Approve/reject events with detailed feedback
- **Certificate Management:** Track and manage certificate generation
- **Email Notifications:** Automated notifications via Resend

### User Experience
- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Dark/Light Mode:** Theme switching with next-themes
- **Spanish Localization:** All content in Spanish (es-MX locale)
- **Form Validation:** Real-time validation with Zod schemas

## 🔐 Authentication & Roles

The system supports two user roles:
- **User (`user`):** Can create and manage their own events
- **Admin (`admin`):** Can review all events and manage certificates

### Mock Authentication (Development)
During development, any email/password combination works:
- Admin users: emails containing "admin" 
- Regular users: any other email

## 🗃️ Database Schema

The system uses two main tables:
- **`profiles`:** User information and roles
- **`events`:** Event data with status tracking

Key status flows:
- **Event Status:** `borrador` → `en_revision` → `aprobado`/`rechazado`
- **Certificate Status:** `sin_solicitar` → `solicitadas` → `emitidas`

## 🎨 Styling & Theming

### Custom UABC Brand Colors
```css
--color-primary: #006341;    /* UABC Green */
--color-secondary: #cc8a00;  /* UABC Ochre */
```

### Utility Classes
- `.btn-primary` - Primary button styling
- `.chip-*` - Status indicator chips
- `cn()` - Combines clsx and tailwind-merge for conditional classes

## 🔌 Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
```

## 📝 Event Data Types

### Programs
- Médico
- Psicología  
- Nutrición
- Posgrado

### Event Types
- Académico
- Cultural
- Deportivo
- Salud

### Classifications
- Conferencia
- Seminario
- Taller
- Otro

### Modalities
- Presencial
- En línea
- Mixta

## 🚀 Deployment

The application is designed for deployment on Vercel with Supabase:

1. **Database Setup:** Run `schema.sql` in your Supabase instance
2. **Environment Variables:** Configure all required environment variables
3. **Domain Configuration:** Set up custom domain and authentication redirects
4. **Email Setup:** Configure Resend for production email sending

## 🛠️ Development Guidelines

### Code Conventions
- Use TypeScript strict mode
- Follow existing component patterns
- Prefer Server Components over Client Components
- Use Zod for all form validation
- Maintain Spanish locale for all user-facing content

### File Naming
- `kebab-case` for files and directories
- `PascalCase` for React components
- Use `@/*` path aliases for imports

### Form Patterns
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  // Define your schema
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { /* defaults */ }
})
```

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System architecture and design patterns
- [Development](./docs/DEVELOPMENT.md) - Detailed development guidelines
- [Database](./docs/DATABASE.md) - Database schema and relationships
- [API](./docs/API.md) - API endpoints and usage
- [Components](./docs/COMPONENTS.md) - Component library documentation
- [Deployment](./docs/DEPLOYMENT.md) - Production deployment guide

## 🤝 Contributing

1. Follow existing code conventions
2. Run linting before commits
3. Update documentation for new features
4. Test thoroughly in both light/dark themes
5. Ensure Spanish localization for user-facing content

## 📄 License

Internal project for Universidad Autónoma de Baja California (UABC).

---

Built with ❤️ for the Faculty of Medicine and Psychology at UABC
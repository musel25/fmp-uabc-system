# Development Guide

## Getting Started

This guide provides detailed instructions for setting up and developing the FMP-UABC Event Management System.

## Prerequisites

### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher (or pnpm 8.0+)
- **Git**: For version control
- **VS Code**: Recommended IDE

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## Environment Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd fmp-uabc-system

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### 2. Environment Variables
Create `.env.local` with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key

# Development Flags
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Option 1: Use Supabase Cloud (Recommended)
# 1. Create project at https://supabase.com
# 2. Run the schema.sql in the SQL editor
# 3. Configure environment variables

# Option 2: Local Supabase (Advanced)
npx supabase init
npx supabase start
npx supabase db reset
```

### 4. Start Development
```bash
# Start the development server
npm run dev

# Open in browser
open http://localhost:3000
```

## Development Workflow

### Daily Development Commands
```bash
# Start development server with hot reload
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production (test locally)
npm run build
npm run start
```

### Git Workflow
```bash
# Feature development
git checkout -b feature/event-notifications
git add .
git commit -m "feat: add email notifications for event approval"
git push origin feature/event-notifications

# Create pull request via GitHub CLI
gh pr create --title "Add Email Notifications" --body "Implements email notifications when events are approved/rejected"
```

## Code Conventions

### File Naming
- **Components**: PascalCase (`EventWizard.tsx`)
- **Pages**: kebab-case (`event-detail.tsx`)
- **Utilities**: kebab-case (`date-utils.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Directory Structure
```
components/
├── ui/                 # shadcn/ui primitives (don't edit)
├── layout/            # Layout components
├── events/            # Event-specific components
├── admin/             # Admin-specific components
└── common/            # Shared components

lib/
├── schemas/           # Zod validation schemas
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
└── constants/         # Application constants
```

### Import Organization
```typescript
// 1. React and framework imports
import React from 'react'
import { NextPage } from 'next'

// 2. External library imports
import { z } from 'zod'
import { useForm } from 'react-hook-form'

// 3. Internal imports (using @/ alias)
import { Button } from '@/components/ui/button'
import { createEvent } from '@/lib/actions'
import { Event } from '@/lib/types'

// 4. Relative imports
import './component.css'
```

### TypeScript Guidelines

#### Interface vs Type
```typescript
// Use interfaces for object shapes
interface User {
  id: string
  email: string
  role: 'user' | 'admin'
}

// Use types for unions, primitives, and computed types
type EventStatus = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado'
type CreateUserData = Omit<User, 'id'>
```

#### Strict Type Checking
```typescript
// Always use strict null checks
function getUser(id: string): User | null {
  // Implementation
}

// Use type guards
function isAdmin(user: User): user is User & { role: 'admin' } {
  return user.role === 'admin'
}

// Prefer unknown over any
function parseJson(str: string): unknown {
  return JSON.parse(str)
}
```

## Component Development

### Component Structure
```typescript
// components/events/event-card.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Event } from '@/lib/types'

interface EventCardProps {
  event: Event
  onEdit?: (event: Event) => void
  className?: string
}

export function EventCard({ event, onEdit, className }: EventCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant="outline">{event.status}</Badge>
        {onEdit && (
          <Button onClick={() => onEdit(event)}>
            Editar
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

### Server Components vs Client Components

#### Server Components (Default)
```typescript
// app/dashboard/page.tsx
import { getEvents } from '@/lib/data'
import { EventList } from '@/components/events/event-list'

export default async function DashboardPage() {
  const events = await getEvents()
  
  return (
    <div>
      <h1>Dashboard</h1>
      <EventList events={events} />
    </div>
  )
}
```

#### Client Components (Interactive)
```typescript
'use client'
// components/events/event-form.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'

export function EventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm()
  
  // Interactive functionality
}
```

### Form Development with React Hook Form + Zod

#### Schema Definition
```typescript
// lib/schemas/event-schema.ts
import { z } from 'zod'

export const createEventSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().regex(/^\d{10}$/, 'Formato de teléfono inválido'),
  program: z.enum(['Médico', 'Psicología', 'Nutrición', 'Posgrado']),
  startDate: z.string().refine((date) => {
    return new Date(date) > new Date()
  }, 'La fecha debe ser futura'),
})

export type CreateEventData = z.infer<typeof createEventSchema>
```

#### Form Implementation
```typescript
// components/events/event-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createEventSchema, CreateEventData } from '@/lib/schemas'

export function EventForm() {
  const form = useForm<CreateEventData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      phone: '',
      program: 'Médico',
    }
  })

  async function onSubmit(data: CreateEventData) {
    try {
      await createEvent(data)
      toast.success('Evento creado exitosamente')
    } catch (error) {
      toast.error('Error al crear evento')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Evento</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese el nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </form>
    </Form>
  )
}
```

## Database Operations

### Server Actions (Recommended)
```typescript
// lib/actions/event-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { createEventSchema } from '@/lib/schemas'

export async function createEvent(formData: FormData) {
  const validatedData = createEventSchema.parse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    // ... other fields
  })

  const { data, error } = await supabase
    .from('events')
    .insert(validatedData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return data
}
```

### Data Fetching
```typescript
// lib/data/events.ts
import { cache } from 'react'
import { supabase } from '@/lib/supabase'

export const getEvents = cache(async (userId?: string) => {
  let query = supabase
    .from('events')
    .select(`
      *,
      profiles!events_user_id_fkey (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`)
  }

  return data || []
})
```

### Real-time Subscriptions
```typescript
// components/admin/real-time-events.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from '@/lib/types'

export function RealTimeEvents() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, (payload) => {
        // Handle real-time updates
        console.log('Event updated:', payload)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <div>{/* Render events */}</div>
}
```

## Styling Guidelines

### Tailwind CSS Patterns
```typescript
// Use the cn() utility for conditional classes
import { cn } from '@/lib/utils'

function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  )
}
```

### Custom CSS (Minimal)
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities only when Tailwind is insufficient */
@layer utilities {
  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors;
  }
  
  .chip-approved {
    @apply bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium;
  }
}
```

### Dark Mode Support
```typescript
// Use CSS variables for theme-aware colors
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

## Testing Guidelines

### Unit Testing (Future Implementation)
```typescript
// __tests__/components/event-card.test.tsx
import { render, screen } from '@testing-library/react'
import { EventCard } from '@/components/events/event-card'

const mockEvent = {
  id: '1',
  name: 'Test Event',
  status: 'aprobado' as const,
  // ... other required fields
}

describe('EventCard', () => {
  it('renders event name', () => {
    render(<EventCard event={mockEvent} />)
    expect(screen.getByText('Test Event')).toBeInTheDocument()
  })

  it('shows approved status', () => {
    render(<EventCard event={mockEvent} />)
    expect(screen.getByText('aprobado')).toBeInTheDocument()
  })
})
```

### Integration Testing
```typescript
// __tests__/api/events.test.ts
import { createEvent } from '@/lib/actions/event-actions'

describe('Event Actions', () => {
  it('creates event with valid data', async () => {
    const eventData = new FormData()
    eventData.append('name', 'Test Event')
    eventData.append('phone', '1234567890')
    
    const result = await createEvent(eventData)
    expect(result.name).toBe('Test Event')
  })
})
```

## Debugging

### Common Development Issues

#### 1. Environment Variables Not Loading
```bash
# Check environment file
cat .env.local

# Verify variables in component
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

#### 2. Hydration Mismatches
```typescript
// Use useEffect for client-only code
useEffect(() => {
  // Client-only logic here
}, [])

// Or use dynamic imports
const ClientOnlyComponent = dynamic(() => import('./client-component'), {
  ssr: false
})
```

#### 3. Database Connection Issues
```typescript
// Test connection
import { testConnection } from '@/lib/supabase'

export default async function TestPage() {
  const result = await testConnection()
  return <pre>{JSON.stringify(result, null, 2)}</pre>
}
```

### Development Tools

#### Next.js Dev Tools
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    logging: {
      level: 'verbose'
    }
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```

#### Browser Dev Tools
```typescript
// Add debug utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).debugUtils = {
    supabase,
    testConnection,
    // Other debug helpers
  }
}
```

## Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <Skeleton className="h-96" />
})

// Route-based splitting (automatic with App Router)
```

### Image Optimization
```typescript
import Image from 'next/image'

// Always use Next.js Image component
<Image
  src="/placeholder.jpg"
  alt="Event image"
  width={400}
  height={300}
  className="rounded-lg"
  priority={isAboveFold}
/>
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --profile
npx @next/bundle-analyzer .next
```

## Production Considerations

### Error Monitoring
```typescript
// lib/error-reporting.ts
export function reportError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    // Send to error reporting service
    console.error('Production error:', error, context)
  } else {
    console.error('Development error:', error, context)
  }
}
```

### Performance Monitoring
```typescript
// lib/performance.ts
export function trackPageView(page: string) {
  if (process.env.NODE_ENV === 'production') {
    // Track page views
  }
}

export function trackUserAction(action: string, properties?: object) {
  if (process.env.NODE_ENV === 'production') {
    // Track user actions
  }
}
```

## Deployment Preparation

### Pre-deployment Checklist
- [ ] All environment variables configured
- [ ] Database schema applied
- [ ] Build passes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All forms work correctly
- [ ] Email sending configured
- [ ] Authentication flow tested

### Build Commands
```bash
# Production build
npm run build

# Test production build locally
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

This development guide should help you get started quickly and maintain consistent code quality throughout the project.
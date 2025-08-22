# Architecture Documentation

## System Overview

The FMP-UABC Event Management System is built using modern web technologies with a focus on performance, scalability, and maintainability. This document outlines the architectural decisions, patterns, and design principles used throughout the application.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js 15)  │────│   (API Routes)  │────│   (Supabase)    │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Server Actions│    │ • PostgreSQL    │
│ • App Router    │    │ • Route Handlers│    │ • Row Level     │
│ • RSC/SSR       │    │ • Middleware    │    │   Security      │
│ • Client Comp.  │    │ • Validation    │    │ • Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │──────────────│   External      │──────────────│
                        │   Services      │
                        │                 │
                        │ • Resend Email  │
                        │ • File Storage  │
                        │ • Authentication│
                        └─────────────────┘
```

## Technology Stack

### Frontend Layer
- **Next.js 15**: App Router with React Server Components
- **React 19**: Latest React features including concurrent rendering
- **TypeScript**: Strict mode for type safety
- **Tailwind CSS v4**: Utility-first styling with custom UABC theme
- **shadcn/ui**: High-quality, accessible component library

### Backend Layer
- **Next.js API Routes**: RESTful endpoints for client-server communication
- **Server Actions**: Direct database operations from components
- **Supabase Client**: Database queries and real-time subscriptions
- **Zod**: Runtime validation and type inference

### Database Layer
- **Supabase**: PostgreSQL with built-in authentication
- **Row Level Security**: Granular access control
- **Real-time Subscriptions**: Live updates for admin dashboard

### External Services
- **Supabase Auth**: User authentication and session management
- **Resend**: Transactional email delivery
- **Vercel**: Hosting and deployment platform

## Design Patterns

### Component Architecture

#### 1. Server Components by Default
```typescript
// Default: Server Component (faster, smaller bundle)
export default function EventList() {
  const events = await fetchEvents()
  return <div>{/* Render events */}</div>
}
```

#### 2. Client Components for Interactivity
```typescript
'use client'
// Only when needed: forms, state, event handlers
export function EventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Interactive functionality
}
```

#### 3. Compound Component Pattern
```typescript
// components/events/event-wizard.tsx
export function EventWizard({ children }) {
  return <div className="wizard-container">{children}</div>
}

EventWizard.Step = EventWizardStep
EventWizard.Navigation = EventWizardNavigation
```

### Data Flow Architecture

#### 1. Unidirectional Data Flow
```
User Action → Component → Server Action → Database → UI Update
```

#### 2. Server Actions for Mutations
```typescript
// Server-side data mutations
async function createEvent(formData: FormData) {
  'use server'
  
  const validatedData = eventSchema.parse(formData)
  const result = await supabase
    .from('events')
    .insert(validatedData)
  
  revalidatePath('/dashboard')
  return result
}
```

#### 3. React Query Pattern (Future)
```typescript
// For complex client-side state management
const { data: events, isLoading } = useQuery({
  queryKey: ['events', userId],
  queryFn: () => fetchUserEvents(userId)
})
```

### Authentication Architecture

#### Current Implementation (Mock)
```typescript
// lib/auth.ts - Development only
export function mockAuth(email: string, password: string) {
  const isAdmin = email.includes('admin')
  return {
    user: { id: generateId(), email, role: isAdmin ? 'admin' : 'user' },
    session: { token: 'mock-token' }
  }
}
```

#### Production Implementation
```typescript
// lib/supabase-auth.ts
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}
```

### State Management Strategy

#### 1. Server State (Database)
- **Primary Source**: Supabase PostgreSQL
- **Caching**: Next.js built-in caching + `revalidatePath()`
- **Real-time**: Supabase subscriptions for admin dashboard

#### 2. Client State (UI)
- **Forms**: React Hook Form + Zod validation
- **UI State**: React `useState` and `useReducer`
- **Global State**: React Context (minimal usage)

#### 3. URL State
- **Routing**: Next.js App Router
- **Search Params**: Filter states, pagination
- **Dynamic Routes**: Event IDs, admin views

## Security Architecture

### Authentication & Authorization

#### Row Level Security (RLS)
```sql
-- Users can only see their own events
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all events
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

#### Middleware Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith('/admin')) {
    return requireAdmin(request)
  }
  
  if (pathname.startsWith('/dashboard')) {
    return requireAuth(request)
  }
}
```

### Data Validation

#### Input Validation
```typescript
// lib/schemas.ts
export const createEventSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono inválido'),
  program: z.enum(['Médico', 'Psicología', 'Nutrición', 'Posgrado']),
  // ... more validation rules
})
```

#### Type Safety
```typescript
// Compile-time type checking
interface Event {
  id: string
  name: string
  status: EventStatus // Only allows valid status values
}

// Runtime validation
const validatedEvent = eventSchema.parse(inputData)
```

## Performance Optimizations

### 1. Next.js Optimizations
- **Static Generation**: Pre-rendered pages where possible
- **Incremental Static Regeneration**: Dynamic content with caching
- **Image Optimization**: Automatic WebP conversion and lazy loading
- **Bundle Splitting**: Automatic code splitting by route

### 2. Database Optimizations
- **Indexing**: Primary keys, foreign keys, and query-specific indexes
- **Query Optimization**: Select only needed columns
- **Connection Pooling**: Supabase handles connection management

### 3. Caching Strategy
```typescript
// Page-level caching
export const revalidate = 3600 // 1 hour

// Function-level caching
const getEvents = cache(async (userId: string) => {
  return await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
})
```

### 4. Client-Side Optimizations
- **Component Lazy Loading**: Dynamic imports for heavy components
- **Virtual Scrolling**: For large lists (future implementation)
- **Debounced Search**: Reduce API calls during search

## Error Handling Strategy

### 1. Global Error Boundaries
```typescript
// app/error.tsx
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 2. API Error Handling
```typescript
// lib/api-client.ts
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text())
    }
    
    return await response.json()
  } catch (error) {
    logger.error('API request failed', { url, error })
    throw error
  }
}
```

### 3. Form Error Handling
```typescript
// React Hook Form integration
const form = useForm({
  resolver: zodResolver(schema),
  onError: (errors) => {
    toast.error('Please fix the form errors')
  }
})
```

## Monitoring & Observability

### 1. Logging Strategy
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date() }))
  },
  error: (message: string, meta?: object) => {
    console.error(JSON.stringify({ level: 'error', message, meta, timestamp: new Date() }))
  }
}
```

### 2. Performance Monitoring
- **Web Vitals**: Core Web Vitals tracking
- **Database Metrics**: Query performance via Supabase dashboard
- **Error Tracking**: Production error monitoring (future: Sentry)

### 3. User Analytics
- **Usage Patterns**: Event creation, admin actions
- **Performance Metrics**: Page load times, form completion rates
- **Error Rates**: Client and server error tracking

## Deployment Architecture

### Production Environment
```
Internet → Vercel Edge → Next.js App → Supabase
                                   ↓
                               Resend API
```

### Development Environment
```
Localhost:3000 → Next.js Dev → Local Supabase (optional)
                            → Supabase Cloud (staging)
```

### Environment Configuration
```typescript
// Different configurations per environment
const config = {
  development: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL_DEV,
    logLevel: 'debug'
  },
  production: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    logLevel: 'error'
  }
}
```

## Future Architecture Considerations

### 1. Scalability Improvements
- **Edge Functions**: Move heavy computations to Supabase Edge Functions
- **CDN**: Static asset delivery via Vercel's global CDN
- **Database Sharding**: If user base grows significantly

### 2. Feature Enhancements
- **Real-time Collaboration**: Live editing of events
- **Advanced Analytics**: User behavior tracking
- **Mobile App**: React Native with shared business logic

### 3. Infrastructure Evolution
- **Microservices**: Break apart monolithic structure if needed
- **Event Sourcing**: Audit trail for all data changes
- **CQRS**: Separate read/write models for complex queries

## Design Principles

### 1. Progressive Enhancement
Start with server-rendered HTML, enhance with JavaScript

### 2. Performance First
Every architectural decision considers performance impact

### 3. Type Safety
TypeScript everywhere, runtime validation at boundaries

### 4. Developer Experience
Clear abstractions, helpful error messages, fast feedback loops

### 5. Accessibility
WCAG 2.1 AA compliance through shadcn/ui and custom components

### 6. Maintainability
Clear separation of concerns, consistent patterns, comprehensive documentation
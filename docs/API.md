# API Documentation

## Overview

The FMP-UABC Event Management System provides both REST API endpoints and Server Actions for data operations. This document covers all available endpoints, request/response formats, and usage examples.

## Authentication

### Current Implementation (Mock)
During development, the system uses localStorage-based mock authentication:
- Any email/password combination is accepted
- Admin users: emails containing "admin"
- Regular users: any other email

### Production Implementation
Production uses Supabase authentication with JWT tokens:
```typescript
// Include in request headers
Authorization: Bearer <jwt_token>
```

## Server Actions

Server Actions provide type-safe, server-side operations directly from React components.

### Event Management

#### `createEvent`
Creates a new event in draft status.

```typescript
// lib/actions/event-actions.ts
async function createEvent(formData: FormData): Promise<Event>
```

**Parameters:**
- `formData`: FormData containing event information

**Usage:**
```typescript
import { createEvent } from '@/lib/actions/event-actions'

// In a component
async function handleSubmit(formData: FormData) {
  try {
    const event = await createEvent(formData)
    console.log('Event created:', event.id)
  } catch (error) {
    console.error('Failed to create event:', error)
  }
}
```

#### `updateEvent`
Updates an existing event (users can only update their own draft events).

```typescript
async function updateEvent(eventId: string, formData: FormData): Promise<Event>
```

#### `submitEventForReview`
Submits a draft event for admin review.

```typescript
async function submitEventForReview(eventId: string): Promise<Event>
```

#### `approveEvent` (Admin only)
Approves an event under review.

```typescript
async function approveEvent(
  eventId: string, 
  adminComments?: string
): Promise<Event>
```

#### `rejectEvent` (Admin only)
Rejects an event with reason.

```typescript
async function rejectEvent(
  eventId: string, 
  rejectionReason: string
): Promise<Event>
```


### Data Fetching

#### `getEvents`
Fetches events based on user role and filters.

```typescript
async function getEvents(options?: {
  userId?: string
  status?: EventStatus
  limit?: number
}): Promise<Event[]>
```

#### `getEventById`
Fetches a single event by ID.

```typescript
async function getEventById(eventId: string): Promise<Event | null>
```

#### `getUserProfile`
Fetches user profile information.

```typescript
async function getUserProfile(userId: string): Promise<Profile | null>
```

## REST API Endpoints

### Email Service

#### `POST /api/send-email`
Sends email notifications via Resend service.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>HTML content</p>",
  "text": "Plain text content"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Email sent successfully via Resend",
  "emailId": "resend_email_id"
}
```

**Response (Development - No API Key):**
```json
{
  "success": true,
  "message": "Email logged (Resend API key not configured)",
  "note": "Add RESEND_API_KEY environment variable to send real emails"
}
```

**Response (Error):**
```json
{
  "error": "Failed to send email",
  "details": "Error message details"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing required fields
- `500`: Server error

**Usage Example:**
```typescript
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Event Approved',
    html: '<p>Your event has been approved!</p>',
    text: 'Your event has been approved!'
  })
})

const result = await response.json()
```

## Data Types and Schemas

### Event Types

#### `Event` Interface
```typescript
interface Event {
  id: string
  name: string
  responsible?: string
  email?: string
  phone: string
  program: EventProgram
  type: EventType
  classification: EventClassification
  classificationOther?: string
  modality: EventModality
  venue: string
  startDate: string
  endDate: string
  hasCost: boolean
  costDetails?: string
  onlineInfo?: string
  organizers: string
  observations?: string
  programDetails: string
  speakerCvs: string
  codigosRequeridos: number
  status: EventStatus
  createdAt: string
  updatedAt: string
  userId: string
  adminComments?: string
  rejectionReason?: string
}
```

#### `CreateEventData` Interface
```typescript
interface CreateEventData {
  name: string
  responsible?: string
  email?: string
  phone: string
  program: EventProgram
  type: EventType
  classification: EventClassification
  classificationOther?: string
  modality: EventModality
  venue: string
  startDate: string
  endDate: string
  hasCost: boolean
  costDetails?: string
  onlineInfo?: string
  organizers: string
  observations?: string
  programDetails: string
  speakerCvs: string
  codigosRequeridos: number
}
```

### Enum Types

#### `EventStatus`
```typescript
type EventStatus = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado'
```


#### `EventProgram`
```typescript
type EventProgram = 'Médico' | 'Psicología' | 'Nutrición' | 'Posgrado'
```

#### `EventType`
```typescript
type EventType = 'Académico' | 'Cultural' | 'Deportivo' | 'Salud'
```

#### `EventClassification`
```typescript
type EventClassification = 'Conferencia' | 'Seminario' | 'Taller' | 'Otro'
```

#### `EventModality`
```typescript
type EventModality = 'Presencial' | 'En línea' | 'Mixta'
```

### Profile Types

#### `Profile` Interface
```typescript
interface Profile {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}
```

## Validation Schemas

### Event Validation (Zod)
```typescript
import { z } from 'zod'

const createEventSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().regex(/^\d{10}$/, 'Formato de teléfono inválido'),
  program: z.enum(['Médico', 'Psicología', 'Nutrición', 'Posgrado']),
  type: z.enum(['Académico', 'Cultural', 'Deportivo', 'Salud']),
  classification: z.enum(['Conferencia', 'Seminario', 'Taller', 'Otro']),
  modality: z.enum(['Presencial', 'En línea', 'Mixta']),
  venue: z.string().min(1, 'El lugar es requerido'),
  startDate: z.string().refine((date) => {
    return new Date(date) > new Date()
  }, 'La fecha debe ser futura'),
  endDate: z.string(),
  organizers: z.string().min(1, 'Los organizadores son requeridos'),
  programDetails: z.string().min(1, 'Los detalles del programa son requeridos'),
  speakerCvs: z.string().min(1, 'Los CVs de ponentes son requeridos'),
  codigosRequeridos: z.number().min(0).max(1000),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate)
}, {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['endDate']
})
```

## Error Handling

### Standard Error Format
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks required permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `INTERNAL_ERROR`: Server error

### Error Handling Examples

#### Server Action Error Handling
```typescript
try {
  const event = await createEvent(formData)
  // Success
} catch (error) {
  if (error instanceof Error) {
    console.error('Error message:', error.message)
  }
}
```

#### API Error Handling
```typescript
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(emailData)
})

if (!response.ok) {
  const error = await response.json()
  throw new Error(`Email failed: ${error.error}`)
}
```

## Rate Limiting

### Email API
- **Limit**: 10 emails per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Total limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

### Database Operations
- **Server Actions**: No explicit rate limiting (handled by Next.js)
- **Supabase**: Built-in connection pooling and query limits

## Authentication & Authorization

### Row Level Security (RLS)

#### Users
- Can view/edit only their own events
- Can create new events
- Can update draft events only
- Cannot approve/reject events

#### Admins
- Can view all events
- Can approve/reject events
- Can manage certificates
- Can view user profiles

### Middleware Protection
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    return requireAdmin(request)
  }
  
  // Protect user dashboard
  if (pathname.startsWith('/dashboard')) {
    return requireAuth(request)
  }
}
```

## Real-time Features

### Supabase Subscriptions
```typescript
// Subscribe to event changes
const subscription = supabase
  .channel('events_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'events'
  }, (payload) => {
    // Handle real-time updates
    console.log('Event changed:', payload)
  })
  .subscribe()
```

### Usage Example
```typescript
// components/admin/real-time-events.tsx
useEffect(() => {
  const subscription = supabase
    .channel('admin_events')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'events',
      filter: 'status=eq.en_revision'
    }, (payload) => {
      // Update admin dashboard in real-time
      setEvents(current => 
        current.map(event => 
          event.id === payload.new.id ? payload.new : event
        )
      )
    })
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

## Email Notifications

### Automatic Notifications

#### New Event Registration
- **Trigger**: Event created and submitted for review
- **Recipient**: Admin (`yaheko.pardo@uabc.edu.mx`)
- **Template**: New event notification with event details

#### Event Approval
- **Trigger**: Event approved by admin
- **Recipient**: Event creator
- **Template**: Approval confirmation with next steps

#### Codes Required (Admin)
- **Trigger**: Event approved with `codigosRequeridos > 0`
- **Recipient**: Codes admin (`serafin.idanya@uabc.edu.mx`)
- **Template**: Structured format with event details

### Email Functions

#### `sendNewEventNotification`
```typescript
await sendNewEventNotification({
  eventName: 'Event Name',
  userName: 'User Name',
  userEmail: 'user@example.com',
  eventId: 'event-uuid'
})
```

#### `sendEventApprovedNotification`
```typescript
await sendEventApprovedNotification({
  eventName: 'Event Name',
  userName: 'User Name',
  userEmail: 'user@example.com',
  eventId: 'event-uuid'
})
```

#### `sendAdminCodesNotification`
```typescript
await sendAdminCodesNotification({
  eventName: 'Event Name',
  eventId: 'event-uuid',
  codigosRequeridos: 50,
  startDate: '2024-12-15T09:00:00Z',
  endDate: '2024-12-15T17:00:00Z',
  venue: 'Event Location',
  type: 'Académico',
  classification: 'Conferencia',
  programDetails: 'Event description...',
  userName: 'User Name',
  userEmail: 'user@example.com'
})
```

## Testing

### Server Action Testing
```typescript
// __tests__/actions/event-actions.test.ts
import { createEvent } from '@/lib/actions/event-actions'

describe('Event Actions', () => {
  it('creates event with valid data', async () => {
    const formData = new FormData()
    formData.append('name', 'Test Event')
    formData.append('phone', '1234567890')
    
    const event = await createEvent(formData)
    expect(event.name).toBe('Test Event')
    expect(event.status).toBe('borrador')
  })
})
```

### API Testing
```typescript
// __tests__/api/send-email.test.ts
import { POST } from '@/app/api/send-email/route'

describe('/api/send-email', () => {
  it('validates required fields', async () => {
    const request = new Request('http://localhost/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '', subject: '', html: '' })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

## Performance Considerations

### Caching
- **Next.js**: Built-in page and data caching
- **Supabase**: Connection pooling and query optimization
- **Server Actions**: Automatic revalidation with `revalidatePath()`

### Optimization Tips
1. Use Server Components for data fetching
2. Implement pagination for large event lists
3. Use React.memo for expensive components
4. Debounce search inputs
5. Optimize images with Next.js Image component

### Database Queries
```typescript
// Efficient event fetching with relationships
const events = await supabase
  .from('events')
  .select(`
    *,
    profiles!events_user_id_fkey (
      name,
      email
    )
  `)
  .eq('status', 'en_revision')
  .order('created_at', { ascending: false })
  .limit(50)
```

This API documentation provides comprehensive coverage of all available endpoints, data operations, and integration patterns for the FMP-UABC Event Management System.
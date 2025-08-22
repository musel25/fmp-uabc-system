# Component Documentation

## Overview

The FMP-UABC Event Management System uses a modular component architecture built on top of shadcn/ui. This document catalogs all components, their props, usage patterns, and design guidelines.

## Component Organization

```
components/
├── ui/                 # shadcn/ui primitives (auto-generated)
├── layout/            # Layout and navigation components
├── events/            # Event-specific components
├── admin/             # Admin-specific components
└── common/            # Shared utility components
```

## UI Foundation Components (shadcn/ui)

### Core Components

#### Button
Primary interaction element with multiple variants.

**Location:** `components/ui/button.tsx`

**Props:**
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
  className?: string
  disabled?: boolean
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/button'

// Primary button
<Button variant="default" size="lg">
  Guardar Evento
</Button>

// Secondary actions
<Button variant="outline" size="sm">
  Cancelar
</Button>

// Destructive actions
<Button variant="destructive">
  Eliminar
</Button>
```

**Custom UABC Styling:**
```css
.btn-primary {
  @apply bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors;
}
```

#### Card
Container component for grouped content.

**Location:** `components/ui/card.tsx`

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Subtitle text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Card className="card-uabc">
  <CardHeader>
    <CardTitle>Información del Evento</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Contenido del evento...</p>
  </CardContent>
</Card>
```

#### Form Components
React Hook Form integration with Zod validation.

**Location:** `components/ui/form.tsx`

**Components:**
- `Form` - Form provider
- `FormField` - Individual field wrapper
- `FormItem` - Field container
- `FormLabel` - Field label
- `FormControl` - Input wrapper
- `FormMessage` - Error/help text

**Usage:**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const form = useForm({
  resolver: zodResolver(schema)
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="eventName"
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
  </form>
</Form>
```

#### Badge
Status indicators and labels.

**Location:** `components/ui/badge.tsx`

**Variants:**
- `default` - Primary badge
- `secondary` - Secondary badge
- `destructive` - Error/warning badge
- `outline` - Outlined badge

**Custom Status Badges:**
```css
.chip-approved { @apply bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium; }
.chip-rejected { @apply bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium; }
.chip-pending { @apply bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium; }
.chip-draft { @apply bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium; }
```

#### StatusBadge
Custom status indicator for events.

**Location:** `components/ui/status-badge.tsx`

**Usage:**
```tsx
import { StatusBadge } from '@/components/ui/status-badge'

<StatusBadge status="aprobado" />
<StatusBadge status="en_revision" />
<StatusBadge status="rechazado" />
<StatusBadge status="borrador" />
```

### Additional UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `Dialog` | Modal dialogs | `components/ui/dialog.tsx` |
| `Drawer` | Side panels | `components/ui/drawer.tsx` |
| `Toast` | Notifications | `components/ui/toast.tsx` |
| `Progress` | Progress indicators | `components/ui/progress.tsx` |
| `Tabs` | Tabbed content | `components/ui/tabs.tsx` |
| `Table` | Data tables | `components/ui/table.tsx` |
| `Select` | Dropdown selection | `components/ui/select.tsx` |
| `Textarea` | Multi-line input | `components/ui/textarea.tsx` |

## Layout Components

### Navbar
Main navigation component with user authentication and admin toggle.

**Location:** `components/layout/navbar.tsx`

**Props:**
```typescript
interface NavbarProps {
  showAdminToggle?: boolean
}
```

**Features:**
- User avatar and profile dropdown
- Admin/User mode toggle
- UABC branding integration
- Responsive design

**Usage:**
```tsx
import { Navbar } from '@/components/layout/navbar'

// Standard navbar
<Navbar />

// With admin toggle for admin users
<Navbar showAdminToggle={true} />
```

### ProtectedRoute
Route protection with authentication and role-based access.

**Location:** `components/layout/protected-route.tsx`

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallback?: React.ReactNode
}
```

**Usage:**
```tsx
import { ProtectedRoute } from '@/components/layout/protected-route'

// User-protected route
<ProtectedRoute>
  <UserDashboard />
</ProtectedRoute>

// Admin-only route
<ProtectedRoute requireAdmin={true}>
  <AdminPanel />
</ProtectedRoute>
```

### Header & Footer
Page layout components.

**Location:** 
- `components/layout/header.tsx`
- `components/layout/footer.tsx`

**Usage:**
```tsx
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

<div className="min-h-screen flex flex-col">
  <Header />
  <main className="flex-1">
    {children}
  </main>
  <Footer />
</div>
```

## Event Components

### EventWizard
Multi-step form for creating/editing events.

**Location:** `components/events/event-wizard.tsx`

**Props:**
```typescript
interface EventWizardProps {
  onSubmit: (data: CreateEventData, isDraft?: boolean) => void
  initialData?: Partial<CreateEventData>
}
```

**Features:**
- 3-step wizard: Data, Files, Review
- Form validation with Zod
- Progress indicator
- Draft saving capability
- Cost validation (prevents paid events)

**Usage:**
```tsx
import { EventWizard } from '@/components/events/event-wizard'

const handleEventSubmit = async (data: CreateEventData, isDraft = false) => {
  // Handle event creation/update
}

<EventWizard 
  onSubmit={handleEventSubmit}
  initialData={existingEvent}
/>
```

#### Wizard Steps

##### EventDataStep
Basic event information input.

**Location:** `components/events/wizard-steps/event-data-step.tsx`

**Fields:**
- Event name, responsible person, contact info
- Program, type, classification, modality
- Venue, dates, organizers
- Cost information (with validation)

##### EventFilesStep
Program details and speaker information.

**Location:** `components/events/wizard-steps/event-files-step.tsx`

**Fields:**
- Program details (required)
- Speaker CVs (required)
- Observations (optional)
- Number of codes required

##### EventReviewStep
Final review before submission.

**Location:** `components/events/wizard-steps/event-review-step.tsx`

**Features:**
- Read-only display of all event data
- Formatted date/time display
- Conditional field display
- Submission actions

### EventTimeline
Visual timeline showing event status progression.

**Location:** `components/events/event-timeline.tsx`

**Props:**
```typescript
interface EventTimelineProps {
  event: Event
  className?: string
}
```

**Features:**
- Status progression visualization
- Admin comments display
- Date/time formatting
- Responsive design

**Usage:**
```tsx
import { EventTimeline } from '@/components/events/event-timeline'

<EventTimeline event={eventData} />
```


## Admin Components

### AdminEventReviewDrawer
Side panel for reviewing and approving/rejecting events.

**Location:** `components/admin/admin-event-review-drawer.tsx`

**Props:**
```typescript
interface AdminEventReviewDrawerProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventUpdate: () => void
}
```

**Features:**
- Complete event information display
- Approval/rejection actions
- Admin comments input
- Email notification triggers

**Usage:**
```tsx
import { AdminEventReviewDrawer } from '@/components/admin/admin-event-review-drawer'

<AdminEventReviewDrawer
  event={selectedEvent}
  open={isReviewOpen}
  onOpenChange={setIsReviewOpen}
  onEventUpdate={refreshEvents}
/>
```


## Common Utilities

### Logo
UABC logo component with consistent branding.

**Location:** `components/ui/logo.tsx`

**Props:**
```typescript
interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}
```

**Usage:**
```tsx
import { Logo } from '@/components/ui/logo'

<Logo size="lg" className="text-primary" />
```

### ThemeProvider
Dark/light theme provider using next-themes.

**Location:** `components/theme-provider.tsx`

**Usage:**
```tsx
// In app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

## Design Patterns

### Compound Components
Complex components use compound patterns for flexibility.

```tsx
// Event wizard with compound pattern
<EventWizard onSubmit={handleSubmit}>
  <EventWizard.Step>
    <EventDataStep />
  </EventWizard.Step>
  <EventWizard.Step>
    <EventFilesStep />
  </EventWizard.Step>
  <EventWizard.Step>
    <EventReviewStep />
  </EventWizard.Step>
</EventWizard>
```

### Render Props
For flexible component composition.

```tsx
<DataProvider>
  {({ data, loading, error }) => (
    <>
      {loading && <Skeleton />}
      {error && <ErrorMessage error={error} />}
      {data && <EventList events={data} />}
    </>
  )}
</DataProvider>
```

### Custom Hooks
Reusable logic extraction.

```tsx
// useEventForm hook
function useEventForm(initialData?: Partial<CreateEventData>) {
  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: { ...defaultValues, ...initialData }
  })
  
  return {
    form,
    handleSubmit: form.handleSubmit,
    isValid: form.formState.isValid,
    errors: form.formState.errors
  }
}
```

## Styling Guidelines

### CSS Classes
Follow Tailwind CSS utility patterns with custom UABC classes.

```css
/* Custom utility classes */
.card-uabc {
  @apply bg-card text-card-foreground rounded-lg border shadow-sm;
}

.btn-primary {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

.chip-approved {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100;
}
```

### Component Styling
Use the `cn()` utility for conditional classes.

```tsx
import { cn } from '@/lib/utils'

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
}
```

### Responsive Design
Mobile-first approach with responsive breakpoints.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {events.map(event => (
    <EventCard key={event.id} event={event} />
  ))}
</div>
```

## Accessibility

### Keyboard Navigation
All interactive components support keyboard navigation.

```tsx
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(e)
    }
  }}
>
  Submit
</Button>
```

### ARIA Labels
Proper ARIA labeling for screen readers.

```tsx
<Button
  aria-label="Approve event"
  aria-describedby="approval-help-text"
>
  Aprobar
</Button>
<div id="approval-help-text" className="sr-only">
  This will approve the event and send notification to the user
</div>
```

### Focus Management
Proper focus management in modals and navigation.

```tsx
useEffect(() => {
  if (open && dialogRef.current) {
    const firstFocusable = dialogRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  }
}, [open])
```

## Performance Optimization

### Code Splitting
Dynamic imports for heavy components.

```tsx
const HeavyAdminPanel = dynamic(() => import('./heavy-admin-panel'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
})
```

### Memoization
React.memo for expensive renders.

```tsx
const EventCard = React.memo(({ event, onEdit }: EventCardProps) => {
  return (
    <Card>
      {/* Event card content */}
    </Card>
  )
})

EventCard.displayName = 'EventCard'
```

### Virtual Scrolling
For large lists (future implementation).

```tsx
import { FixedSizeList as List } from 'react-window'

const VirtualizedEventList = ({ events }: { events: Event[] }) => (
  <List
    height={600}
    itemCount={events.length}
    itemSize={120}
    itemData={events}
  >
    {EventListItem}
  </List>
)
```

## Testing Patterns

### Component Testing
Test component behavior and user interactions.

```tsx
// __tests__/components/event-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { EventCard } from '@/components/events/event-card'

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    name: 'Test Event',
    status: 'aprobado' as const,
    // ... other required fields
  }

  it('renders event information', () => {
    render(<EventCard event={mockEvent} />)
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('aprobado')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<EventCard event={mockEvent} onEdit={onEdit} />)
    
    fireEvent.click(screen.getByText('Editar'))
    expect(onEdit).toHaveBeenCalledWith(mockEvent)
  })
})
```

### Integration Testing
Test component interactions with external systems.

```tsx
// __tests__/integration/event-wizard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventWizard } from '@/components/events/event-wizard'

describe('EventWizard Integration', () => {
  it('completes full event creation flow', async () => {
    const onSubmit = jest.fn()
    render(<EventWizard onSubmit={onSubmit} />)
    
    // Fill out step 1
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Test Event' }
    })
    
    // Navigate through wizard
    fireEvent.click(screen.getByText('Siguiente'))
    
    // Verify submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Event' }),
        false
      )
    })
  })
})
```

## Component Development Checklist

When creating new components:

- [ ] **TypeScript**: Full type safety with proper interfaces
- [ ] **Props**: Well-defined props with JSDoc comments
- [ ] **Styling**: Use Tailwind CSS with `cn()` utility
- [ ] **Accessibility**: ARIA labels, keyboard navigation, focus management
- [ ] **Responsive**: Mobile-first responsive design
- [ ] **Testing**: Unit tests for behavior and edge cases
- [ ] **Documentation**: JSDoc comments and usage examples
- [ ] **Performance**: Memoization where appropriate
- [ ] **Error Handling**: Graceful error states and fallbacks
- [ ] **Internationalization**: Spanish language support

This component documentation provides a comprehensive guide for understanding, using, and extending the FMP-UABC system's component library.
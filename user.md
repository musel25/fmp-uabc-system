# User Experience Implementation Plan

## Current Frontend State

### 🎨 **Recent Changes Made**
1. **Fixed Color System** (Today):
   - Replaced grayscale (oklch) colors with proper UABC brand colors
   - Primary: `#006341` (UABC Green)
   - Secondary: `#cc8a00` (UABC Ochre/Gold)
   - Destructive: `#dc2626` (Proper Red)
   - Removed duplicate `styles/globals.css` file causing conflicts

### 📱 **Current Frontend Implementation**

#### Authentication System (Mock)
- **File**: `lib/auth.ts`
- **Current**: localStorage-based mock authentication
- **Features**:
  - Email/password login (any credentials work)
  - Role-based authentication (`admin` vs `user`)
  - Session persistence
  - Protected routes with `ProtectedRoute` component

#### Event Management (Mock)
- **File**: `lib/mock-events.ts`
- **Current**: 7 sample events with complete workflow simulation
- **Features**:
  - CRUD operations for events
  - Status workflow: `borrador` → `en_revision` → `aprobado`/`rechazado`
  - Certificate workflow: `sin_solicitar` → `solicitadas` → `emitidas`
  - Search and filtering capabilities
  - Statistics and analytics

#### UI Components
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style)
- **Forms**: React Hook Form + Zod validation
- **State**: Client-side state management (no global state library)

#### Key Pages/Routes
- `/login` - Authentication
- `/dashboard` - User dashboard with events overview
- `/events/new` - Event creation wizard
- `/events/[id]` - Event details and editing
- `/admin/review` - Admin event review interface
- `/admin/certificates` - Admin certificate management

---

## 🚀 Backend Integration Action Plan (Supabase)

### Step 1: Supabase Project Setup

**Actions:**
1. Create new Supabase project at https://supabase.com
2. Install Supabase dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```
3. Create environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Create `lib/supabase.ts` client configuration

### Step 2: Database Schema Creation

**Actions:**
1. Create tables in Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Events table
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  responsible TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('Médico', 'Psicología', 'Nutrición', 'Posgrado')),
  type TEXT NOT NULL CHECK (type IN ('Académico', 'Cultural', 'Deportivo', 'Salud')),
  classification TEXT NOT NULL CHECK (classification IN ('Conferencia', 'Seminario', 'Taller', 'Otro')),
  classification_other TEXT,
  modality TEXT NOT NULL CHECK (modality IN ('Presencial', 'En línea', 'Mixta')),
  venue TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  has_cost BOOLEAN NOT NULL DEFAULT FALSE,
  cost_details TEXT,
  online_info TEXT,
  organizers TEXT NOT NULL,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'en_revision', 'aprobado', 'rechazado')),
  certificate_status TEXT NOT NULL DEFAULT 'sin_solicitar' CHECK (certificate_status IN ('sin_solicitar', 'solicitadas', 'emitidas')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admin_comments TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event files table
CREATE TABLE public.event_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificate requests table
CREATE TABLE public.certificate_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  participant_list JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

2. Set up Row Level Security (RLS) policies
3. Create database functions for triggers (updated_at)

### Step 3: Authentication Integration

**Actions:**
1. Replace `lib/auth.ts` with Supabase auth:
   - Remove localStorage-based auth
   - Add Supabase auth functions
   - Implement sign in/sign up/sign out
   - Add profile creation trigger

2. Update `components/layout/protected-route.tsx`:
   - Use Supabase auth state
   - Handle loading and error states
   - Redirect based on auth status

3. Update login page (`app/login/page.tsx`):
   - Use Supabase auth methods
   - Add proper error handling
   - Remove mock authentication

### Step 4: Event Management Integration

**Actions:**
1. Create `lib/database.ts` with Supabase queries:
   - CRUD operations for events
   - Search and filtering functions
   - Status update functions
   - User-specific queries

2. Replace `lib/mock-events.ts` imports throughout the app:
   - Update all components using mock data
   - Add proper loading states
   - Implement error handling

3. Update event forms to save to database:
   - Event creation wizard
   - Event editing functionality
   - Status updates (submit for review, etc.)

### Step 5: File Upload Implementation

**Actions:**
1. Configure Supabase Storage:
   - Create storage bucket for event files
   - Set up storage policies
   - Configure file type restrictions

2. Create file upload utilities:
   - File validation functions
   - Upload progress tracking
   - Error handling for uploads

3. Update file upload components:
   - Program file uploads
   - CV file uploads
   - File preview and deletion

### Step 6: Admin Panel Integration

**Actions:**
1. Create admin-specific database queries:
   - Events pending review
   - Certificate requests
   - Analytics and statistics

2. Update admin components:
   - Event review interface
   - Certificate management
   - Bulk operations

### Step 7: Real-time Features (Optional)

**Actions:**
1. Implement Supabase realtime subscriptions:
   - Live event status updates
   - Real-time notifications
   - Admin dashboard updates

### Step 8: Migration and Cleanup

**Actions:**
1. Create data migration script:
   - Convert mock data to database format
   - Seed initial admin users
   - Import sample events

2. Remove mock dependencies:
   - Delete `lib/mock-events.ts`
   - Clean up unused mock functions
   - Update imports throughout app

3. Add proper error boundaries and loading states

---

## ✅ Ready-to-Execute Task Checklist

### 🏗️ **Setup Phase**
- [ ] Create Supabase project
- [ ] Install dependencies: `@supabase/supabase-js @supabase/auth-helpers-nextjs`
- [ ] Add environment variables to `.env.local`
- [ ] Create `lib/supabase.ts` client configuration

### 🗄️ **Database Phase**
- [ ] Run SQL schema creation in Supabase SQL Editor
- [ ] Set up Row Level Security policies
- [ ] Create updated_at trigger functions
- [ ] Test database connection

### 🔐 **Authentication Phase**
- [ ] Create new `lib/supabase-auth.ts` with auth functions
- [ ] Update `components/layout/protected-route.tsx` for Supabase auth
- [ ] Modify `app/login/page.tsx` to use Supabase auth
- [ ] Add profile creation trigger
- [ ] Test login/logout functionality

### 📝 **Events Phase**
- [ ] Create `lib/supabase-database.ts` with event queries
- [ ] Update event creation wizard to save to database
- [ ] Update event listing pages to fetch from database
- [ ] Update event detail pages to fetch from database
- [ ] Replace all `mock-events.ts` imports
- [ ] Add loading states to event components

### 📁 **File Upload Phase**
- [ ] Create Supabase storage bucket for files
- [ ] Set up storage policies
- [ ] Create file upload utilities in `lib/file-upload.ts`
- [ ] Update event wizard file upload steps
- [ ] Add file preview and deletion functionality

### 👥 **Admin Phase**
- [ ] Create admin database queries
- [ ] Update admin review interface to use real data
- [ ] Update certificate management interface
- [ ] Add admin-only route protection

### 🧹 **Cleanup Phase**
- [ ] Delete `lib/mock-events.ts`
- [ ] Remove all mock-related imports
- [ ] Add comprehensive error handling
- [ ] Create data migration script for existing mock data
- [ ] Test all workflows end-to-end

---

## 🔧 Implementation Notes

### Supabase Configuration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Row Level Security Policies
- Users can only see their own events
- Admins can see all events
- Public read access for approved events (if needed)
- File access restricted to event owners and admins

### Database Indexing
```sql
-- Add indexes for better performance
CREATE INDEX events_user_id_idx ON events(user_id);
CREATE INDEX events_status_idx ON events(status);
CREATE INDEX events_created_at_idx ON events(created_at);
CREATE INDEX event_files_event_id_idx ON event_files(event_id);
```

---

## 📊 Current Mock Data Structure

The system currently has 7 sample events covering all status types:
- 2 approved events (1 with certificates issued)
- 2 in review
- 2 drafts
- 1 rejected

This provides a good foundation for testing all workflows during backend integration.
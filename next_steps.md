# Next Steps Implementation Plan

## ✅ COMPLETED: Authentication Foundation
- [x] Supabase authentication fully working
- [x] User registration and login
- [x] Protected routes with role-based access
- [x] Real user profiles in database

---

## 🎯 PRIORITY 1: Event Management (Core User Workflow)

### Step 1: Create Database Query Functions
**File**: `lib/supabase-database.ts`

**Actions**:
- [ ] Create `createEvent(eventData)` function
- [ ] Create `getUserEvents(userId)` function  
- [ ] Create `getEventById(eventId)` function
- [ ] Create `updateEvent(eventId, updates)` function
- [ ] Create `deleteEvent(eventId)` function
- [ ] Create `submitEventForReview(eventId)` function
- [ ] Create `searchEvents(query, filters)` function
- [ ] Create `getEventStatistics()` function

### Step 2: Update Event Creation Wizard
**File**: `app/events/new/page.tsx` and wizard components

**Actions**:
- [ ] Replace mock data saving with real database calls
- [ ] Update form submission to save to Supabase
- [ ] Add proper loading states during save
- [ ] Add error handling for database operations
- [ ] Redirect to event details after successful creation

### Step 3: Update Dashboard (Event Listing)
**File**: `app/dashboard/page.tsx`

**Actions**:
- [ ] Replace `mockEvents` with database fetch
- [ ] Load events for current authenticated user
- [ ] Add loading skeleton while fetching
- [ ] Add error state handling
- [ ] Update search and filtering to use database queries

### Step 4: Update Event Details and Editing
**Files**: `app/events/[id]/page.tsx` and `app/events/[id]/edit/page.tsx`

**Actions**:
- [ ] Load event data from database instead of mock
- [ ] Update edit functionality to save to database
- [ ] Add proper 404 handling for non-existent events
- [ ] Ensure users can only view/edit their own events

---

## 🎯 PRIORITY 2: Admin Features

### Step 5: Create Admin Database Functions
**File**: `lib/supabase-admin.ts`

**Actions**:
- [ ] Create `getEventsForReview()` function (status = 'en_revision')
- [ ] Create `approveEvent(eventId, comments)` function
- [ ] Create `rejectEvent(eventId, reason, comments)` function
- [ ] Create `getCertificateRequests()` function
- [ ] Create `approveCertificates(requestId)` function
- [ ] Create `getAllEvents()` function (admin view)

### Step 6: Update Admin Review Interface
**File**: `app/admin/review/page.tsx`

**Actions**:
- [ ] Replace mock data with real database queries
- [ ] Load events pending review from database
- [ ] Update approve/reject actions to save to database
- [ ] Add real-time updates when status changes
- [ ] Add proper error handling

### Step 7: Update Admin Certificate Management
**File**: `app/admin/certificates/page.tsx`

**Actions**:
- [ ] Load certificate requests from database
- [ ] Update certificate approval to save to database
- [ ] Add certificate generation functionality

---

## 🎯 PRIORITY 3: File Upload System

### Step 8: Set Up Supabase Storage
**Supabase Dashboard Actions**:
- [ ] Create storage bucket named 'event-files'
- [ ] Set up storage policies for file access
- [ ] Configure file type restrictions (PDF, DOC, etc.)

### Step 9: Create File Upload Functions
**File**: `lib/supabase-files.ts`

**Actions**:
- [ ] Create `uploadFile(file, eventId, fileType)` function
- [ ] Create `deleteFile(fileId)` function
- [ ] Create `getFileUrl(filePath)` function
- [ ] Add file validation (size, type)
- [ ] Add progress tracking for uploads

### Step 10: Update File Upload Components
**Files**: Event wizard file upload steps

**Actions**:
- [ ] Replace mock file uploads with real Supabase storage
- [ ] Add file preview functionality
- [ ] Add file deletion capability
- [ ] Update database to store file references

---

## 🎯 PRIORITY 4: Data Migration and Cleanup

### Step 11: Migration Script
**File**: `scripts/migrate-mock-data.ts`

**Actions**:
- [ ] Create script to import mock events to database
- [ ] Create admin user in database
- [ ] Test complete workflow with real data

### Step 12: Remove Mock Dependencies
**Actions**:
- [ ] Delete `lib/mock-events.ts`
- [ ] Remove all imports of mock functions
- [ ] Update all components to use real database
- [ ] Remove `lib/auth-old.ts` backup file

---

## 🔥 IMMEDIATE NEXT ACTION

**Start with Step 1**: Create `lib/supabase-database.ts`

This file will contain all the database query functions needed to replace the mock event system. Once this is created, we can quickly update all the event-related pages to use real data.

**Sample function to implement first**:
```typescript
// lib/supabase-database.ts
export async function createEvent(eventData: CreateEventData, userId: string) {
  const { data, error } = await supabase
    .from('events')
    .insert([{
      ...eventData,
      user_id: userId,
      status: 'borrador'
    }])
    .select()
    .single()
    
  if (error) throw error
  return data
}
```

---

## 📋 Success Metrics

After completing each priority:

**Priority 1 Complete**: Users can create, edit, and manage real events
**Priority 2 Complete**: Admins can review and approve events with real data  
**Priority 3 Complete**: File uploads work with real storage
**Priority 4 Complete**: No mock data remains, everything uses Supabase

---

## 🎛️ Optional Enhancements (After Core Features)

- [ ] Real-time notifications using Supabase realtime
- [ ] Email notifications for status changes
- [ ] PDF certificate generation
- [ ] Event analytics dashboard
- [ ] Bulk operations for admins
- [ ] Advanced search with full-text search
- [ ] Event export functionality
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

## 🚀 Backend Integration Plan

### Phase 1: API Infrastructure Setup
**Timeline: 1-2 weeks**

1. **Choose Backend Technology**
   - Option A: Next.js API Routes (same codebase)
   - Option B: Separate Node.js/Express API
   - Option C: Python/Django REST API
   - **Recommendation**: Next.js API Routes for simplicity

2. **Database Setup**
   - **Users Table**: id, email, password_hash, name, role, created_at, updated_at
   - **Events Table**: All current Event fields from `types.ts`
   - **Files Table**: id, event_id, file_name, file_path, file_type, size, uploaded_at
   - **Certificate_Requests Table**: id, event_id, user_id, participant_list, status, requested_at

3. **Authentication & Security**
   - Replace localStorage with JWT tokens
   - Implement password hashing (bcrypt)
   - Add session management
   - CORS configuration
   - Input validation middleware

### Phase 2: Core API Endpoints
**Timeline: 2-3 weeks**

#### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/refresh
```

#### Event Management Endpoints
```
GET    /api/events           # List events (with filters)
POST   /api/events           # Create event
GET    /api/events/:id       # Get specific event
PUT    /api/events/:id       # Update event
DELETE /api/events/:id       # Delete event
POST   /api/events/:id/submit # Submit for review
```

#### Admin Endpoints
```
GET  /api/admin/events/review    # Events pending review
POST /api/admin/events/:id/approve
POST /api/admin/events/:id/reject
GET  /api/admin/certificates     # Certificate requests
POST /api/admin/certificates/:id/approve
```

#### File Upload Endpoints
```
POST /api/upload/program/:eventId
POST /api/upload/cv/:eventId
GET  /api/files/:fileId
```

### Phase 3: Frontend API Integration
**Timeline: 2-3 weeks**

1. **Create API Client Layer**
   - Create `lib/api.ts` with fetch wrappers
   - Add error handling and loading states
   - Implement request/response interceptors

2. **Replace Mock Functions**
   - Update `lib/auth.ts` to use real API calls
   - Replace `lib/mock-events.ts` with API calls
   - Add proper error boundaries

3. **Update Components**
   - Add loading states to all forms
   - Implement proper error handling
   - Add optimistic UI updates where appropriate

### Phase 4: File Upload & Storage
**Timeline: 1-2 weeks**

1. **File Storage Options**
   - Option A: Local file system
   - Option B: Cloud storage (AWS S3, Google Cloud)
   - **Recommendation**: Start with local, migrate to cloud later

2. **Implementation**
   - Multipart form data handling
   - File type validation
   - Size limits and compression
   - Secure file serving

### Phase 5: Advanced Features
**Timeline: 2-3 weeks**

1. **Email Notifications**
   - Event status changes
   - Certificate availability
   - Admin notifications

2. **PDF Generation**
   - Certificate generation
   - Event reports
   - Attendance lists

3. **Search & Analytics**
   - Full-text search implementation
   - Event analytics dashboard
   - Export functionality

---

## 🔄 Migration Strategy

### Step 1: Incremental Migration
- Keep mock system as fallback
- Add feature flags to toggle between mock/real API
- Migrate one feature at a time (auth → events → files)

### Step 2: Data Migration
- Create seed scripts for initial data
- Export existing mock data structure
- Validate data integrity

### Step 3: Testing Strategy
- Unit tests for API endpoints
- Integration tests for workflows
- E2E tests for critical user journeys

---

## 📋 Immediate Next Steps

1. **Choose Backend Technology** (Decision needed)
2. **Set up development database** 
3. **Create basic API structure**
4. **Implement authentication endpoints**
5. **Update login page to use real API**

---

## 🔧 Technical Considerations

### Performance
- Implement pagination for event lists
- Add caching layer (Redis)
- Optimize database queries
- Image/file optimization

### Security
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- File upload security

### Scalability
- Database indexing strategy
- API rate limiting
- CDN for static files
- Monitoring and logging

---

## 📊 Current Mock Data Structure

The system currently has 7 sample events covering all status types:
- 2 approved events (1 with certificates issued)
- 2 in review
- 2 drafts
- 1 rejected

This provides a good foundation for testing all workflows during backend integration.
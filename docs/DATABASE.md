# Database Documentation

## Overview

The FMP-UABC Event Management System uses PostgreSQL via Supabase as its primary database. This document outlines the database schema, relationships, and data management patterns.

## Database Schema

### Tables Overview

```
┌─────────────┐    ┌─────────────┐
│   profiles  │    │   events    │
│             │    │             │
│ • id (PK)   │◄───┤ • user_id   │
│ • email     │    │ • id (PK)   │
│ • name      │    │ • name      │
│ • role      │    │ • status    │
│ • created_at│    │ • cert_stat │
└─────────────┘    └─────────────┘
```

### 1. Profiles Table

User authentication and role management.

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user'::text 
    CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

#### Columns
- **`id`** (`uuid`, Primary Key): Links to Supabase auth.users
- **`email`** (`text`, Unique, Not Null): User's email address
- **`name`** (`text`, Not Null): User's display name
- **`role`** (`text`, Not Null): User role (`'user'` | `'admin'`)
- **`created_at`** (`timestamptz`): Account creation timestamp
- **`updated_at`** (`timestamptz`): Last profile update

#### Constraints
- **Role Check**: Only `'user'` or `'admin'` values allowed
- **Email Unique**: Prevents duplicate email addresses
- **Foreign Key**: Links to Supabase auth system

### 2. Events Table

Core event management and tracking.

```sql
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  responsible text,
  email text,
  phone text NOT NULL,
  program text NOT NULL 
    CHECK (program = ANY (ARRAY['Médico'::text, 'Psicología'::text, 'Nutrición'::text, 'Posgrado'::text])),
  type text NOT NULL 
    CHECK (type = ANY (ARRAY['Académico'::text, 'Cultural'::text, 'Deportivo'::text, 'Salud'::text])),
  classification text NOT NULL 
    CHECK (classification = ANY (ARRAY['Conferencia'::text, 'Seminario'::text, 'Taller'::text, 'Otro'::text])),
  classification_other text,
  modality text NOT NULL 
    CHECK (modality = ANY (ARRAY['Presencial'::text, 'En línea'::text, 'Mixta'::text])),
  venue text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  has_cost boolean NOT NULL DEFAULT false,
  online_info text,
  organizers text NOT NULL,
  observations text,
  status text NOT NULL DEFAULT 'borrador'::text 
    CHECK (status = ANY (ARRAY['borrador'::text, 'en_revision'::text, 'aprobado'::text, 'rechazado'::text])),
  certificate_status text NOT NULL DEFAULT 'sin_solicitar'::text 
    CHECK (certificate_status = ANY (ARRAY['sin_solicitar'::text, 'solicitadas'::text, 'emitidas'::text])),
  user_id uuid NOT NULL,
  admin_comments text,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  program_details text,
  speaker_cvs text,
  codigos_requeridos integer NOT NULL DEFAULT 0,
  
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

#### Basic Information
- **`id`** (`uuid`, Primary Key): Unique event identifier
- **`name`** (`text`, Not Null): Event name/title
- **`responsible`** (`text`): Responsible person name
- **`email`** (`text`): Contact email for event
- **`phone`** (`text`, Not Null): Contact phone number

#### Event Classification
- **`program`** (`text`, Not Null): Academic program
  - `'Médico'` - Medical program
  - `'Psicología'` - Psychology program  
  - `'Nutrición'` - Nutrition program
  - `'Posgrado'` - Graduate program

- **`type`** (`text`, Not Null): Event category
  - `'Académico'` - Academic event
  - `'Cultural'` - Cultural event
  - `'Deportivo'` - Sports event
  - `'Salud'` - Health event

- **`classification`** (`text`, Not Null): Event format
  - `'Conferencia'` - Conference
  - `'Seminario'` - Seminar
  - `'Taller'` - Workshop
  - `'Otro'` - Other (specify in classification_other)

- **`classification_other`** (`text`): Custom classification when type is 'Otro'

#### Event Details
- **`modality`** (`text`, Not Null): Delivery method
  - `'Presencial'` - In-person
  - `'En línea'` - Online
  - `'Mixta'` - Hybrid

- **`venue`** (`text`, Not Null): Event location/platform
- **`start_date`** (`timestamptz`, Not Null): Event start date and time
- **`end_date`** (`timestamptz`, Not Null): Event end date and time
- **`has_cost`** (`boolean`, Default: false): Whether event has cost
- **`online_info`** (`text`): Online access information (URLs, passwords)
- **`organizers`** (`text`, Not Null): Event organizers
- **`observations`** (`text`): Additional notes or observations

#### Workflow Management
- **`status`** (`text`, Not Null, Default: 'borrador'): Event approval status
  - `'borrador'` - Draft (initial state)
  - `'en_revision'` - Under review by admin
  - `'aprobado'` - Approved by admin
  - `'rechazado'` - Rejected by admin


#### Administrative Fields
- **`user_id`** (`uuid`, Not Null): Foreign key to profiles table
- **`admin_comments`** (`text`): Admin feedback/comments
- **`rejection_reason`** (`text`): Reason for rejection
- **`created_at`** (`timestamptz`): Event creation timestamp
- **`updated_at`** (`timestamptz`): Last update timestamp

#### Additional Information
- **`program_details`** (`text`): Detailed program description
- **`speaker_cvs`** (`text`): Speaker curriculum vitae information
- **`codigos_requeridos`** (`integer`, Default: 0): Number of codes required

## Relationships

### Profile → Events (One-to-Many)
```sql
-- One user can have multiple events
SELECT p.name, COUNT(e.id) as event_count
FROM profiles p
LEFT JOIN events e ON p.id = e.user_id
GROUP BY p.id, p.name;
```

### Event Ownership Rules
- Users can only view/edit their own events
- Admins can view/edit all events
- Event creation always links to the authenticated user

## Data Flows

### 1. Event Lifecycle
```
User Creates Event (status: 'borrador')
           ↓
User Submits for Review (status: 'en_revision')
           ↓
    Admin Reviews Event
           ↓
┌─────────────────┬─────────────────┐
│ Admin Approves  │ Admin Rejects   │
│ (status:        │ (status:        │
│  'aprobado')    │  'rechazado')   │
└─────────────────┴─────────────────┘
```


## Row Level Security (RLS)

### Users Policy
```sql
-- Users can view their own events
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create events
CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft events
CREATE POLICY "Users can update own draft events" ON events
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'borrador'
  );
```

### Admin Policies
```sql
-- Admins can view all events
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can update any event
CREATE POLICY "Admins can update events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

## Data Validation

### TypeScript Types
```typescript
// lib/types.ts
export type EventStatus = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado'
export type EventProgram = 'Médico' | 'Psicología' | 'Nutrición' | 'Posgrado'
export type EventType = 'Académico' | 'Cultural' | 'Deportivo' | 'Salud'
export type EventClassification = 'Conferencia' | 'Seminario' | 'Taller' | 'Otro'
export type EventModality = 'Presencial' | 'En línea' | 'Mixta'
```

### Zod Schemas
```typescript
// lib/schemas/event-schema.ts
import { z } from 'zod'

export const eventSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
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
  codigosRequeridos: z.number().min(0).max(1000),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate)
}, {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['endDate']
})
```

## Common Queries

### Event Management
```sql
-- Get user's events with status
SELECT 
  id, name, status, certificate_status, created_at
FROM events 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- Get events pending admin review
SELECT 
  e.*, p.name as user_name, p.email as user_email
FROM events e
JOIN profiles p ON e.user_id = p.id
WHERE e.status = 'en_revision'
ORDER BY e.created_at ASC;

```

### Analytics Queries
```sql
-- Events by program
SELECT 
  program, 
  COUNT(*) as total_events,
  COUNT(CASE WHEN status = 'aprobado' THEN 1 END) as approved_events
FROM events 
GROUP BY program;

-- Monthly event creation
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as events_created
FROM events 
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month;

-- User activity
SELECT 
  p.name,
  COUNT(e.id) as total_events,
  COUNT(CASE WHEN e.status = 'aprobado' THEN 1 END) as approved_events
FROM profiles p
LEFT JOIN events e ON p.id = e.user_id
WHERE p.role = 'user'
GROUP BY p.id, p.name
ORDER BY total_events DESC;
```

## Indexing Strategy

### Existing Indexes
```sql
-- Primary Keys (automatic)
CREATE UNIQUE INDEX profiles_pkey ON profiles(id);
CREATE UNIQUE INDEX events_pkey ON events(id);

-- Foreign Keys (automatic)
CREATE INDEX events_user_id_idx ON events(user_id);

-- Unique Constraints
CREATE UNIQUE INDEX profiles_email_key ON profiles(email);
```

### Recommended Additional Indexes
```sql
-- Query performance optimization
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_user_status ON events(user_id, status);
CREATE INDEX idx_events_program ON events(program);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
```

## Data Migration

### Initial Schema Setup
```sql
-- Run schema.sql in Supabase SQL Editor
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies (see RLS section above)
```

### Sample Data
```sql
-- Create sample admin user
INSERT INTO profiles (id, email, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@uabc.edu.mx', 'Admin User', 'admin');

-- Create sample regular user
INSERT INTO profiles (id, email, name, role) VALUES 
('00000000-0000-0000-0000-000000000002', 'user@uabc.edu.mx', 'Regular User', 'user');

-- Create sample event
INSERT INTO events (
  name, phone, program, type, classification, modality, venue,
  start_date, end_date, organizers, user_id, codigos_requeridos
) VALUES (
  'Conferencia de Medicina Preventiva',
  '6641234567',
  'Médico',
  'Académico', 
  'Conferencia',
  'Presencial',
  'Auditorio Principal FMP',
  '2024-12-15 09:00:00-07',
  '2024-12-15 17:00:00-07',
  'Departamento de Medicina Preventiva',
  '00000000-0000-0000-0000-000000000002',
  50
);
```

## Backup and Maintenance

### Automated Backups
- Supabase provides automated daily backups
- Point-in-time recovery available
- Manual backup triggers available via dashboard

### Data Retention Policy
- Events: Retain indefinitely for historical records
- Audit logs: 2 years retention
- User sessions: 30 days

### Performance Monitoring
```sql
-- Monitor slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 100
ORDER BY mean_time DESC;

-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Database Security

### Access Control
- Service Role Key: Server-side operations only
- Anon Key: Client-side operations with RLS
- Database passwords: Strong, rotated regularly

### Data Encryption
- Encryption at rest: Enabled by default in Supabase
- Encryption in transit: TLS 1.2+ required
- Application-level encryption: For sensitive fields if needed

### Audit Trail
```sql
-- Add audit triggers (future enhancement)
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name, operation, user_id, old_data, new_data, timestamp
  ) VALUES (
    TG_TABLE_NAME, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW), NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

This database documentation provides a comprehensive overview of the data layer powering the FMP-UABC Event Management System.
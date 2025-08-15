-- Complete File Upload Setup for FMP UABC System
-- Run this entire script in your Supabase SQL Editor

-- 1. Create storage bucket for event files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-files',
  'event-files',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING; -- Avoid error if bucket already exists

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage policies for event files

-- Policy 1: Users can upload files for their own events
DROP POLICY IF EXISTS "Users can upload files for their events" ON storage.objects;
CREATE POLICY "Users can upload files for their events" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view files for their own events
DROP POLICY IF EXISTS "Users can view their event files" ON storage.objects;
CREATE POLICY "Users can view their event files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete files for their own events
DROP POLICY IF EXISTS "Users can delete their event files" ON storage.objects;
CREATE POLICY "Users can delete their event files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can update files for their own events
DROP POLICY IF EXISTS "Users can update their event files" ON storage.objects;
CREATE POLICY "Users can update their event files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Admins can access all files
DROP POLICY IF EXISTS "Admins can access all event files" ON storage.objects;
CREATE POLICY "Admins can access all event files" ON storage.objects
FOR ALL USING (
  bucket_id = 'event-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Create event_files table for storing file references
CREATE TABLE IF NOT EXISTS public.event_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_files_event_id ON public.event_files(event_id);
CREATE INDEX IF NOT EXISTS idx_event_files_uploaded_at ON public.event_files(uploaded_at);

-- 6. Enable RLS on event_files table
ALTER TABLE public.event_files ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for event_files table

-- Policy 1: Users can insert files for their own events
DROP POLICY IF EXISTS "Users can upload files for their events" ON public.event_files;
CREATE POLICY "Users can upload files for their events" ON public.event_files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND user_id = auth.uid()
  )
);

-- Policy 2: Users can view files for their own events
DROP POLICY IF EXISTS "Users can view their event files" ON public.event_files;
CREATE POLICY "Users can view their event files" ON public.event_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND user_id = auth.uid()
  )
);

-- Policy 3: Users can delete files for their own events
DROP POLICY IF EXISTS "Users can delete their event files" ON public.event_files;
CREATE POLICY "Users can delete their event files" ON public.event_files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND user_id = auth.uid()
  )
);

-- Policy 4: Admins can access all event files
DROP POLICY IF EXISTS "Admins can access all event files" ON public.event_files;
CREATE POLICY "Admins can access all event files" ON public.event_files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 8. Create function to get file URL
CREATE OR REPLACE FUNCTION get_file_url(file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/event-files/',
    file_path
  );
END;
$$;

-- 9. Add uploaded_by to existing rows (if any)
UPDATE public.event_files 
SET uploaded_by = (
  SELECT user_id FROM public.events 
  WHERE events.id = event_files.event_id
) 
WHERE uploaded_by IS NULL;

-- Setup complete! You can now use file uploads in your application.
-- Supabase Storage Setup for Event Files
-- Run this in your Supabase SQL Editor

-- Create storage bucket for event files
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
);

-- Storage policies for event files

-- Policy 1: Users can upload files for their own events
CREATE POLICY "Users can upload files for their events" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view files for their own events
CREATE POLICY "Users can view their event files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can delete files for their own events
CREATE POLICY "Users can delete their event files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can update files for their own events
CREATE POLICY "Users can update their event files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Admins can access all files
CREATE POLICY "Admins can access all event files" ON storage.objects
FOR ALL USING (
  bucket_id = 'event-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create function to get file URL
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
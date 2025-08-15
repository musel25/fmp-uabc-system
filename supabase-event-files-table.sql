-- Create event_files table for storing file references
-- Run this in your Supabase SQL Editor

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_files_event_id ON public.event_files(event_id);
CREATE INDEX IF NOT EXISTS idx_event_files_uploaded_at ON public.event_files(uploaded_at);

-- Enable RLS
ALTER TABLE public.event_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_files table

-- Policy 1: Users can insert files for their own events
CREATE POLICY "Users can upload files for their events" ON public.event_files
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND user_id = auth.uid()
  )
);

-- Policy 2: Users can view files for their own events
CREATE POLICY "Users can view their event files" ON public.event_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND user_id = auth.uid()
  )
);

-- Policy 3: Users can delete files for their own events
CREATE POLICY "Users can delete their event files" ON public.event_files
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id AND user_id = auth.uid()
  )
);

-- Policy 4: Admins can access all event files
CREATE POLICY "Admins can access all event files" ON public.event_files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Add uploaded_by to existing rows (if any)
UPDATE public.event_files 
SET uploaded_by = (
  SELECT user_id FROM public.events 
  WHERE events.id = event_files.event_id
) 
WHERE uploaded_by IS NULL;
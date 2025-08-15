-- Add text fields to replace file uploads
-- Run this in your Supabase SQL Editor

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS program_details TEXT,
ADD COLUMN IF NOT EXISTS speaker_cvs TEXT;

-- Update existing events to have empty strings for new fields
UPDATE public.events 
SET 
  program_details = COALESCE(program_details, ''),
  speaker_cvs = COALESCE(speaker_cvs, '')
WHERE program_details IS NULL OR speaker_cvs IS NULL;
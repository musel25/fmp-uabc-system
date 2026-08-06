-- Allow external or non-program-specific events to be classified outside the
-- four academic programs.
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_program_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_program_check
  CHECK (program IN ('Médico', 'Psicología', 'Nutrición', 'Posgrado', 'Otro'));

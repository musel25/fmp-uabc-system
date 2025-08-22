-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  responsible text,
  email text,
  phone text NOT NULL,
  program text NOT NULL CHECK (program = ANY (ARRAY['Médico'::text, 'Psicología'::text, 'Nutrición'::text, 'Posgrado'::text])),
  type text NOT NULL CHECK (type = ANY (ARRAY['Académico'::text, 'Cultural'::text, 'Deportivo'::text, 'Salud'::text])),
  classification text NOT NULL CHECK (classification = ANY (ARRAY['Conferencia'::text, 'Seminario'::text, 'Taller'::text, 'Otro'::text])),
  classification_other text,
  modality text NOT NULL CHECK (modality = ANY (ARRAY['Presencial'::text, 'En línea'::text, 'Mixta'::text])),
  venue text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  has_cost boolean NOT NULL DEFAULT false,
  online_info text,
  organizers text NOT NULL,
  observations text,
  status text NOT NULL DEFAULT 'borrador'::text CHECK (status = ANY (ARRAY['borrador'::text, 'en_revision'::text, 'aprobado'::text, 'rechazado'::text])),
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
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);